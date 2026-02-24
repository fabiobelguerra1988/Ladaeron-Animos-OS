use serde::{Deserialize, Serialize};
use std::net::{Ipv4Addr, SocketAddrV4, UdpSocket};
use std::sync::Arc;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

const MULTICAST_IP: &str = "224.0.0.123";
const MULTICAST_PORT: u16 = 7777;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SwarmPeerPayload {
    pub node_id: String,
    pub node_type: String, // "Human Orchestrator" or "AI Agent"
    pub status: String,
    pub heartbeat: u64,
}

pub fn initialize_mesh_network(app: AppHandle) {
    let multicast_addr = MULTICAST_IP
        .parse::<Ipv4Addr>()
        .expect("Invalid multicast IP");
    let bind_addr = SocketAddrV4::new(Ipv4Addr::UNSPECIFIED, MULTICAST_PORT);

    // 1. Setup the receiving socket
    let listener = UdpSocket::bind(bind_addr).expect("Failed to bind UDP Multicast socket");
    listener
        .join_multicast_v4(&multicast_addr, &Ipv4Addr::UNSPECIFIED)
        .expect("Failed to join multicast group");
    listener
        .set_read_timeout(Some(Duration::from_millis(100)))
        .expect("Failed to set read timeout");

    let listener_arc = Arc::new(listener);

    // 2. Thread: Start Listening for Peers
    let listener_app = app.clone();
    let listener_socket = Arc::clone(&listener_arc);
    thread::spawn(move || {
        let mut buf = [0u8; 1024];
        loop {
            if let Ok((len, _)) = listener_socket.recv_from(&mut buf) {
                if let Ok(msg) = std::str::from_utf8(&buf[..len]) {
                    if let Ok(payload) = serde_json::from_str::<SwarmPeerPayload>(msg) {
                        listener_app.emit("swarm-peer-update", payload).ok();
                    }
                }
            }
            // Small sleep to yield thread
            thread::sleep(Duration::from_millis(50));
        }
    });

    // 3. Setup the broadcasting socket
    let sender = UdpSocket::bind("0.0.0.0:0").expect("Failed to bind sending socket");
    sender
        .set_multicast_loop_v4(true) // Set to true: we want to hear our own events in dev mode
        .expect("Failed to set multicast loop");

    // 4. Thread: Start Broadcasting our Node Identity
    let my_node_id = format!("NODE_ANIMA_{}", rand::random::<u16>());
    let target_addr = format!("{}:{}", MULTICAST_IP, MULTICAST_PORT);

    thread::spawn(move || loop {
        let payload = SwarmPeerPayload {
            node_id: my_node_id.clone(),
            node_type: "Human Orchestrator".to_string(), // In reality we'd pull from Digital DNA auth
            status: "ONLINE".to_string(),
            heartbeat: chrono::Utc::now().timestamp() as u64,
        };

        if let Ok(msg) = serde_json::to_string(&payload) {
            sender.send_to(msg.as_bytes(), &target_addr).unwrap_or(0);
        }
        thread::sleep(Duration::from_secs(3)); // Pulse identity every 3 seconds
    });
}
