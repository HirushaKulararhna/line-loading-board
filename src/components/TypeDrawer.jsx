import { useEffect } from 'react';
import Sty from './Sty';
import { nm } from '../lib/machines';
import { fmtDay, norm } from '../lib/model';

// Side panel for one machine type: the numbers, where the plan needs it on its busiest day, and every machine of that type.
export default function TypeDrawer({ row, M, C, list, onClose, onOpenStyle }) {
  useEffect(() => {
    const f = e => { if (e.key === 'Escape') onClose(); };
    addEventListener('keydown', f); return () => removeEventListener('keydown', f);
  }, [onClose]);

  const recs = list.filter(r => r.purchase !== 'Test' && r.key === row.key)
    .sort((a, b) => (a.purchase === b.purchase ? a.line.localeCompare(b.line, undefined, { numeric: true }) : a.purchase === 'Owned' ? -1 : 1));
  const toRent = Math.max(0, row.need - row.owned);

  // modules that use this type on its busiest day
  const uses = [];
  if (row.peakDate) for (const mod of M.modules) {
    const st = M.plan[mod][row.peakDate]; if (!st) continue;
    const e = C.idx.get(norm(st)); if (!e) continue;
    const n = Object.entries(e.m).filter(([k]) => nm(k) === row.key).reduce((a, [, v]) => a + v, 0);
    if (n > 0) uses.push({ mod, st, n });
  }
  uses.sort((a, b) => b.n - a.n);

  const result = !row.need ? <span className="pill mute">not in plan</span>
    : !row.found ? <span className="pill w">name not found</span>
    : row.short > 0 ? <span className="pill bad">rent {row.short} more</span>
    : <span className="pill in">{row.gap} extra</span>;

  return (
    <div className="overlay" onClick={onClose}>
      <aside className="drawer wide" role="dialog" aria-modal="true" aria-label={row.name} onClick={e => e.stopPropagation()}>
        <div className="dhead">
          <div><h2 style={{ margin: 0 }}>{row.name}</h2><div className="sub" style={{ marginBottom: 0 }}>{result}</div></div>
          <button className="btn ghost" onClick={onClose} autoFocus>Close</button>
        </div>

        <div className="kpis" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
          <div className="card kpi"><small>Purchased</small><b>{row.owned}</b></div>
          <div className="card kpi"><small>Rented</small><b>{row.rented}</b></div>
          <div className="card kpi"><small>Required</small><b>{row.need || '–'}</b>{row.peakDate && <span>on {fmtDay(row.peakDate)}</span>}</div>
          <div className="card kpi"><small>To rent</small><b>{row.need ? toRent : '–'}</b></div>
          <div className={'card kpi ' + (row.short > 0 ? 'alert' : row.need && row.found ? 'ok' : '')}><small>{row.short > 0 ? 'Rent more' : 'Extra'}</small><b>{row.need && row.found ? (row.short > 0 ? row.short : row.gap) : '–'}</b></div>
        </div>
        {row.need > 0 && !row.found && <div className="notice">No machine with this name is in the machine list, so it cannot be compared. Add the name under machineAliases in src/config.js if it is spelled differently.</div>}

        {uses.length > 0 && <>
          <h3 className="dsub">Needed on {fmtDay(row.peakDate)} (busiest day)</h3>
          {uses.map(u => (
            <div className="it2" key={u.mod}>
              <span><b>Module {u.mod}</b> &nbsp;<Sty code={u.st} onClick={onOpenStyle} /></span>
              <span className="mono">{u.n}</span>
            </div>
          ))}
          <div className="it2"><b>Total</b><b className="mono">{row.need}</b></div>
        </>}

        <h3 className="dsub">Our machines of this type ({recs.length})</h3>
        <div className="twrap" style={{ maxHeight: 'none' }}>
          <table className="left">
            <thead><tr><th>Serial ID</th><th>Purchase</th><th>Status</th><th>Line</th><th>Brand</th><th>Model</th></tr></thead>
            <tbody>
              {recs.map((r, i) => (
                <tr key={r.serial + i}>
                  <td className="mono">{r.serial || '–'}</td>
                  <td>{r.purchase === 'Owned' ? 'Purchased' : r.purchase}</td>
                  <td>{r.status}</td>
                  <td>{r.line === 'Unassigned' ? <span className="muted">spare</span> : r.line}</td>
                  <td>{r.brand}</td><td>{r.model}</td>
                </tr>
              ))}
              {!recs.length && <tr><td colSpan={6}><div className="empty">No machines of this type in the machine list.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </aside>
    </div>
  );
}
