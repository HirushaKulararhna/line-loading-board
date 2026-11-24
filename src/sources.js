// The two data sources of the board: the production plan and the machine list.
import CONFIG from './config';
import { buildModel, modelFromWorkbook } from './lib/model';
import { machinesFromWorkbook, parseMachines } from './lib/machines';

const queryId = () => new URLSearchParams(location.search).get('sheet') || '';

export const PLAN_SPEC = {
  key: 'plan', label: 'Plan',
  projectFile: CONFIG.projectFile, pollSeconds: CONFIG.projectPollSeconds, googlePollSeconds: CONFIG.googlePollSeconds,
  googleId: () => queryId() || CONFIG.googleSheetId,
  tabs: [CONFIG.layoutTab, CONFIG.planTab, CONFIG.inventoryTab], optionalTabs: [2],
  fromWorkbook: (XLSX, wb, name) => modelFromWorkbook(XLSX, wb, name, CONFIG),
  fromRows: ([L, P, I]) => buildModel(L, P, I && I.some(r => String(r[0]).trim().toLowerCase() === 'machine') ? I : null, 'Google Sheet'),
};

export const MACHINE_SPEC = {
  key: 'machines', label: 'Machines',
  projectFile: CONFIG.machines.projectFile, pollSeconds: CONFIG.machines.projectPollSeconds, googlePollSeconds: CONFIG.googlePollSeconds,
  googleId: () => queryId() || CONFIG.machines.googleSheetId || CONFIG.googleSheetId,
  tabs: [CONFIG.machines.googleTab],
  fromWorkbook: (XLSX, wb, name) => machinesFromWorkbook(XLSX, wb, name),
  fromRows: ([R]) => parseMachines(R, 'Google Sheet'),
};
