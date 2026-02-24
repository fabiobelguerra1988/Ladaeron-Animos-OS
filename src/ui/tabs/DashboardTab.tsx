import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { SwarmPanel } from '../components/swarm/SwarmPanel';

export interface SentinelAlertPayload {
  level: string;
  component: string;
  message: string;
  timestamp: string;
}

function MetricRing({ label, value, color, delay }: { label: string; value: number; color: string; delay: number }) {
  const [fill, setFill] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setFill(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  const dashLine = 100;
  const offset = dashLine - (fill / 100) * dashLine;

  return (
    <div className="hiq-metric">
      <div className="hiq-ring">
        <svg viewBox="0 0 36 36">
          <path
            className="hiq-ring-bg"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className="hiq-ring-fill"
            strokeDasharray={`${dashLine}, ${dashLine}`}
            strokeDashoffset={offset}
            stroke={color}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div className="hiq-ring-value" style={{ color }}>{fill.toFixed(1)}%</div>
      </div>
      <div className="hiq-label">{label}</div>
    </div>
  );
}

export interface AuditLogEntry {
  id: string;
  payload: SentinelAlertPayload;
  resolved: boolean;
}

export function DashboardTab() {
  const rootDir = useAppStore((s) => s.rootDir);
  const runState = useAppStore((s) => s.runState);

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [cfmScore, setCfmScore] = useState(100.0);

  // Mocking the backend Rust Analytics for the Dashboard V1
  const hpiScore = 94.2;
  const tsiScore = 88.7;
  const [desScore, setDesScore] = useState(0.0); // Destructive Entropy MUST remain at 0 per Sentient Firewall

  useEffect(() => {
    const unlisten = listen<SentinelAlertPayload>('sentinel-alert', (event) => {
      const isError = event.payload.level === 'BLOCK';

      const newEntry: AuditLogEntry = {
        id: Math.random().toString(36).substring(7),
        payload: event.payload,
        resolved: !isError, // Success events are pre-resolved
      };

      setAuditLogs(prev => [newEntry, ...prev].slice(0, 10)); // Keep last 10

      if (isError) {
        setCfmScore(prev => Math.max(0, prev - 5.5)); // CFM Penalty for AI Action Without Consent
        setDesScore(prev => Math.min(100, prev + 2.0)); // Temporary DES spike until resolved
      }
    });

    return () => {
      unlisten.then(f => f());
    };
  }, []);

  const resolveLog = (id: string) => {
    setAuditLogs(prev => prev.map(log => {
      if (log.id === id && !log.resolved) {
        setCfmScore(score => Math.min(100, score + 4.8)); // CFM Reimbursed upon Human Consent Iteration
        setDesScore(score => Math.max(0, score - 2.0)); // DES Neutralized
        return { ...log, resolved: true };
      }
      return log;
    }));
  };

  const triggerTest = (type: string) => {
    invoke('trigger_mock_sentinel_alert', { failType: type }).catch(console.error);
  };

  return (
    <div className="dashboard-shell">
      <div className="dashboard-glow dashboard-glow-a" />
      <div className="dashboard-glow dashboard-glow-b" />

      <section className="dashboard-hero">
        <div>
          <div className="dashboard-kicker">Holistic Intelligence Quotient (HIQ)</div>
          <h2>L🜔DΛEЯ⦿N Monitoring</h2>
          <p>Real-time telemetry of the Sovereign OS Logic. The Sentinel Firewall enforces a Destructive Entropy limit of absolutely zero.</p>
        </div>
        <div className="dashboard-status-block">
          <span>Engine Status</span>
          <strong>{runState === 'Idle' ? 'AWAITING LOGIC' : runState.toUpperCase()}</strong>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-card hiq-hero-card">
          <div className="dashboard-card-title">Metaphysical Metrics & Consent</div>
          <div className="hiq-ring-row">
            <MetricRing label="Hope Preservation (HPI)" value={hpiScore} color="#00ffff" delay={200} />
            <MetricRing label="Truth Sync (TSI)" value={tsiScore} color="#a64dff" delay={400} />
            <MetricRing label="Consent Flow (CFM)" value={cfmScore} color="#ffb84d" delay={500} />
            <MetricRing label="Destructive Entropy (DES)" value={desScore} color="#ff3366" delay={600} />
          </div>
          <p className="dashboard-card-copy" style={{ marginTop: '20px' }}>
            The OS mathematically proves usefulness by generating high HPI while the Rust Sentient Firewall caps Destructive Entropy at 0.0 before a single processor cycle is wasted. The CFM tracks continuous Recursive Consent.
          </p>
        </article>

        <article className="dashboard-card citizen-audit-card">
          <div className="dashboard-card-title" style={{ color: '#ff4d4d', display: 'flex', justifyContent: 'space-between' }}>
            <span>Citizen Audit Protocol (Sentinel)</span>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button onClick={() => triggerTest('success')} style={{ fontSize: '9px', padding: '2px 5px', background: 'transparent', color: '#00ffcc', border: '1px solid #00ffcc', cursor: 'pointer' }}>TEST OK</button>
              <button onClick={() => triggerTest('paradox')} style={{ fontSize: '9px', padding: '2px 5px', background: 'transparent', color: '#ff3366', border: '1px solid #ff3366', cursor: 'pointer' }}>TEST PARADOX</button>
              <button onClick={() => triggerTest('firewall')} style={{ fontSize: '9px', padding: '2px 5px', background: 'transparent', color: '#ff3366', border: '1px solid #ff3366', cursor: 'pointer' }}>TEST HHS</button>
              <button onClick={() => triggerTest('kernel_override')} style={{ fontSize: '9px', padding: '2px 5px', background: '#ff1a1a', color: 'white', border: 'none', cursor: 'pointer' }}>TEST KERNEL</button>
            </div>
          </div>
          <div className="audit-log-container">
            {auditLogs.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.2)', fontStyle: 'italic', padding: '10px 0' }}>Awaiting execution validations from Rust SAT logic...</div>
            ) : (
              auditLogs.map((log) => {
                const isKill = log.payload.level === 'SYSTEM_KILL';
                return (
                  <div key={log.id} className={`audit-entry ${log.payload.level === 'BLOCK' ? 'block' : isKill ? 'kill' : 'success'} ${log.resolved ? 'resolved' : ''}`} style={isKill ? { borderLeft: '3px solid #ff0000', background: 'rgba(255, 0, 0, 0.1)' } : {}}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="audit-time">{log.payload.timestamp}</span>
                        {(log.payload.level === 'BLOCK' || isKill) && (
                          <button
                            onClick={() => resolveLog(log.id)}
                            disabled={log.resolved}
                            style={{
                              fontSize: '9px',
                              padding: '2px 8px',
                              background: log.resolved ? 'transparent' : '#ffb84d',
                              color: log.resolved ? '#ffb84d' : '#000',
                              border: `1px solid ${log.resolved ? '#ffb84d' : 'transparent'}`,
                              borderRadius: '3px',
                              cursor: log.resolved ? 'default' : 'pointer'
                            }}
                          >
                            {log.resolved ? 'RESOLVED' : 'RESOLVE'}
                          </button>
                        )}
                      </div>
                      <span className="audit-msg" style={{ opacity: log.resolved ? 0.6 : 1 }}>{log.payload.message}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="dashboard-subtle-line">
            *All executions are evaluated by the native Rust SAT Solver prior to payload compilation. Blocked items penalize the Consent Flow Metric (CFM) until human resolution.
          </div>
        </article>

        <article className="dashboard-card">
          <div className="dashboard-card-title">Constitutional Matrix</div>
          <div className="dashboard-pill-row">
            <div className="dashboard-pill active"><span className="dashboard-pill-dot" style={{ background: '#00ffcc' }} />SAT Solver: ACTIVE</div>
            <div className="dashboard-pill active"><span className="dashboard-pill-dot" style={{ background: '#00ffcc' }} />Sentient Firewall: ENGAGED</div>
            <div className="dashboard-pill active"><span className="dashboard-pill-dot" style={{ background: '#00ffcc' }} />Memory Anchor: SECURE</div>
          </div>
        </article>

        <SwarmPanel />

        <article className="dashboard-card">
          <div className="dashboard-card-title">Active Origin Root</div>
          <div className="dashboard-path">{rootDir || 'Awaiting Constitutional Spacetime...'}</div>
        </article>
      </section>
    </div>
  );
}
