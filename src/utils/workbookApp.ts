import * as XLSX from 'xlsx';

export type FieldType = 'text' | 'number' | 'date' | 'boolean' | 'tag';
export type CellValue = string | number | boolean | null;
export interface AppColumn { id: string; name: string; type: FieldType; required: boolean; metric: boolean }
export interface AppRow { id: string; sourceRow?: number; values: Record<string, CellValue> }
export interface AppPage { id: string; name: string; sourceSheet: string; headerRow: number; columns: AppColumn[]; rows: AppRow[] }
export interface AppRelationship { id: string; kind: 'parent-child' | 'peer'; fromPage: string; fromColumn: string; toPage: string; toColumn: string }
export interface WorkbookApp { version: 1; id: string; name: string; pages: AppPage[]; relationships: AppRelationship[] }
export const APP_STORAGE_KEY = 'workbook-apps-v1';
const str = (v: unknown) => String(v ?? '').trim();
const own = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);

export function convertValue(value: unknown, type: FieldType): CellValue {
  if (value === null || value === undefined || value === '') return null;
  if (type === 'text' || type === 'tag') return String(value);
  if (type === 'number') {
    if (typeof value === 'boolean' || !str(value)) throw new Error('Enter a number.');
    const n = typeof value === 'number' ? value : Number(str(value));
    if (!Number.isFinite(n)) throw new Error('Enter a finite number without currency symbols.');
    return n;
  }
  if (type === 'boolean') {
    if (value === true || str(value).toLowerCase() === 'true') return true;
    if (value === false || str(value).toLowerCase() === 'false') return false;
    throw new Error('Choose true or false.');
  }
  if (type === 'date') {
    const s = value instanceof Date ? value.toISOString().slice(0, 10) : str(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || !Number.isFinite(Date.parse(s)) || new Date(s).toISOString().slice(0, 10) !== s) throw new Error('Use a valid YYYY-MM-DD date.');
    return s;
  }
  throw new Error('Unknown field type.');
}

export function readWorkbookApp(buffer: ArrayBuffer, filename: string, headerRows: Record<string, number> = {}): WorkbookApp {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  let count = 0;
  const pages = workbook.SheetNames.map((name, pageIndex): AppPage => {
    const sheet = workbook.Sheets[name];
    for (const [address, cell] of Object.entries(sheet)) {
      if (!address.startsWith('!') && cell?.f && (cell.v === undefined || cell.v === null)) throw new Error(`${name}!${address}: formula has no saved result. Recalculate and save the workbook in Excel before importing.`);
    }
    if (sheet['!ref']) {
      const bounds = XLSX.utils.decode_range(sheet['!ref']);
      if ((bounds.e.r + 1) * (bounds.e.c + 1) > 250000) throw new Error(`${name}: worksheet exceeds 250,000 cells. Reduce its range before importing.`);
    }
    const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, range: 0, defval: '', blankrows: true });
    const headerIndex = headerRows[name] !== undefined ? headerRows[name] - 1 : raw.slice(0, 25).reduce((best, row, i) => row.filter(v => str(v)).length > (raw[best] || []).filter(v => str(v)).length ? i : best, 0);
    if (!Number.isInteger(headerIndex) || headerIndex < 0 || (raw.length && headerIndex >= raw.length)) throw new Error(`${name}: header row is outside the worksheet.`);
    const headers = raw[headerIndex] || [];
    // Blank headers with data must receive a name rather than dropping their values.
    const width = raw.reduce((n, r) => Math.max(n, r.length), 0);
    const used = Array.from({ length: width }, (_, i) => i).filter(i => raw.some(r => str(r[i]) !== ''));
    const names = new Set<string>();
    const columns = used.map((index): AppColumn => {
      const base = str(headers[index]) || `Column ${XLSX.utils.encode_col(index)}`;
      let label = base, suffix = 2;
      while (names.has(label.toLowerCase())) label = `${base} (${suffix++})`;
      names.add(label.toLowerCase());
      const values = raw.slice(headerIndex + 1).map(row => row[index]).filter(v => v !== '' && v !== null && v !== undefined);
      let type: FieldType = 'text';
      if (values.length && values.every(v => v instanceof Date)) type = 'date';
      else if (values.length && values.every(v => typeof v === 'boolean')) type = 'boolean';
      else if (values.length && values.every(v => typeof v === 'number') && !/(^id$|\bid\b|code|phone|zip|postal)/i.test(label)) type = 'number';
      return { id: `c${index}`, name: label, type, required: false, metric: false };
    });
    const rows = raw.slice(headerIndex + 1).flatMap((row, index): AppRow[] => {
      if (row.every(v => str(v) === '')) return [];
      if (++count > 20000) throw new Error('This builder supports up to 20,000 records per app. Split this workbook into smaller apps.');
      return [{ id: `r${index + headerIndex + 2}`, sourceRow: index + headerIndex + 2, values: Object.fromEntries(columns.map((c, i) => {
        const v = row[used[i]];
        return [c.id, convertValue(v instanceof Date ? v.toISOString().slice(0, 10) : v, c.type)];
      })) }];
    });
    return { id: `p${pageIndex}`, name, sourceSheet: name, headerRow: headerIndex + 1, columns, rows };
  }).filter(p => p.columns.length);
  if (!pages.length) throw new Error('The workbook contains no populated sheets.');
  return { version: 1, id: crypto.randomUUID(), name: filename.replace(/\.[^.]+$/, ''), pages, relationships: [] };
}

