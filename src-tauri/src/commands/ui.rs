use tauri::{command, AppHandle};

#[command]
pub async fn broadcast_layout_changed(app: AppHandle) -> Result<(), String> {
  // Broadcast to all windows (including test) to reload layout.
  use tauri::Emitter;
  app.emit("layout-changed", ()).map_err(|e| e.to_string())
}

#[command]
pub async fn open_test_window(app: AppHandle) -> Result<(), String> {
  use tauri::Manager;
  if app.get_webview_window("test").is_some() {
    return Ok(());
  }
  let url = tauri::WebviewUrl::App("index.html#/test".into());
  tauri::WebviewWindowBuilder::new(&app, "test", url)
    .title("ANIMA Test")
    .inner_size(1100.0, 800.0)
    .resizable(true)
    .build()
    .map_err(|e| e.to_string())?;
  Ok(())
}

#[command]
pub async fn close_test_window(_app: AppHandle) -> Result<(), String> {
  Ok(())
}
