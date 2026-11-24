import { useMemo, useState } from 'react';
import StackBar from '../components/StackBar';
import { RangeToggle } from '../components/Chrome';
import { compareFleet, fleetTotals, nm } from '../lib/machines';
import { fmtDay, visibleDates } from '../lib/model';

export function FleetOptions({ opts, setOpts }) {
  const box = (k, label) => <label className="chk"><input type="checkbox" checked={opts[k]} onChange={e => setOpts({ ...opts, [k]: e.target.checked })} /> {label}</label>;
  return <div className="opts">{box('rented', 'Count rented machines')}{box('pending', 'Count "Pending Approval"')}{box('maintenance', 'Count "Under Maintenance"')}</div>;
}

export default function Fleet({ M, C, machines, opts, setOpts, range, setRange }) {
  const [q, setQ] = useState('');
  const [onlyShort, setOnlyShort] = useState(false);
  const [sort, setSort] = useState('gap');
  const dates = visibleDates(M, range);
  const list = machines ? machines.list : [];
  const t = useMemo(() => fleetTotals(list), [list]);
  const cmp = useMemo(() => compareFleet(M, C, dates, list, opts), [M, C, range, list, opts]); // eslint-disable-line

  if (!machines) return <div className="card"><div className="empty">The machine list is not loaded yet. Put it at <b>public/data/machines.xlsx</b>, or link it with the button at the top.</div></div>;

  let rows = cmp.rows.filter(r => (r.registered > 0 || r.need > 0) && (!q || nm(r.name).includes(nm(q))) && (!onlyShort || r.short > 0));
  const by = { gap: (a, b) => a.gap - b.gap || b.need - a.need, name: (a, b) => a.name.localeCompare(b.name), most: (a, b) => b.usable - a.usable };
  rows = rows.sort(by[sort]);
  const pct = n => (t.registered ? Math.round((n / t.registered) * 100) : 0);
  const sum = k => rows.reduce((a, r) => a + r[k], 0);
  const statusParts = ['Active', 'Available', 'Pending Approval', 'Under Maintenance'].map((s, i) => ({ label: s, n: t.status[s] || 0, cls: 'c' + (i + 1) }));

  return (
    <>
      <div className="kpis">
        <div className="card kpi"><small>Machines registered</small><b>{t.registered}</b><span>{t.test ? `${t.test} test machines not counted` : 'all machines'}</span></div>
        <div className="card kpi"><small>Owned</small><b>{t.owned}</b><span>{pct(t.owned)}% of machines</span></div>
        <div className="card kpi"><small>Rented</small><b>{t.rented}</b><span>{pct(t.rented)}% of machines</span></div>
        <div className="card kpi"><small>Spare</small><b>{t.spare}</b><span>available, not on any line</span></div>
        <div className={'card kpi ' + (cmp.toAdd ? 'alert' : 'ok')}><small>More machines needed</small><b>{cmp.toAdd}</b><span>{cmp.toAdd ? 'at the busiest day, ' : 'no shortage, '}{range === 'two' ? 'next 2 weeks' : 'whole sheet'}</span></div>
        <div className={'card kpi ' + (cmp.notFound.length ? 'warn' : '')}><small>Names not matched</small><b>{cmp.notFound.length}</b><span>{cmp.notFound.length ? `${cmp.notFoundNeed} machines of demand cannot be compared` : 'every needed machine found'}</span></div>
      </div>

      <div className="grid2c">
        <div className="card"><h2>Owned or rented</h2><div className="sub">Registered machines, test machines not counted</div>
          <StackBar parts={[{ label: 'Owned', n: t.owned, cls: 'c1' }, { label: 'Rented', n: t.rented, cls: 'c2' }, ...(t.purchaseOther ? [{ label: 'Other', n: t.purchaseOther, cls: 'c5' }] : [])]} /></div>
        <div className="card"><h2>Machine status</h2><div className="sub">Where machines stand right now</div><StackBar parts={statusParts} /></div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="row">
          <div><h2>Have versus need, by machine type</h2>
            <div className="sub">Needed is the most machines the plan asks for on one day ({fmtDay(dates[0])} to {fmtDay(dates[dates.length - 1])}). Have is what you can use today.</div></div>
          <RangeToggle range={range} setRange={setRange} />
        </div>
        <FleetOptions opts={opts} setOpts={setOpts} />
        <div className="bar2">
          <input className="search" placeholder="Search machine type" value={q} onChange={e => setQ(e.target.value)} aria-label="Search machine type" />
          <label className="chk"><input type="checkbox" checked={onlyShort} onChange={e => setOnlyShort(e.target.checked)} /> Only shortages</label>
          <select value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort"><option value="gap">Biggest shortage first</option><option value="name">Name A to Z</option><option value="most">Most machines first</option></select>
        </div>
        <div className="twrap">
          <table>
            <thead><tr><th className="l">Machine type</th><th>Owned</th><th>Rented</th><th>Usable</th><th>Spare</th><th>Needed</th><th>Result</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.key}>
                  <td className="l" title={r.name}>{r.name}</td>
                  <td className="mono">{r.owned || ''}</td><td className="mono">{r.rented || ''}</td>
                  <td className="mono"><b>{r.usable || ''}</b></td><td className="mono">{r.spare || ''}</td>
                  <td className="mono">{r.need ? <>{r.need}<span className="sm"> {fmtDay(r.peakDate)}</span></> : ''}</td>
                  <td>{!r.need ? <span className="muted">not in plan</span>
                    : !r.found ? <span className="pill w" title="No machines with this name in the machine list. Check the name, or add it to machineAliases in src/config.js">name not found</span>
                    : r.short > 0 ? <span className="pill bad">need {r.short} more</span>
                    : <span className="pill in">{r.gap} spare</span>}</td>
                </tr>
              ))}
              {!rows.length && <tr><td className="l" colSpan={7}><div className="empty">No machine types match.</div></td></tr>}
            </tbody>
            <tfoot><tr><td className="l">Total ({rows.length} types)</td><td>{sum('owned')}</td><td>{sum('rented')}</td><td>{sum('usable')}</td><td>{sum('spare')}</td><td /><td>{sum('short') ? `need ${sum('short')} more` : ''}</td></tr></tfoot>
          </table>
        </div>
      </div>
    </>
  );
}