// Produces a normalized copy; the original and persisted data remain unchanged on errors.
export function validateWorkbookApp(input: WorkbookApp): WorkbookApp {
  const app = structuredClone(input);
  if (app.version !== 1 || typeof app.id !== 'string' || !app.id || typeof app.name !== 'string' || !app.name.trim() || !Array.isArray(app.pages) || !app.pages.length || !Array.isArray(app.relationships)) throw new Error('Invalid app definition.');
  const ids = new Set<string>(), pageNames = new Set<string>();
  let records = 0;
  for (const page of app.pages) {
    if (typeof page.id !== 'string' || !page.id || ids.has(page.id) || typeof page.name !== 'string' || !page.name.trim() || pageNames.has(page.name.toLowerCase()) || !Array.isArray(page.columns) || !page.columns.length || !Array.isArray(page.rows)) throw new Error('Pages must have unique names and IDs, with at least one column.');
    ids.add(page.id); pageNames.add(page.name.toLowerCase());
    if (typeof page.sourceSheet !== 'string' || !Number.isInteger(page.headerRow) || page.headerRow < 1) throw new Error(`${page.name}: invalid source metadata.`);
    records += page.rows.length;
    if (records > 20000) throw new Error('An app can contain up to 20,000 records.');
    const columnIds = new Set<string>(), columnNames = new Set<string>(), rowIds = new Set<string>();
    for (const c of page.columns) {
      if (typeof c.id !== 'string' || !c.id || columnIds.has(c.id) || typeof c.name !== 'string' || !c.name.trim() || columnNames.has(c.name.toLowerCase()) || !['text', 'number', 'date', 'boolean', 'tag'].includes(c.type) || typeof c.required !== 'boolean' || typeof c.metric !== 'boolean' || (c.metric && c.type !== 'number')) throw new Error(`${page.name}: invalid or duplicate column definition.`);
      columnIds.add(c.id); columnNames.add(c.name.toLowerCase());
    }
    for (const row of page.rows) {
      if (typeof row.id !== 'string' || !row.id || rowIds.has(row.id) || !row.values || typeof row.values !== 'object' || Array.isArray(row.values)) throw new Error(`${page.name}: invalid or duplicate record.`);
      rowIds.add(row.id);
      for (const c of page.columns) {
        const raw = own(row.values, c.id) ? row.values[c.id] : null;
        if (raw !== null && !['string', 'number', 'boolean'].includes(typeof raw)) throw new Error(`${page.name}: invalid cell value.`);
        try {
          const v = convertValue(raw, c.type);
          if (c.required && (v === null || str(v) === '')) throw new Error('This field is required.');
          row.values[c.id] = v;
        } catch (e) { throw new Error(`${page.name}, ${row.sourceRow ? `source row ${row.sourceRow}` : 'record ' + row.id}, ${c.name}: ${(e as Error).message}`); }
      }
    }
  }
  const relationIds = new Set<string>(), edges = new Map<string, string[]>();
  for (const rel of app.relationships) {
    if (!rel.id || relationIds.has(rel.id) || !['parent-child', 'peer'].includes(rel.kind)) throw new Error('Invalid relationship.');
    relationIds.add(rel.id);
    const from = app.pages.find(p => p.id === rel.fromPage), to = app.pages.find(p => p.id === rel.toPage);
    const foreign = from?.columns.find(c => c.id === rel.fromColumn), key = to?.columns.find(c => c.id === rel.toColumn);
    if (!from || !to || from === to || !foreign || !key) throw new Error('Choose two different included pages and their linking columns.');
    if (foreign.type !== key.type) throw new Error(`${from.name} / ${to.name}: linking columns must have the same type.`);
    const keys = new Set<string>();
    for (const row of to.rows) {
      const v = row.values[key.id], token = JSON.stringify(v);
      if (v === null || str(v) === '' || keys.has(token)) throw new Error(`${to.name}: ${key.name} must be nonblank and unique to link records.`);
      keys.add(token);
    }
    for (const row of from.rows) {
      const v = row.values[foreign.id];
      if (v !== null && str(v) !== '' && !keys.has(JSON.stringify(v))) throw new Error(`${from.name}, source row ${row.sourceRow || row.id}: ${foreign.name} "${str(v)}" has no matching ${to.name} record.`);
    }
    if (rel.kind === 'parent-child') edges.set(from.id, [...(edges.get(from.id) || []), to.id]);
  }
  const visit = (id: string, path: Set<string>) => {
    if (path.has(id)) throw new Error('Parent-child relationships contain a cycle.');
    const next = new Set(path).add(id);
    for (const target of edges.get(id) || []) visit(target, next);
  };
  for (const id of ids) visit(id, new Set());
  return app;
}

