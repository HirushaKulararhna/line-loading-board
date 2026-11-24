// Remembers the Excel files you linked, so you can reconnect with one click next time.
const open = () => new Promise((ok, no) => {
  const r = indexedDB.open('line-board', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('h');
  r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
});
export async function idbGet(key = 'file') {
  try { const d = await open(); return await new Promise(ok => { const q = d.transaction('h').objectStore('h').get(key); q.onsuccess = () => ok(q.result); q.onerror = () => ok(null); }); }
  catch { return null; }
}
export async function idbSet(v, key = 'file') { try { const d = await open(); d.transaction('h', 'readwrite').objectStore('h').put(v, key); } catch { /* ignore */ } }
export async function idbClear(key = 'file') { try { const d = await open(); d.transaction('h', 'readwrite').objectStore('h').delete(key); } catch { /* ignore */ } }
