import { useForm } from '@inertiajs/react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import Modal from '@/Components/Modal';
import RichTextEditor from '@/Components/RichTextEditor';
import { QUESTION_TYPES, defaultOptions, categoryLabel } from './helpers';

export default function QuestionForm({ question, courses, categories, initialCourseId, onClose }) {
    const form = useForm({
        course_id: question?.course_id ?? initialCourseId ?? courses[0]?.id ?? '',
        category_id: question?.category_id ?? '', title: question?.title ?? '',
        question: question?.question ?? '', type: question?.type ?? 'multiple_choice',
        points: question?.points ?? 1, status: question?.status ?? 'draft',
        tags: question?.tags ?? [], explanation: question?.explanation ?? '',
        image: null,
        options: question?.options ?? defaultOptions('multiple_choice'),
    });
    const input = 'w-full rounded-lg border-gray-200 text-sm focus:border-navy-500 focus:ring-navy-500';
    const courseCategories = categories.filter(category => String(category.course_id) === String(form.data.course_id));
    function submit(event) {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: onClose };
        if (question) {
            form.transform(data => ({ ...data, _method: 'patch' }));
            form.post(route('admin.question-bank.update', question.id), options);
        } else form.post(route('admin.question-bank.store'), options);
    }
    return (
        <Modal show onClose={onClose} maxWidth="3xl">
            <form onSubmit={submit}>
                <div className="flex items-start justify-between border-b border-gray-100 p-5">
                    <div><h2 className="text-lg font-bold text-navy-900">{question ? 'Edit soal' : 'Tambah soal ke bank'}</h2><p className="mt-1 text-xs text-gray-500">{question ? `Versi ${question.version} · perubahan disimpan sebagai versi baru.` : 'Siapkan pertanyaan, kunci jawaban, dan pembahasannya.'}</p></div>
                    <button type="button" onClick={onClose} aria-label="Tutup editor soal" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
                </div>
                <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5 sm:p-6">
                    {!!Object.keys(form.errors).length && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{Object.entries(form.errors).map(([key, value]) => <p key={key}>{value}</p>)}</div>}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="space-y-1 text-xs font-semibold text-gray-600">Kursus pemilik bank<select value={form.data.course_id} disabled={!!question} onChange={event => form.setData({ ...form.data, course_id: event.target.value, category_id: '' })} className={input} required><option value="">Pilih kursus</option>{courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
                        <label className="space-y-1 text-xs font-semibold text-gray-600">Kategori<select value={form.data.category_id} onChange={event => form.setData('category_id', event.target.value)} className={input}><option value="">Tanpa kategori</option>{courseCategories.map(category => <option key={category.id} value={category.id}>{categoryLabel(category, categories)}</option>)}</select></label>
                    </div>
                    <label className="block space-y-1 text-xs font-semibold text-gray-600">Nama soal (untuk pengajar)<input required maxLength={255} value={form.data.title} onChange={event => form.setData('title', event.target.value)} className={input} placeholder="Contoh: BAB 3 — Identifikasi sampel" /></label>
                    <div className="grid grid-cols-3 gap-3">
                        <label className="space-y-1 text-xs font-semibold text-gray-600">Jenis soal<select value={form.data.type} onChange={event => form.setData({ ...form.data, type: event.target.value, options: defaultOptions(event.target.value) })} className={input}>{Object.entries(QUESTION_TYPES).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>
                        <label className="space-y-1 text-xs font-semibold text-gray-600">Poin maksimal<input required type="number" min="1" max="1000" value={form.data.points} onChange={event => form.setData('points', event.target.value)} className={input} /></label>
                        <label className="space-y-1 text-xs font-semibold text-gray-600">Status<select value={form.data.status} onChange={event => form.setData('status', event.target.value)} className={input}><option value="draft">Draft</option><option value="ready">Ready</option></select></label>
                    </div>
                    <div><p className="mb-2 text-xs font-semibold text-gray-600">Teks pertanyaan</p><RichTextEditor content={form.data.question} onChange={html => form.setData('question', html)} /><p className="mt-1 text-[11px] text-gray-400">Format teks dipertahankan. Gambar terpisah dari soal kuis tetap ikut saat disalin ke bank.</p></div>
                    <div className="space-y-2">
                        <label className="block space-y-1 text-xs font-semibold text-gray-600">Gambar pendukung (opsional, maks. 5 MB)<input type="file" accept="image/*" onChange={event => form.setData('image', event.target.files[0] ?? null)} className="block w-full rounded-lg border border-gray-200 p-2 text-xs" /></label>
                        {question?.image_path && !form.data.image && <img src={`/storage/${question.image_path}`} alt="Gambar soal saat ini" className="max-h-36 max-w-full rounded-lg border" />}
                    </div>
                    {!!form.data.options.length && <fieldset className="space-y-3"><legend className="mb-2 text-sm font-bold text-gray-700">Pilihan jawaban · pilih satu kunci benar</legend>
                        {form.data.options.map((option, index) => <div className="flex items-center gap-3" key={index}>
                            <input type="radio" name="correct-option" aria-label={`Opsi ${index + 1} benar`} checked={option.is_correct} onChange={() => form.setData('options', form.data.options.map((item, i) => ({ ...item, is_correct: i === index })))} className="text-navy-600 focus:ring-navy-500" />
                            <input required aria-label={`Teks opsi ${index + 1}`} value={option.option_text} disabled={form.data.type === 'true_false'} onChange={event => form.setData('options', form.data.options.map((item, i) => i === index ? { ...item, option_text: event.target.value } : item))} className={input} />
                            {form.data.type === 'multiple_choice' && form.data.options.length > 2 && <button type="button" aria-label={`Hapus opsi ${index + 1}`} onClick={() => form.setData('options', form.data.options.filter((_, i) => i !== index))} className="text-red-400"><Trash2 className="h-4 w-4" /></button>}
                        </div>)}
                        {form.data.type === 'multiple_choice' && form.data.options.length < 8 && <button type="button" onClick={() => form.setData('options', [...form.data.options, { option_text: '', is_correct: false }])} className="inline-flex items-center gap-1 text-xs font-semibold text-navy-600"><Plus className="h-4 w-4" /> Tambah pilihan</button>}
                    </fieldset>}
                    {['essay', 'short_answer'].includes(form.data.type) && <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Esai dan jawaban singkat mengikuti penilaian manual yang tersedia pada aplikasi ini.</p>}
                    <label className="block space-y-1 text-xs font-semibold text-gray-600">Pembahasan / panduan koreksi<textarea rows="3" value={form.data.explanation} onChange={event => form.setData('explanation', event.target.value)} className={input} maxLength={10000} /></label>
                    <label className="block space-y-1 text-xs font-semibold text-gray-600">Tag (pisahkan dengan koma)<input value={form.data.tags.join(', ')} onChange={event => form.setData('tags', event.target.value.split(',').map(tag => tag.trim()))} onBlur={() => form.setData('tags', [...new Set(form.data.tags.filter(Boolean))])} className={input} placeholder="bab-3, peralatan, mudah" /></label>
                </div>
                <div className="flex justify-end gap-3 border-t border-gray-100 p-5"><button type="button" onClick={onClose} className="btn-secondary text-sm">Batal</button><button disabled={form.processing || !courses.length} className="btn-gold inline-flex items-center gap-2 text-sm disabled:opacity-50"><Save className="h-4 w-4" /> {form.processing ? 'Menyimpan…' : 'Simpan soal'}</button></div>
            </form>
        </Modal>
    );
}