export function updateAppRecord(app: WorkbookApp, pageId: string, row: AppRow): WorkbookApp {
  const page = app.pages.find(p => p.id === pageId);
  if (!page) throw new Error('Page not found.');
  return validateWorkbookApp({ ...app, pages: app.pages.map(p => p.id !== pageId ? p : { ...p, rows: p.rows.some(r => r.id === row.id) ? p.rows.map(r => r.id === row.id ? row : r) : [...p.rows, row] }) });
}
export function removeAppRecord(app: WorkbookApp, pageId: string, rowId: string): WorkbookApp {
  return validateWorkbookApp({ ...app, pages: app.pages.map(p => p.id !== pageId ? p : { ...p, rows: p.rows.filter(r => r.id !== rowId) }) });
}
export function workbookAppExport(app: WorkbookApp) {
  const wb = XLSX.utils.book_new(), used = new Set<string>();
  for (const page of app.pages) {
    const base = page.name.replace(/[\\/?*\[\]:]/g, '_').slice(0, 31) || 'Sheet';
    let name = base, n = 2;
    while (used.has(name.toLowerCase())) { const suffix = ` (${n++})`; name = base.slice(0, 31 - suffix.length) + suffix; }
    used.add(name.toLowerCase());
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([page.columns.map(c => c.name), ...page.rows.map(r => page.columns.map(c => r.values[c.id] ?? ''))]), name);
  }
  return wb;
}
export function readAppLibrary(storage: Pick<Storage, 'getItem'>): WorkbookApp[] {
  const raw = storage.getItem(APP_STORAGE_KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Invalid app library.');
  const apps = parsed.map(validateWorkbookApp);
  if (new Set(apps.map(a => a.id)).size !== apps.length) throw new Error('Duplicate apps in saved library.');
  return apps;
}
