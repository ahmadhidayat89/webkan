import { useEffect, useRef, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Combobox, ComboboxInput, ComboboxButton, ComboboxOptions, ComboboxOption } from '@headlessui/react';
import { PackageOpen, X, ChevronDown, Check } from 'lucide-react';
import Modal from '@/Components/Modal';

export default function ImportQuizPackage({ module = null, preset = null, onClose }) {
    const dropdownButton = useRef(null);
    const [data, setData] = useState(null);
    const [chosenPackage, setChosenPackage] = useState(preset);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [courseId, setCourseId] = useState('');
    const form = useForm({ package_id: preset?.id ?? '', module_id: module?.id ?? '', title: preset?.title ?? '' });
    useEffect(() => {
        const controller = new AbortController();
        setLoading(true); setError('');
        const timer = setTimeout(() => {
            fetch(route('admin.question-bank.packages.index', { search: search.trim(), page, archived: 0 }), { signal: controller.signal, headers: { Accept: 'application/json' } })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Paket kuis gagal dimuat.');
                    }
                    return response.json();
                })
                .then(result => { if (!controller.signal.aborted) setData(result); })
                .catch(error => { if (error.name !== 'AbortError') setError(error.message); })
                .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        }, search ? 250 : 0);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [search, page]);
    const available = data?.packages.data ?? [];
    const selected = chosenPackage;
    const targetModules = data?.courses.find(course => String(course.id) === String(courseId))?.modules ?? [];
    const input = 'w-full rounded-lg border-gray-200 text-sm focus:ring-navy-500 focus:border-navy-500';
    function submit(event) {
        event.preventDefault();
        form.post(route('admin.question-bank.packages.import', form.data.package_id), { preserveScroll: true, onSuccess: onClose });
    }
    return <Modal show onClose={onClose} maxWidth="xl"><form onSubmit={submit}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100"><h2 className="flex items-center gap-2 font-bold text-navy-900"><PackageOpen className="w-5 h-5" /> Impor Paket Kuis</h2><button type="button" onClick={onClose} aria-label="Tutup impor paket" className="text-gray-400"><X className="w-5 h-5" /></button></div>
        <div className="max-h-[70vh] overflow-y-auto p-5 space-y-4">
            <div className="space-y-1">
                <label htmlFor="import-package-picker" className="block text-xs font-semibold text-gray-600">Paket kuis</label>
                {preset ? <input id="import-package-picker" readOnly value={`${preset.title} · ${preset.effective_questions_count} soal`} className={`${input} bg-gray-50`} /> : <Combobox immediate value={chosenPackage} by="id" onChange={chosen => {
                    if (!chosen) return;
                    setChosenPackage(chosen);
                    form.setData({ ...form.data, package_id: chosen.id, title: chosen.title });
                }} onClose={() => { setSearch(''); setPage(1); }}>
                    <div className="relative">
                        <ComboboxInput id="import-package-picker" aria-label="Paket kuis" onClick={event => {
                            if (event.currentTarget.getAttribute('aria-expanded') !== 'true') dropdownButton.current?.click();
                        }} autoComplete="off" maxLength={200} placeholder="Pilih atau cari paket kuis…" displayValue={item => item?.title ?? ''} onChange={event => { setSearch(event.target.value); setPage(1); }} className={`${input} pr-10`} />
                        <ComboboxButton ref={dropdownButton} aria-label="Buka daftar paket kuis" className="absolute top-0 right-0 h-10 px-3 text-gray-400"><ChevronDown className="w-4 h-4" /></ComboboxButton>
                        <ComboboxOptions className="p-1 mt-1 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 focus:outline-none">
                            {loading && <output className="block p-3 text-xs text-gray-500">Mencari paket…</output>}
                            {!loading && error && <p role="alert" className="p-3 text-xs text-red-600">{error}</p>}
                            {!loading && !error && <>
                                {available.length === 0 && <output className="block p-3 text-sm text-gray-500">{search.trim() ? `Tidak ada paket yang cocok dengan “${search.trim()}”.` : 'Belum ada paket kuis aktif.'}</output>}
                                {available.map(item => <ComboboxOption key={item.id} value={item} className="group flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-navy-800 data-[focus]:bg-navy-50 data-[selected]:font-semibold"><Check className="h-4 w-4 shrink-0 opacity-0 group-data-[selected]:opacity-100" /><span className="min-w-0"><span className="block break-words">{item.title}</span><span className="block text-xs font-normal text-gray-400">{item.effective_questions_count} soal · {item.course?.title}</span></span></ComboboxOption>)}
                                {data?.packages.last_page > 1 && <div className="flex items-center justify-between p-2 border-t border-gray-100">{[['Sebelumnya', -1, data.packages.prev_page_url], ['Berikutnya', 1, data.packages.next_page_url]].map(([label, step, next]) => <button key={label} type="button" disabled={!next} onClick={() => setPage(page + step)} className="text-xs font-semibold text-navy-600 disabled:text-gray-300">{label}</button>)}</div>}
                            </>}
                        </ComboboxOptions>
                    </div>
                </Combobox>}
            </div>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            {selected && <p className="p-3 text-xs rounded-lg bg-navy-50 text-navy-700">{selected.questions_count} pertanyaan tersimpan · {selected.effective_questions_count} soal per pengerjaan. Pengaturan dan gambar ikut disalin.</p>}
            {!module ? <>
                <label className="block space-y-1 text-xs font-semibold text-gray-600">Kursus tujuan<select required value={courseId} onChange={event => { setCourseId(event.target.value); form.setData('module_id', ''); }} className={input}><option value="">Pilih kursus</option>{data?.courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
                <label className="block space-y-1 text-xs font-semibold text-gray-600">Modul tujuan<select required value={form.data.module_id} onChange={event => form.setData('module_id', event.target.value)} className={input}><option value="">Pilih modul</option>{targetModules.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
            </> : <p className="text-sm text-gray-600">Modul tujuan: <strong>{module.title}</strong></p>}
            <label className="block space-y-1 text-xs font-semibold text-gray-600">Judul kuis baru<input required maxLength={255} value={form.data.title} onChange={event => form.setData('title', event.target.value)} className={input} /></label>
            <p className="text-xs text-gray-400">Kuis baru ditambahkan di akhir modul. Jadwal mengikuti akses modul tujuan; tanggal kuis dapat diatur setelah impor. Hasil peserta dimulai dari kosong.</p>
            {!!Object.keys(form.errors).length && <p role="alert" className="text-sm text-red-600">{Object.values(form.errors).join(' ')}</p>}
        </div>
        <div className="flex justify-end gap-2 p-5 border-t border-gray-100"><button type="button" onClick={onClose} className="text-sm btn-secondary">Batal</button><button type="submit" disabled={loading || form.processing || (!preset && search !== '') || !form.data.package_id || !form.data.module_id} className="text-sm btn-gold disabled:opacity-50">{form.processing ? 'Membuat kuis…' : 'Impor sebagai kuis baru'}</button></div>
    </form></Modal>;
}
