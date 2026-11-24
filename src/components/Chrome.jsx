const ICON = {
  overview: <path d="M4 13h6V4H4zM14 20h6V4h-6zM4 20h6v-4H4z" />,
  schedule: <path d="M4 6h10M4 12h16M8 18h12" />,
  machines: <><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" /></>,
  summary: <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />,
  fleet: <path d="M3 17V7h11v10M14 10h4l3 3v4h-7M7 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />,
  lines: <path d="M4 5h16M4 10h16M4 15h10M4 20h6" />,
  list: <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />,
  styles: <path d="M5 4h14v16H5zM9 9h6M9 13h6" />,
  check: <path d="M12 3l9 16H3zM12 10v4M12 17h.01" />,
};
export const PAGES = {
  overview: 'Overview', schedule: 'Schedule', styles: 'Styles', summary: 'Machine summary',
  machines: 'Machines needed per day', fleet: 'Have vs need', lines: 'Machines by line', list: 'All machines',
  check: 'Problems to fix',
};
// Plain one-line explanation shown under each page title
export const HELP = {
  summary: 'Purchased and rented machines we have, what the plan needs, and how many more are required. Pick the dates.',
  overview: 'How many machines the plan needs each day. Click a bar to see that day.',
  schedule: 'Which style runs on which module, day by day. Click a bar for details.',
  styles: 'Every style and the machines it needs. Click a style for details.',
  machines: 'How many of each machine type are needed on each day.',
  fleet: 'Machines you have compared with machines the plan needs.',
  lines: 'The machines on each line. Click a line to open it.',
  list: 'The full machine register. Use the filters to find a machine.',
  check: 'Styles in the plan that have no machine layout.',
};
const GROUPS = [
  ['Production plan', ['overview', 'schedule', 'styles']],
  ['Machines', ['summary', 'machines', 'fleet', 'lines', 'list']],
  ['Checks', ['check']],
];

export function Rail({ route, badCount }) {
  return (
    <aside className="rail">
      <div className="brand">
        <div className="logo"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M4 7h16M4 12h10M4 17h16" /></svg></div>
        Line Loading
      </div>
      <nav aria-label="Sections">
        {GROUPS.map(([g, keys]) => (
          <div key={g} style={{ display: 'contents' }}>
            <div className="navgroup">{g}</div>
            {keys.map(k => (
              <a key={k} href={`#${k}`} aria-current={route === k ? 'page' : undefined}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{ICON[k]}</svg>
                {PAGES[k]}
                {k === 'check' && badCount > 0 && <span className="count">{badCount}</span>}
              </a>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

function SourceChip({ src }) {
  const { label, status, mode, reconnect, linkFile, doReconnect, useProjectFile } = src;
  return (
    <span className="srcgrp">
      <span className={'chip ' + status.kind}><span className="dot" /><b>{label}</b>&nbsp;{status.text}</span>
      {reconnect && <button className="btn" onClick={doReconnect}>Reconnect {reconnect.name}</button>}
      {(mode === 'file' || mode !== 'google') && (
        <details className="dsrc">
          <summary className="btn ghost">Change {label.toLowerCase()} file</summary>
          <div className="dsrc-body">
            {mode === 'file' && <button className="btn ghost" onClick={useProjectFile}>Use the project file</button>}
            {mode !== 'google' && <button className="btn" onClick={linkFile}>Pick a file from my computer</button>}
          </div>
        </details>
      )}
    </span>
  );
}

export function TopBar({ title, subtitle, sources }) {
  return (
    <div className="top">
      <div><h1>{title}</h1><div className="sub">{subtitle}</div></div>
      <div className="src">{sources.map(s => <SourceChip key={s.label} src={s} />)}</div>
    </div>
  );
}

export function RangeToggle({ range, setRange }) {
  return (
    <div className="seg" role="group" aria-label="Range">
      <button aria-pressed={range === 'two'} onClick={() => setRange('two')}>Next 2 weeks</button>
      <button aria-pressed={range === 'all'} onClick={() => setRange('all')}>Whole sheet</button>
    </div>
  );
}
