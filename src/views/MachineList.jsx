import { useMemo, useState } from 'react';
import { linesOf, nm } from '../lib/machines';

const LIMIT = 100;
export default function MachineList({ machines, filters, setFilters }) {
  const [shown, setShown] = useState(LIMIT);
  const list = machines ? machines.list : [];
  const f = filters;
  const opt = k => [...new Set(list.map(r => r[k]).filter(Boolean))].sort();
  const lines = useMemo(() => linesOf(list).map(l => l.name), [list]);
  const rows = useMemo(() => {
    const q = nm(f.q);
    return list.filter(r =>
      (!f.line || r.line === f.line) && (!f.purchase || r.purchase === f.purchase) && (!f.status || r.status === f.status) && (!f.type || r.type === f.type) &&
      (!q || nm([r.serial, r.sub, r.brand, r.model, r.line, r.loc].join(' ')).includes(q)));
  }, [list, f]);
  if (!machines) return <div className="card"><div className="empty">The machine list is not loaded yet. Put it at <b>public/data/machines.xlsx</b>, or link it with the button at the top.</div></div>;
  const set = (k, v) => { setShown(LIMIT); setFilters({ ...f, [k]: v }); };
  const pill = p => <span className={'pill ' + (p === 'Owned' ? 'in' : p === 'Rented' ? 'w' : 'mute')}>{p}</span>;
  return (
    <div className="card">
      <div className="row"><div><h2>All machines</h2><div className="sub">{rows.length} of {list.length} machines</div></div>
        {(f.q || f.line || f.purchase || f.status || f.type) && <button className="btn ghost" onClick={() => { setShown(LIMIT); setFilters({ q: '', line: '', purchase: '', status: '', type: '' }); }}>Clear filters</button>}</div>
      <div className="bar2">
        <input className="search" placeholder="Search serial, machine, brand, model" value={f.q} onChange={e => set('q', e.target.value)} aria-label="Search machines" />
        <select value={f.line} onChange={e => set('line', e.target.value)} aria-label="Line"><option value="">All lines</option>{lines.map(l => <option key={l}>{l}</option>)}</select>
        <select value={f.purchase} onChange={e => set('purchase', e.target.value)} aria-label="Owned or rented"><option value="">Owned and rented</option>{opt('purchase').map(l => <option key={l}>{l}</option>)}</select>
        <select value={f.status} onChange={e => set('status', e.target.value)} aria-label="Status"><option value="">All statuses</option>{opt('status').map(l => <option key={l}>{l}</option>)}</select>
        <select value={f.type} onChange={e => set('type', e.target.value)} aria-label="Group"><option value="">All groups</option>{opt('type').map(l => <option key={l}>{l}</option>)}</select>
      </div>
      <div className="twrap">
        <table className="left">
          <thead><tr><th className="l">Machine</th><th>Serial</th><th>Brand</th><th>Model</th><th>Line</th><th>Owned / rented</th><th>Status</th></tr></thead>
          <tbody>
            {rows.slice(0, shown).map((r, i) => (
              <tr key={i}><td className="l" title={r.sub}>{r.sub}</td><td className="mono">{r.serial}</td><td>{r.brand}</td><td className="tl">{r.model}</td><td>{r.line}</td><td>{pill(r.purchase)}</td><td>{r.status}</td></tr>
            ))}
            {!rows.length && <tr><td className="l" colSpan={7}><div className="empty">No machines match.</div></td></tr>}
          </tbody>
        </table>
      </div>
      {rows.length > shown && <p style={{ textAlign: 'center' }}><button className="btn ghost" onClick={() => setShown(shown + LIMIT)}>Show {Math.min(LIMIT, rows.length - shown)} more ({rows.length - shown} left)</button></p>}
    </div>
  );
}
