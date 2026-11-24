// Reads the company machine list and compares what you HAVE with what the plan NEEDS.
import CONFIG from '../config';
import { norm } from './model';

export const nm = s => String(s ?? '').replace(/\s+/g, ' ').trim().toUpperCase();
const cs = v => (v == null ? '' : String(v).trim());
const hdrKey = s => nm(s).replace(/\*/g, '').trim().toLowerCase();

const ALIAS = new Map(Object.entries(CONFIG.machineAliases || {}).map(([k, v]) => [nm(k), nm(v)]));
const LINE_ALIAS = new Map(Object.entries(CONFIG.lineAliases || {}).map(([k, v]) => [nm(k), nm(v)]));

// machine list name -> the name used on the Layout tab (so both sides compare like with like)
export const supplyKey = sub => { const k = nm(sub); return ALIAS.get(k) || k; };
export const moduleLineKey = mod => LINE_ALIAS.get(nm(mod)) || nm(mod);

export function normLine(v) {
  if (v == null || v === '') return 'Unassigned';
  if (typeof v === 'number') return String(Math.round(v));
  const s = String(v).trim().replace(/\s+/g, ' ');
  if (!s) return 'Unassigned';
  if (/^\d+(\.0+)?$/.test(s)) return String(parseInt(s, 10));
  return s;
}

export const DEFAULT_OPTS = { rented: true, pending: true, maintenance: false };

export function parseMachines(rows, source) {
  const hi = rows.findIndex(r => r.some(c => hdrKey(c) === 'machine type'));
  if (hi < 0) throw new Error('Machine list: could not find a header row with "Machine Type".');
  const h = rows[hi].map(hdrKey), col = n => h.indexOf(n);
  const c = {
    type: col('machine type'), sub: col('machine sub-category'), brand: col('brand'), line: col('line no'),
    loc: col('machine location'), serial: col('machine serial id'), purchase: col('type of purchase'),
    status: col('machine status'), model: col('machine model no.'),
  };
  for (const [n, i] of Object.entries(c)) if (['sub', 'purchase', 'status', 'line'].includes(n) && i < 0) throw new Error(`Machine list: column for "${n}" not found.`);
  const list = [];
  for (let r = hi + 1; r < rows.length; r++) {
    const row = rows[r], sub = cs(row[c.sub]), serial = cs(row[c.serial]);
    if (!sub && !serial) continue;
    const pr = cs(row[c.purchase]);
    const purchase = /^purchase/i.test(pr) ? 'Owned' : /^rent/i.test(pr) ? 'Rented' : /^test/i.test(pr) ? 'Test' : pr || 'Unknown';
    list.push({
      type: cs(row[c.type]), sub, key: supplyKey(sub), brand: cs(row[c.brand]), line: normLine(row[c.line]),
      serial, purchase, status: cs(row[c.status]) || 'Unknown', model: cs(row[c.model]), loc: cs(row[c.loc]),
    });
  }
  return { list, source };
}

export function machinesFromWorkbook(XLSX, wb, source) {
  for (const name of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: null });
    if (rows.slice(0, 10).some(r => r.some(c => hdrKey(c) === 'machine type'))) return parseMachines(rows, source);
  }
  throw new Error('Could not find the machine list in this workbook (header "Machine Type").');
}

/* ---------- which machines count as "usable" ---------- */
export function isUsable(r, o) {
  if (r.purchase === 'Test') return false;
  if (r.purchase === 'Rented' && !o.rented) return false;
  if (r.status === 'Pending Approval') return o.pending;
  if (r.status === 'Under Maintenance') return o.maintenance;
  return true;
}

export function fleetTotals(list) {
  const t = { registered: 0, owned: 0, rented: 0, test: 0, spare: 0, status: {}, purchaseOther: 0 };
  for (const r of list) {
    if (r.purchase === 'Test') { t.test++; continue; }
    t.registered++;
    if (r.purchase === 'Owned') t.owned++; else if (r.purchase === 'Rented') t.rented++; else t.purchaseOther++;
    t.status[r.status] = (t.status[r.status] || 0) + 1;
    if (r.status === 'Available' && r.line === 'Unassigned') t.spare++;
  }
  return t;
}

const blank = (key, name) => ({ key, name, owned: 0, rented: 0, usable: 0, spare: 0, registered: 0, need: 0, peakDate: '' });

