import { useMemo, useState } from 'react';
import DateRange from '../components/DateRange';
import { fmtDay } from '../lib/model';
import { PENDING, approvals, fmtMin, fmtStamp } from '../lib/tickets';

export default function Approvals({ T }) {
  const [f, setF] = useState(''), [t, setT] = useState('');
  const from = f || T.firstDay, to = t || T.lastDay;
  const A = useMemo(() => approvals(T.tickets, from, to), [T, from, to]);
  const waiting = T.tickets.filter(x => x.status === PENDING).length;
  const maxAvg = Math.max(1, ...A.sups.map(s => s.avg));

  return (
    <>
      <DateRange from={from} to={to} setFrom={setF} setTo={setT} min={T.firstDay} max={T.lastDay}
        onAll={() => { setF(''); setT(''); }} onLast={() => { setF(T.lastDay); setT(T.lastDay); }}
        note={`Tickets whose repair finished from ${fmtDay(from)} to ${fmtDay(to)}`} />

      <div className="kpis">
        <div className="card kpi"><small>Tickets approved</small><b>{A.done.length}</b><span>by supervisors</span></div>
        <div className="card kpi"><small>Average approval time</small><b>{A.done.length ? fmtMin(A.avg) : '–'}</b><span>from repair finished to approved</span></div>
        <div className="card kpi"><small>Slowest approval</small><b>{A.done.length ? fmtMin(A.longest) : '–'}</b><span>one ticket</span></div>
        <div className={'card kpi ' + (waiting ? 'alert' : 'ok')}><small>Not approved yet</small><b>{waiting}</b><span><a href="#waiting">See which tickets</a></span></div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <h2>Approval time by supervisor</h2>
        <div className="sub">Slowest average first. The bar shows the average time.</div>
        <div className="twrap" style={{ maxHeight: 'none' }}>
          <table className="left">
            <thead><tr><th>Supervisor</th><th>Tickets approved</th><th>Average time</th><th style={{ width: '30%' }} /><th>Slowest</th></tr></thead>
            <tbody>
              {A.sups.map(s => (
                <tr key={s.name}>
                  <td><b>{s.name}</b></td><td className="mono">{s.n}</td><td className="mono"><b>{fmtMin(s.avg)}</b></td>
                  <td><div className="hbar" style={{ margin: 0 }}><i style={{ width: `${(s.avg / maxAvg) * 100}%` }} /></div></td>
                  <td className="mono">{fmtMin(s.longest)}</td>
                </tr>
              ))}
              {!A.sups.length && <tr><td colSpan={5}><div className="empty">No approved tickets in these dates.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {A.slowest.length > 0 && (
        <div className="card">
          <h2>10 slowest approvals</h2>
          <div className="sub">Tickets that waited longest for a supervisor to approve.</div>
          <div className="twrap" style={{ maxHeight: 'none' }}>
            <table className="left">
              <thead><tr><th>Ticket</th><th>Supervisor</th><th>Line</th><th>Machine</th><th>Repair finished</th><th>Approval time</th></tr></thead>
              <tbody>
                {A.slowest.map(x => (
                  <tr key={x.id}>
                    <td className="mono">{x.id}</td><td>{x.approver}</td><td>{x.line}</td>
                    <td>{x.machine}{x.serial && <span className="sm"> · {x.serial}</span>}</td>
                    <td>{x.repairEnd ? fmtStamp(x.repairEnd.min) : '–'}</td>
                    <td className="mono"><b>{fmtMin(x.approvalMin)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="muted" style={{ marginTop: 12 }}>Approval time is the "Approval Time" the ticket system recorded.</p>
    </>
  );
}
