import { useEffect, useRef, useState } from 'react';
import { FaArrowLeft, FaPlus, FaFileImport, FaHeading, FaImage, FaVideo, FaLayerGroup, FaEye, FaPalette, FaEllipsisV, FaUndo, FaRedo, FaTimes } from 'react-icons/fa';

const actionClass = 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-blue-600 disabled:opacity-40';

function saveStatusText(saving, dirty, persisted) {
  if (saving) return 'Menyimpan…';
  if (dirty) return 'Ada perubahan yang belum disimpan';
  return persisted ? 'Semua perubahan tersimpan' : 'Belum disimpan';
}

function uploadLabel(busy, url, label) {
  if (busy) return 'Mengunggah…';
  return url ? 'Ganti gambar' : label;
}

export function EditorHeader({ title, persisted, published, mode, onMode, onBack, onSave, saving, dirty, onShare, onTheme, onCopy, onUnpublish, undo, redo, canUndo, canRedo }) {
  const tabs = [['edit', 'Pertanyaan'], ['res', 'Jawaban'], ['settings', 'Setelan']];
  const statusText = saveStatusText(saving, dirty, persisted);
  return <header data-survey-editor-header className="sticky top-0 z-20 rounded-2xl border border-slate-200 bg-white/95 shadow-sm backdrop-blur print:hidden">
    <div className="flex flex-wrap items-center gap-3 p-4">
      <button type="button" onClick={onBack} aria-label="Kembali ke daftar kuesioner" className={actionClass}><FaArrowLeft /></button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-bold text-slate-900">{title || 'Kuesioner tanpa judul'}</h1>
        <output className="mt-0.5 block text-[11px] text-slate-500">{statusText} <span className="mx-1">·</span> {published ? 'Dipublikasikan' : 'Draf'}</output>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" title="Urungkan perubahan pertanyaan" aria-label="Urungkan" disabled={!canUndo} onClick={undo} className={actionClass}><FaUndo /></button>
        <button type="button" title="Ulangi perubahan pertanyaan" aria-label="Ulangi" disabled={!canRedo} onClick={redo} className={actionClass}><FaRedo /></button>
        <button type="button" onClick={onTheme} className={actionClass}><FaPalette /><span>Tema</span></button>
        <button type="button" onClick={() => onMode('pv')} className={`${actionClass} ${mode === 'pv' ? 'bg-blue-50 text-blue-700' : ''}`}><FaEye /><span>Pratinjau</span></button>
        <button type="button" disabled={saving} onClick={onSave} className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-800 disabled:opacity-40">{saving ? 'Menyimpan…' : 'Simpan'}</button>
        <button type="button" onClick={onShare} className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800">{published ? 'Bagikan' : 'Publikasikan'}</button>
        <details className="relative">
          <summary aria-label="Menu kuesioner" className={`${actionClass} list-none cursor-pointer`}><FaEllipsisV /></summary>
          <div className="absolute right-0 z-30 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
            <button type="button" onClick={onCopy} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50">Buat salinan</button>
            <button type="button" onClick={() => window.print()} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50">Cetak</button>
            {published && <button type="button" onClick={onUnpublish} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50">Batalkan publikasi</button>}
          </div>
        </details>
      </div>
    </div>
    <nav aria-label="Bagian editor kuesioner" className="flex justify-center gap-6 border-t border-slate-100 px-4">
      {tabs.map(([key, label]) => <button type="button" key={key} aria-current={mode === key ? 'page' : undefined} onClick={() => onMode(key)} className={`border-b-[3px] px-2 py-3 text-sm font-semibold transition ${mode === key ? 'border-blue-700 text-blue-800' : 'border-transparent text-slate-500 hover:text-blue-700'}`}>{label}</button>)}
    </nav>
    {mode === 'pv' && <div className="border-t border-blue-100 bg-blue-50 px-4 py-2 text-center text-xs text-blue-800">Mode pratinjau · Jawaban percobaan tidak disimpan <button type="button" onClick={() => onMode('edit')} className="ml-3 font-bold underline">Kembali ke editor</button></div>}
  </header>;
}

export function InsertToolbar({ onAdd, onImport }) {
  const actions = [
    ['short', 'Pertanyaan', FaPlus], ['import', 'Impor pertanyaan', FaFileImport],
    ['heading', 'Judul & deskripsi', FaHeading], ['image', 'Gambar', FaImage],
    ['video', 'Video', FaVideo], ['section', 'Bagian', FaLayerGroup],
  ];
  return <aside aria-label="Tambah konten" className="sticky top-40 z-10 grid grid-cols-6 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-sm lg:flex lg:flex-col lg:items-stretch">
    {actions.map(([type, label, Icon]) => <button key={type} type="button" aria-label={`Tambahkan ${label.toLowerCase()}`} title={`Tambahkan ${label.toLowerCase()}`} onClick={() => type === 'import' ? onImport() : onAdd(type)} className="flex items-center justify-center gap-3 rounded-lg p-3 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-blue-600 lg:justify-start"><Icon className="shrink-0 text-base" /><span className="sr-only text-xs font-semibold lg:not-sr-only">{label}</span></button>)}
  </aside>;
}

export function EditorDialog({ title, onClose, children, wide = false }) {
  const dialog = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const el = dialog.current;
    el.showModal();
    const dismiss = e => { e.preventDefault(); closeRef.current(); };
    el.addEventListener('cancel', dismiss);
    return () => { el.removeEventListener('cancel', dismiss); el.close(); };
  }, []);
  return <dialog ref={dialog} className={`m-auto max-h-[90vh] w-[calc(100%_-_2rem)] rounded-2xl border border-slate-200 bg-slate-50 p-0 shadow-2xl backdrop:bg-slate-950/40 ${wide ? 'max-w-3xl' : 'max-w-xl'}`} aria-label={title}>
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4"><h2 className="font-bold text-slate-900">{title}</h2><button type="button" onClick={onClose} aria-label="Tutup dialog" className={actionClass}><FaTimes /></button></div>
    <div className="p-5">{children}</div>
  </dialog>;
}

export function InlineImageUpload({ label = 'Tambahkan gambar', url, onChange }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  return <div className="space-y-2">
    <input ref={input} type="file" className="hidden" accept="image/jpeg,image/png,image/gif,image/webp" onChange={async e => {
      const el = e.target;
      const file = el.files?.[0];
      if (!file) return;
      setBusy(true);
      try { const { uploadSurveyImage } = await import('../../services/api'); const result = await uploadSurveyImage(file); onChange(result.data.data.url); }
      catch { const { default: toast } = await import('react-hot-toast'); toast.error('Gambar gagal diunggah. Maksimal 5 MB.'); }
      finally { setBusy(false); el.value = ''; }
    }} />
    <button type="button" onClick={() => input.current.click()} disabled={busy} aria-label={label} title={label} className={actionClass}><FaImage /><span>{uploadLabel(busy, url, label)}</span></button>
    {url && <div className="flex items-start gap-3"><img src={url} alt="Gambar konten" className="max-h-48 max-w-full rounded-lg object-contain" /><button type="button" onClick={() => onChange(null)} className="text-xs font-semibold text-rose-600">Hapus gambar</button></div>}
  </div>;
}
