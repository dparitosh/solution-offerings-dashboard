import React, { useEffect, useRef, useState } from 'react';
import { Offering, QuarterType, RemedialAction } from '../types/dashboard';
import { ImportResult } from '../utils/excelImport';
import { mappingFields, MappingOptions, SheetInfo } from '../utils/importMapping';

export function ImportMappingModal({ buffer, name, offerings, actions, quarter, onClose, onApply }: {
  buffer: ArrayBuffer; name: string; offerings: Offering[]; actions: RemedialAction[]; quarter: QuarterType;
  onClose: () => void; onApply: (result: ImportResult) => void;
}) {
  const [sheets, setSheets] = useState<SheetInfo[]>([]);
  const [options, setOptions] = useState<MappingOptions>({ mode: 'mapped', sheet: '', headerRow: 1, startRow: 2, endRow: 2, columns: {}, relationship: 'tag', grouping: 'offering' });
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [review, setReview] = useState<ImportResult | null>(null);
  const worker = useRef<Worker | null>(null);
  const generation = useRef(0);
  const run = (message: object, done: (result: any) => void) => {
    worker.current?.terminate(); const version = ++generation.current;
    setBusy(true); setError(''); setReview(null);
    const next = new Worker(new URL('../utils/importMapping.worker.ts', import.meta.url), { type: 'module' }); worker.current = next;
    next.onmessage = ({ data }) => { if (version !== generation.current) return; setBusy(false); next.terminate(); if (data.error) setError(data.error); else done(data.result); };
    next.onerror = () => { if (version !== generation.current) return; setBusy(false); setError('Background validation failed. Please try again.'); next.terminate(); };
    next.postMessage({ ...message, buffer });
  };
  const suggested = (sheet: SheetInfo) => Object.fromEntries(mappingFields.map(field => [field, sheet.headers.find(h => h.toLowerCase().replace(/[^a-z0-9]/g, '') === field.toLowerCase().replace(/[^a-z0-9]/g, '')) || (field === 'Offering' ? sheet.headers.find(h => h === 'Offering Name') : field === 'Sub-offering' ? sheet.headers.find(h => h === 'Sub offering Name') : '') || '']));
  useEffect(() => {
    run({ kind: 'inspect', headerRow: 1 }, (result: SheetInfo[]) => {
      setSheets(result); const first = result.find(s => s.name === 'Offerings & Sub-Offerings') || result[0];
      if (!first) { setError('Workbook contains no sheets.'); return; }
      setOptions(prev => ({ ...prev, mode: first.name === 'Offerings & Sub-Offerings' ? 'template' : 'mapped', sheet: first.name, endRow: first.rowCount, columns: suggested(first) }));
    });
    return () => { generation.current++; worker.current?.terminate(); };
  }, [buffer]);
  const change = (patch: Partial<MappingOptions>) => { generation.current++; worker.current?.terminate(); setBusy(false); setReview(null); setError(''); setOptions(prev => ({ ...prev, ...patch })); };
  const sheet = sheets.find(s => s.name === options.sheet);
  const control = 'block w-full mt-1 border border-slate-300 rounded p-2 bg-white text-sm';
  return <div className="fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-4">
    <section role="dialog" aria-modal="true" aria-label="Review import mapping" className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[92vh] overflow-auto p-6" onKeyDown={event => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        const items = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), summary')];
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }}>
      <div className="flex justify-between gap-4"><h2 className="font-bold text-xl">Review import mapping</h2><button autoFocus onClick={onClose} aria-label="Close mapping">Close</button></div>
      <p className="text-sm text-slate-600 mt-2">{name} · {quarter}. Applying replaces this quarter’s offerings. Existing actions must retain valid parents. Export a backup before applying.</p>
      <label className="block mt-4">Import format<select className={control} value={options.mode} onChange={e => change({ mode: e.target.value as MappingOptions['mode'] })}><option value="mapped">Map source columns</option><option value="template">Dashboard export (all sheets and rows)</option></select></label>
      {options.mode === 'mapped' && <>
        <h3 className="font-semibold mt-5">1. Map columns</h3>
        <div className="grid sm:grid-cols-3 gap-3 mt-2">
          <label>Worksheet<select className={control} value={options.sheet} onChange={e => { const selected = sheets.find(s => s.name === e.target.value)!; change({ sheet: selected.name, endRow: selected.rowCount, columns: suggested(selected) }); }}>{sheets.map(s => <option key={s.name}>{s.name}</option>)}</select></label>
          <label>Header row<input type="number" min="1" className={control} value={options.headerRow} onChange={e => change({ headerRow: Number(e.target.value), columns: {} })} /></label>
          <button className="border rounded p-2 self-end disabled:opacity-50" disabled={busy || !Number.isInteger(options.headerRow) || options.headerRow < 1} onClick={() => run({ kind: 'inspect', headerRow: options.headerRow }, (result: SheetInfo[]) => { setSheets(result); const selected = result.find(s => s.name === options.sheet)!; change({ columns: suggested(selected), startRow: options.headerRow + 1, endRow: selected.rowCount }); })}>Read headers</button>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 mt-3">{mappingFields.map(field => <label key={field} className="text-sm">{field}<select className={control} value={options.columns[field] || ''} onChange={e => change({ columns: { ...options.columns, [field]: e.target.value } })}><option value="">Select column</option>{[...new Set(sheet?.headers.filter(Boolean) || [])].map(h => <option key={h}>{h}</option>)}</select></label>)}</div>
        <p className="text-xs text-slate-500 mt-2">Offering, Updated Offering and all six metrics are required. Metrics use USD millions; zero is valid. Map remedial-action columns to keep plans with their detail rows.</p>
        {sheet?.sample.length > 0 && <details className="mt-3 text-sm"><summary>Preview first three source rows</summary><div className="overflow-auto"><table className="text-xs"><thead><tr>{sheet.headers.map((h, i) => <th className="p-2 border" key={i}>{h}</th>)}</tr></thead><tbody>{sheet.sample.map((r, i) => <tr key={i}>{sheet.headers.map((_, j) => <td className="p-2 border" key={j}>{r[j]}</td>)}</tr>)}</tbody></table></div></details>}
        <h3 className="font-semibold mt-5">2. Choose relationship</h3>
        <select aria-label="Relationship" className={control} value={options.relationship} onChange={e => change({ relationship: e.target.value as MappingOptions['relationship'] })}><option value="tag">Tag</option><option value="parent-child">Parent–child</option><option value="peer">Peer</option></select>
        <p className="text-sm text-slate-600 mt-2">{options.relationship === 'tag' ? 'Updated Offering labels the source offering without adding to financial totals.' : options.relationship === 'peer' ? 'Updated Offering is a peer link; its metrics are not copied or added.' : 'Updated Offering becomes the financial parent. Detail names retain the original Offering / Sub-offering path.'}</p>
        <h3 className="font-semibold mt-5">3. Grouping and source-row scope</h3>
        <div className="grid sm:grid-cols-3 gap-3 mt-2">
          <label>Grouping<select className={control} disabled={options.relationship === 'parent-child'} value={options.relationship === 'parent-child' ? 'updated' : options.grouping} onChange={e => change({ grouping: e.target.value as MappingOptions['grouping'] })}><option value="offering">Offering</option><option value="sub-offering">Sub-offering</option>{options.relationship === 'parent-child' && <option value="updated">Updated Offering</option>}</select></label>
          <label>First source row<input type="number" className={control} min={options.headerRow + 1} value={options.startRow} onChange={e => change({ startRow: Number(e.target.value) })} /></label>
          <label>Last source row<input type="number" className={control} max={sheet?.rowCount} value={options.endRow} onChange={e => change({ endRow: Number(e.target.value) })} /></label>
        </div><p className="text-xs text-slate-500 mt-2">Excel row numbers, inclusive. Select detail rows only, excluding summary totals. The resulting quarter contains only the selected rows.</p>
      </>}
      {error && <p role="alert" className="mt-4 p-3 bg-rose-50 text-rose-800 rounded">{error}</p>}
      {busy && <p role="status" className="mt-4">Validating in the background… You can continue adjusting the mapping or close this window.</p>}
      {review && <div className="mt-4 p-3 bg-emerald-50 rounded">
        <p role="status" className="font-semibold">Mapping valid: {review.offerings.length} groups, {review.offerings.reduce((n, o) => n + o.subOfferings.length, 0)} detail rows, {review.actions.length} actions.</p>
        <p className="text-xs mt-1">Amounts are USD millions. Each metric shows actual / AOP; gaps are calculated from these values.</p>
        <div className="max-h-60 overflow-auto mt-2 text-sm"><table className="w-full text-left"><thead><tr>{['Parent / Detail', 'Relationship / Source', 'Pipeline', 'TCV', 'Revenue', 'Remedial plans'].map(h => <th key={h} className="p-2 border-b">{h}</th>)}</tr></thead>
          <tbody>{review.offerings.flatMap(o => o.subOfferings.map(s => <tr key={s.id}>
            <td className="p-2"><strong>{o.name}</strong><p>{s.name}</p></td>
            <td className="p-2">{s.mapping ? `${s.mapping.relationship}: ${s.mapping.updatedOffering} · source row ${s.mapping.sourceRow}` : 'Template hierarchy'}</td>
            <td className="p-2 whitespace-nowrap">{s.pipelineActual} / {s.pipelineAop}</td><td className="p-2 whitespace-nowrap">{s.tcvActual} / {s.tcvAop}</td><td className="p-2 whitespace-nowrap">{s.revenueActual} / {s.revenueAop}</td>
            <td className="p-2">{[s.pipelineRemedialActions, s.tcvRemedialActions, s.revenueRemedialActions].filter(Boolean).join(' · ') || 'None'}</td>
          </tr>))}</tbody></table></div>
      </div>}
      <div className="flex justify-end gap-3 mt-5"><button disabled={busy || !sheets.length} className="bg-slate-800 text-white rounded px-4 py-2 disabled:opacity-50" onClick={() => run({ kind: 'review', options, offerings, actions, quarter }, (result: ImportResult) => { if (result.error) setError(result.error); else setReview(result); })}>Review mapping</button><button disabled={!review || busy} className="bg-blue-700 text-white rounded px-4 py-2 disabled:opacity-50" onClick={() => review && onApply(review)}>Apply import</button></div>
    </section>
  </div>;
}
