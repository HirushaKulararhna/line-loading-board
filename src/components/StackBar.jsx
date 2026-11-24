// A horizontal bar split into parts, with a legend underneath.
export default function StackBar({ parts }) {
  const total = parts.reduce((a, p) => a + p.n, 0) || 1;
  return (
    <div>
      <div className="stack" role="img" aria-label={parts.map(p => `${p.label} ${p.n}`).join(', ')}>
        {parts.filter(p => p.n > 0).map(p => <i key={p.label} className={p.cls} style={{ width: `${(p.n / total) * 100}%` }} title={`${p.label}: ${p.n}`} />)}
      </div>
      <div className="legend">
        {parts.map(p => <span key={p.label}><i className={'sw ' + p.cls} />{p.label} <b className="mono">{p.n}</b></span>)}
      </div>
    </div>
  );
}
