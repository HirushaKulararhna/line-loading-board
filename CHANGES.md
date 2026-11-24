# Style details panel: what changed

Clicking a style now opens a side panel with every machine that style needs, the total, and where the style runs in the plan.
You can click a style on the Styles page (any card), on Overview (module list), on Schedule (any bar) and on Data check.

## Easiest way: use the new zip
1. Copy your own workbook somewhere safe if you changed `public/data/plan.xlsx`.
2. Unzip the new `react-board.zip` over your project folder (replace all files).
3. Put your workbook back at `public/data/plan.xlsx`.
4. Terminal: `npm run dev` (run `npm install` first only if you unzipped into a new folder).

## Or change the code yourself in VS Code
Open the folder in VS Code. Do these steps in order. Save each file with Ctrl+S. The page reloads by itself while `npm run dev` is running.

### Step 1. Add a new file: `src/components/StyleDrawer.jsx`
In the Explorer, right-click the `components` folder, choose **New File**, name it `StyleDrawer.jsx`, and paste the whole content of the file with that name from the zip.

### Step 2. Replace `src/components/Sty.jsx` with the version from the zip
(It now accepts an `onClick` so the chip can be clicked.)

### Step 3. Make small edits in 5 files
Lines starting with `-` are removed, lines starting with `+` are added. Use Ctrl+F in each file to find the line.

#### `src/App.jsx`
```diff
@@ -9,2 +9,3 @@
 import Check from './views/Check';
+import StyleDrawer from './components/StyleDrawer';
 
@@ -20,5 +21,6 @@
   const [picked, setPicked] = useState(null);
+  const [openCode, setOpenCode] = useState(null); // style whose details panel is open
 
   useEffect(() => {
-    const f = () => { setRoute(routeFromHash()); setQ(''); };
+    const f = () => { setRoute(routeFromHash()); setQ(''); setOpenCode(null); };
     addEventListener('hashchange', f); return () => removeEventListener('hashchange', f);
@@ -46,8 +48,9 @@
         {!M && <div className="card"><div className="empty">{src.status.kind === 'err' ? src.status.text : 'Loading your plan…'}</div></div>}
-        {M && route === 'overview' && <Overview M={M} C={C} range={range} setRange={setRange} selDate={selDate} setSelDate={setPicked} />}
-        {M && route === 'schedule' && <Schedule M={M} C={C} range={range} setRange={setRange} />}
+        {M && route === 'overview' && <Overview M={M} C={C} range={range} setRange={setRange} selDate={selDate} setSelDate={setPicked} onOpenStyle={setOpenCode} />}
+        {M && route === 'schedule' && <Schedule M={M} C={C} range={range} setRange={setRange} onOpenStyle={setOpenCode} />}
         {M && route === 'machines' && <Machines M={M} C={C} range={range} setRange={setRange} q={q} setQ={setQ} />}
-        {M && route === 'styles' && <Styles M={M} C={C} q={q} setQ={setQ} />}
-        {M && route === 'check' && <Check M={M} C={C} />}
+        {M && route === 'styles' && <Styles M={M} C={C} q={q} setQ={setQ} onOpenStyle={setOpenCode} />}
+        {M && route === 'check' && <Check M={M} C={C} onOpenStyle={setOpenCode} />}
       </main>
+      {M && openCode && <StyleDrawer code={openCode} M={M} C={C} onClose={() => setOpenCode(null)} />}
       {src.toast && <div className="toast">{src.toast}</div>}
```

#### `src/views/Overview.jsx`
```diff
@@ -5,3 +5,3 @@
 
-export default function Overview({ M, C, range, setRange, selDate, setSelDate }) {
+export default function Overview({ M, C, range, setRange, selDate, setSelDate, onOpenStyle }) {
   const ds = visibleDates(M, range), today = todayStr();
@@ -56,3 +56,3 @@
             const st = M.plan[mod][selDate], e = C.idx.get(norm(st));
-            return <div className="it" key={mod}><span><b>{mod}</b> &nbsp;<Sty code={st} bad={!e} /></span><span className="mono">{e ? sumM(e.m) : '?'}</span></div>;
+            return <div className="it" key={mod}><span><b>{mod}</b> &nbsp;<Sty code={st} bad={!e} onClick={onOpenStyle} /></span><span className="mono">{e ? sumM(e.m) : '?'}</span></div>;
           }) : <div className="empty">No production on this day.</div>}
```

