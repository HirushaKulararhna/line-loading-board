import { useMemo, useState } from 'react';
import { fmtMin, fmtStamp, waiting } from '../lib/tickets';

export default function Waiting({ T }) {
  const W = useMemo(() => waiting(T), [T]);
  const [sup, setSup] = useState(null); // null = all supervisors
  const rows = sup === null ? W.pending : W.pending.filter(t => t.supervisor === sup);
  const name = s => s || 'Not known';

  return (
    <>
      <div className="kpis">
        <div className={'card kpi ' + (W.pending.length ? 'alert' : 'ok')}><small>Waiting for approval</small><b>{W.pending.length}</b><span>repaired, supervisor has not approved</span></div>
        <div className="card kpi"><small>Waiting the longest</small><b>{W.pending.length ? fmtMin(W.longest) : '–'}</b><span>since the repair finished</span></div>
        <div className="card kpi"><small>Not repaired yet</small><b>{W.notRepaired}</b><span>reported or still in repair</span></div>
      </div>

      {W.pending.length > 0 && (
        <div className="card" style={{ marginBottom: 14 }}>
          <h2>Which supervisor has not approved</h2>
          <div className="sub">The report does not say who must approve, so this is the supervisor who normally approves that line. Click a name to see only their tickets.</div>
          <div className="twrap" style={{ maxHeight: 'none' }}>
            <table className="left">
              <thead><tr><th>Supervisor</th><th>Tickets waiting</th><th>Waiting the longest</th></tr></thead>
              <tbody>
                {W.sups.map(s => (
                  <tr key={s.name} className={sup === s.name ? 'picked' : ''}>
                    <td><button className="linkcell" onClick={() => setSup(sup === s.name ? null : s.name)}>{name(s.name)}</button></td>
                    <td className="mono"><b>{s.n}</b></td><td className="mono">{fmtMin(s.longest)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <div className="row">
          <div><h2>Tickets waiting for approval{sup !== null ? ` · ${name(sup)}` : ''}</h2>
            <div className="sub">Longest wait first. Waiting is counted up to {fmtStamp(T.asOf)}, the latest time in the report.</div></div>
          {sup !== null && <button className="btn ghost" onClick={() => setSup(null)}>Show all</button>}
        </div>
        <div className="twrap">
          <table className="left">
            <thead><tr><th>Ticket</th><th>Supervisor</th><th>Line</th><th>Machine</th><th>Mechanic</th><th>Repair finished</th><th>Waiting</th></tr></thead>
            <tbody>
              {rows.map(t => (
                <tr key={t.id}>
                  <td className="mono">{t.id}</td>
                  <td>{t.supervisor || <span className="muted">not known</span>}</td>
                  <td>{t.line}</td>
                  <td>{t.machine}{t.serial && <span className="sm"> · {t.serial}</span>}</td>
                  <td>{t.mechanic || <span className="muted">–</span>}</td>
                  <td>{t.repairEnd ? fmtStamp(t.repairEnd.min) : '–'}</td>
                  <td className="mono"><b>{fmtMin(t.waitMin)}</b></td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={7}><div className="empty">Every repaired ticket has been approved.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
