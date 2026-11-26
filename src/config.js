// Edit this file to change where the data comes from and how names are matched.
export default {
  // ---------- PRODUCTION PLAN workbook (Layout MC + Prod Plan tabs) ----------
  // 1) PROJECT FILE (default): the board reads public/data/plan.xlsx and re-reads it every few seconds.
  projectFile: 'data/plan.xlsx',
  projectPollSeconds: 3,
  // 2) GOOGLE SHEET: paste the Sheet ID to read a live Google Sheet instead (or open the site with ?sheet=ID).
  googleSheetId: '',
  googlePollSeconds: 30,
  layoutTab: 'Layout MC',
  planTab: 'Prod Plan',
  inventoryTab: 'Machine Available', // optional: columns Machine | Available (not needed when the machine list is loaded)

  // ---------- MACHINE LIST (the company machine register you upload) ----------
  machines: {
    projectFile: 'data/machines.xlsx', // replace this file with your latest machine list export
    projectPollSeconds: 3,
    googleSheetId: '',                 // blank = use the same Google Sheet as the plan
    googleTab: 'Machine List',         // tab name when using Google Sheets
  },

  // ---------- BREAKDOWN TICKETS (the daily "Detailed Ticket Info Report") ----------
  tickets: {
    projectFile: 'data/tickets.xlsx', // or use "Change tickets file" at the top and pick today's report
    projectPollSeconds: 3,
  },

  // ---------- NAME MATCHING ----------
  // The machine list and the Layout tab sometimes spell a machine differently.
  // "Name in machine list": "Name in Layout tab". Capital letters do not matter.
  // CHECK THESE: they are best guesses. Remove or change any that are wrong.
  machineAliases: {
    'IRON BOARD': 'IRON TABLE',
    'STEAM GENERATOR (MINI BOILER)': 'BOILLER',
    'SINGLE NEEDLE': 'SNGLE NEEDLE LOCK STICH',
    'SNGLE NEEDLE LOCK STICH - BIG STITCH': 'SNGLE NEEDLE LOCK STICH',
    'SN LOCK STICH (NEEDLE FEED)': 'SNGLE NEEDLE LOCK STICH - NEEDLE FEED',
    'OVER LOCK 4TH': 'OVER LOCK - 4T',
    'DOUBLE NEEDLE - LOCK STICH - BIG STICH': 'DOUBLE NEEDLE - LOCK STICH',
    'FLATLOCK BINDING': 'FLAT LOCK BINDING',
    'FLAT LOCK HEM SEWER WITH CUTTER': 'FLAT LOCK HEM CUTTER',
    'ZIPPER CUTTER MACHINE': 'ZIPPER CUT MC',
    'COIN POCKET SETTER': 'COIN POCKET SETTERS',
    'BUTON ATTACHER': 'LOCK STICH BUTTON ATTACHER',
  },
  // Module name in the plan: Line name in the machine list (when they are spelled differently)
  lineAliases: {
    PDC: 'Pdc & Pps',
  },
};
