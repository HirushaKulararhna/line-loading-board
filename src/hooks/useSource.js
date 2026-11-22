import { useCallback, useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import CONFIG from '../config';
import { buildModel, modelFromWorkbook, parseCSV, norm, pad } from '../lib/model';
import { idbGet, idbSet, idbClear } from '../lib/handleStore';

const hhmm = () => { const d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
const quickHash = buf => { const u = new Uint8Array(buf); let h = u.length; for (let i = 0; i < u.length; i += 97) h = (h * 31 + u[i]) | 0; return h; };

/**
 * One hook that feeds the whole app. Priority:
 *   Google Sheet (if an ID is set) > Excel file you linked with the picker > project file public/data/plan.xlsx
 */
export function useSource() {
  const [model, setModel] = useState(null);
  const [status, setStatus] = useState({ text: 'Loading…', kind: '' });
  const [mode, setMode] = useState('boot');
  const [reconnect, setReconnect] = useState(null);
  const [toast, setToast] = useState('');
  const timers = useRef([]);
  const sig = useRef('');
  const had = useRef(false);
  const toastT = useRef();

  const say = (text, kind = '') => setStatus({ text, kind });
  const notify = t => { setToast(t); clearTimeout(toastT.current); toastT.current = setTimeout(() => setToast(''), 2500); };
  const stop = () => { timers.current.forEach(clearInterval); timers.current = []; sig.current = ''; };
  const apply = m => { setModel(m); if (had.current) notify('Plan updated from the data source'); had.current = true; };
  const every = (fn, sec) => { fn(); timers.current.push(setInterval(fn, Math.max(1, sec) * 1000)); };

  /* ---- Google Sheet ---- */
  const gsheet = async (id, tab) => {
    const u = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(id)}/gviz/tq?tqx=out:csv&headers=0&sheet=${encodeURIComponent(tab)}`;
    const r = await fetch(u, { cache: 'no-store' });
    if (!r.ok) throw new Error('Sheet not reachable. Share it as "Anyone with the link can view".');
    return parseCSV(await r.text());
  };
  const startGoogle = useCallback(id => {
    stop(); setMode('google');
    every(async () => {
      try {
        const [L, P] = await Promise.all([gsheet(id, CONFIG.layoutTab), gsheet(id, CONFIG.planTab)]);
        let I = null;
        try { I = await gsheet(id, CONFIG.inventoryTab); if (I.length < 2 || !I.some(r => norm(r[0]) === 'machine')) I = null; } catch { /* optional */ }
        const s = JSON.stringify([L, P, I]);
        if (s !== sig.current) { sig.current = s; apply(buildModel(L, P, I, 'Google Sheet')); }
        say(`Live · Google Sheet · checked ${hhmm()}`, 'live');
      } catch (e) { say('Sheet error: ' + e.message, 'err'); }
    }, CONFIG.googlePollSeconds);
  }, []); // eslint-disable-line

  /* ---- Excel file linked with the picker (Chrome / Edge) ---- */
  const startHandle = useCallback(h => {
    stop(); setMode('file'); setReconnect(null);
    every(async () => {
      try {
        const f = await h.getFile(); const s = f.lastModified + ':' + f.size;
        if (s === sig.current) return; sig.current = s;
        const wb = XLSX.read(await f.arrayBuffer(), { type: 'array' });
        apply(modelFromWorkbook(XLSX, wb, f.name, CONFIG));
        const d = new Date(f.lastModified);
        say(`Linked · ${f.name} · saved ${pad(d.getHours())}:${pad(d.getMinutes())}`, 'live');
      } catch (e) { say('Cannot read the file: ' + e.message, 'err'); }
    }, 2);
  }, []); // eslint-disable-line

  /* ---- project file public/data/plan.xlsx ---- */
  const startProject = useCallback(() => {
    stop(); setMode('project');
    every(async () => {
      try {
        const r = await fetch(`${import.meta.env.BASE_URL}${CONFIG.projectFile}?t=${Date.now()}`, { cache: 'no-store' });
        const type = r.headers.get('content-type') || '';
        if (!r.ok || type.includes('text/html')) throw new Error(`Put your workbook at public/${CONFIG.projectFile}`);
        const buf = await r.arrayBuffer(); const s = buf.byteLength + ':' + quickHash(buf);
        if (s !== sig.current) { sig.current = s; apply(modelFromWorkbook(XLSX, XLSX.read(buf, { type: 'array' }), 'plan.xlsx', CONFIG)); }
        say(`Live · project file · checked ${hhmm()}`, 'live');
      } catch (e) { say(e.message, 'err'); }
    }, CONFIG.projectPollSeconds);
  }, []); // eslint-disable-line

  /* ---- actions ---- */
  const linkFile = useCallback(async () => {
    if (!window.showOpenFilePicker) { notify('This browser cannot link files. Use Chrome or Edge, or use the project file.'); return; }
    try {
      const [h] = await window.showOpenFilePicker({ types: [{ description: 'Excel', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx', '.xlsm'] } }] });
      await idbSet(h); startHandle(h);
    } catch (e) { if (e.name !== 'AbortError') say(e.message, 'err'); }
  }, [startHandle]);
  const doReconnect = useCallback(async () => {
    if (reconnect && (await reconnect.requestPermission({ mode: 'read' })) === 'granted') startHandle(reconnect);
  }, [reconnect, startHandle]);
  const useProjectFile = useCallback(async () => { await idbClear(); setReconnect(null); startProject(); }, [startProject]);
  const refresh = useCallback(() => { sig.current = ''; }, []);

  useEffect(() => {
    (async () => {
      const id = new URLSearchParams(location.search).get('sheet') || CONFIG.googleSheetId;
      if (id) return startGoogle(id);
      const h = await idbGet();
      if (h && h.queryPermission) {
        try {
          if ((await h.queryPermission({ mode: 'read' })) === 'granted') return startHandle(h);
          setReconnect(h); say(`Reconnect ${h.name} to keep it live`, '');
        } catch { /* fall through */ }
      }
      startProject();
    })();
    return stop;
  }, []); // eslint-disable-line

  return { model, status, mode, reconnect, toast, linkFile, doReconnect, useProjectFile, refresh };
}
