import { RangeToggle } from '../components/Chrome';
import { WD, dt, fmtDay, hue, norm, todayStr, visibleDates } from '../lib/model';

export default function Schedule({ M, C, range, setRange, onOpenStyle }) {
  const ds = visibleDates(M, range), N = ds.length, today = todayStr(), R = M.modules.length;
  const off = ds.map(d => M.modules.every(m => !M.plan[m][d]));
  const segs = [];
  M.modules.forEach((mod, r) => {
    let i = 0;
    while (i < N) {
      const st = M.plan[mod][ds[i]];
      if (!st) { i++; continue; }
      let j = i; while (j + 1 < N && M.plan[mod][ds[j + 1]] === st) j++;
      segs.push({ mod, st, r, i, j, bad: !C.idx.has(norm(st)) });
      i = j + 1;
    }
  });
  return (
    <div className="card">
      <div className="row">
        <div><h2>Which style runs where</h2><div className="sub">Each bar is a style running on a module. Grey columns are days with no production.</div></div>
        <RangeToggle range={range} setRange={setRange} />
      </div>
      <div className="gwrap">
        <div className="gantt" style={{ gridTemplateColumns: `140px repeat(${N},minmax(66px,1fr))`, gridTemplateRows: `auto repeat(${R},58px)` }}>
          <div className="gh corner" style={{ gridColumn: 1, gridRow: 1 }}>Module</div>
          {ds.map((d, i) => <div key={d} className={'gh' + (d === today ? ' today' : '')} style={{ gridColumn: i + 2, gridRow: 1 }}><b>{dt(d).getDate()}</b>{WD[dt(d).getDay()]}</div>)}
          {M.modules.map((mod, r) => (
            <span key={mod} style={{ display: 'contents' }}>
              <div className="gl" style={{ gridColumn: 1, gridRow: r + 2 }}>{mod}</div>
              <div className="rowline" style={{ gridColumn: `2 / span ${N}`, gridRow: r + 2 }} />
            </span>
          ))}
          {ds.map((d, i) => off[i] && <div key={'o' + d} className="stripe" style={{ gridColumn: i + 2, gridRow: `2 / span ${R}` }} />)}
          {segs.map(s => (
            <div key={s.mod + s.i} className={'seg2' + (s.bad ? ' bad' : '')} style={{ gridColumn: `${s.i + 2} / span ${s.j - s.i + 1}`, gridRow: s.r + 2, '--h': hue(s.st), cursor: 'pointer' }}
              onClick={() => onOpenStyle(s.st)}
              title={`${s.mod} · ${s.st} · ${fmtDay(ds[s.i])} to ${fmtDay(ds[s.j])}${s.bad ? ' · no machine layout' : ''}`}>{s.st}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
