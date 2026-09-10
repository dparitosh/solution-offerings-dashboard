import React, { useEffect, useRef, useState } from 'react';
import { Offering, QuarterType, RemedialAction } from '../types/dashboard';
import { ImportResult } from '../utils/excelImport';
import { mappingFields, MappingOptions, SheetInfo, suggestColumns, requiredMappingFields } from '../utils/importMapping';

const control = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm';
const primary = 'rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40';
const secondary = 'rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm disabled:opacity-40';

export function ImportMappingModal({ buffer, name, offerings, actions, quarter, onClose, onApply }: {
  buffer: ArrayBuffer; name: string; offerings: Offering[]; actions: RemedialAction[]; quarter: QuarterType;
  onClose: () => void; onApply: (result: ImportResult) => void;
}) {
  const [sheets, setSheets] = useState<SheetInfo[]>([]);
  const [configs, setConfigs] = useState<Record<string, MappingOptions>>({});
  const [selected, setSelected] = useState<string[]>([]), [active, setActive] = useState('');
  const [mode, setMode] = useState<'mapped' | 'template'>('mapped'), [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [review, setReview] = useState<ImportResult | null>(null);
  const [relationship, setRelationship] = useState<MappingOptions['relationship']>('tag');
  const [grouping, setGrouping] = useState<MappingOptions['grouping']>('offering');
  const worker = useRef<Worker | null>(null), generation = useRef(0);
  const invalidate = () => { generation.current++; worker.current?.terminate(); setBusy(false); setReview(null); setError(''); };
  const run = (message: object, done: (result: any) => void) => {
    invalidate(); const version = generation.current; setBusy(true);
    try {
      const next = new Worker(new URL('../utils/importMapping.worker.ts', import.meta.url), { type: 'module' }); worker.current = next;
      next.onmessage = ({ data }) => { if (version !== generation.current) return; setBusy(false); next.terminate(); if (data.error) setError(data.error); else done(data.result); };
      next.onerror = () => { if (version !== generation.current) return; setBusy(false); setError('Background validation failed. Try again.'); next.terminate(); };
      next.postMessage({ ...message, buffer });
    } catch { setBusy(false); setError('Could not start validation. Reload the app and try again.'); }
  };
  useEffect(() => {
    run({ kind: 'inspect' }, (result: SheetInfo[]) => {
      setSheets(result);
      const first = result.find(s => s.name === 'Offerings & Sub-Offerings') || result[0];
      if (!first) { setError('Workbook contains no sheets.'); return; }
      setConfigs(Object.fromEntries(result.map(s => [s.name, { mode: 'mapped', sheet: s.name, headerRow: s.headerRow, startRow: s.headerRow + 1, endRow: s.rowCount, columns: suggestColumns(s.headers), relationship: 'tag', grouping: 'offering' }])));
      setSelected([first.name]); setActive(first.name); setMode(first.name === 'Offerings & Sub-Offerings' ? 'template' : 'mapped');
    });
    return () => { generation.current++; worker.current?.terminate(); };
  }, [buffer]);
  const config = configs[active], sheet = sheets.find(s => s.name === active);
  const effective = (n: string) => ({ ...configs[n], relationship, grouping });
  const missing = (n: string) => requiredMappingFields(effective(n)).filter(f => !configs[n]?.columns[f]);
  const missingCount = selected.reduce((n, s) => n + missing(s).length, 0);
  const update = (patch: Partial<MappingOptions>) => { invalidate(); setConfigs(prev => ({ ...prev, [active]: { ...prev[active], ...patch } })); };
  const validate = () => {
    setStep(2);
    run({ kind: 'review', options: mode === 'template' ? { ...configs[active], mode: 'template' } : selected.map(effective), offerings, actions, quarter }, (result: ImportResult) => {
      if (result.error) setError(result.error); else setReview(result);
    });
  };
  const columnRow = (field: string) => {
    const column = config.columns[field] || '', needed = requiredMappingFields(effective(active)).includes(field);
    const example = sheet?.sample.map(r => r[sheet.headers.indexOf(column)]).find(v => v !== '' && v !== undefined);
    return <div key={field} className="grid sm:grid-cols-[1fr_1.4fr_1fr] gap-2 items-center border-b border-slate-100 py-3">
      <label htmlFor={`map-${field}`} className="text-sm font-medium">{field}<span className="ml-2 text-xs font-normal text-slate-500">{needed ? 'Required' : 'Optional'}</span></label>
      <select id={`map-${field}`} className={`${control} ${needed && !column ? 'border-amber-500 bg-amber-50' : ''}`} value={column} onChange={e => update({ columns: { ...config.columns, [field]: e.target.value } })}>
        <option value="">{needed ? 'Choose a column' : 'Skip this field'}</option>
        {[...new Set(sheet?.headers.filter(Boolean) || [])].map(h => <option key={h} disabled={Object.entries(config.columns).some(([f, v]) => f !== field && v === h)}>{h}</option>)}
      </select>
      <p className="truncate text-xs text-slate-500" title={example}>{column ? `Example: ${example ?? '(blank)'}` : needed ? 'Needs your choice' : 'Not mapped'}</p>
    </div>;
  };
  return <div className="fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-3 sm:p-6">
    <section role="dialog" aria-modal="true" aria-label="Review import mapping" className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden" onKeyDown={event => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        const items = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), summary')].filter(el => el.getClientRects().length);
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }}>
      <header className="border-b px-6 py-4 shrink-0">
        <div className="flex justify-between gap-4"><div><h2 className="font-bold text-xl">Import your workbook</h2><p className="text-sm text-slate-500 break-all">{name} / {quarter}</p></div><button autoFocus onClick={onClose} aria-label="Close mapping" className={secondary}>Close</button></div>
        <nav aria-label="Import steps" className="flex gap-2 mt-4">{['Choose sheets', 'Map columns', 'Review & apply'].map((label, i) => <button key={label} aria-current={step === i ? 'step' : undefined} disabled={!sheets.length || (i > 0 && mode === 'mapped' && !selected.length) || (i === 1 && mode === 'template')} onClick={() => { if (i === 1 && !selected.includes(active)) setActive(selected[0]); setStep(i); }} className={`rounded-full px-3 py-2 text-xs sm:text-sm ${step === i ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'} disabled:opacity-40`}>{i + 1}. {label}</button>)}</nav>
      </header>
      <div className="overflow-auto px-6 py-5 flex-1">
        {step === 0 && <>
          <h3 className="font-semibold text-lg">Which sheets should we include?</h3><p className="text-sm text-slate-500 mt-1">Select detail sheets from the same quarter. We will combine them in one import.</p>
          <label className="block text-sm mt-4">Workbook format<select className={`${control} mt-1`} value={mode} disabled={!sheets.length} onChange={e => { invalidate(); setMode(e.target.value as typeof mode); }}><option value="mapped">Custom workbook - choose sheets and map columns</option><option value="template">Dashboard export - offerings, regions and actions</option></select></label>
          {mode === 'template' ? <p className="mt-5 rounded-lg bg-blue-50 p-4 text-sm text-blue-900">The dashboard template already defines the mapping. Review validates its master sheet, regional breakdown and action registry together.</p> : <>
            <div className="flex gap-3 mt-5"><button className={secondary} disabled={!sheets.length} onClick={() => { invalidate(); setSelected(sheets.map(s => s.name)); }}>Select all sheets</button><button className={secondary} onClick={() => { invalidate(); setSelected([]); }}>Clear selection</button></div>
            <div className="grid sm:grid-cols-2 gap-3 mt-3">{sheets.map(s => <label key={s.name} className={`flex gap-3 border rounded-xl p-4 cursor-pointer ${selected.includes(s.name) ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}><input type="checkbox" checked={selected.includes(s.name)} onChange={e => { invalidate(); setSelected(prev => e.target.checked ? [...prev, s.name] : prev.filter(n => n !== s.name)); }} /><span><strong className="text-sm">{s.name}</strong><span className="block text-xs text-slate-500 mt-1">Header row {s.headerRow} / {Math.max(0, s.rowCount - s.headerRow)} source rows / {Object.values(configs[s.name]?.columns || {}).filter(Boolean).length} columns matched</span></span></label>)}</div>
            <p className="text-xs text-slate-500 mt-3">Exclude summaries and lookup sheets. Duplicate detail rows across sheets are rejected to prevent double counting.</p>
          </>}
        </>}
        {step === 1 && config && <>
          <div className="flex justify-between items-start gap-3"><div><h3 className="font-semibold text-lg">Check the suggested columns</h3><p className="text-sm text-slate-500">Matching names are filled in. Review the examples and complete the amber fields.</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs whitespace-nowrap">{missingCount ? `${missingCount} required choices left` : 'Required columns mapped'}</span></div>
          <div className="flex flex-wrap gap-2 my-4" role="tablist" aria-label="Selected worksheets">{selected.map(s => <button role="tab" aria-selected={active === s} key={s} className={`${secondary} ${active === s ? 'border-blue-600 text-blue-700 bg-blue-50' : ''}`} onClick={() => setActive(s)}>{s} {missing(s).length ? `(${missing(s).length} missing)` : '(ready)'}</button>)}</div>
          <div className="flex justify-between items-center gap-3 mb-2"><p className="text-xs text-slate-500">Source: {active}, rows {config.startRow}-{config.endRow}</p><button className={secondary} onClick={() => update({ columns: suggestColumns(sheet!.headers) })}>Auto-match columns</button></div>
          {[...mappingFields.slice(0, 3), ...mappingFields.slice(4, 10)].map(columnRow)}
          <details className="mt-3"><summary className="cursor-pointer text-sm font-medium">Owner and remedial plans (optional)</summary>{[mappingFields[3], ...mappingFields.slice(10)].map(columnRow)}</details>
          <p className="text-xs text-slate-500 mt-3">Amounts must be USD millions. Blank required values are rejected; zero is valid. Review suggestions before importing.</p>
          <details className="mt-5 border rounded-xl p-3"><summary className="cursor-pointer text-sm font-medium">Header and row range / reuse mapping</summary>
            <div className="grid sm:grid-cols-3 gap-3 mt-3"><label className="text-sm">Header row<input type="number" min="1" className={`${control} mt-1`} value={config.headerRow} onChange={e => update({ headerRow: Number(e.target.value), columns: {} })} /></label><label className="text-sm">First source row<input type="number" className={`${control} mt-1`} value={config.startRow} onChange={e => update({ startRow: Number(e.target.value) })} /></label><label className="text-sm">Last source row<input type="number" className={`${control} mt-1`} value={config.endRow} onChange={e => update({ endRow: Number(e.target.value) })} /></label></div>
            <div className="flex flex-wrap gap-2 mt-3"><button className={secondary} disabled={busy || !Number.isInteger(config.headerRow) || config.headerRow < 1} onClick={() => { const target = active; run({ kind: 'inspect', headerRow: config.headerRow }, (result: SheetInfo[]) => { const refreshed = result.find(s => s.name === target)!; setSheets(prev => prev.map(s => s.name === target ? refreshed : s)); setConfigs(prev => ({ ...prev, [target]: { ...prev[target], columns: suggestColumns(refreshed.headers), startRow: config.headerRow + 1, endRow: refreshed.rowCount } })); }); }}>Read headers</button>
              <button className={secondary} disabled={selected.length < 2} onClick={() => { invalidate(); setConfigs(prev => Object.fromEntries(Object.entries(prev).map(([n, c]) => [n, selected.includes(n) && n !== active ? { ...c, columns: Object.fromEntries(Object.entries(config.columns).map(([f, h]) => [f, sheets.find(s => s.name === n)!.headers.filter(v => v === h).length === 1 ? h : ''])) } : c]))); }}>Copy mapping to selected sheets</button></div>
            <p className="text-xs text-slate-500 mt-2">Only identical column names are copied. Each sheet keeps its own row range. Unmatched columns remain empty.</p>
          </details>
          <fieldset className="mt-6"><legend className="font-semibold">How should Updated Offering be used?</legend><div className="grid sm:grid-cols-3 gap-2 mt-2">{([['tag', 'Tag', 'Label the original offering.'], ['parent-child', 'Parent-child', 'Make Updated Offering the parent.'], ['peer', 'Peer', 'Link offerings without adding totals.']] as const).map(([id, title, desc]) => <label key={id} className={`border rounded-xl p-3 cursor-pointer ${relationship === id ? 'border-blue-600 bg-blue-50' : ''}`}><input type="radio" name="relationship" value={id} checked={relationship === id} onChange={() => { invalidate(); setRelationship(id); }} /><strong className="text-sm ml-2">{title}</strong><p className="text-xs text-slate-500 mt-1">{desc}</p></label>)}</div></fieldset>
          <label className="block mt-4 text-sm">Group detail rows by<select className={`${control} mt-1`} disabled={relationship === 'parent-child'} value={relationship === 'parent-child' ? 'updated' : grouping} onChange={e => { invalidate(); setGrouping(e.target.value as typeof grouping); }}><option value="offering">Offering</option><option value="sub-offering">Sub-offering</option>{relationship === 'parent-child' && <option value="updated">Updated Offering</option>}</select></label><p className="text-xs text-slate-500 mt-2">Relationship and grouping apply to every selected sheet. Original offering/sub-offering paths remain visible under an updated parent.</p>
        </>}
        {step === 2 && <>
          <h3 className="font-semibold text-lg">Review before applying</h3><p className="rounded-lg bg-amber-50 text-amber-900 p-3 text-sm mt-3">Apply replaces {quarter} with this combined import. Existing actions must retain valid parents. Export a backup before applying.</p>
          <p className="text-sm mt-3">{mode === 'template' ? 'Dashboard export: all template sheets' : `${selected.length} sheets: ${selected.join(', ')} / ${relationship} / grouping: ${relationship === 'parent-child' ? 'Updated Offering' : grouping}`}</p>
          {!review && !busy && !error && <p className="mt-4 text-slate-500 text-sm">Click Review mapping to validate the complete import in the background.</p>}
          {review && <div className="mt-4"><p role="status" className="rounded-lg bg-emerald-50 text-emerald-900 p-3 font-semibold">Mapping valid: {review.offerings.length} groups, {review.offerings.reduce((n, o) => n + o.subOfferings.length, 0)} detail rows, {review.actions.length} actions.</p>
            <p className="text-xs text-slate-500 mt-3">Actual / AOP in USD millions. Each source row is counted once.</p><div className="overflow-auto mt-2"><table className="w-full text-left text-sm"><thead><tr>{['Parent / Detail', 'Source', 'Pipeline', 'TCV', 'Revenue'].map(h => <th key={h} className="p-2 border-b">{h}</th>)}</tr></thead><tbody>{review.offerings.flatMap(o => o.subOfferings.map(s => <tr key={s.id} className="border-b border-slate-100"><td className="p-2"><strong>{o.name}</strong><p>{s.name}</p>{[s.pipelineRemedialActions, s.tcvRemedialActions, s.revenueRemedialActions].filter(Boolean).length > 0 && <details className="text-xs text-slate-500 mt-1"><summary>Remedial plans</summary>{[s.pipelineRemedialActions, s.tcvRemedialActions, s.revenueRemedialActions].filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}</details>}</td><td className="p-2">{s.mapping ? `${s.mapping.sourceSheet} / row ${s.mapping.sourceRow} / ${s.mapping.relationship}: ${s.mapping.updatedOffering}` : 'Template'}</td><td className="p-2 whitespace-nowrap">{s.pipelineActual} / {s.pipelineAop}</td><td className="p-2 whitespace-nowrap">{s.tcvActual} / {s.tcvAop}</td><td className="p-2 whitespace-nowrap">{s.revenueActual} / {s.revenueAop}</td></tr>))}</tbody></table></div>
          </div>}
        </>}
        {error && <p role="alert" className="mt-4 p-3 bg-rose-50 text-rose-800 rounded-lg">{error}</p>}
        {busy && <p role="status" className="mt-4 text-sm text-blue-700">{sheets.length ? 'Validating in the background...' : 'Reading sheets and suggesting columns...'}</p>}
      </div>
      <footer className="border-t px-6 py-4 bg-slate-50 flex justify-between gap-3 shrink-0"><span className="text-xs text-slate-500 self-center">{mode === 'template' ? 'Template workbook' : `${selected.length} sheets selected`}</span><div className="flex gap-2">
        {step > 0 && <button className={secondary} onClick={() => setStep(mode === 'template' ? 0 : step - 1)}>Back</button>}
        {step === 0 && <button className={primary} disabled={!sheets.length || (mode === 'mapped' && !selected.length) || busy} onClick={() => { setActive(selected[0]); if (mode === 'template') validate(); else setStep(1); }}>{mode === 'template' ? 'Review mapping' : 'Continue to mapping'}</button>}
        {step > 0 && <button className={step === 1 ? primary : secondary} disabled={busy || (mode === 'mapped' && !selected.length) || (mode === 'mapped' && missingCount > 0)} onClick={validate}>Review mapping</button>}
        {step === 2 && <button className={primary} disabled={!review || busy} onClick={() => review && onApply(review)}>Apply import</button>}
      </div></footer>
    </section>
  </div>;
}
