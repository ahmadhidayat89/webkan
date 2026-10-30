import { useEffect, useId, useRef, useState } from 'react';

/** A local combobox shared by the editor and dropdown answer fields. */
export default function SearchableSelect({ value, options, onChange, label, placeholder = 'Silakan pilih', searchPlaceholder = 'Cari…', disabled = false, clearable = false, className = '' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const root = useRef(null);
  const search = useRef(null);
  const id = useId();
  const normalized = query.trim().toLocaleLowerCase('id');
  const filtered = options.filter(option => String(option.label).toLocaleLowerCase('id').includes(normalized));
  const selected = options.find(option => option.value === value);

  useEffect(() => {
    if (!open) return;
    search.current?.focus();
    const outside = e => { if (!root.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  useEffect(() => {
    if (open) root.current?.querySelector('[role="option"][data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [open, active, query]);

  const choose = option => {
    onChange(option.value);
    setOpen(false);
    setQuery('');
    root.current?.querySelector('[role="combobox"]')?.focus();
  };
  const show = () => { setQuery(''); setActive(0); setOpen(true); };
  const onKeyDown = e => {
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); root.current?.querySelector('[role="combobox"]')?.focus(); }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(previous => Math.max(0, Math.min(filtered.length - 1, previous + (e.key === 'ArrowDown' ? 1 : -1))));
    }
    if (e.key === 'Enter') { e.preventDefault(); if (filtered[active]) choose(filtered[active]); }
  };

  return <div ref={root} className={`relative min-w-0 ${className}`} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
    <button type="button" role="combobox" aria-label={label} aria-controls={`${id}-list`} aria-expanded={open} aria-haspopup="listbox" disabled={disabled} onClick={() => open ? setOpen(false) : show()} onKeyDown={e => { if (['ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); show(); } }} className="flex items-center justify-between w-full gap-3 px-3 py-2 text-sm text-left bg-white border rounded-lg outline-none border-slate-200 text-slate-700 focus:ring-2 focus:ring-blue-200 disabled:opacity-50">
      <span className="min-w-0 truncate">{selected?.label || placeholder}</span><span aria-hidden="true" className="text-xs text-slate-400">⌄</span>
    </button>
    {open && <div className="absolute left-0 top-full z-40 mt-1 w-full min-w-[200px] rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
      <input ref={search} aria-label={searchPlaceholder} placeholder={searchPlaceholder} value={query} onChange={e => { setQuery(e.target.value); setActive(0); }} onKeyDown={onKeyDown} aria-controls={`${id}-list`} aria-activedescendant={filtered.length ? `${id}-option-${active}` : undefined} className="w-full px-3 py-2 mb-2 text-sm border rounded-lg outline-none border-slate-200 focus:border-blue-500" />
      <div id={`${id}-list`} role="listbox" aria-label={label} className="overflow-y-auto max-h-60">
        {!filtered.length && <output className="block px-3 py-3 text-xs text-slate-500">Tidak ada hasil.</output>}
        {filtered.map((option, index) => <button key={String(option.value)} id={`${id}-option-${index}`} type="button" role="option" tabIndex={-1} aria-selected={option.value === value} data-active={active === index} onFocus={() => setActive(index)} onMouseEnter={() => setActive(index)} onClick={() => choose(option)} onKeyDown={onKeyDown} className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${active === index ? 'bg-blue-50 text-blue-900' : 'text-slate-600 hover:bg-slate-50'} ${option.value === value ? 'font-bold' : ''}`}>{option.label}</button>)}
      </div>
      {clearable && value !== '' && value != null && <button type="button" onClick={() => choose({ value: '', label: placeholder })} className="w-full px-3 py-2 mt-2 text-xs font-semibold text-left border-t border-slate-100 text-slate-500">Kosongkan pilihan</button>}
    </div>}
  </div>;
}
