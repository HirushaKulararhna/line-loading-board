import { RangeToggle } from '../components/Chrome';
import { WD, dt, norm, visibleDates } from '../lib/model';

export default function Machines({ M, C, range, setRange, q, setQ }) {
  const ds = visibleDates(M, range), hasInv = Object.keys(M.inventory).length > 0;
  const rows = M.machines.filter(m => ds.some(d => C.perDay[d][m]) && (!q || norm(m).includes(norm(q))));
  return (
    <div className="card">
      <div className="row">
        <div><h2>Machines needed</h2><div className="sub">Darker cells need more machines.{hasInv ? ' Red means more than you have.' : ''}</div></div>
        <div className="row" style={{ margin: 0 }}>
          <input className="search" placeholder="Search machine" value={q} onChange={e => setQ(e.target.value)} aria-label="Search machine" />
          <RangeToggle range={range} setRange={setRange} />
        </div>
      </div>
      <div className="twrap">
        <table>
          <thead><tr>
            <th className="l">Machine</th>{hasInv && <th>Available</th>}<th>Peak</th>
            {ds.map(d => { const x = dt(d); return <th key={d} className={x.getDay() === 0 ? 'off' : ''}>{x.getDate()}<br />{WD[x.getDay()]}</th>; })}
          </tr></thead>
          <tbody>
            {rows.map(m => {
              const v = ds.map(d => C.perDay[d][m] || 0), pk = Math.max(...v), av = M.inventory[m];
              return (
                <tr key={m}>
                  <td className="l" title={m}>{m}</td>
                  {hasInv && <td className="mono">{av ?? ''}</td>}
                  <td className="mono"><b>{pk}</b></td>
                  {v.map((x, i) => { const bad = av !== undefined && x > av; return <td key={i} className={(bad ? 'short' : x ? 'h' : '') + ' mono'} style={x && !bad ? { '--t': (x / pk).toFixed(2) } : undefined}>{x || ''}</td>; })}
                </tr>
              );
            })}
            {!rows.length && <tr><td className="l" colSpan={ds.length + 3}><div className="empty">No machines match.</div></td></tr>}
          </tbody>
          <tfoot><tr><td className="l">Total machines</td>{hasInv && <td />}<td />{ds.map(d => <td key={d}>{C.total[d] || '–'}</td>)}</tr></tfoot>
        </table>
      </div>
    </div>
  );
}
