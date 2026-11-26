import { useEffect, useMemo, useState } from 'react';
import { useDataset } from './hooks/useDataset';
import { PLAN_SPEC, MACHINE_SPEC, TICKET_SPEC } from './sources';
import { compute, todayStr } from './lib/model';
import { DEFAULT_OPTS, inventoryFromFleet } from './lib/machines';
import { PAGES, HELP, Rail, TopBar } from './components/Chrome';
import Overview from './views/Overview';
import Schedule from './views/Schedule';
import Machines from './views/Machines';
import Summary from './views/Summary';
import Fleet from './views/Fleet';
import Lines from './views/Lines';
import MachineList from './views/MachineList';
import Styles from './views/Styles';
import Check from './views/Check';
import Mechanics from './views/Mechanics';
import Waiting from './views/Waiting';
import Approvals from './views/Approvals';
import StyleDrawer from './components/StyleDrawer';
import LineDrawer from './components/LineDrawer';

const routeFromHash = () => { const h = location.hash.slice(1); return PAGES[h] ? h : 'overview'; };
const NO_FILTERS = { q: '', line: '', purchase: '', status: '', type: '' };

export default function App() {
  const planSrc = useDataset(PLAN_SPEC);
  const machSrc = useDataset(MACHINE_SPEC);
  const tickSrc = useDataset(TICKET_SPEC);
  const T = tickSrc.model;
  const machines = machSrc.model;
  const [opts, setOpts] = useState(DEFAULT_OPTS); // which machines count as usable
  const [route, setRoute] = useState(routeFromHash());
  const isTicketPage = ['mechanics', 'waiting', 'approvals'].includes(route);
  const [range, setRange] = useState('two');
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState(null);
  const [openCode, setOpenCode] = useState(null); // style details panel
  const [openLine, setOpenLine] = useState(null); // line details panel
  const [filters, setFilters] = useState(NO_FILTERS); // machine list filters

  const plan = planSrc.model;
  const C = useMemo(() => (plan ? compute(plan) : null), [plan]);
  // when the machine list is loaded it replaces the optional "Machine Available" tab
  const M = useMemo(() => (plan && machines ? { ...plan, inventory: inventoryFromFleet(plan, machines.list, opts) } : plan), [plan, machines, opts]);

  useEffect(() => {
    const f = () => { setRoute(routeFromHash()); setQ(''); setOpenCode(null); setOpenLine(null); };
    addEventListener('hashchange', f); return () => removeEventListener('hashchange', f);
  }, []);

  const selDate = useMemo(() => {
    if (!M) return null;
    if (picked && M.dates.includes(picked)) return picked;
    const t = todayStr();
    return (C.total[t] ? t : M.dates.find(d => C.total[d] > 0 && d >= t)) || M.dates.find(d => C.total[d] > 0) || M.dates[0];
  }, [M, C, picked]);

  const showMachines = line => { setFilters({ ...NO_FILTERS, line }); setOpenLine(null); location.hash = '#list'; };

  const bad = C ? Object.keys(C.unmapped).length : 0;
  const subtitle = HELP[route];
  const toast = planSrc.toast || machSrc.toast || tickSrc.toast;
  const pending = T ? T.tickets.filter(t => t.status === 'Pending for Approval').length : 0;

  return (
    <div className="app">
      <Rail route={route} badges={{ check: bad, waiting: pending }} />
      <main>
        <TopBar title={PAGES[route]} subtitle={subtitle} sources={isTicketPage ? [tickSrc] : [planSrc, machSrc]} />
        {M && !isTicketPage && bad > 0 && route !== 'check' && (
          <div className="notice">{bad} scheduled style{bad > 1 ? 's have' : ' has'} no machine layout and {bad > 1 ? 'are' : 'is'} counted as zero. <a href="#check">See which</a></div>
        )}
        {isTicketPage && !T && <div className="card"><div className="empty">{tickSrc.status.kind === 'err' ? 'The ticket report is not loaded yet. Click "Change tickets file" at the top and pick the Detailed Ticket Info Report you downloaded.' : 'Loading tickets…'}</div></div>}
        {T && route === 'mechanics' && <Mechanics T={T} />}
        {T && route === 'waiting' && <Waiting T={T} />}
        {T && route === 'approvals' && <Approvals T={T} />}
        {!isTicketPage && !M && <div className="card"><div className="empty">{planSrc.status.kind === 'err' ? planSrc.status.text : 'Loading your plan…'}</div></div>}
        {M && route === 'overview' && <Overview M={M} C={C} range={range} setRange={setRange} selDate={selDate} setSelDate={setPicked} onOpenStyle={setOpenCode} />}
        {M && route === 'schedule' && <Schedule M={M} C={C} range={range} setRange={setRange} onOpenStyle={setOpenCode} />}
        {M && route === 'machines' && <Machines M={M} C={C} range={range} setRange={setRange} q={q} setQ={setQ} />}
        {M && route === 'summary' && <Summary M={M} C={C} machines={machines} onOpenStyle={setOpenCode} />}
        {M && route === 'fleet' && <Fleet M={M} C={C} machines={machines} opts={opts} setOpts={setOpts} range={range} setRange={setRange} />}
        {M && route === 'lines' && <Lines M={M} C={C} machines={machines} opts={opts} setOpts={setOpts} range={range} setRange={setRange} onOpenLine={setOpenLine} />}
        {M && route === 'list' && <MachineList machines={machines} filters={filters} setFilters={setFilters} />}
        {M && route === 'styles' && <Styles M={M} C={C} q={q} setQ={setQ} onOpenStyle={setOpenCode} />}
        {M && route === 'check' && <Check M={M} C={C} onOpenStyle={setOpenCode} machines={machines} opts={opts} />}
      </main>
      {M && openCode && <StyleDrawer code={openCode} M={M} C={C} onClose={() => setOpenCode(null)} />}
      {M && machines && openLine && <LineDrawer line={openLine} M={M} C={C} machines={machines} opts={opts} setOpts={setOpts} range={range} onClose={() => setOpenLine(null)} onShowMachines={showMachines} onOpenStyle={setOpenCode} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
