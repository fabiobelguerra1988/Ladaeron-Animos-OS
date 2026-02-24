import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

type Widget = { id: string; kind: 'Panel' | 'Button' | 'Text'; x: number; y: number; w: number; h: number; text?: string };
type Layout = { version: 1; widgets: Widget[] };

export function TestApp() {
  const [layout, setLayout] = useState<Layout | null>(null);
  const [rootDir, setRootDir] = useState<string>('');

  useEffect(() => {
    (async () => {
      const rd = await invoke<string>('get_project_root');
      setRootDir(rd);
      const txt = await invoke<string>('read_file', { path: `${rd}/ui/layout.json` });
      setLayout(JSON.parse(txt));
    })();
  }, []);

  useEffect(() => {
    const unlistenP = listen('layout-changed', async () => {
      if (!rootDir) return;
      const txt = await invoke<string>('read_file', { path: `${rootDir}/ui/layout.json` });
      setLayout(JSON.parse(txt));
    });
    return () => { void unlistenP.then((u) => u()); };
  }, [rootDir]);

  return (
    <div style={{ height:'100vh', background:'#0b0b0b', color:'#eee', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'10px 12px', borderBottom:'1px solid #2a2a2a', display:'flex', gap:10, alignItems:'center' }}>
        <div style={{ fontWeight: 700 }}>Test Window</div>
        <div style={{ opacity:.6, fontSize:12 }}>Live reloads on layout changes</div>
      </div>
      <div style={{ flex:1, position:'relative', overflow:'auto' }}>
        <div style={{ position:'relative', width:1200, height:800, margin:20 }}>
          {(layout?.widgets ?? []).map((w) => (
            <div key={w.id} style={{
              position:'absolute',
              left: w.x, top: w.y, width: w.w, height: w.h,
              borderRadius: 12,
              border: '1px solid #2a2a2a',
              background: w.kind === 'Button' ? '#1a1a1a' : (w.kind === 'Panel' ? '#101010' : '#0f0f0f'),
              display:'flex', alignItems:'center', justifyContent:'center'
            }}>
              {w.text ?? w.kind}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
