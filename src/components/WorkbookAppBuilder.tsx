import React, { useEffect, useRef, useState } from 'react';
import { APP_STORAGE_KEY, AppColumn, AppPage, AppRelationship, FieldType, WorkbookApp, readAppLibrary } from '../utils/workbookApp';
import { downloadAppDefinition, GeneratedWorkbookApp } from './GeneratedWorkbookApp';

const control = 'border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm';
const button = 'border border-slate-300 rounded-lg px-4 py-2 bg-white text-sm disabled:opacity-40';
const primary = 'rounded-lg px-4 py-2 bg-blue-700 text-white font-semibold text-sm disabled:opacity-40';
export function WorkbookAppBuilder({ onClose }: { onClose: () => void }) {
  const [initial] = useState(() => { try { return { apps: readAppLibrary(localStorage), error: '' }; } catch { return { apps: [], error: 'Saved app data could not be read. It has not been overwritten. Download the saved library for recovery.' }; } });
  const [apps, setApps] = useState<WorkbookApp[]>(initial.apps), [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<WorkbookApp | null>(null), [review, setReview] = useState<WorkbookApp | null>(null);
  const [selected, setSelected] = useState<string[]>([]), [pageId, setPageId] = useState('');
  const [step, setStep] = useState(0), [busy, setBusy] = useState(false), [error, setError] = useState(initial.error);
  const [headerRow, setHeaderRow] = useState(1);
  const fileInput = useRef<HTMLInputElement>(null), worker = useRef<Worker | null>(null), sequence = useRef(0);
  const source = useRef<{ buffer: ArrayBuffer; name: string } | null>(null);
  const fileRequest = useRef(0);
  const invalidate = () => { sequence.current++; worker.current?.terminate(); setReview(null); setError(''); setBusy(false); };
  useEffect(() => () => { fileRequest.current++; sequence.current++; worker.current?.terminate(); }, []);
  const run = (message: object, done: (app: WorkbookApp) => void) => {
    invalidate(); const token = sequence.current; setBusy(true);
    try {
      const next = new Worker(new URL('../utils/workbookApp.worker.ts', import.meta.url), { type: 'module' }); worker.current = next;
      next.onmessage = ({ data }) => { if (sequence.current !== token) return; next.terminate(); setBusy(false); if (data.error) setError(data.error); else done(data.result); };
      next.onerror = () => { if (sequence.current !== token) return; next.terminate(); setBusy(false); setError('The workbook could not be processed. Try again with a smaller file.'); };
      next.postMessage(message);
    } catch { setBusy(false); setError('Unable to start the workbook processor. Please reload.'); }
  };
  const load = async (file?: File) => {
    if (!file) return;
    invalidate(); setBusy(true); const token = ++fileRequest.current;
    try {
      if (file.size > 25 * 1024 * 1024) throw new Error('Choose a workbook smaller than 25 MB.');
      const ready = (app: WorkbookApp) => { setDraft({ ...app, id: crypto.randomUUID() }); setSelected(app.pages.map(p => p.id)); setPageId(app.pages[0].id); setHeaderRow(app.pages[0].headerRow); setStep(0); setOpenId(null); };
      if (/\.json$/i.test(file.name)) {
        const app = JSON.parse(await file.text()); if (token !== fileRequest.current) return;
        source.current = null; run({ kind: 'validate', app }, ready);
      } else {
        const buffer = await file.arrayBuffer(); if (token !== fileRequest.current) return;
        source.current = { buffer, name: file.name }; run({ kind: 'read', buffer, name: file.name }, ready);
      }
    } catch (e) { if (token === fileRequest.current) { setBusy(false); setError((e as Error).message); } }
  };
  const persist = (app: WorkbookApp) => {
    if (initial.error) throw new Error(initial.error);
    const next = apps.some(a => a.id === app.id) ? apps.map(a => a.id === app.id ? app : a) : [...apps, app];
    try { localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(next)); }
    catch { throw new Error('Browser storage is full or unavailable. Download app JSON to keep a copy. The saved app has not changed.'); }
    setApps(next);
  };
  const page = draft?.pages.find(p => p.id === pageId);
  const updatePage = (patch: Partial<AppPage>) => { invalidate(); setDraft(prev => prev && ({ ...prev, pages: prev.pages.map(p => p.id === pageId ? { ...p, ...patch } : p) })); };
  const updateColumn = (id: string, patch: Partial<AppColumn>) => updatePage({ columns: page!.columns.map(c => c.id === id ? { ...c, ...patch } : c) });
  const editRelation = (id: string, patch: Partial<AppRelationship>) => { invalidate(); setDraft(prev => prev && ({ ...prev, relationships: prev.relationships.map(r => r.id === id ? { ...r, ...patch } : r) })); };
  const open = apps.find(a => a.id === openId);
  if (open) return <GeneratedWorkbookApp key={open.id} app={open} onSave={persist} onBack={() => setOpenId(null)} />;
  return <div className="min-h-screen bg-slate-100 text-slate-900">
    <header className="bg-slate-900 text-white p-5"><div className="max-w-6xl mx-auto flex justify-between items-center gap-4"><div><p className="text-xs text-blue-200">EXCEL TO APP</p><h1 className="text-2xl font-bold">Turn your workbook into a working app</h1><p className="text-sm text-slate-300 mt-1">Sheets become pages. Columns become fields. You choose the links and summaries.</p></div><button className={`${button} text-slate-900`} onClick={onClose}>Back to dashboard</button></div></header>
    <main className="max-w-6xl mx-auto p-5">
      <input ref={fileInput} aria-label="Upload workbook for app" type="file" accept=".xlsx,.xls,.csv,.json" className="hidden" onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; load(file); }} />
      {!draft && <>
        <section className="bg-white border rounded-2xl p-8 my-4"><h2 className="text-xl font-bold">Start with your Excel file</h2><p className="text-slate-500 text-sm my-3 max-w-2xl">Upload one workbook to preview its pages, field types and records. Create tables, search, filters, editable forms and selected numeric summaries. Choose related ID columns to keep records connected.</p><button className={primary} disabled={busy} onClick={() => fileInput.current?.click()}>Upload Excel or app JSON</button><p className="text-xs text-slate-500 mt-3">Files stay in this browser. Up to 25 MB, 20,000 records and 250,000 cells per sheet. Formula results are imported as values; formulas and macros do not run.</p></section>
        <h2 className="text-lg font-bold mt-6 mb-3">Your apps</h2>{!apps.length && <p className="text-sm text-slate-500">No apps created yet.</p>}<div className="grid md:grid-cols-3 gap-4">{apps.map(a => <div key={a.id} className="bg-white border rounded-xl p-5"><h3 className="font-semibold">{a.name}</h3><p className="text-sm text-slate-500 my-2">{a.pages.length} pages / {a.pages.reduce((n, p) => n + p.rows.length, 0)} records</p><div className="flex gap-2"><button className={primary} onClick={() => setOpenId(a.id)}>Open app</button><button className={button} onClick={() => downloadAppDefinition(a)}>Download JSON</button></div></div>)}</div>
      </>}
      {draft && <section className="bg-white border rounded-2xl overflow-hidden">
        <div className="border-b p-5 flex flex-wrap justify-between gap-3"><nav aria-label="Builder steps" className="flex gap-2">{['Pages & fields', 'Relationships', 'Review app'].map((s, i) => <button key={s} aria-current={step === i ? 'step' : undefined} className={step === i ? primary : button} onClick={() => setStep(i)}>{i + 1}. {s}</button>)}</nav><button className={button} onClick={() => { invalidate(); setDraft(null); source.current = null; }}>Cancel setup</button></div>
        <div className="p-5">
          <label className="block text-sm mb-5">App name<input className={`${control} block mt-1 w-full`} value={draft.name} onChange={e => { invalidate(); setDraft({ ...draft, name: e.target.value }); }} /></label>
          {step === 0 && <>
            <p className="text-sm text-slate-500 mb-3">Choose sheets to include. Review the detected header row, field types and sample records before continuing. Empty sheets are omitted.</p>
            <div className="flex flex-wrap gap-3 mb-4">{draft.pages.map(p => <label key={p.id} className="border rounded-lg p-3 text-sm"><input type="checkbox" checked={selected.includes(p.id)} onChange={e => { invalidate(); setSelected(prev => e.target.checked ? [...prev, p.id] : prev.filter(id => id !== p.id)); }} /> <strong>{p.sourceSheet}</strong> / {p.rows.length} records</label>)}</div>
            <nav aria-label="Sheet configuration" className="flex gap-2 flex-wrap mb-4">{draft.pages.map(p => <button key={p.id} className={p.id === pageId ? primary : button} onClick={() => { setPageId(p.id); setHeaderRow(p.headerRow); }}>{p.name}</button>)}</nav>
            {page && <><div className="flex flex-wrap gap-3 items-end mb-3"><label className="text-sm">Page title<input className={`${control} block mt-1`} value={page.name} onChange={e => updatePage({ name: e.target.value })} /></label><label className="text-sm">Header row<input type="number" min="1" className={`${control} block mt-1 w-28`} disabled={!source.current} value={headerRow} onChange={e => { invalidate(); setHeaderRow(Number(e.target.value)); }} /></label><button className={button} disabled={!source.current || busy || !Number.isInteger(headerRow) || headerRow < 1} onClick={() => {
              const target = page; run({ kind: 'read', ...source.current, headerRows: { [page.sourceSheet]: headerRow } }, result => { const refreshed = result.pages.find(p => p.sourceSheet === target.sourceSheet); if (!refreshed) { setError('No columns found at this header row.'); return; } setDraft(prev => prev && ({ ...prev, pages: prev.pages.map(p => p.id === target.id ? { ...refreshed, id: target.id, name: target.name } : p) })); });
            }}>Re-read this sheet</button></div><p className="text-xs text-slate-500 mb-3">Re-reading resets this sheet's fields and records. Tag fields display as labels; only numeric fields selected as summaries are totaled.</p>
              <div className="overflow-auto"><table className="w-full text-sm text-left"><thead><tr>{['Field name', 'Type', 'Required', 'Summary total', 'Example'].map(s => <th key={s} className="p-2 border-b">{s}</th>)}</tr></thead><tbody>{page.columns.map(c => <tr key={c.id} className="border-b"><td className="p-2"><input aria-label={`Field name ${c.id}`} className={control} value={c.name} onChange={e => updateColumn(c.id, { name: e.target.value })} /></td><td className="p-2"><select aria-label={`Type for ${c.name}`} className={control} value={c.type} onChange={e => updateColumn(c.id, { type: e.target.value as FieldType, metric: e.target.value === 'number' && c.metric })}>{['text', 'number', 'date', 'boolean', 'tag'].map(t => <option key={t}>{t}</option>)}</select></td><td className="p-2"><input aria-label={`Required ${c.name}`} type="checkbox" checked={c.required} onChange={e => updateColumn(c.id, { required: e.target.checked })} /></td><td className="p-2"><input aria-label={`Total ${c.name}`} type="checkbox" disabled={c.type !== 'number'} checked={c.metric} onChange={e => updateColumn(c.id, { metric: e.target.checked })} /></td><td className="p-2 max-w-56 truncate">{String(page.rows.find(r => r.values[c.id] !== null)?.values[c.id] ?? '(Blank)')}</td></tr>)}</tbody></table></div>
              <details className="mt-4"><summary className="cursor-pointer text-sm font-semibold">Preview source records</summary><div className="overflow-auto mt-2"><table className="text-xs"><thead><tr><th className="p-2">Source row</th>{page.columns.map(c => <th className="p-2" key={c.id}>{c.name}</th>)}</tr></thead><tbody>{page.rows.slice(0, 5).map(r => <tr key={r.id}><td className="p-2">{r.sourceRow}</td>{page.columns.map(c => <td className="p-2" key={c.id}>{String(r.values[c.id] ?? '')}</td>)}</tr>)}</tbody></table></div></details>
            </>}
          </>}
          {step === 1 && <>
            <h2 className="font-bold text-lg">Connect records across pages</h2><p className="text-sm text-slate-500 my-2">For example: Remedial Actions.Offering ID links to Offerings.ID. The target column must be unique and nonblank. Blank source links are allowed unless the field is required. Parent-child links show related records; they do not add totals across pages.</p>
            <button className={button} disabled={selected.length < 2} onClick={() => { invalidate(); const from = draft.pages.find(p => p.id === selected[0])!, to = draft.pages.find(p => p.id === selected[1])!; setDraft({ ...draft, relationships: [...draft.relationships, { id: crypto.randomUUID(), kind: 'parent-child', fromPage: from.id, fromColumn: from.columns[0].id, toPage: to.id, toColumn: to.columns[0].id }] }); }}>Add relationship</button>
            {!draft.relationships.length && <p className="text-sm text-slate-500 mt-4">No relationships selected. You can create independent pages.</p>}
            {draft.relationships.map((r, i) => <div key={r.id} className="border rounded-xl p-4 mt-3"><div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2"><label className="text-xs">Relationship<select aria-label={`Relationship ${i + 1}`} className={`${control} w-full mt-1`} value={r.kind} onChange={e => editRelation(r.id, { kind: e.target.value as AppRelationship['kind'] })}><option value="parent-child">Parent-child</option><option value="peer">Peer</option></select></label><label className="text-xs">From page<select aria-label={`From page ${i + 1}`} className={`${control} w-full mt-1`} value={r.fromPage} onChange={e => editRelation(r.id, { fromPage: e.target.value, fromColumn: draft.pages.find(p => p.id === e.target.value)!.columns[0].id })}>{draft.pages.map(p => <option key={p.id} value={p.id}>{p.name}{selected.includes(p.id) ? '' : ' (excluded)'}</option>)}</select></label><label className="text-xs">Linking column<select aria-label={`From column ${i + 1}`} className={`${control} w-full mt-1`} value={r.fromColumn} onChange={e => editRelation(r.id, { fromColumn: e.target.value })}>{draft.pages.find(p => p.id === r.fromPage)?.columns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="text-xs">To parent / peer page<select aria-label={`To page ${i + 1}`} className={`${control} w-full mt-1`} value={r.toPage} onChange={e => editRelation(r.id, { toPage: e.target.value, toColumn: draft.pages.find(p => p.id === e.target.value)!.columns[0].id })}>{draft.pages.map(p => <option key={p.id} value={p.id}>{p.name}{selected.includes(p.id) ? '' : ' (excluded)'}</option>)}</select></label><label className="text-xs">Unique target column<select aria-label={`To column ${i + 1}`} className={`${control} w-full mt-1`} value={r.toColumn} onChange={e => editRelation(r.id, { toColumn: e.target.value })}>{draft.pages.find(p => p.id === r.toPage)?.columns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div><button className={`${button} mt-3`} onClick={() => { invalidate(); setDraft({ ...draft, relationships: draft.relationships.filter(x => x.id !== r.id) }); }}>Remove relationship {i + 1}</button></div>)}
          </>}
          {step === 2 && <>
            <h2 className="text-lg font-bold">Your app preview</h2><p className="text-sm text-slate-500 mt-2">{selected.length} pages / {draft.pages.filter(p => selected.includes(p.id)).reduce((n, p) => n + p.rows.length, 0)} records / {draft.relationships.length} relationships</p><div className="grid md:grid-cols-3 gap-3 my-4">{draft.pages.filter(p => selected.includes(p.id)).map(p => <div className="border rounded-xl p-4" key={p.id}><h3 className="font-semibold">{p.name}</h3><p className="text-xs text-slate-500 my-2">{p.columns.length} fields / {p.rows.length} records</p><p className="text-sm">Table, search, filters, editing forms, related records</p><p className="text-xs mt-2">Summaries: {p.columns.filter(c => c.metric).map(c => c.name).join(', ') || 'Record count only'}</p></div>)}</div>
            <p className="text-sm bg-blue-50 p-3 rounded-lg">This creates a configurable app inside this React/Node application. Data is saved per browser, with no shared database or sign-in. Download app JSON to move the complete app to another installation. Excel export contains values; JSON retains the app configuration.</p>
            {review && <p role="status" className="bg-emerald-50 text-emerald-800 p-3 mt-3 rounded-lg">Validation passed. The app is ready to create.</p>}
          </>}
          {error && <p role="alert" className="bg-rose-50 text-rose-800 p-3 rounded-lg mt-4">{error}</p>}
          {busy && <p role="status" className="text-sm text-blue-700 mt-4">Processing in the background...</p>}
        </div>
        <footer className="p-4 bg-slate-50 border-t flex justify-end gap-2">
          {step > 0 && <button className={button} onClick={() => setStep(step - 1)}>Back</button>}
          {step < 2 ? <button className={primary} disabled={!selected.length || busy} onClick={() => setStep(step + 1)}>Continue</button> : <><button className={button} disabled={busy || !selected.length} onClick={() => run({ kind: 'validate', app: { ...draft, pages: draft.pages.filter(p => selected.includes(p.id)) } }, setReview)}>Validate app</button><button className={primary} disabled={busy || !review} onClick={() => { try { persist(review!); setOpenId(review!.id); setDraft(null); setReview(null); } catch (e) { setError((e as Error).message); } }}>Create app</button>{review && <button className={button} onClick={() => downloadAppDefinition(review)}>Download app JSON</button>}</>}
        </footer>
      </section>}
      {!draft && error && <p role="alert" className="bg-rose-50 text-rose-800 p-4 rounded-xl mt-4">{error}</p>}
      {!draft && busy && <p role="status" className="p-4 text-blue-700">Reading workbook in the background...</p>}
      {initial.error && <button className={`${button} mt-3`} onClick={() => { const raw = localStorage.getItem(APP_STORAGE_KEY) || ''; const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = 'workbook-app-library-recovery.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }}>Download saved library for recovery</button>}
    </main>
  </div>;
}
