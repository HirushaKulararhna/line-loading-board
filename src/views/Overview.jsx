import Kpis from './Kpis';
import Sty from '../components/Sty';
import { RangeToggle } from '../components/Chrome';
import { WD, dt, fmtDay, norm, sumM, todayStr, visibleDates } from '../lib/model';

export default function Overview({ M, C, range, setRange, selDate, setSelDate, onOpenStyle }) {
  const ds = visibleDates(M, range), today = todayStr();
  const max = Math.max(1, ...ds.map(d => C.total[d] || 0));
  const top = Object.entries(C.perDay[selDate] || {}).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const tmax = top[0] ? top[0][1] : 1;
  const mods = M.modules.filter(m => M.plan[m][selDate]);
  return (
    <>
      <Kpis M={M} C={C} />
      <div className="grid">
        <div className="card">
          <div className="row">
            <div><h2>Machines needed per day</h2><div className="sub">Select a day to see what runs on it</div></div>
            <RangeToggle range={range} setRange={setRange} />
          </div>
          <div className="chart">
            <div className="bars">
              {ds.map(d => {
                const v = C.total[d] || 0;
                return (
                  <div key={d} className={'bcol' + (v ? '' : ' off') + (d === selDate ? ' sel' : '')}>
                    {v > 0 && <span className="bval" style={{ bottom: `calc(${(v / max * 100).toFixed(1)}% * .88 + 4px)` }}>{v}</span>}
                    <button className="bar" style={{ height: `${(v / max * 88).toFixed(1)}%` }} aria-label={`${fmtDay(d)}: ${v} machines`} onClick={() => setSelDate(d)} />
                  </div>
                );
              })}
            </div>
            <div className="axis">
              {ds.map(d => <div key={d} className={d === today ? 'today' : ''}><b>{dt(d).getDate()}</b>{WD[dt(d).getDay()]}</div>)}
            </div>
          </div>
        </div>
        <div className="card">
          <h2>{fmtDay(selDate)} · {WD[dt(selDate).getDay()]}</h2>
          <div className="sub">{C.total[selDate] || 0} machines in total</div>
          <div className="dl list2">
            {top.length ? top.map(([n, v]) => (
              <div className="it" key={n}>
                <div className="top2"><span>{n}</span><span className="mono">{v}</span></div>
                <div className="hbar"><i style={{ width: `${v / tmax * 100}%` }} /></div>
              </div>
            )) : <div className="empty">–</div>}
          </div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <h2>Modules on {fmtDay(selDate)}</h2>
        <div className="sub">Style on each module and the machines it needs</div>
        <div className="dl">
          {mods.length ? mods.map(mod => {
            const st = M.plan[mod][selDate], e = C.idx.get(norm(st));
            return <div className="it" key={mod}><span><b>{mod}</b> &nbsp;<Sty code={st} bad={!e} onClick={onOpenStyle} /></span><span className="mono">{e ? sumM(e.m) : '?'}</span></div>;
          }) : <div className="empty">No production on this day.</div>}
        </div>
      </div>
    </>
  );
}
