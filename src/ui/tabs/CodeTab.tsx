import React, { useEffect, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import { invoke } from '@tauri-apps/api/core';

export function CodeTab(props: { rootDir: string; activeFile: string; onLog: (s: string) => void }) {
  const { rootDir, activeFile, onLog } = props;
  const [value, setValue] = useState<string>('');
  const [language, setLanguage] = useState<string>('plaintext');

  const short = useMemo(() => activeFile ? activeFile.replace(rootDir, '').replace(/^\//, '') : '', [activeFile, rootDir]);

  useEffect(() => {
    (async () => {
      if (!activeFile) return;
      try {
        const txt = await invoke<string>('read_file', { path: activeFile });
        setValue(txt);
        const ext = activeFile.split('.').pop()?.toLowerCase();
        setLanguage(ext === 'rs' ? 'rust' : ext === 'ts' ? 'typescript' : ext === 'tsx' ? 'typescript' : ext === 'json' ? 'json' : 'plaintext');
        onLog(`Opened ${short}`);
      } catch (e: any) {
        onLog(`Read error: ${String(e)}`);
      }
    })();
  }, [activeFile]);

  async function save() {
    if (!activeFile) return;
    try {
      await invoke('write_file', { path: activeFile, contents: value });
      onLog(`Saved ${short}`);
    } catch (e: any) {
      onLog(`Save error: ${String(e)}`);
    }
  }

  return (
    <div style={{ height: '100%', display:'flex', flexDirection:'column', minHeight:0 }}>
      <div style={{ padding:'8px 10px', borderBottom:'1px solid #2a2a2a', display:'flex', gap:10, alignItems:'center' }}>
        <div style={{ fontWeight: 700 }}>Code</div>
        <div className="muted" style={{ fontSize: 12 }}>{short || 'No file selected'}</div>
        <div style={{ flex: 1 }} />
        <button onClick={save} disabled={!activeFile}>Save</button>
      </div>
      <div style={{ flex:1, minHeight:0 }}>
        <Editor
          height="100%"
          theme="vs-dark"
          language={language}
          value={value}
          onChange={(v) => setValue(v ?? '')}
          options={{ fontSize: 13, minimap: { enabled: false }, wordWrap: 'on' }}
        />
      </div>
    </div>
  );
}
