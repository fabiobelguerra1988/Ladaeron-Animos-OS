import React, { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';

function SettingPill({ label, active }: { label: string; active: boolean }) {
  return (
    <div className={'dashboard-pill' + (active ? ' active' : '')}>
      <span className="dashboard-pill-dot" />
      {label}
    </div>
  );
}

export function DashboardTab() {
  const rootDir = useAppStore((s) => s.rootDir);
  const runState = useAppStore((s) => s.runState);
  const currentJob = useAppStore((s) => s.currentJob);
  const layers = useAppStore((s) => s.layers);
  const edgeFilter = useAppStore((s) => s.edgeFilter);

  const isolation = useMemo(() => {
    const network = currentJob?.network ?? 'off';
    return network === 'off' ? 'Isolated (Offline Sandbox)' : 'Allowlisted Network';
  }, [currentJob]);

  return (
    <div className="dashboard-shell">
      <div className="dashboard-glow dashboard-glow-a" />
      <div className="dashboard-glow dashboard-glow-b" />

      <section className="dashboard-hero">
        <div>
          <div className="dashboard-kicker">Command Center</div>
          <h2>ANIMA Dashboard</h2>
          <p>Unified operational view for runtime controls, graph defaults, and isolation posture.</p>
        </div>
        <div className="dashboard-status-block">
          <span>Runtime</span>
          <strong>{runState}</strong>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-card">
          <div className="dashboard-card-title">Theme</div>
          <div className="dashboard-card-value">Midnight Glass</div>
          <p className="dashboard-card-copy">High-contrast dark foundation with layered blur and reflective accents.</p>
        </article>

        <article className="dashboard-card">
          <div className="dashboard-card-title">Graph Layer Defaults</div>
          <div className="dashboard-pill-row">
            <SettingPill label="Code" active={layers.code} />
            <SettingPill label="Symbols" active={layers.symbols} />
            <SettingPill label="Runs" active={layers.runs} />
            <SettingPill label="Time Lens" active={layers.timeLens} />
            <SettingPill label="Heat Lens" active={layers.heatLens} />
          </div>
          <div className="dashboard-subtle-line">
            Edge Filters: {edgeFilter.connections ? 'Connections On' : 'Connections Off'} · {edgeFilter.calls ? 'Calls On' : 'Calls Off'}
          </div>
        </article>

        <article className="dashboard-card">
          <div className="dashboard-card-title">Network Isolation</div>
          <div className="dashboard-card-value">{isolation}</div>
          <p className="dashboard-card-copy">Current execution contracts default to an offline security perimeter for deterministic jobs.</p>
        </article>

        <article className="dashboard-card">
          <div className="dashboard-card-title">Workspace</div>
          <div className="dashboard-path">{rootDir || 'No workspace detected'}</div>
        </article>
      </section>
    </div>
  );
}
