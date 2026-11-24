import { fmtDay, shortages } from '../lib/model';
export default function Kpis({ M, C }) {
  const days = M.dates.filter(d => C.total[d] > 0);
  let pk = 0, pd = ''; days.forEach(d => { if (C.total[d] > pk) { pk = C.total[d]; pd = d; } });
  const bad = Object.keys(C.unmapped).length, hasInv = Object.keys(M.inventory).length > 0, sh = shortages(M, C);
  return (
    <div className="kpis">
      <div className="card kpi"><small>Working days</small><b>{days.length}</b><span>{fmtDay(M.dates[0])} to {fmtDay(M.dates[M.dates.length - 1])}</span></div>
      <div className="card kpi"><small>Busiest day</small><b>{pk || '–'}</b><span>{pd ? `machines needed on ${fmtDay(pd)}` : 'no plan'}</span></div>
      <div className={'card kpi ' + (hasInv ? (sh.length ? 'alert' : 'ok') : '')}><small>Machine types short</small><b>{hasInv ? sh.length : '–'}</b><span>{hasInv ? (sh.length ? 'need more than you have' : 'you have enough') : 'machine list not loaded'}</span></div>
      <div className={'card kpi ' + (bad ? 'alert' : 'ok')}><small>Styles with no layout</small><b>{bad}</b><span>{bad ? 'counted as zero machines' : 'all styles covered'}</span></div>
    </div>
  );
}
