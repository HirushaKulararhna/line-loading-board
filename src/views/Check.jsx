import { useMemo } from 'react';
import Sty from '../components/Sty';
import { compareFleet, machineIssues, nm, supplyTable } from '../lib/machines';
import { shortages } from '../lib/model';

const line = { display: 'flex', justifyContent: 'space-between', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--line)' };

export default function Check({ M, C, onOpenStyle, machines, opts }) {
  const keys = Object.keys(C.unmapped).sort(), sh = shortages(M, C), hasInv = Object.keys(M.inventory).length > 0;
  const list = machines ? machines.list : [];
  const cmp = useMemo(() => (machines ? compareFleet(M, C, M.dates, list, opts) : null), [M, C, machines, list, opts]);
  const iss = useMemo(() => (machines ? machineIssues(list) : null), [machines, list]);
  const unusedTypes = useMemo(() => {
    if (!machines) return [];
    const demand = new Set(M.machines.map(nm));
    return [...supplyTable(list, opts).values()].filter(s => s.registered > 0 && !demand.has(s.key)).sort((a, b) => b.registered - a.registered);
  }, [M, machines, list, opts]);

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

      {machines && (
        <>
          <div className="card" style={{ marginTop: 14 }}>
            <h2>Plan machines not found in the machine list</h2>
            <div className="sub">The plan needs these, but no machine with the same name is registered. Either the name is spelled differently, or you have none. If it is a spelling difference, add it to machineAliases in src/config.js.</div>
            {cmp.notFound.length ? cmp.notFound.sort((a, b) => b.need - a.need).map(r => <div style={line} key={r.key}><span>{r.name}</span><span className="pill w">needs {r.need}</span></div>) : <div className="empty">Every needed machine name was found.</div>}
          </div>
          <div className="card" style={{ marginTop: 14 }}>
            <h2>Machine list entries not used by any Layout machine</h2>
            <div className="sub">These machines exist in the machine list but no style asks for them by this name. Fine for washing and test machines. If it is a spelling difference, add an alias.</div>
            {unusedTypes.length ? unusedTypes.slice(0, 40).map(s => <div style={line} key={s.key}><span>{s.key}</span><span className="mono">{s.registered}</span></div>) : <div className="empty">None.</div>}
          </div>
          <div className="card" style={{ marginTop: 14 }}>
            <h2>Machine list problems</h2>
            <div className="sub">Things in the machine list worth fixing in Excel.</div>
            <div style={line}><span>Serial numbers used twice</span><span className={'pill ' + (iss.dup.length ? 'bad' : 'in')}>{iss.dup.length}</span></div>
            {iss.dup.slice(0, 5).map((r, i) => <div className="sub" key={i} style={{ margin: '2px 0 2px 12px' }}>{r.serial} · {r.sub} · line {r.line}</div>)}
            <div style={line}><span>Machines without a serial number</span><span className={'pill ' + (iss.noSerial.length ? 'bad' : 'in')}>{iss.noSerial.length}</span></div>
            <div style={line}><span>"Active" machines with no line</span><span className={'pill ' + (iss.activeNoLine.length ? 'w' : 'in')}>{iss.activeNoLine.length}</span></div>
            <div style={line}><span>Purchase type not Purchased, Rented or Test</span><span className={'pill ' + (iss.unknownPurchase.length ? 'bad' : 'in')}>{iss.unknownPurchase.length}</span></div>
          </div>
        </>
      )}

      {hasInv && !machines && (
        <div className="card" style={{ marginTop: 14 }}>
          <h2>Machine shortages</h2><div className="sub">Peak demand above the machines you have available.</div>
          {sh.length ? sh.map(s => <div style={line} key={s.m}><span>{s.m}</span><span className="mono">need {s.pk} · have {s.a}</span></div>) : <div className="empty">No shortages.</div>}
        </div>
      )}
    </>
  );
}
