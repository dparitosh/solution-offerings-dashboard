import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { AppRow, WorkbookApp, updateAppRecord, removeAppRecord, workbookAppExport } from '../utils/workbookApp';

const input = 'border border-slate-300 rounded-lg bg-white px-3 py-2 text-sm';
const button = 'border border-slate-300 rounded-lg bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-40';
const display = (v: unknown) => v === null || v === undefined ? '' : String(v);
export function downloadAppDefinition(app: WorkbookApp) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(app, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = `${app.name.replace(/[^a-z0-9_-]/gi, '_') || 'workbook-app'}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function GeneratedWorkbookApp({ app, onSave, onBack }: { app: WorkbookApp; onSave: (app: WorkbookApp) => void; onBack: () => void }) {
  const [pageId, setPageId] = useState(app.pages[0].id), [search, setSearch] = useState('');
  const [filterColumn, setFilterColumn] = useState(''), [filterValue, setFilterValue] = useState('');
  const [sortColumn, setSortColumn] = useState(''), [descending, setDescending] = useState(false), [pageNumber, setPageNumber] = useState(0);
  const [editing, setEditing] = useState<AppRow | null>(null), [detailId, setDetailId] = useState<string | null>(null);
  const [error, setError] = useState(''), [undo, setUndo] = useState<WorkbookApp | null>(null);
  const page = app.pages.find(p => p.id === pageId) || app.pages[0];
  const detail = page.rows.find(r => r.id === detailId);
  const visible = useMemo(() => {
    const rows = page.rows.filter(r => page.columns.some(c => display(r.values[c.id]).toLowerCase().includes(search.toLowerCase())) && (!filterColumn || display(r.values[filterColumn]) === filterValue));
    const column = page.columns.find(c => c.id === sortColumn);
    if (column) rows.sort((a, b) => {
      const x = a.values[column.id], y = b.values[column.id];
      const order = x === null ? (y === null ? 0 : 1) : y === null ? -1 : column.type === 'number' ? Number(x) - Number(y) : display(x).localeCompare(display(y));
      return descending ? -order : order;
    });
    return rows;
  }, [page, search, filterColumn, filterValue, sortColumn, descending]);
  useEffect(() => { setPageNumber(0); }, [pageId, search, filterColumn, filterValue, sortColumn, descending]);
  const changePage = (id: string, rowId: string | null = null) => { setPageId(id); setSearch(''); setFilterColumn(''); setFilterValue(''); setSortColumn(''); setPageNumber(0); setDetailId(rowId); setEditing(null); setError(''); };
  const save = (next: WorkbookApp) => { onSave(next); setUndo(app); setError(''); };
  const currentPage = Math.min(pageNumber, Math.max(0, Math.ceil(visible.length / 25) - 1));
  const relations = app.relationships.flatMap(rel => {
    if (!detail) return [];
    if (rel.fromPage === page.id) {
      const target = app.pages.find(p => p.id === rel.toPage)!;
      const v = detail.values[rel.fromColumn];
      return [{ id: rel.id, title: `${rel.kind === 'parent-child' ? 'Parent' : 'Linked'}: ${target.name}`, target, rows: v === null || v === '' ? [] : target.rows.filter(r => r.values[rel.toColumn] === v) }];
    }
    if (rel.toPage === page.id) {
      const target = app.pages.find(p => p.id === rel.fromPage)!;
      return [{ id: rel.id, title: `${rel.kind === 'parent-child' ? 'Children' : 'Linked'}: ${target.name}`, target, rows: target.rows.filter(r => r.values[rel.fromColumn] === detail.values[rel.toColumn]) }];
    }
    return [];
  });
  return <div className="min-h-screen bg-slate-100 text-slate-900">
    <header className="bg-slate-900 text-white p-5"><div className="max-w-7xl mx-auto flex flex-wrap justify-between gap-3 items-center"><div><p className="text-xs text-blue-200">WORKBOOK APP</p><h1 className="text-2xl font-bold">{app.name}</h1><p className="text-xs text-slate-300 mt-1">Saved in this browser. Download app JSON to transfer its pages, relationships and data.</p></div><div className="flex gap-2 text-slate-900"><button className={button} onClick={onBack}>App library</button><button className={button} onClick={() => downloadAppDefinition(app)}>Download app JSON</button><button className={button} onClick={() => XLSX.writeFile(workbookAppExport(app), `${app.name.replace(/[^a-z0-9_-]/gi, '_')}.xlsx`)}>Export Excel</button></div></div></header>
    <div className="max-w-7xl mx-auto p-5 grid md:grid-cols-[210px_1fr] gap-5">
      <nav aria-label="App pages" className="bg-white border rounded-xl p-3 h-fit"><h2 className="text-xs font-bold uppercase text-slate-500 px-2 mb-2">Pages</h2>{app.pages.map(p => <button key={p.id} className={`w-full text-left rounded-lg px-3 py-3 text-sm flex justify-between gap-2 ${page.id === p.id ? 'bg-blue-50 text-blue-800 font-semibold' : ''}`} onClick={() => changePage(p.id)}><span>{p.name}</span><span>{p.rows.length}</span></button>)}</nav>
      <main className="min-w-0">
        <div className="flex justify-between items-center gap-3"><div><h2 className="text-xl font-bold">{page.name}</h2><p className="text-xs text-slate-500">Source sheet: {page.sourceSheet}</p></div><button className="bg-blue-700 text-white rounded-lg px-4 py-2 text-sm" onClick={() => { setError(''); setEditing({ id: crypto.randomUUID(), values: Object.fromEntries(page.columns.map(c => [c.id, null])) }); }}>Add record</button></div>
        <div className="grid sm:grid-cols-3 gap-3 my-4"><div className="bg-white border rounded-xl p-4"><p className="text-xs text-slate-500">Matching records</p><strong className="text-2xl">{visible.length}</strong></div>{page.columns.filter(c => c.metric).map(c => <div className="bg-white border rounded-xl p-4" key={c.id}><p className="text-xs text-slate-500">{c.name} / sum of matching records</p><strong className="text-2xl">{visible.reduce((n, r) => n + Number(r.values[c.id] ?? 0), 0).toLocaleString(undefined, { maximumFractionDigits: 4 })}</strong></div>)}</div>
        <div className="flex flex-wrap gap-2 bg-white border rounded-xl p-3 mb-3">
          <input aria-label="Search records" placeholder="Search all columns..." className={`${input} flex-1 min-w-40`} value={search} onChange={e => setSearch(e.target.value)} />
          <select aria-label="Filter column" className={input} value={filterColumn} onChange={e => { setFilterColumn(e.target.value); setFilterValue(''); }}><option value="">All records</option>{page.columns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          {filterColumn && <select aria-label="Filter value" className={input} value={filterValue} onChange={e => setFilterValue(e.target.value)}><option value="">(Blank)</option>{[...new Set(page.rows.map(r => display(r.values[filterColumn])))].filter(Boolean).sort().map(v => <option key={v}>{v}</option>)}</select>}
          <select aria-label="Sort column" className={input} value={sortColumn} onChange={e => setSortColumn(e.target.value)}><option value="">Source order</option>{page.columns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><button className={button} onClick={() => setDescending(!descending)}>{descending ? 'Descending' : 'Ascending'}</button>
        </div>
        {error && <p role="alert" className="bg-rose-50 text-rose-800 p-3 rounded-lg mb-3">{error}</p>}
        {undo && <div className="mb-3 flex items-center gap-3 text-sm"><span>Change saved.</span><button className={button} onClick={() => { try { onSave(undo); setUndo(null); setError(''); } catch (e) { setError((e as Error).message); } }}>Undo last change</button></div>}
        <div className="overflow-auto bg-white border rounded-xl"><table className="w-full text-sm text-left"><thead className="bg-slate-50"><tr>{page.columns.map(c => <th className="p-3 whitespace-nowrap" key={c.id}>{c.name}</th>)}<th className="p-3">Actions</th></tr></thead><tbody>{visible.slice(currentPage * 25, (currentPage + 1) * 25).map(row => <tr key={row.id} className="border-t">{page.columns.map(c => <td key={c.id} className="p-3 max-w-72 whitespace-pre-wrap break-words">{c.type === 'tag' && row.values[c.id] ? <span className="bg-blue-50 text-blue-800 rounded px-2 py-1">{display(row.values[c.id])}</span> : display(row.values[c.id])}</td>)}<td className="p-3"><div className="flex gap-2"><button className={button} onClick={() => setDetailId(row.id)}>Details</button><button className={button} onClick={() => { setError(''); setEditing(structuredClone(row)); }}>Edit</button><button className={button} onClick={() => { try { save(removeAppRecord(app, page.id, row.id)); if (detailId === row.id) setDetailId(null); } catch (e) { setError((e as Error).message); } }}>Delete</button></div></td></tr>)}</tbody></table>{!visible.length && <p className="p-8 text-center text-slate-500">No matching records. Change the filters or add a record.</p>}</div>
        <div className="flex justify-between items-center my-3 text-sm"><span>Page {currentPage + 1} of {Math.max(1, Math.ceil(visible.length / 25))}</span><div className="flex gap-2"><button className={button} disabled={currentPage === 0} onClick={() => setPageNumber(currentPage - 1)}>Previous</button><button className={button} disabled={(currentPage + 1) * 25 >= visible.length} onClick={() => setPageNumber(currentPage + 1)}>Next</button></div></div>
        {detail && <section className="bg-white border rounded-xl p-4 mt-4" aria-label="Record details"><div className="flex justify-between"><h3 className="font-bold">Record details</h3><button className={button} onClick={() => setDetailId(null)}>Close details</button></div><dl className="grid sm:grid-cols-2 gap-3 my-3">{page.columns.map(c => <div key={c.id}><dt className="text-xs text-slate-500">{c.name}</dt><dd className="text-sm whitespace-pre-wrap">{display(detail.values[c.id]) || '(Blank)'}</dd></div>)}</dl>{relations.map(rel => <div key={rel.id} className="border-t pt-3 mt-3"><h4 className="font-semibold text-sm">{rel.title} ({rel.rows.length})</h4><div className="flex flex-wrap gap-2 mt-2">{rel.rows.slice(0, 100).map(r => <button key={r.id} className={button} onClick={() => changePage(rel.target.id, r.id)}>{rel.target.columns.slice(0, 2).map(c => display(r.values[c.id])).join(' / ') || r.id}</button>)}</div>{rel.rows.length > 100 && <p className="text-xs">Showing the first 100 links. Use the related page to search all records.</p>}</div>)}</section>}
      </main>
    </div>
    {editing && <div className="fixed inset-0 z-[110] bg-slate-900/60 flex items-center justify-center p-4"><form role="dialog" aria-modal="true" aria-label="Edit app record" className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto p-6" onKeyDown={event => {
      if (event.key === 'Escape') { setEditing(null); setError(''); }
      if (event.key === 'Tab') {
        const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('input, select, button')];
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }} onSubmit={e => { e.preventDefault(); try { save(updateAppRecord(app, page.id, editing)); setEditing(null); } catch (err) { setError((err as Error).message); } }}><h2 className="text-xl font-bold mb-4">{page.name} record</h2><div className="grid sm:grid-cols-2 gap-3">{page.columns.map(c => <label key={c.id} className="text-sm">{c.name}{c.required ? ' *' : ''}{c.type === 'boolean' ? <select autoFocus={c.id === page.columns[0].id} className={`${input} w-full mt-1`} value={display(editing.values[c.id])} onChange={e => setEditing({ ...editing, values: { ...editing.values, [c.id]: e.target.value || null } })}><option value="">(Blank)</option><option value="true">True</option><option value="false">False</option></select> : <input autoFocus={c.id === page.columns[0].id} className={`${input} w-full mt-1`} required={c.required} type={c.type === 'number' ? 'number' : c.type === 'date' ? 'date' : 'text'} step="any" value={display(editing.values[c.id])} onChange={e => setEditing({ ...editing, values: { ...editing.values, [c.id]: e.target.value || null } })} />}</label>)}</div>{error && <p role="alert" className="bg-rose-50 text-rose-800 p-3 mt-4">{error}</p>}<div className="flex justify-end gap-2 mt-4"><button type="button" className={button} onClick={() => { setEditing(null); setError(''); }}>Cancel</button><button className="bg-blue-700 text-white rounded-lg px-4 py-2">Save record</button></div></form></div>}
  </div>;
}
