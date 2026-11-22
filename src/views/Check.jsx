import Sty from '../components/Sty';
import { shortages } from '../lib/model';
const line = { display: 'flex', justifyContent: 'space-between', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--line)' };
export default function Check({ M, C, onOpenStyle }) {
  const keys = Object.keys(C.unmapped).sort(), sh = shortages(M, C), hasInv = Object.keys(M.inventory).length > 0;
  return (
    <>
      <div className="card">
        <h2>Styles with no machine layout</h2>
        <div className="sub">Add a row for each one on the Layout tab of your Excel sheet and this list clears by itself.</div>
        {keys.length ? keys.map(k => {
          const mods = [...new Set(C.unmapped[k].map(x => x[0]))].join(', '), n = C.unmapped[k].length;
          return <div style={line} key={k}><span><Sty code={k} bad onClick={onOpenStyle} /> <span className="sub" style={{ margin: 0 }}>module {mods}</span></span><span className="pill bad">{n} day{n > 1 ? 's' : ''}</span></div>;
        }) : <div className="empty">Every scheduled style has a layout.</div>}
      </div>
      {hasInv && (
        <div className="card" style={{ marginTop: 14 }}>
          <h2>Machine shortages</h2><div className="sub">Peak demand above the machines you have available.</div>
          {sh.length ? sh.map(s => <div style={line} key={s.m}><span>{s.m}</span><span className="mono">need {s.pk} · have {s.a}</span></div>) : <div className="empty">No shortages.</div>}
        </div>
      )}
    </>
  );
}
