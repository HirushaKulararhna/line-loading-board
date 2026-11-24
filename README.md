# Line Loading Board (React + Vite)

A light-mode dashboard for your production plan. It reads your Excel workbook and updates itself when the workbook changes.

## 1. Install once

1. Install **Node.js LTS** from https://nodejs.org (tick the default options). Restart VS Code afterwards.
2. In VS Code choose **File, Open Folder** and open this folder.
3. Open the terminal (**Terminal, New Terminal**) and run:

```
npm install
npm run dev
```

The browser opens at http://localhost:5173.

## 2. Link your Excel file (three ways)

### A. Project file (simplest, works in any browser)
1. Copy your workbook to `public/data/plan.xlsx` (replace the sample file).
2. Open **that file** in Excel, edit, and press **Save** (Ctrl+S).
3. The board re-reads the file every 3 seconds. The chip at the top shows "Live · project file".

To change the speed or file name, edit `src/config.js`.

### B. Linked file from anywhere (Chrome or Edge only)
1. Click **Link Excel file** on the board and choose your workbook.
2. Save in Excel. The board checks it every 2 seconds.
3. Next time, click **Reconnect** and allow access. **Use project file** goes back to option A.

### C. Google Sheet (best for phones and other people)
1. Open your workbook in Google Sheets. Rename the tabs to `Layout MC` and `Prod Plan` (no extra spaces).
2. Format the date row on `Prod Plan` as `yyyy-mm-dd`.
3. Share, then General access: **Anyone with the link: Viewer**.
4. Copy the Sheet ID from `docs.google.com/spreadsheets/d/THIS_PART/edit`.
5. Paste it into `googleSheetId` in `src/config.js`, or open `http://localhost:5173/?sheet=THIS_PART`.
6. The board refreshes every 30 seconds.

## 3. What the workbook must contain

| Tab | Needed |
|---|---|
| `Layout MC` | Header row with `Product`, `Style`, machine columns, `Total Machine`. One row per style. |
| `Prod Plan` | Header cell `Module`, a date row, one row per module. Cell = style code. Blank = no production. |
| `Machine Available` (optional) | Columns `Machine`, `Available`. Turns on shortage warnings. |

The `Summary` tab is not needed. The board does that calculation itself.
A style in the plan with no row on `Layout MC` counts as zero machines and is flagged in red.

## 4. Share it with others

```
npm run build
```

Upload the `dist` folder to Netlify Drop (https://app.netlify.com/drop). On the hosted site, option A reads the `plan.xlsx` that was in the build, so to publish new data you rebuild and upload again. For live data on a hosted site, use option C (Google Sheet).

## 5. Where things are

- `src/config.js` data source, tab names, refresh speed
- `src/lib/model.js` reads the sheets and does the machine maths
- `src/hooks/useSource.js` the three ways of linking data
- `src/views/` one file per page
- `src/styles.css` colours and fonts (light mode)

## 6. Machine list (owned, rented, how many more machines are needed)

The board reads your company machine list the same way it reads the plan.

1. Export the machine list to Excel and save it as `public/data/machines.xlsx` (replace the old file). Open that file in Excel, edit, and press Save: the board updates within a few seconds.
   - Or press **Link machines file** at the top and pick the file (Chrome or Edge).
   - Or add a tab called `Machine List` to your Google Sheet (same Sheet ID as the plan).
2. The header row must contain these columns: `Machine Type*`, `Machine Sub-category`, `Line No`, `Type of Purchase*`, `Machine Status*`. Other columns (serial, brand, model) are shown in the Machine list page.
3. Pages:
   - **Fleet**: machines registered, owned, rented, spare, and **more machines needed**, then a have-versus-need table for every machine type.
   - **Lines**: one card per line. Click a line for its machines (owned and rented), and what the plan needs there.
   - **Machine list**: every machine, with search and filters by line, owned or rented, status.
   - **Data check**: plan machines not found in the machine list, and problems in the list (duplicate serials and so on).

How the numbers are worked out:
- Test machines (Type of Purchase = Test) are never counted.
- "Usable" machines are Active and Available ones. "Pending Approval" is counted, "Under Maintenance" is not. You can change this with the tick boxes on the Fleet and Lines pages.
- "Needed" is the most machines the plan asks for on any one day in the chosen range (Next 2 weeks or Whole sheet).
- "More machines needed" adds up the shortage of every machine type that exists in the machine list.
- Machine types whose name is not found in the machine list are shown separately as "Names not matched". They are NOT added to the shortage. Fix the spelling in Excel, or add the name to `machineAliases` in `src/config.js`.
- A plan module is linked to a line by name (module 101 = Line 101). If a module has a different name from its line, add it to `lineAliases` in `src/config.js`.
- `src/config.js` already contains name matches that were guessed from the two files. Please check them.
