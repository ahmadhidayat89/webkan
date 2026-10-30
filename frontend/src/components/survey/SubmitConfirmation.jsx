import { useEffect, useRef } from 'react';

export default function SubmitConfirmation({ onCancel, onConfirm, busy = false }) {
  const dialog = useRef(null);
  useEffect(() => {
    const el = dialog.current;
    el.showModal();
    return () => el.close();
  }, []);
  return <dialog ref={dialog} style={{ margin: 'auto' }} aria-labelledby="submit-confirm-title" aria-describedby="submit-confirm-description" onCancel={e => { e.preventDefault(); if (!busy) onCancel(); }} className="max-h-[90vh] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl backdrop:bg-slate-950/40">
    <h2 id="submit-confirm-title" className="text-lg font-bold text-slate-900">Kirim jawaban Anda?</h2>
    <p id="submit-confirm-description" className="mt-3 text-sm leading-relaxed text-slate-600">Pastikan semua jawaban sudah sesuai sebelum dikirim. Anda dapat kembali untuk memeriksanya.</p>
    <div className="mt-6 flex flex-wrap justify-end gap-3">
      <button autoFocus type="button" disabled={busy} onClick={onCancel} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 disabled:opacity-50">Periksa lagi</button>
      <button type="button" disabled={busy} onClick={onConfirm} className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Mengirimkan…' : 'Ya, kirim jawaban'}</button>
    </div>
  </dialog>;
}