#### `src/views/Schedule.jsx`
```diff
@@ -3,3 +3,3 @@
 
-export default function Schedule({ M, C, range, setRange }) {
+export default function Schedule({ M, C, range, setRange, onOpenStyle }) {
   const ds = visibleDates(M, range), N = ds.length, today = todayStr(), R = M.modules.length;
@@ -35,3 +35,4 @@
           {segs.map(s => (
-            <div key={s.mod + s.i} className={'seg2' + (s.bad ? ' bad' : '')} style={{ gridColumn: `${s.i + 2} / span ${s.j - s.i + 1}`, gridRow: s.r + 2, '--h': hue(s.st) }}
+            <div key={s.mod + s.i} className={'seg2' + (s.bad ? ' bad' : '')} style={{ gridColumn: `${s.i + 2} / span ${s.j - s.i + 1}`, gridRow: s.r + 2, '--h': hue(s.st), cursor: 'pointer' }}
+              onClick={() => onOpenStyle(s.st)}
               title={`${s.mod} · ${s.st} · ${fmtDay(ds[s.i])} to ${fmtDay(ds[s.j])}${s.bad ? ' · no machine layout' : ''}`}>{s.st}</div>
```

#### `src/views/Check.jsx`
```diff
@@ -3,3 +3,3 @@
 const line = { display: 'flex', justifyContent: 'space-between', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--line)' };
-export default function Check({ M, C }) {
+export default function Check({ M, C, onOpenStyle }) {
   const keys = Object.keys(C.unmapped).sort(), sh = shortages(M, C), hasInv = Object.keys(M.inventory).length > 0;
@@ -12,3 +12,3 @@
           const mods = [...new Set(C.unmapped[k].map(x => x[0]))].join(', '), n = C.unmapped[k].length;
-          return <div style={line} key={k}><span><Sty code={k} bad /> <span className="sub" style={{ margin: 0 }}>module {mods}</span></span><span className="pill bad">{n} day{n > 1 ? 's' : ''}</span></div>;
+          return <div style={line} key={k}><span><Sty code={k} bad onClick={onOpenStyle} /> <span className="sub" style={{ margin: 0 }}>module {mods}</span></span><span className="pill bad">{n} day{n > 1 ? 's' : ''}</span></div>;
         }) : <div className="empty">Every scheduled style has a layout.</div>}
```

#### `src/views/Styles.jsx`
```diff
@@ -1,3 +1,3 @@
 import { norm, sumM } from '../lib/model';
-export default function Styles({ M, C, q, setQ }) {
+export default function Styles({ M, C, q, setQ, onOpenStyle }) {
   const list = M.styles.filter(s => !q || norm(s.k).includes(norm(q)) || norm(s.p).includes(norm(q)));
@@ -13,3 +13,3 @@
           return (
-            <div className="card scard" key={s.k}>
+            <div className="card scard click" key={s.k} role="button" tabIndex={0} onClick={() => onOpenStyle(s.k)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenStyle(s.k); } }}>
               <div className="row" style={{ margin: 0, flexWrap: 'nowrap' }}><h3>{s.k}</h3>{C.used.has(norm(s.k)) && <span className="pill in">In plan</span>}</div>
@@ -18,3 +18,3 @@
                 {ent.slice(0, 10).map(([n, v]) => <span className="tag" key={n}>{n} <b>{v}</b></span>)}
-                {ent.length > 10 && <span className="tag">+{ent.length - 10} more</span>}
+                {ent.length > 10 && <span className="tag">+{ent.length - 10} more · click to see all</span>}
               </div>
```

### Step 4. Add styles
Open `src/styles.css`, go to the very bottom, and paste everything from the line `/* ---- style details panel ---- */` to the end of the same file in the zip.

### Step 5. Test
1. `npm run dev`, open http://localhost:5173/#styles.
2. Click a card. A panel slides in from the right with all machines and counts.
3. Close it with the Close button, by clicking the dark area, or with the Esc key.

## If something breaks
- Red error in the terminal: read the file name and line number, and check that the `+` lines were copied fully.
- Blank page: press F12 in the browser, open Console, and read the first red message.
