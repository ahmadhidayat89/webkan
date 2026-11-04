import { useEffect, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Search, X, Shuffle, LibraryBig } from 'lucide-react';
import Modal from '@/Components/Modal';
import { QUESTION_TYPES, categoryLabel } from '@/Pages/Admin/QuestionBank/helpers';

export default function BankQuestionPicker({ quiz, mode, onClose }) {
    const [data, setData] = useState(null);
    const sourceType = quiz.quiz_mode === 'custom' ? '' : quiz.quiz_mode;
    const [filters, setFilters] = useState({ course_id: '', category_id: '', search: '', type: sourceType });
    const [selected, setSelected] = useState([]);
    const [preview, setPreview] = useState(null);
    const [url, setUrl] = useState(route('admin.question-bank.index', { status: 'ready', type: sourceType || undefined }));
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState('');
    const form = useForm({ label: 'Kelompok soal acak', draw_count: 5 });
    const existingIds = new Set(quiz.questions.map(question => question.bank_question_id).filter(Boolean));
    useEffect(() => {
        const controller = new AbortController();
        setLoading(true); setLoadError('');
        fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } })
            .then(response => { if (!response.ok) throw new Error('Bank soal gagal dimuat.'); return response.json(); })
            .then(setData).catch(error => { if (error.name !== 'AbortError') setLoadError(error.message); })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [url]);
    function search(event) {
        event.preventDefault();
        setUrl(route('admin.question-bank.index', Object.fromEntries(Object.entries({ ...filters, status: 'ready' }).filter(([, value]) => value !== ''))));
    }
    function submit(event) {
        event.preventDefault();
        form.transform(values => ({ ...values, mode, question_ids: selected }));
        form.post(route('admin.question-bank.quiz.add', quiz.id), { preserveScroll: true, onSuccess: onClose });
    }
    const input = 'rounded-lg border-gray-200 text-sm focus:border-navy-500 focus:ring-navy-500';
    return <Modal show onClose={onClose} maxWidth="3xl">
        <div className="flex items-start justify-between border-b border-gray-100 p-5"><div><h2 className="flex items-center gap-2 font-bold text-navy-900">{mode === 'random' ? <Shuffle className="h-5 w-5" /> : <LibraryBig className="h-5 w-5" />}{mode === 'random' ? 'Tambah kelompok soal acak' : 'Ambil dari Bank Soal'}</h2><p className="mt-1 text-xs text-gray-500">Pilih soal Ready. Salinan versi saat ini akan disimpan pada kuis.</p></div><button type="button" onClick={onClose} aria-label="Tutup pemilih bank soal" className="text-gray-400"><X className="h-5 w-5" /></button></div>
        <form onSubmit={search} className="space-y-3 border-b border-gray-100 p-5">
            <div className="flex gap-2"><input aria-label="Cari soal bank" placeholder="Cari nama atau teks soal…" value={filters.search} onChange={event => setFilters({ ...filters, search: event.target.value })} className={`${input} flex-1`} /><button type="submit" className="btn-secondary inline-flex items-center gap-1 text-sm"><Search className="h-4 w-4" /> Cari</button></div>
            <div className="grid gap-2 sm:grid-cols-3">
                <select aria-label="Kursus sumber soal" value={filters.course_id} onChange={event => setFilters({ ...filters, course_id: event.target.value, category_id: '' })} className={input}><option value="">Semua kursus yang dapat diakses</option>{data?.courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}</select>
                <select aria-label="Kategori sumber soal" value={filters.category_id} onChange={event => setFilters({ ...filters, category_id: event.target.value })} className={input}><option value="">Semua kategori</option>{data?.categories.filter(category => !filters.course_id || String(category.course_id) === String(filters.course_id)).map(category => <option key={category.id} value={category.id}>{categoryLabel(category, data.categories)}</option>)}</select>
                <select aria-label="Jenis soal sumber" value={filters.type} onChange={event => setFilters({ ...filters, type: event.target.value })} className={input}><option value="">Semua jenis</option>{Object.entries(QUESTION_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            </div>
        </form>
        <form onSubmit={submit}>
            <div className="max-h-[45vh] space-y-2 overflow-y-auto p-5">
                {loadError && <p role="alert" className="text-sm text-red-600">{loadError}</p>}
                {loading ? <p role="status" className="p-8 text-center text-sm text-gray-400">Memuat bank soal…</p> : <>
                    {data?.questions.data.map(question => <div key={question.id} className="rounded-lg border border-gray-200 p-3">
                        <div className="flex items-start gap-3"><input type="checkbox" aria-label={`Pilih soal: ${question.title}`} disabled={existingIds.has(question.id) || (!selected.includes(question.id) && selected.length >= 100)} checked={selected.includes(question.id)} onChange={event => setSelected(event.target.checked ? [...selected, question.id] : selected.filter(id => id !== question.id))} className="mt-1 rounded text-navy-600 focus:ring-navy-500" />
                            <div className="min-w-0 flex-1"><button type="button" onClick={() => setPreview(preview === question.id ? null : question.id)} className="text-left text-sm font-semibold text-navy-800 hover:underline">{question.title}</button><p className="mt-1 text-xs text-gray-400">{QUESTION_TYPES[question.type]} · {question.points} poin · v{question.version}{existingIds.has(question.id) ? ' · Sudah ada di kuis' : ''}</p></div>
                        </div>
                        {preview === question.id && <div className="prose prose-sm mt-3 max-w-none border-t border-gray-100 pt-3" dangerouslySetInnerHTML={{ __html: question.question }} />}
                    </div>)}
                    {!data?.questions.data.length && <p className="p-8 text-center text-sm text-gray-400">Belum ada soal Ready yang sesuai. Buat atau ubah status soal di Bank Soal terlebih dahulu.</p>}
                    <div className="flex justify-between pt-2">{[['Sebelumnya', data?.questions.prev_page_url], ['Berikutnya', data?.questions.next_page_url]].map(([label, next]) => <button type="button" key={label} disabled={!next} onClick={() => setUrl(next)} className="text-xs font-semibold text-navy-600 disabled:text-gray-300">{label}</button>)}</div>
                </>}
            </div>
            {mode === 'random' && <div className="grid gap-3 border-t border-gray-100 bg-navy-50/40 p-5 sm:grid-cols-2">
                <label className="space-y-1 text-xs font-semibold text-gray-600">Nama kelompok<input required maxLength={120} value={form.data.label} onChange={event => form.setData('label', event.target.value)} className={`${input} w-full`} /></label>
                <label className="space-y-1 text-xs font-semibold text-gray-600">Jumlah soal diambil per pengerjaan<input required type="number" min="1" max={Math.max(1, selected.length)} value={form.data.draw_count} onChange={event => form.setData('draw_count', event.target.value)} className={`${input} w-full`} /></label>
                <p className="text-xs text-gray-500 sm:col-span-2">Paket dipilih di server saat peserta mulai, lalu tetap sama saat halaman dimuat ulang. Setiap percobaan baru mengambil paket lagi.</p>
            </div>}
            {!!Object.keys(form.errors).length && <div role="alert" className="px-5 pb-3 text-xs text-red-600">{Object.values(form.errors).join(' ')}</div>}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 p-5"><p className="text-xs text-gray-500">{selected.length} soal dipilih</p><button type="submit" disabled={!selected.length || form.processing} className="btn-gold text-sm disabled:opacity-50">{form.processing ? 'Menambahkan…' : mode === 'random' ? 'Tambahkan kelompok acak' : 'Tambahkan ke kuis'}</button></div>
        </form>
    </Modal>;
}
