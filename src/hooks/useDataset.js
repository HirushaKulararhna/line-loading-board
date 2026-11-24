import { useCallback, useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import CONFIG from '../config';
import { parseCSV, pad } from '../lib/model';
import { idbGet, idbSet, idbClear } from '../lib/handleStore';

const hhmm = () => { const d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
const quickHash = buf => { const u = new Uint8Array(buf); let h = u.length; for (let i = 0; i < u.length; i += 97) h = (h * 31 + u[i]) | 0; return h; };

/**
 * Feeds one dataset (the production plan, or the machine list). Priority:
 *   Google Sheet (if an ID is set) > Excel file linked with the picker > project file in public/data
 *
 * spec = { key, label, projectFile, pollSeconds, googleId(), tabs: [..], optionalTabs: [index..],
 *          fromWorkbook(XLSX, wb, name), fromRows([rowsPerTab]) }
 */
export function useDataset(spec) {
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
  const apply = m => { setModel(m); if (had.current) notify(`${spec.label} updated from the data source`); had.current = true; };
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
        const rows = await Promise.all(spec.tabs.map((t, i) => gsheet(id, t).catch(e => { if ((spec.optionalTabs || []).includes(i)) return null; throw e; })));
        const s = JSON.stringify(rows);
        if (s !== sig.current) { sig.current = s; apply(spec.fromRows(rows)); }
        say(`Live · Google Sheet · checked ${hhmm()}`, 'live');
      } catch (e) { say('Sheet error: ' + e.message, 'err'); }
    }, spec.googlePollSeconds || 30);
  }, []); // eslint-disable-line

  /* ---- Excel file linked with the picker (Chrome / Edge) ---- */
  const startHandle = useCallback(h => {
    stop(); setMode('file'); setReconnect(null);
    every(async () => {
      try {
        const f = await h.getFile(); const s = f.lastModified + ':' + f.size;
        if (s === sig.current) return; sig.current = s;
        const wb = XLSX.read(await f.arrayBuffer(), { type: 'array' });
        apply(spec.fromWorkbook(XLSX, wb, f.name));
        const d = new Date(f.lastModified);
        say(`Linked · ${f.name} · saved ${pad(d.getHours())}:${pad(d.getMinutes())}`, 'live');
      } catch (e) { say('Cannot read the file: ' + e.message, 'err'); }
    }, 2);
  }, []); // eslint-disable-line

  /* ---- project file in public/data ---- */
  const startProject = useCallback(() => {
    stop(); setMode('project');
    every(async () => {
      try {
        const r = await fetch(`${import.meta.env.BASE_URL}${spec.projectFile}?t=${Date.now()}`, { cache: 'no-store' });
        const type = r.headers.get('content-type') || '';
        if (!r.ok || type.includes('text/html')) throw new Error(`Put your file at public/${spec.projectFile}`);
        const buf = await r.arrayBuffer(); const s = buf.byteLength + ':' + quickHash(buf);
        if (s !== sig.current) { sig.current = s; apply(spec.fromWorkbook(XLSX, XLSX.read(buf, { type: 'array' }), spec.projectFile.split('/').pop())); }
        say(`Live · project file · checked ${hhmm()}`, 'live');
      } catch (e) { say(e.message, 'err'); }
    }, spec.pollSeconds || 3);
  }, []); // eslint-disable-line

  /* ---- actions ---- */
  const linkFile = useCallback(async () => {
    if (!window.showOpenFilePicker) { notify('This browser cannot link files. Use Chrome or Edge, or use the project file.'); return; }
    try {
      const [h] = await window.showOpenFilePicker({ types: [{ description: 'Excel', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx', '.xlsm'] } }] });
      await idbSet(h, spec.key); startHandle(h);
    } catch (e) { if (e.name !== 'AbortError') say(e.message, 'err'); }
  }, [startHandle]); // eslint-disable-line
  const doReconnect = useCallback(async () => {
    if (reconnect && (await reconnect.requestPermission({ mode: 'read' })) === 'granted') startHandle(reconnect);
  }, [reconnect, startHandle]);
  const useProjectFile = useCallback(async () => { await idbClear(spec.key); setReconnect(null); startProject(); }, [startProject]); // eslint-disable-line

  useEffect(() => {
    (async () => {
      const id = spec.googleId();
      if (id) return startGoogle(id);
      const h = await idbGet(spec.key);
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

  return { label: spec.label, model, status, mode, reconnect, toast, linkFile, doReconnect, useProjectFile };
}
