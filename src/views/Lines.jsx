import { useMemo } from 'react';
import StackBar from '../components/StackBar';
import { FleetOptions } from './Fleet';
import { RangeToggle } from '../components/Chrome';
import { linesOf, lineModules, lineSummary } from '../lib/machines';
import { visibleDates } from '../lib/model';

export default function Lines({ M, C, machines, opts, setOpts, range, setRange, onOpenLine }) {
  const dates = visibleDates(M, range);
  const list = machines ? machines.list : [];
  const cards = useMemo(() => linesOf(list).map(l => ({ ...l, s: lineSummary(M, C, dates, list, opts, l.name) })), [M, C, range, list, opts]); // eslint-disable-line
  if (!machines) return <div className="card"><div className="empty">The machine list is not loaded yet. Put it at <b>public/data/machines.xlsx</b>, or link it with the button at the top.</div></div>;
  const orphan = M.modules.filter(m => !cards.some(c => lineModules(M, c.name).includes(m)));
  return (
    <>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="row"><div><h2>Machines on each line</h2><div className="sub">Click a line for the full machine list, owned or rented, and what the plan needs there.</div></div><RangeToggle range={range} setRange={setRange} /></div>
        <FleetOptions opts={opts} setOpts={setOpts} />
      </div>
      {orphan.length > 0 && <div className="notice">Plan modules with no matching line in the machine list: <b>{orphan.join(', ')}</b>. To match them, add them under lineAliases in src/config.js.</div>}
      <div className="cards">
        {cards.map(({ name, recs, s }) => {
          const owned = recs.filter(r => r.purchase === 'Owned').length, rented = recs.filter(r => r.purchase === 'Rented').length;
          return (
            <button key={name} className="card scard click lcard" onClick={() => onOpenLine(name)}>
              <div className="row" style={{ margin: 0, flexWrap: 'nowrap' }}>
                <h3>{name === 'Unassigned' ? 'Unassigned (spare)' : /^\d+$/.test(name) ? `Line ${name}` : name}</h3>
                {s.planned ? (s.short > 0 ? <span className="pill bad">needs {s.short} more</span> : <span className="pill in">plan covered</span>) : <span className="pill mute">no plan module</span>}
              </div>
              <div className="p">{recs.length} machines · {s.usable} usable</div>
              <StackBar parts={[{ label: 'Owned', n: owned, cls: 'c1' }, { label: 'Rented', n: rented, cls: 'c2' }]} />
            </button>
          );
        })}
      </div>
    </>
  );
}
