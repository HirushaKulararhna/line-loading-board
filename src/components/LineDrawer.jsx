import { useEffect, useMemo } from 'react';
import Sty from './Sty';
import { FleetOptions } from '../views/Fleet';
import { lineSummary, nm } from '../lib/machines';
import { fmtDay, norm, visibleDates } from '../lib/model';

// Side panel for one line: machines on it (owned / rented) and what the plan needs there.
export default function LineDrawer({ line, M, C, machines, opts, setOpts, range, onClose, onShowMachines, onOpenStyle }) {
  useEffect(() => {
    const f = e => { if (e.key === 'Escape') onClose(); };
    addEventListener('keydown', f); return () => removeEventListener('keydown', f);
  }, [onClose]);
  const dates = visibleDates(M, range);
  const s = useMemo(() => lineSummary(M, C, dates, machines.list, opts, line), [M, C, range, machines, opts, line]); // eslint-disable-line
  const recs = machines.list.filter(r => r.purchase !== 'Test' && nm(r.line) === nm(line));
  const rows = s.rows.filter(r => r.registered > 0 || r.need > 0).sort((a, b) => a.gap - b.gap || b.usable - a.usable);
  const title = line === 'Unassigned' ? 'Unassigned (spare)' : /^\d+$/.test(line) ? `Line ${line}` : line;
  return (
    <div className="overlay" onClick={onClose}>
      <aside className="drawer wide" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <div className="dhead"><div><h2 style={{ margin: 0, fontSize: 22 }}>{title}</h2><div className="sub">{recs.length} machines registered · {s.usable} usable · {s.owned} owned · {s.rented} rented</div></div>
          <button className="btn ghost" onClick={onClose} autoFocus>Close</button></div>
        <FleetOptions opts={opts} setOpts={setOpts} />
        {s.planned ? (
          <div className="sub" style={{ margin: '10px 0' }}>
            Plan modules on this line: <b>{s.mods.join(', ')}</b> ({fmtDay(dates[0])} to {fmtDay(dates[dates.length - 1])}).{' '}
            {s.styles.map(st => <span key={st} style={{ marginRight: 4 }}><Sty code={st} bad={!C.idx.has(norm(st))} onClick={onOpenStyle} /></span>)}
          </div>
        ) : <div className="notice" style={{ marginTop: 10 }}>No plan module matches this line, so there is no "needed" figure.</div>}
        {s.planned && <div className="dtotal"><b className="mono">{s.short}</b><span>{s.short ? 'more machines needed on this line at its busiest day' : 'machines short, this line has what the plan needs'}</span></div>}
        <div className="twrap" style={{ maxHeight: 'none' }}>
          <table>
            <thead><tr><th className="l">Machine type</th><th>Owned</th><th>Rented</th><th>Usable</th>{s.planned && <th>Needed</th>}{s.planned && <th>Result</th>}</tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.key}><td className="l" title={r.name}>{r.name}</td><td className="mono">{r.owned || ''}</td><td className="mono">{r.rented || ''}</td><td className="mono"><b>{r.usable || ''}</b></td>
                  {s.planned && <td className="mono">{r.need || ''}</td>}
                  {s.planned && <td>{!r.need ? '' : !r.found ? <span className="pill w">none on line</span> : r.short > 0 ? <span className="pill bad">need {r.short} more</span> : <span className="pill in">ok</span>}</td>}</tr>
              ))}
              {!rows.length && <tr><td className="l" colSpan={6}><div className="empty">No machines on this line.</div></td></tr>}
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: 14 }}><button className="btn" onClick={() => onShowMachines(line)}>Show all {recs.length} machines on this line</button></p>
        {s.planned && <p className="sub">"None on line" means the plan needs that machine type on this line but no machine of that type is registered here. Spare machines are listed under Unassigned.</p>}
      </aside>
    </div>
  );
}
