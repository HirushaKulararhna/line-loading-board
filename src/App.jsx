import { useEffect, useMemo, useState } from 'react';
import { useSource } from './hooks/useSource';
import { compute, todayStr } from './lib/model';
import { PAGES, Rail, TopBar } from './components/Chrome';
import Overview from './views/Overview';
import Schedule from './views/Schedule';
import Machines from './views/Machines';
import Styles from './views/Styles';
import Check from './views/Check';
import StyleDrawer from './components/StyleDrawer';

const routeFromHash = () => { const h = location.hash.slice(1); return PAGES[h] ? h : 'overview'; };

export default function App() {
  const src = useSource();
  const M = src.model;
  const C = useMemo(() => (M ? compute(M) : null), [M]);
  const [route, setRoute] = useState(routeFromHash());
  const [range, setRange] = useState('two');
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState(null);
  const [openCode, setOpenCode] = useState(null); // style whose details panel is open

  useEffect(() => {
    const f = () => { setRoute(routeFromHash()); setQ(''); setOpenCode(null); };
    addEventListener('hashchange', f); return () => removeEventListener('hashchange', f);
  }, []);

  // selected day: the one you clicked, else today, else the next working day
  const selDate = useMemo(() => {
    if (!M) return null;
    if (picked && M.dates.includes(picked)) return picked;
    const t = todayStr();
    return (C.total[t] ? t : M.dates.find(d => C.total[d] > 0 && d >= t)) || M.dates.find(d => C.total[d] > 0) || M.dates[0];
  }, [M, C, picked]);

  const bad = C ? Object.keys(C.unmapped).length : 0;
  const subtitle = M ? `${M.modules.length} modules · ${M.styles.length} styles · ${M.dates.length} days` : '';

  return (
    <div className="app">
      <Rail route={route} badCount={bad} />
      <main>
        <TopBar title={PAGES[route]} subtitle={subtitle} src={src} />
        {M && bad > 0 && route !== 'check' && (
          <div className="notice">{bad} scheduled style{bad > 1 ? 's have' : ' has'} no machine layout and {bad > 1 ? 'are' : 'is'} counted as zero. <a href="#check">See which</a></div>
        )}
        {!M && <div className="card"><div className="empty">{src.status.kind === 'err' ? src.status.text : 'Loading your plan…'}</div></div>}
        {M && route === 'overview' && <Overview M={M} C={C} range={range} setRange={setRange} selDate={selDate} setSelDate={setPicked} onOpenStyle={setOpenCode} />}
        {M && route === 'schedule' && <Schedule M={M} C={C} range={range} setRange={setRange} onOpenStyle={setOpenCode} />}
        {M && route === 'machines' && <Machines M={M} C={C} range={range} setRange={setRange} q={q} setQ={setQ} />}
        {M && route === 'styles' && <Styles M={M} C={C} q={q} setQ={setQ} onOpenStyle={setOpenCode} />}
        {M && route === 'check' && <Check M={M} C={C} onOpenStyle={setOpenCode} />}
      </main>
      {M && openCode && <StyleDrawer code={openCode} M={M} C={C} onClose={() => setOpenCode(null)} />}
      {src.toast && <div className="toast">{src.toast}</div>}
    </div>
  );
}
