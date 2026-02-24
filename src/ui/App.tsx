import React, { useEffect, useMemo, useState, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Rnd } from 'react-rnd';
import { CodeTab } from './tabs/CodeTab';
import { GraphTab } from './tabs/GraphTab';
import { PreviewTab } from './tabs/PreviewTab';
import { DashboardTab } from './tabs/DashboardTab';
import { ProfessorAInstein } from './components/overlays/ProfessorAInstein';
import { SwarmPanel } from './components/overlays/SwarmPanel';
import { useAppStore } from './store/useAppStore';
import { TabKey, FileEntry, RunState, JobContract, JobAction, SwarmEventPayload } from './types';

function RunReport({ result, rootDir, onClose }: { result: any, rootDir: string, onClose: () => void }) {
  const diagnosis = result.control_result?.diagnosis || {};
  const success = result.control_result?.overall_success === true;
  const reports = result.report_paths || {};

  const openPath = async (path: string) => {
    try {
      await invoke('open_in_external', { path });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="run-report" style={{
      background: '#1a1a1a', borderLeft: '1px solid #333', width: 350, padding: 15,
      display: 'flex', flexDirection: 'column', gap: 15, overflow: 'auto', height: '100%'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Run Report</h3>
        <button onClick={onClose}>X</button>
      </div>

      <div style={{
        padding: 10, borderRadius: 8,
        background: success ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)',
        border: `1px solid ${success ? '#28a745' : '#dc3545'}`,
        color: success ? '#28a745' : '#dc3545',
        fontWeight: 700, textAlign: 'center'
      }}>
        {success ? 'SUCCESS' : 'FAILURE'}
      </div>

      <div style={{ fontSize: 13 }}>
        <div className="muted">Job ID</div>
        <div style={{ fontFamily: 'monospace' }}>{result.job_id}</div>
      </div>

      {diagnosis.summary && (
        <div style={{ fontSize: 13 }}>
          <div className="muted">Diagnosis</div>
          <div style={{ color: '#e8e8e8' }}>{diagnosis.summary}</div>
        </div>
      )}

      {diagnosis.category && (
        <div style={{ fontSize: 13 }}>
          <div className="muted">Category</div>
          <code>{diagnosis.category}</code>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="muted" style={{ fontSize: 13 }}>Reports</div>
        {Object.entries(reports).map(([key, path]: [string, any]) => (
          <button key={key} onClick={() => openPath(path)} style={{ fontSize: 11, textAlign: 'left' }}>
            Open {key.replace(/_/g, ' ')}
          </button>
        ))}
        {result.run_dir && (
          <button onClick={() => openPath(result.run_dir)} style={{ fontSize: 11, textAlign: 'left' }}>
            Open Run Directory
          </button>
        )}
      </div>
    </div>
  );
}

export function App() {
  const rootDir = useAppStore((s) => s.rootDir);
  const setRootDir = useAppStore((s) => s.setRootDir);
  const files = useAppStore((s) => s.files);
  const setFiles = useAppStore((s) => s.setFiles);
  const activeFile = useAppStore((s) => s.activeFile);
  const setActiveFile = useAppStore((s) => s.setActiveFile);
  const log = useAppStore((s) => s.log);
  const pushLog = useAppStore((s) => s.pushLog);
  const runState = useAppStore((s) => s.runState);
  const setRunState = useAppStore((s) => s.setRunState);
  const currentJob = useAppStore((s) => s.currentJob);
  const setCurrentJob = useAppStore((s) => s.setCurrentJob);
  const lastResult = useAppStore((s) => s.lastResult);
  const setLastResult = useAppStore((s) => s.setLastResult);
  const showTrafficPreview = useAppStore((s) => s.showTrafficPreview);
  const setShowTrafficPreview = useAppStore((s) => s.setShowTrafficPreview);
  const upsertSwarmEvent = useAppStore((s) => s.upsertSwarmEvent);

  const [tab, setTab] = useState<TabKey>('graph');
  const [showJobJson, setShowJobJson] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const trafficEndRef = useRef<HTMLDivElement>(null);

  const appendLog = (line: string) => pushLog(`[${new Date().toLocaleTimeString()}] ${line}`);

  useEffect(() => {
    let unlisten: any;
    let unlistenSwarm: any;
    const setupListener = async () => {
      unlisten = await listen<string>('orchestrator-log', (event) => {
        appendLog(`[AGENT_STREAM] ${event.payload}`);
      });
      unlistenSwarm = await listen<SwarmEventPayload>('swarm-event', (event) => {
        upsertSwarmEvent(event.payload);
      });
    };
    setupListener();
    return () => {
      if (unlisten) unlisten();
      if (unlistenSwarm) unlistenSwarm();
    };
  }, [upsertSwarmEvent]);

  useEffect(() => {
    if (showTrafficPreview && trafficEndRef.current) {
      trafficEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [log, showTrafficPreview, runState]);

  useEffect(() => {
    (async () => {
      try {
        const rd = await invoke<string>('get_project_root');
        setRootDir(rd);
        appendLog(`Project root: ${rd}`);
        const list = await invoke<FileEntry[]>('list_files', { root: rd });
        setFiles(list);
        const first = list.find((e) => e.kind === 'file' && (e.path.endsWith('.rs') || e.path.endsWith('.tsx') || e.path.endsWith('.ts')));
        if (first) setActiveFile(first.path);

        // Start backend agent telemetry tailing
        await invoke('start_agent_telemetry');
        appendLog(`Agent telemetry activated.`);
      } catch (e: any) {
        appendLog(`Init error: ${String(e)}`);
      }
    })();
  }, []);

  const tabs = useMemo(() => ([
    { key: 'dashboard' as const, label: 'Dashboard' },
    { key: 'graph' as const, label: 'Graph' },
    { key: 'code' as const, label: 'Code' },
    { key: 'preview' as const, label: 'Preview' },
  ]), []);

  async function onRun() {
    if (!rootDir) return;
    try {
      setRunState('Running');
      const jobId = `job-${Date.now()}`;
      const contract: JobContract = {
        job_id: jobId,
        workspace: rootDir,
        network: 'off',
        actions: [
          { name: 'build', kind: 'build', cmd: 'cargo build' },
          { name: 'test', kind: 'test', cmd: 'cargo test' }
        ],
        container: { image: 'localhost/anima/tauri-builder:bookworm' }
      };
      setCurrentJob(contract);

      const contractPath = `${rootDir}/.agent/contracts/${jobId}.json`;
      await invoke('write_file', { path: contractPath, contents: JSON.stringify(contract, null, 2) });
      appendLog(`Contract emitted: ${contractPath}`);

      const result = await invoke<string>('run_job', { contractPath });
      const parsed = JSON.parse(result);
      setLastResult(parsed);

      const success = parsed.control_result?.overall_success === true;
      const isRejected = parsed.run_state === 'GovernanceRejected';

      setRunState(isRejected ? 'GovernanceRejected' : success ? 'Succeeded' : 'Failed');
      setShowReport(true);
      appendLog(`Run finished: ${success ? 'SUCCESS' : 'FAILURE'}`);
    } catch (e: any) {
      setRunState('Failed');
      appendLog(`Run error: ${String(e)}`);
    }
  }

  const handleSelectFile = (path: string) => {
    setActiveFile(path);
    setTab('code');
  };

  const handleLaunch3D = async () => {
    if (!rootDir) return;
    try {
      appendLog("Booting Bevy Spatial Engine...");
      const graph = await invoke('cargo_graph', { root: rootDir });
      await invoke('spawn_3d_viewport', { graph });
      appendLog("3D Context launched successfully.");
    } catch (e: any) {
      appendLog(`Spatial Error: ${String(e)}`);
    }
  };

  return (
    <div className="app">
      <div className="topbar">
        <div style={{ fontWeight: 700 }}>ANIMA Graph IDE</div>
        <div className="status-badge" style={{
          background: runState === 'Running' ? '#007acc' : runState === 'Succeeded' ? '#28a745' : runState === 'Failed' ? '#dc3545' : runState === 'GovernanceRejected' ? '#ffc107' : '#444',
          color: runState === 'GovernanceRejected' ? '#000' : '#fff',
          padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700
        }}>
          {runState.toUpperCase()}
        </div>
        <div className="muted" style={{ fontSize: 12 }}>{rootDir || '…'}</div>
        <div style={{ flex: 1 }} />
        <button onClick={handleLaunch3D} disabled={!rootDir} style={{ background: '#5e0099', color: 'white', borderColor: '#4a007a' }}>
          Launch 3D VR Grid
        </button>
        <button onClick={() => setShowTrafficPreview(!showTrafficPreview)} style={{ borderColor: showTrafficPreview ? '#00aaff' : '' }}>
          Live Traffic
        </button>
        <button onClick={() => setShowJobJson(!showJobJson)} disabled={!currentJob}>Job JSON</button>
        <button onClick={() => setShowReport(!showReport)} disabled={!lastResult}>Report</button>
        <button onClick={onRun} disabled={!rootDir || runState === 'Running'}>Run</button>
      </div>

      <div className="shell">
        <div className="sidebar">
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Files</div>
          {files.map((f) => (
            <div
              key={f.path}
              className={'file' + (f.path === activeFile ? ' active' : '') + (f.kind === 'dir' ? ' muted' : '')}
              onClick={() => f.kind === 'file' && setActiveFile(f.path)}
              title={f.path}
            >
              {f.path.replace(rootDir, '').replace(/^\//, '')}
            </div>
          ))}
        </div>

        <div className="main">
          <div className="tabs">
            {tabs.map((t) => (
              <div key={t.key} className={'tab' + (tab === t.key ? ' active' : '')} onClick={() => setTab(t.key)}>
                {t.label}
              </div>
            ))}
          </div>

          <div className="content">
            {showJobJson && currentJob && (
              <div className="job-json-overlay" style={{
                position: 'absolute', top: 40, right: 10, width: 400, height: '70%',
                background: '#1e1e1e', border: '1px solid #333', zIndex: 100, display: 'flex', flexDirection: 'column'
              }}>
                <div style={{ padding: 8, borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between' }}>
                  <b>Emitted Contract</b>
                  <button onClick={() => setShowJobJson(false)}>X</button>
                </div>
                <pre style={{ flex: 1, overflow: 'auto', padding: 8, fontSize: 11, margin: 0 }}>
                  {JSON.stringify(currentJob, null, 2)}
                </pre>
              </div>
            )}
            <div className="pane">
              {tab === 'dashboard' && (
                <DashboardTab />
              )}
              {tab === 'code' && (
                <CodeTab rootDir={rootDir} activeFile={activeFile || ''} onLog={pushLog} />
              )}
              {tab === 'graph' && (
                <GraphTab rootDir={rootDir} onLog={pushLog} onSelectFile={handleSelectFile} onRun={onRun} />
              )}
              {tab === 'preview' && (
                <PreviewTab rootDir={rootDir} onLog={pushLog} />
              )}
            </div>
            {showReport && lastResult && (
              <RunReport result={lastResult} rootDir={rootDir} onClose={() => setShowReport(false)} />
            )}
          </div>

          <div className="bottom">
            {log.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
      </div>

      {showTrafficPreview && (
        <Rnd
          default={{
            x: typeof window !== 'undefined' ? window.innerWidth - 450 : 500,
            y: typeof window !== 'undefined' ? window.innerHeight - 350 : 300,
            width: 400,
            height: 300
          }}
          bounds="window"
          dragHandleClassName="rnd-drag-handle"
          style={{
            zIndex: 9999,
            background: 'rgba(15, 15, 15, 0.85)',
            backdropFilter: 'blur(20px)',
            borderRadius: 12,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
          }}
        >
          <div
            className="rnd-drag-handle"
            style={{
              padding: '8px 12px',
              background: 'rgba(0,0,0,0.5)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'move'
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: '#00aaff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: runState === 'Running' ? '#00aaff' : '#555',
                boxShadow: runState === 'Running' ? '0 0 8px #00aaff' : 'none'
              }} />
              Orchestration Traffic Monitor
            </div>
            <button
              onClick={() => setShowTrafficPreview(false)}
              style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}
            >
              ✕
            </button>
          </div>
          <div style={{
            flex: 1, overflow: 'auto', padding: 12, fontSize: 11, fontFamily: 'monospace',
            display: 'flex', flexDirection: 'column', gap: 6
          }}>
            {log.length === 0 ? (
              <div className="muted" style={{ fontStyle: 'italic' }}>Listening for agent traffic...</div>
            ) : (
              log.map((l, i) => (
                <div key={i} style={{
                  color: l.toLowerCase().includes('error') || l.toLowerCase().includes('failure') ? '#ff5555' :
                    l.toLowerCase().includes('success') ? '#55ff55' : '#ccc',
                  lineHeight: '1.4'
                }}>
                  {l}
                </div>
              ))
            )}
            {runState === 'Running' && (
              <div style={{ color: '#00aaff', fontStyle: 'italic', marginTop: 8 }}>
                [AGENT] Orchestrator is executing job parameters. Awaiting signal...
              </div>
            )}
            <div ref={trafficEndRef} />
          </div>
        </Rnd>
      )}

      <SwarmPanel />
      <ProfessorAInstein />
    </div>
  );
}
