import { useMemo, useState } from 'react';
import StackBar from '../components/StackBar';
import { compareFleet, fleetTotals, nm } from '../lib/machines';
import { dt, fmtDay, todayStr, ymd } from '../lib/model';

// Every registered machine counts here (owned, rented, any status) so the numbers match the machine list.
const ALL = { rented: true, pending: true, maintenance: true };

export default function Summary({ M, C, machines }) {
  const first = M.dates[0], last = M.dates[M.dates.length - 1];
  const [from, setFrom] = useState(first);
  const [to, setTo] = useState(last);
  const [q, setQ] = useState('');
  const [showOther, setShowOther] = useState(false);
  const list = machines ? machines.list : [];
  const dates = useMemo(() => M.dates.filter(d => d >= from && d <= to), [M, from, to]);
  const t = useMemo(() => fleetTotals(list), [list]);
  const cmp = useMemo(() => compareFleet(M, C, dates, list, ALL), [M, C, dates, list]);

  if (!machines) return <div className="card"><div className="empty">The machine list is not loaded yet. Put it at <b>public/data/machines.xlsx</b>, or use the "Change machines file" button at the top.</div></div>;

  const quick = n => {
    const t0 = todayStr(), a = M.dates.find(d => d >= t0) || first, e = dt(a); e.setDate(e.getDate() + n);
    setFrom(a); setTo(ymd(e) > last ? last : ymd(e));
  };
  const rows = cmp.rows.filter(r => (q ? r.registered > 0 || r.need > 0 : r.need > 0) && (!q || nm(r.name).includes(nm(q)))).sort((a, b) => b.short - a.short || b.need - a.need);
  const needed = rows.reduce((a, r) => a + r.need, 0);
  const lack = cmp.toAdd;
  // machine types the plan does not use in these dates, so the table footer adds up to ALL machines
  const other = cmp.rows.filter(r => !r.need && r.registered > 0);
  const otherOwned = other.reduce((a, r) => a + r.owned, 0), otherRented = other.reduce((a, r) => a + r.rented, 0);
  const otherSorted = [...other].sort((a, b) => b.registered - a.registered || a.name.localeCompare(b.name));
  const planRows = cmp.rows.filter(r => r.need > 0);
  const planOwned = planRows.reduce((a, r) => a + r.owned, 0), planRented = planRows.reduce((a, r) => a + r.rented, 0);
  const toRent = rows.reduce((a, r) => a + Math.max(0, r.need - r.owned), 0);
  const bad = from > to;

  return (
    <>
      <div className="card" style={{ marginBottom: 14 }}>
        <h2>Choose the dates</h2>
        <div className="sub">The numbers below are for the days you pick.</div>
        <div className="bar2">
          <label className="dlabel">From <input type="date" className="search dateinp" value={from} min={first} max={last} onChange={e => e.target.value && setFrom(e.target.value)} /></label>
          <label className="dlabel">To <input type="date" className="search dateinp" value={to} min={first} max={last} onChange={e => e.target.value && setTo(e.target.value)} /></label>
          <div className="seg" role="group" aria-label="Quick dates">
            <button aria-pressed={false} onClick={() => quick(7)}>Next 7 days</button>
            <button aria-pressed={false} onClick={() => quick(14)}>Next 2 weeks</button>
            <button aria-pressed={false} onClick={() => { setFrom(first); setTo(last); }}>Whole plan</button>
          </div>
        </div>
        {bad ? <div className="notice" style={{ marginBottom: 0 }}>"From" is after "To". Please fix the dates.</div>
          : <div className="muted">Showing {fmtDay(dates[0] || from)} to {fmtDay(dates[dates.length - 1] || to)} · {dates.length} plan days</div>}
      </div>

      <div className="kpis">
        <div className="card kpi"><small>Purchased machines</small><b>{t.owned}</b><span>we own</span></div>
        <div className="card kpi"><small>Rented machines</small><b>{t.rented}</b><span>we rent now</span></div>
        <div className="card kpi"><small>Machines required</small><b>{needed}</b><span>all machines the plan needs</span></div>
        <div className={'card kpi ' + (toRent ? 'alert' : 'ok')}><small>Machines to rent</small><b>{toRent}</b><span>{toRent ? `needed beyond purchased (${t.rented} already rented, ${lack} more to rent)` : 'purchased machines are enough'}</span></div>
      </div>

      <div className="card">
        <h2>Machine types the plan needs</h2>
        <div className="sub">Biggest shortage first. "Needed" is the most machines of that type used on one day in the chosen dates.</div>
        <StackBar parts={[{ label: 'Purchased', n: t.owned, cls: 'c1' }, { label: 'Rented', n: t.rented, cls: 'c2' }]} />
        {cmp.notFound.length > 0 && <div className="notice" style={{ marginTop: 12 }}>{cmp.notFound.length} machine type{cmp.notFound.length > 1 ? 's' : ''} in the plan could not be found in the machine list ({cmp.notFoundNeed} machines). They are marked "name not found" below.</div>}
        <div className="bar2" style={{ marginTop: 14 }}>
          <input className="search" placeholder="Search machine sub-category" value={q} onChange={e => setQ(e.target.value)} aria-label="Search machine sub-category" />
          {q && <button className="btn ghost" onClick={() => setQ('')}>Clear</button>}
          <span className="muted">{q ? `${rows.length} found (including types not in the plan)` : 'Type to find any machine sub-category'}</span>
        </div>
        <div className="twrap">
          <table className="sumtable">
            <thead><tr><th className="l">Machine type</th><th>Purchased</th><th>Rented</th><th>Required</th><th>To rent</th><th>Rent more / extra</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.key}>
                  <td className="l" title={r.name}>{r.name}</td>
                  <td className="mono">{r.owned}</td><td className="mono">{r.rented}</td>
                  <td className="mono">{r.need ? <><b>{r.need}</b><span className="sm"> {fmtDay(r.peakDate)}</span></> : <span className="muted">–</span>}</td>
                  <td className="mono">{r.need ? <b>{Math.max(0, r.need - r.owned) || ''}</b> : ''}</td>
                  <td>{!r.need ? <span className="muted">not in plan</span> : !r.found ? <span className="pill w">name not found</span>
                    : r.short > 0 ? <span className="pill bad">rent {r.short} more</span>
                    : <span className="pill in">{r.gap} extra</span>}</td>
                </tr>
              ))}
              {showOther && !q && other.length > 0 && <tr className="subhead"><td className="l" colSpan={6}>Machine types the plan does not use in these dates ({other.length})</td></tr>}
              {showOther && !q && otherSorted.map(r => (
                <tr key={'o' + r.key} className="otherrow">
                  <td className="l" title={r.name}>{r.name}</td>
                  <td className="mono">{r.owned}</td><td className="mono">{r.rented}</td>
                  <td className="mono"><span className="muted">–</span></td><td className="mono" /><td><span className="muted">not in plan</span></td>
                </tr>
              ))}
              {!rows.length && <tr><td className="l" colSpan={6}><div className="empty">{q ? 'No machine sub-category matches.' : 'No production planned in these dates.'}</div></td></tr>}
            </tbody>
            <tfoot>
              <tr><td className="l">Types the plan uses</td><td>{planOwned}</td><td>{planRented}</td><td>{needed}</td><td>{toRent}</td><td>{lack ? `rent ${lack} more` : ''}</td></tr>
              <tr><td className="l">Other types (not in plan, {other.length}) <button className="btn ghost linkbtn" onClick={() => { setShowOther(v => !v); setQ(''); }}>{showOther ? 'Hide list' : 'Show list'}</button></td><td>{otherOwned}</td><td>{otherRented}</td><td /><td /><td /></tr>
              <tr><td className="l">All our machines</td><td>{planOwned + otherOwned}</td><td>{planRented + otherRented}</td><td /><td /><td /></tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  );
}
