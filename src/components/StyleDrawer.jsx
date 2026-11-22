import { useEffect } from 'react';
import Sty from './Sty';
import { fmtDay, norm, sumM } from '../lib/model';

// Side panel that shows every machine a style needs, and where the style is used in the plan.
export default function StyleDrawer({ code, M, C, onClose }) {
  useEffect(() => {
    const f = e => { if (e.key === 'Escape') onClose(); };
    addEventListener('keydown', f);
    return () => removeEventListener('keydown', f);
  }, [onClose]);

  const entry = C.idx.get(norm(code));
  const machines = entry ? Object.entries(entry.m).sort((a, b) => b[1] - a[1]) : [];
  const max = machines.length ? machines[0][1] : 1;
  const total = entry ? sumM(entry.m) : 0;

  // where this style runs: per module, first day, last day and number of days
  const uses = [];
  for (const mod of M.modules) {
    const days = M.dates.filter(d => M.plan[mod][d] && norm(M.plan[mod][d]) === norm(code));
    if (days.length) uses.push({ mod, first: days[0], last: days[days.length - 1], n: days.length });
  }

  return (
    <div className="overlay" onClick={onClose}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={`Style ${code}`} onClick={e => e.stopPropagation()}>
        <div className="dhead">
          <div>
            <Sty code={code} bad={!entry} />
            <h2>{entry ? entry.p || 'Style' : 'No machine layout'}</h2>
          </div>
          <button className="btn ghost" onClick={onClose} autoFocus>Close</button>
        </div>

        {entry ? (
          <>
            <div className="dtotal"><b className="mono">{total}</b><span>machines in total · {machines.length} machine types</span></div>
            <div className="dl list2">
              {machines.map(([name, n]) => (
                <div className="it" key={name}>
                  <div className="top2"><span>{name}</span><span className="mono">{n}</span></div>
                  <div className="hbar"><i style={{ width: `${(n / max) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="notice">This style is in the plan but has no row on the Layout tab, so it counts as 0 machines. Add it to your Excel Layout tab.</div>
        )}

        <h3 className="dsub">Where it runs</h3>
        {uses.length ? uses.map(u => (
          <div className="it2" key={u.mod}>
            <span><b>Module {u.mod}</b></span>
            <span className="mono">{fmtDay(u.first)}{u.last !== u.first ? ` – ${fmtDay(u.last)}` : ''} · {u.n} day{u.n > 1 ? 's' : ''}</span>
          </div>
        )) : <div className="sub">Not used in this plan.</div>}
      </aside>
    </div>
  );
}
