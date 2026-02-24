export class AIGateway {
    private ws: WebSocket | null = null;
    private url: string;
    private connected: boolean = false;
    private onMessageCbs: ((msg: any) => void)[] = [];
    private onConnectCbs: ((status: boolean) => void)[] = [];

    constructor(url: string = 'ws://127.0.0.1:19001') {
        this.url = url;
    }

    public connect() {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            return;
        }

        try {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                this.connected = true;
                this.notifyConnect(true);
            };

            this.ws.onclose = () => {
                this.connected = false;
                this.notifyConnect(false);
                setTimeout(() => this.connect(), 3000); // Auto-reconnect
            };

            this.ws.onerror = (err) => {
                console.warn("OpenClaw AI Gateway Error:", err);
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.onMessageCbs.forEach(cb => cb(data));
                } catch (e) {
                    console.warn("Failed to parse OpenClaw message:", e);
                }
            };
        } catch (e) {
            console.warn("Could not initiate OpenClaw socket:", e);
            setTimeout(() => this.connect(), 3000);
        }
    }

    public async askProfessor(context: string, question: string): Promise<string> {
        if (!this.connected || !this.ws) {
            return "Professor AInstein is currently offline. Ensure OpenClaw daemon is running.";
        }

        return new Promise((resolve) => {
            const msgId = `ask-${Date.now()}`;

            const handler = (msg: any) => {
                if (msg.id === msgId && msg.type === "response") {
                    this.unsubscribe(handler);
                    resolve(msg.content);
                }
            };

            this.subscribe(handler);

            this.ws!.send(JSON.stringify({
                id: msgId,
                type: "request",
                agent: "professor",
                payload: { context, question },
                sandbox_level: "READ_ONLY" // Strict Guardrail
            }));

            // Timeout fallback
            setTimeout(() => {
                this.unsubscribe(handler);
                resolve("Professor AInstein timed out while thinking...");
            }, 15000);
        });
    }

    public subscribe(cb: (msg: any) => void) {
        this.onMessageCbs.push(cb);
    }

    public unsubscribe(cb: (msg: any) => void) {
        this.onMessageCbs = this.onMessageCbs.filter(existing => existing !== cb);
    }

    public onStatusChange(cb: (status: boolean) => void) {
        this.onConnectCbs.push(cb);
        cb(this.connected); // Send current status immediately
    }

    private notifyConnect(status: boolean) {
        this.onConnectCbs.forEach(cb => cb(status));
    }
}

// Export a singleton instance for universal IDE memory
export const aiGateway = new AIGateway();