export function supplyTable(list, opts, onlyLine) {
  const m = new Map();
  for (const r of list) {
    if (r.purchase === 'Test') continue;
    if (onlyLine && nm(r.line) !== onlyLine) continue;
    const e = m.get(r.key) || blank(r.key, r.key);
    e.registered++;
    if (isUsable(r, opts)) {
      e.usable++;
      if (r.purchase === 'Rented') e.rented++; else e.owned++;
      if (r.status === 'Available') e.spare++;
    }
    m.set(r.key, e);
  }
  return m;
}

// Peak machines the plan needs per machine type over the chosen dates (optionally for some modules only)
export function demandFor(M, C, dates, mods) {
  const out = new Map();
  for (const d of dates) {
    const day = new Map();
    for (const mod of mods) {
      const st = M.plan[mod] && M.plan[mod][d]; if (!st) continue;
      const e = C.idx.get(norm(st)); if (!e) continue;
      for (const [name, n] of Object.entries(e.m)) { const k = nm(name); const cur = day.get(k) || { name, n: 0 }; cur.n += n; day.set(k, cur); }
    }
    for (const [k, { name, n }] of day) { const o = out.get(k); if (!o || n > o.peak) out.set(k, { name, peak: n, peakDate: d }); }
  }
  return out;
}

// Have vs need, per machine type
export function compareRows(demand, supply) {
  const keys = new Set([...demand.keys(), ...supply.keys()]);
  const rows = [];
  for (const k of keys) {
    const d = demand.get(k), s = supply.get(k) || blank(k, k);
    const need = d ? d.peak : 0, found = s.registered > 0;
    rows.push({ ...s, name: d ? d.name : s.name, need, peakDate: d ? d.peakDate : '', found, gap: s.usable - need, short: found ? Math.max(0, need - s.usable) : 0 });
  }
  return rows;
}

export function compareFleet(M, C, dates, list, opts) {
  const rows = compareRows(demandFor(M, C, dates, M.modules), supplyTable(list, opts));
  const toAdd = rows.reduce((a, r) => a + r.short, 0);
  const notFound = rows.filter(r => r.need > 0 && !r.found);
  return { rows, toAdd, notFound, notFoundNeed: notFound.reduce((a, r) => a + r.need, 0) };
}

// For the demand table: how many of each Layout machine you have (so the red "short" cells work)
export function inventoryFromFleet(M, list, opts) {
  const sup = supplyTable(list, opts), inv = {};
  for (const name of M.machines) { const s = sup.get(nm(name)); if (s) inv[name] = s.usable; }
  return inv;
}

/* ---------- lines ---------- */
export function linesOf(list) {
  const g = new Map();
  for (const r of list) { if (r.purchase === 'Test') continue; (g.get(r.line) || g.set(r.line, []).get(r.line)).push(r); }
  return [...g.keys()].sort((a, b) => {
    if (a === 'Unassigned') return 1; if (b === 'Unassigned') return -1;
    const na = /^\d+$/.test(a), nb = /^\d+$/.test(b);
    if (na && nb) return +a - +b; if (na) return -1; if (nb) return 1;
    return g.get(b).length - g.get(a).length;
  }).map(name => ({ name, recs: g.get(name) }));
}

export function lineModules(M, line) { return M.modules.filter(m => moduleLineKey(m) === nm(line)); }

export function lineSummary(M, C, dates, list, opts, line) {
  const mods = lineModules(M, line);
  const supply = supplyTable(list, opts, nm(line));
  const rows = compareRows(mods.length ? demandFor(M, C, dates, mods) : new Map(), supply);
  const owned = rows.reduce((a, r) => a + r.owned, 0), rented = rows.reduce((a, r) => a + r.rented, 0);
  const styles = [...new Set(mods.flatMap(m => dates.map(d => M.plan[m][d]).filter(Boolean)))];
  return { mods, rows, owned, rented, usable: owned + rented, short: rows.reduce((a, r) => a + r.short, 0), styles, planned: mods.length > 0 };
}

export function machineIssues(list) {
  const seen = new Map(), dup = [];
  for (const r of list) { if (!r.serial) continue; const k = r.serial; if (seen.has(k)) dup.push(r); else seen.set(k, r); }
  return {
    dup,
    noSerial: list.filter(r => !r.serial),
    activeNoLine: list.filter(r => r.status === 'Active' && r.line === 'Unassigned' && r.purchase !== 'Test'),
    unknownPurchase: list.filter(r => !['Owned', 'Rented', 'Test'].includes(r.purchase)),
  };
}
