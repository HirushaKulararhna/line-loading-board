import { useMemo, useState } from 'react';
import DateRange from '../components/DateRange';
import { WD, dt, fmtDay } from '../lib/model';
import { hours, mechanicHours } from '../lib/tickets';

export default function Mechanics({ T }) {
  const [f, setF] = useState(''), [t, setT] = useState('');
  const from = f || T.firstDay, to = t || T.lastDay;
  const H = useMemo(() => mechanicHours(T.tickets, from, to), [T, from, to]);
  const peak = Math.max(1, ...H.rows.flatMap(r => Object.values(r.days)));
  const mechDays = H.rows.reduce((a, r) => a + r.workDays, 0);

  return (
    <>
      <DateRange from={from} to={to} setFrom={setF} setTo={setT} min={T.firstDay} max={T.lastDay}
        onAll={() => { setF(''); setT(''); }} onLast={() => { setF(T.lastDay); setT(T.lastDay); }}
        note={`Repairs finished from ${fmtDay(from)} to ${fmtDay(to)}`} />

      <div className="kpis">
        <div className="card kpi"><small>Mechanics who worked</small><b>{H.rows.length}</b><span>finished at least one repair</span></div>
        <div className="card kpi"><small>Tickets repaired</small><b>{H.tickets}</b><span>in these dates</span></div>
        <div className="card kpi"><small>Total repair hours</small><b>{hours(H.total)}</b><span>all mechanics together</span></div>
        <div className="card kpi"><small>Hours per mechanic per day</small><b>{mechDays ? hours(H.total / mechDays) : '–'}</b><span>average on days they worked</span></div>
      </div>

      <div className="card">
        <h2>Hours each mechanic worked, per day</h2>
        <div className="sub">Hours of repair time on the tickets they completed. Darker means more hours. Most hours first.</div>
        <div className="twrap">
          <table className="sumtable">
            <thead><tr>
              <th className="l">Mechanic</th>
              {H.dates.map(d => { const x = dt(d); return <th key={d}>{fmtDay(d)}<br />{WD[x.getDay()]}</th>; })}
              <th>Total hours</th><th>Tickets</th><th>Hours per day</th>
            </tr></thead>
            <tbody>
              {H.rows.map(r => (
                <tr key={r.name}>
                  <td className="l" title={r.name}>{r.name}</td>
                  {H.dates.map(d => { const v = r.days[d] || 0; return <td key={d} className={(v ? 'h' : '') + ' mono'} style={v ? { '--t': (v / peak).toFixed(2) } : undefined}>{v ? hours(v) : ''}</td>; })}
                  <td className="mono"><b>{hours(r.total)}</b></td>
                  <td className="mono">{r.tickets}</td>
                  <td className="mono">{r.workDays ? hours(r.total / r.workDays) : '–'}</td>
                </tr>
              ))}
              {!H.rows.length && <tr><td className="l" colSpan={H.dates.length + 4}><div className="empty">No repairs finished in these dates.</div></td></tr>}
            </tbody>
            <tfoot><tr>
              <td className="l">All mechanics</td>
              {H.dates.map(d => <td key={d}>{hours(H.dayTotals[d])}</td>)}
              <td>{hours(H.total)}</td><td>{H.tickets}</td><td />
            </tr></tfoot>
          </table>
        </div>
        <p className="muted" style={{ marginTop: 12 }}>Hours are the "Repair Time" written on each ticket. They are counted on the day the repair finished. Tickets still being repaired are not included yet.</p>
      </div>
    </>
  );
}
