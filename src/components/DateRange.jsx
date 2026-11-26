// From / To date boxes with quick buttons. Used on the ticket pages.
export default function DateRange({ from, to, setFrom, setTo, min, max, onAll, onLast, note }) {
  const bad = from > to;
  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="bar2" style={{ marginBottom: 8 }}>
        <label className="dlabel">From <input type="date" className="search dateinp" value={from} min={min} max={max} onChange={e => e.target.value && setFrom(e.target.value)} /></label>
        <label className="dlabel">To <input type="date" className="search dateinp" value={to} min={min} max={max} onChange={e => e.target.value && setTo(e.target.value)} /></label>
        <div className="seg" role="group" aria-label="Quick dates">
          <button aria-pressed={false} onClick={onLast}>Last day</button>
          <button aria-pressed={false} onClick={onAll}>Whole report</button>
        </div>
      </div>
      {bad ? <div className="notice" style={{ marginBottom: 0 }}>"From" is after "To". Please fix the dates.</div> : <div className="muted">{note}</div>}
    </div>
  );
}
