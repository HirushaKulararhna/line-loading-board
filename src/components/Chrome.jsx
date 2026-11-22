const ICON = {
  overview: <path d="M4 13h6V4H4zM14 20h6V4h-6zM4 20h6v-4H4z" />,
  schedule: <path d="M4 6h10M4 12h16M8 18h12" />,
  machines: <><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" /></>,
  styles: <path d="M5 4h14v16H5zM9 9h6M9 13h6" />,
  check: <path d="M12 3l9 16H3zM12 10v4M12 17h.01" />,
};
export const PAGES = { overview: 'Overview', schedule: 'Schedule', machines: 'Machines', styles: 'Styles', check: 'Data check' };

export function Rail({ route, badCount }) {
  return (
    <aside className="rail">
      <div className="brand">
        <div className="logo"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M4 7h16M4 12h10M4 17h16" /></svg></div>
        Line Loading
      </div>
      <nav aria-label="Sections">
        {Object.entries(PAGES).map(([k, v]) => (
          <a key={k} href={`#${k}`} aria-current={route === k ? 'page' : undefined}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{ICON[k]}</svg>
            {v}
            {k === 'check' && badCount > 0 && <span className="count">{badCount}</span>}
          </a>
        ))}
      </nav>
    </aside>
  );
}

export function TopBar({ title, subtitle, src }) {
  const { status, mode, reconnect, linkFile, doReconnect, useProjectFile } = src;
  return (
    <div className="top">
      <div><h1>{title}</h1><div className="sub">{subtitle}</div></div>
      <div className="src">
        <span className={'chip ' + status.kind}><span className="dot" /><span>{status.text}</span></span>
        {reconnect && <button className="btn" onClick={doReconnect}>Reconnect {reconnect.name}</button>}
        {mode === 'file' && <button className="btn ghost" onClick={useProjectFile}>Use project file</button>}
        {mode !== 'google' && <button className="btn" onClick={linkFile}>Link Excel file</button>}
      </div>
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
