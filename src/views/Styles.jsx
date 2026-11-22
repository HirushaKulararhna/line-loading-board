import { norm, sumM } from '../lib/model';
export default function Styles({ M, C, q, setQ, onOpenStyle }) {
  const list = M.styles.filter(s => !q || norm(s.k).includes(norm(q)) || norm(s.p).includes(norm(q)));
  return (
    <>
      <div className="row">
        <input className="search" placeholder="Search style or product" value={q} onChange={e => setQ(e.target.value)} aria-label="Search styles" />
        <span className="sub" style={{ margin: 0 }}>{list.length} of {M.styles.length} styles</span>
      </div>
      <div className="cards">
        {list.map(s => {
          const ent = Object.entries(s.m).sort((a, b) => b[1] - a[1]);
          return (
            <div className="card scard click" key={s.k} role="button" tabIndex={0} onClick={() => onOpenStyle(s.k)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenStyle(s.k); } }}>
              <div className="row" style={{ margin: 0, flexWrap: 'nowrap' }}><h3>{s.k}</h3>{C.used.has(norm(s.k)) && <span className="pill in">In plan</span>}</div>
              <div className="p">{s.p} · {sumM(s.m)} machines</div>
              <div className="tags">
                {ent.slice(0, 10).map(([n, v]) => <span className="tag" key={n}>{n} <b>{v}</b></span>)}
                {ent.length > 10 && <span className="tag">+{ent.length - 10} more · click to see all</span>}
              </div>
            </div>
          );
        })}
        {!list.length && <div className="empty">No styles match.</div>}
      </div>
    </>
  );
}
