use crate::commands::orchestrator::Graph;
use bevy::prelude::*;
use sysinfo::System;
use tauri::command;

#[derive(Resource)]
struct SpatialGraphData {
    pub graph: Graph,
}

#[derive(Resource)]
struct SysinfoMonitor {
    sys: System,
    timer: Timer,
}

#[derive(Component)]
struct ProcessHologram {
    pid: u32,
}

#[command]
pub fn spawn_3d_viewport(graph: Graph) -> Result<String, String> {
    std::thread::spawn(move || {
        App::new()
            .add_plugins(DefaultPlugins.set(WindowPlugin {
                primary_window: Some(Window {
                    title: "ANIMA 3D Spatial Constitution".into(),
                    name: Some("anima.3d.monitor".into()),
                    resolution: (1280_u32, 720_u32).into(),
                    ..default()
                }),
                ..default()
            }))
            .insert_resource(SpatialGraphData { graph })
            .insert_resource(SysinfoMonitor {
                sys: System::new_all(),
                timer: Timer::from_seconds(2.0, TimerMode::Repeating),
            })
            .add_systems(Startup, setup_3d_scene)
            .add_systems(Update, update_sysinfo_holograms)
            .run();
    });

    Ok("3D Spatial Engine Launched".to_string())
}

fn setup_3d_scene(
    mut commands: Commands,
    mut meshes: ResMut<Assets<Mesh>>,
    mut materials: ResMut<Assets<StandardMaterial>>,
    graph_res: Res<SpatialGraphData>,
) {
    // Scene lighting
    commands.spawn((
        PointLight {
            shadows_enabled: true,
            intensity: 15_000_000.,
            range: 100.0,
            ..default()
        },
        Transform::from_xyz(0.0, 15.0, 0.0),
    ));

    // Orbital/spatial camera
    commands.spawn((
        Camera3d::default(),
        Transform::from_xyz(-15.0, 15.0, 25.0).looking_at(Vec3::ZERO, Vec3::Y),
    ));

    // Material logic based on the Immutable Node Core abstractions
    let mat_crate = materials.add(StandardMaterial {
        base_color: Color::srgb(0.0, 0.4, 0.8),
        ..default()
    });
    let mat_module = materials.add(StandardMaterial {
        base_color: Color::srgb(0.2, 0.6, 0.2),
        ..default()
    });
    let mat_job = materials.add(StandardMaterial {
        base_color: Color::srgb(0.8, 0.1, 0.1),
        emissive: LinearRgba::rgb(0.5, 0.0, 0.0),
        ..default()
    });

    let cube = meshes.add(Cuboid::new(1.0, 1.0, 1.0));
    let sphere = meshes.add(Sphere::new(0.6));

    // Project Universal Node Core logic to the Bevy 3D plane
    for (i, node) in graph_res.graph.nodes.iter().enumerate() {
        let x = (i as f32 % 8.0) * 3.5 - 12.0;
        let z = (i as f32 / 8.0).floor() * 3.5 - 12.0;

        let (mesh, mat, y) = match node.kind.as_str() {
            "crate" => (cube.clone(), mat_crate.clone(), 0.0),
            "job" => (sphere.clone(), mat_job.clone(), 4.0), // Jobs hover above logic
            _ => (cube.clone(), mat_module.clone(), 0.5),
        };

        commands.spawn((
            Mesh3d(mesh),
            MeshMaterial3d(mat),
            Transform::from_xyz(x, y, z),
        ));
    }
}

// System to physically render native Linux processes via Holographic Cognitive Mapping
fn update_sysinfo_holograms(
    time: Res<Time>,
    mut monitor: ResMut<SysinfoMonitor>,
    mut commands: Commands,
    mut meshes: ResMut<Assets<Mesh>>,
    mut materials: ResMut<Assets<StandardMaterial>>,
    query: Query<Entity, With<ProcessHologram>>,
) {
    monitor.timer.tick(time.delta());
    if monitor.timer.just_finished() {
        monitor.sys.refresh_all();

        // Remove old process holograms
        for entity in query.iter() {
            commands.entity(entity).despawn();
        }

        // Get Top 10 High-Memory Processes
        let mut processes: Vec<_> = monitor.sys.processes().values().collect();
        processes.sort_by(|a, b| b.memory().cmp(&a.memory()));

        let cube = meshes.add(Cuboid::new(1.0, 1.0, 1.0));
        let process_mat = materials.add(StandardMaterial {
            base_color: Color::srgb(0.8, 0.0, 0.8), // Purple neon hue
            emissive: LinearRgba::rgb(0.4, 0.0, 0.6),
            ..default()
        });

        for (i, p) in processes.iter().take(10).enumerate() {
            let memory_mb = p.memory() as f32 / 1024.0 / 1024.0;
            // Scale object dramatically between 0.5x and 4x depending on RAM usage
            let scale = (memory_mb / 200.0).clamp(0.5, 4.0);

            // Hover in an arc above the abstract static logic graph
            let angle = (i as f32 / 10.0) * std::f32::consts::TAU;
            let radius = 15.0;
            let x = angle.cos() * radius;
            let z = angle.sin() * radius;
            let y = 10.0 + (i as f32 % 3.0) * 2.0;

            commands.spawn((
                ProcessHologram {
                    pid: p.pid().as_u32(),
                },
                Mesh3d(cube.clone()),
                MeshMaterial3d(process_mat.clone()),
                Transform::from_xyz(x, y, z).with_scale(Vec3::splat(scale)),
            ));
        }
    }
}
