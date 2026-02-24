import React, { useEffect, useState } from 'react';
import { Rnd } from 'react-rnd';
import { invoke } from '@tauri-apps/api/core';

type Widget = { id: string; kind: 'Panel' | 'Button' | 'Text'; x: number; y: number; w: number; h: number; text?: string };
type Layout = { version: 1; widgets: Widget[] };

const DEFAULT_LAYOUT: Layout = {
  version: 1,
  widgets: [
    { id: 'panel-1', kind: 'Panel', x: 40, y: 40, w: 420, h: 220, text: 'Panel' },
    { id: 'btn-1', kind: 'Button', x: 80, y: 90, w: 140, h: 44, text: 'Start' },
    { id: 'txt-1', kind: 'Text', x: 80, y: 150, w: 240, h: 32, text: 'Hello L🜔DΛEЯ⦿N ∆NIM♾S' }
  ]
};

export function PreviewTab(props: { rootDir: string; onLog: (s: string) => void }) {
  const { rootDir, onLog } = props;
  const [layout, setLayout] = useState<Layout>(DEFAULT_LAYOUT);

  const layoutPath = rootDir ? `${rootDir}/ui/layout.json` : '';

  useEffect(() => {
    (async () => {
      if (!layoutPath) return;
      try {
        const txt = await invoke<string>('read_or_init_layout', { path: layoutPath, defaultContents: JSON.stringify(DEFAULT_LAYOUT, null, 2) });
        setLayout(JSON.parse(txt));
        onLog('Preview: layout loaded');
      } catch (e: any) {
        onLog(`Preview load error: ${String(e)}`);
      }
    })();
  }, [layoutPath]);

  async function save(next: Layout) {
    if (!layoutPath) return;
    setLayout(next);
    try {
      await invoke('write_file', { path: layoutPath, contents: JSON.stringify(next, null, 2) });
      onLog('Preview: layout saved');
      // notify test window to reload if open
      await invoke('broadcast_layout_changed');
    } catch (e: any) {
      onLog(`Preview save error: ${String(e)}`);
    }
  }

  function updateWidget(id: string, patch: Partial<Widget>) {
    const next: Layout = { ...layout, widgets: layout.widgets.map(w => w.id === id ? { ...w, ...patch } : w) };
    void save(next);
  }

  function add(kind: Widget['kind']) {
    const id = `${kind.toLowerCase()}-${Math.random().toString(16).slice(2, 7)}`;
    const next: Layout = { ...layout, widgets: [...layout.widgets, { id, kind, x: 60, y: 60, w: 160, h: 48, text: kind }] };
    void save(next);
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px 10px', borderBottom: '1px solid #2a2a2a', display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ fontWeight: 700 }}>Preview</div>
        <div style={{ flex: 1 }} />
        <button onClick={() => add('Panel')}>+ Panel</button>
        <button onClick={() => add('Button')}>+ Button</button>
        <button onClick={() => add('Text')}>+ Text</button>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'auto', background: '#090909' }}>
        <div style={{ position: 'relative', width: 1200, height: 800, margin: 20, border: '1px dashed #2a2a2a' }}>
          {layout.widgets.map((w) => (
            <Rnd
              key={w.id}
              size={{ width: w.w, height: w.h }}
              position={{ x: w.x, y: w.y }}
              onDragStop={(e, d) => updateWidget(w.id, { x: d.x, y: d.y })}
              onResizeStop={(e, dir, ref, delta, pos) => updateWidget(w.id, { w: ref.offsetWidth, h: ref.offsetHeight, x: pos.x, y: pos.y })}
              bounds="parent"
            >
              <WidgetView widget={w} />
            </Rnd>
          ))}
        </div>
      </div>
    </div>
  );
}

function WidgetView({ widget }: { widget: Widget }) {
  const common: React.CSSProperties = {
    width: '100%', height: '100%',
    borderRadius: 12,
    border: '1px solid #2a2a2a',
    background: '#121212',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#e8e8e8',
    userSelect: 'none'
  };
  if (widget.kind === 'Panel') return <div style={{ ...common, background: '#101010' }}>{widget.text ?? 'Panel'}</div>;
  if (widget.kind === 'Button') return <div style={{ ...common, background: '#1a1a1a' }}>{widget.text ?? 'Button'}</div>;
  return <div style={{ ...common, background: '#0f0f0f' }}>{widget.text ?? 'Text'}</div>;
}
