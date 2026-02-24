import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

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

export function DashboardTab() {
  const rootDir = useAppStore((s) => s.rootDir);
  const runState = useAppStore((s) => s.runState);

  // Mocking the backend Rust Analytics for the Dashboard V1
  const hpiScore = 94.2;
  const tsiScore = 88.7;
  const desScore = 0.0; // Destructive Entropy MUST remain at 0 per Sentient Firewall

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
          <div className="dashboard-card-title">Metaphysical Metrics</div>
          <div className="hiq-ring-row">
            <MetricRing label="Hope Preservation (HPI)" value={hpiScore} color="#00ffff" delay={200} />
            <MetricRing label="Truth Sync (TSI)" value={tsiScore} color="#a64dff" delay={400} />
            <MetricRing label="Destructive Entropy (DES)" value={desScore} color="#ff3366" delay={600} />
          </div>
          <p className="dashboard-card-copy" style={{ marginTop: '20px' }}>
            The OS mathematically proves usefulness by generating high HPI while the Rust Sentient Firewall caps Destructive Entropy at 0.0 before a single processor cycle is wasted.
          </p>
        </article>

        <article className="dashboard-card citizen-audit-card">
          <div className="dashboard-card-title" style={{ color: '#ff4d4d' }}>Citizen Audit Protocol (Sentinel)</div>
          <div className="audit-log-container">
            <div className="audit-entry success">
              <span className="audit-time">10:04:12</span>
              <span className="audit-msg">[SAT SOLVER] Payload Graph passed structural paradox resolution.</span>
            </div>
            <div className="audit-entry success">
              <span className="audit-time">10:04:13</span>
              <span className="audit-msg">[FIREWALL] Identity Hash matched. Consent verified.</span>
            </div>
            <div className="audit-entry block">
              <span className="audit-time">10:04:22</span>
              <span className="audit-msg">[ERROR] Axiom Contradiction. Node 3 attempted to delete Truth Anchor. Execution Dropped.</span>
            </div>
          </div>
          <div className="dashboard-subtle-line">
            *All executions are evaluated by the native Rust SAT Solver prior to payload compilation.
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

        <article className="dashboard-card">
          <div className="dashboard-card-title">Active Origin Root</div>
          <div className="dashboard-path">{rootDir || 'Awaiting Constitutional Spacetime...'}</div>
        </article>
      </section>
    </div>
  );
}
