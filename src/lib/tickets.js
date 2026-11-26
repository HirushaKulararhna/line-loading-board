// Reads the daily "Detailed Ticket Info Report" (breakdown tickets) and works out
// mechanic hours, tickets waiting for supervisor approval, and approval times.
import { MON, pad } from './model';

const cs = v => (v == null ? '' : String(v).replace(/\s+/g, ' ').trim());
const hk = s => cs(s).toLowerCase();
const num = v => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

export const PENDING = 'Pending for Approval';

// "2026-11-25 05:48 PM" -> { date: '2026-11-25', min: minutes since 1970 (clock time, no time zone) }
export function stamp(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number' && v > 30000 && v < 80000) {
    const ms = Date.UTC(1899, 11, 30) + Math.round(v * 864e5), d = new Date(ms);
    return { date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`, min: Math.round(ms / 6e4) };
  }
  const m = cs(v).match(/^(\d{4})-(\d{1,2})-(\d{1,2})[ T]+(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return null;
  let h = +m[4]; const ap = (m[6] || '').toUpperCase();
  if (ap === 'PM' && h < 12) h += 12; if (ap === 'AM' && h === 12) h = 0;
  return { date: `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`, min: Math.round(Date.UTC(+m[1], +m[2] - 1, +m[3], h, +m[5]) / 6e4) };
}

// "FGround FloorDSeSAsmL201" -> "201"
export function lineOf(loc) {
  const m = /^F(.+?)D(.+?)S(.+?)L(.*)$/.exec(cs(loc));
  return m ? (m[4] || '').trim() || 'Unknown' : (cs(loc) || 'Unknown');
}

export function parseTickets(rows, source) {
  const hi = rows.findIndex(r => r.some(c => hk(c) === 'ticket id'));
  if (hi < 0) throw new Error('Ticket report: could not find a header row with "Ticket Id".');
  const h = rows[hi].map(hk), col = n => h.indexOf(n);
  const c = {
    id: col('ticket id'), sub: col('machine sub category'), serial: col('serial id'), loc: col('location'),
    raisedAt: col('raised at'), raisedBy: col('raised by'), done: col('completed by'), appr: col('approved by'),
    repair: col('repair time'), apprTime: col('approval time'), status: col('ticket status'), repEnd: col('ticket repair end time'), end: col('end time'),
  };
  for (const [n, i] of Object.entries(c)) if (['id', 'done', 'appr', 'repair', 'apprTime', 'status', 'repEnd'].includes(n) && i < 0) throw new Error(`Ticket report: column for "${n}" not found.`);
  const tickets = []; let asOf = 0;
  for (let r = hi + 1; r < rows.length; r++) {
    const row = rows[r], id = cs(row[c.id]); if (!id) continue;
    const t = {
      id, machine: cs(row[c.sub]) || 'Unknown machine', serial: cs(row[c.serial]), line: lineOf(row[c.loc]),
      raisedBy: cs(row[c.raisedBy]), mechanic: cs(row[c.done]), approver: cs(row[c.appr]),
      repairMin: num(row[c.repair]), approvalMin: num(row[c.apprTime]), status: cs(row[c.status]) || 'Unknown',
      raisedAt: stamp(row[c.raisedAt]), repairEnd: stamp(row[c.repEnd]), endAt: c.end >= 0 ? stamp(row[c.end]) : null,
    };
    for (const s of [t.raisedAt, t.repairEnd, t.endAt]) if (s && s.min > asOf) asOf = s.min;
    tickets.push(t);
  }
  const days = [...new Set(tickets.filter(t => t.repairEnd).map(t => t.repairEnd.date))].sort();
  return { tickets, source, asOf, firstDay: days[0] || '', lastDay: days[days.length - 1] || '' };
}

export function ticketsFromWorkbook(XLSX, wb, source) {
  for (const name of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: null });
    if (rows.slice(0, 10).some(r => r.some(x => hk(x) === 'ticket id'))) return parseTickets(rows, source);
  }
  throw new Error('This does not look like the Detailed Ticket Info Report (header "Ticket Id" not found).');
}

/* ---------- formatting ---------- */
export function fmtMin(m) {
  m = Math.round(m || 0);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  if (h < 24) return r ? `${h} h ${r} min` : `${h} h`;
  const d = Math.floor(h / 24), hh = h % 24;
  return hh ? `${d} d ${hh} h` : `${d} d`;
}
export const hours = m => (m / 60).toFixed(1);
export function fmtStamp(min) {
  const d = new Date(min * 6e4); let h = d.getUTCHours(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
  return `${d.getUTCDate()} ${MON[d.getUTCMonth()]}, ${h}:${pad(d.getUTCMinutes())} ${ap}`;
}

/* ---------- 1. mechanic hours ---------- */
export function mechanicHours(tickets, from, to) {
  const by = new Map(), dates = new Set();
  for (const t of tickets) {
    if (!t.mechanic || !t.repairEnd) continue;
    const d = t.repairEnd.date; if (d < from || d > to) continue;
    dates.add(d);
    const m = by.get(t.mechanic) || { name: t.mechanic, days: {}, total: 0, tickets: 0 };
    m.days[d] = (m.days[d] || 0) + t.repairMin; m.total += t.repairMin; m.tickets++;
    by.set(t.mechanic, m);
  }
  const ds = [...dates].sort();
  const rows = [...by.values()].map(m => ({ ...m, workDays: Object.values(m.days).filter(v => v > 0).length })).sort((a, b) => b.total - a.total);
  const dayTotals = Object.fromEntries(ds.map(d => [d, rows.reduce((a, m) => a + (m.days[d] || 0), 0)]));
  return { rows, dates: ds, dayTotals, total: rows.reduce((a, m) => a + m.total, 0), tickets: rows.reduce((a, m) => a + m.tickets, 0) };
}

/* ---------- 2. waiting for approval ---------- */
// The supervisor who normally approves a line = whoever approved most tickets on that line in this report.
export function usualApprovers(tickets) {
  const g = new Map();
  for (const t of tickets) if (t.approver) { const m = g.get(t.line) || new Map(); m.set(t.approver, (m.get(t.approver) || 0) + 1); g.set(t.line, m); }
  const out = new Map();
  for (const [line, m] of g) {
    const list = [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const human = list.filter(([n]) => n !== 'mm_admin');
    out.set(line, (human[0] || list[0])[0]);
  }
  return out;
}

export function waiting(model) {
  const { tickets, asOf } = model, usual = usualApprovers(tickets);
  const pending = tickets.filter(t => t.status === PENDING).map(t => ({
    ...t, supervisor: usual.get(t.line) || '', waitMin: t.repairEnd ? Math.max(0, asOf - t.repairEnd.min) : 0,
  })).sort((a, b) => b.waitMin - a.waitMin);
  const g = new Map();
  for (const t of pending) { const k = t.supervisor || ''; const e = g.get(k) || { name: k, n: 0, longest: 0 }; e.n++; e.longest = Math.max(e.longest, t.waitMin); g.set(k, e); }
  const sups = [...g.values()].sort((a, b) => (a.name === '') - (b.name === '') || b.n - a.n);
  const notRepaired = tickets.filter(t => t.status !== PENDING && t.status !== 'Repaired').length;
  return { pending, sups, notRepaired, longest: pending[0] ? pending[0].waitMin : 0 };
}

/* ---------- 3. approval time ---------- */
export function approvals(tickets, from, to) {
  const done = tickets.filter(t => t.approver && t.status === 'Repaired' && (!t.repairEnd || (t.repairEnd.date >= from && t.repairEnd.date <= to)));
  const by = new Map();
  for (const t of done) { const e = by.get(t.approver) || { name: t.approver, n: 0, sum: 0, longest: 0 }; e.n++; e.sum += t.approvalMin; e.longest = Math.max(e.longest, t.approvalMin); by.set(t.approver, e); }
  const sups = [...by.values()].map(e => ({ ...e, avg: e.sum / e.n })).sort((a, b) => b.avg - a.avg);
  const all = done.reduce((a, t) => a + t.approvalMin, 0);
  return { done, sups, avg: done.length ? all / done.length : 0, longest: Math.max(0, ...done.map(t => t.approvalMin)), slowest: [...done].sort((a, b) => b.approvalMin - a.approvalMin).slice(0, 10) };
}
