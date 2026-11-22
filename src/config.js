// Edit this file to change where the data comes from.
export default {
  // 1) PROJECT FILE (default): the board reads public/data/plan.xlsx and re-reads it every few seconds.
  projectFile: 'data/plan.xlsx',
  projectPollSeconds: 3,

  // 2) GOOGLE SHEET: paste the Sheet ID to read a live Google Sheet instead (or open the site with ?sheet=ID).
  googleSheetId: '',
  googlePollSeconds: 30,

  // Tab names inside the workbook / sheet
  layoutTab: 'Layout MC',
  planTab: 'Prod Plan',
  inventoryTab: 'Machine Available', // optional: columns Machine | Available
};
