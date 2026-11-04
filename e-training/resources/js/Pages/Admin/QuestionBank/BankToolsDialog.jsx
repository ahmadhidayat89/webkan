import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import { X } from 'lucide-react';
import { categoryLabel } from './helpers';

export default function BankToolsDialog({ mode, courses, categories, initialCourseId, onClose }) {
    const form = useForm({ course_id: initialCourseId || courses[0]?.id || '', category_id: '', parent_id: '', name: '', file: null });
    const input = 'w-full rounded-lg border-gray-200 text-sm focus:border-navy-500 focus:ring-navy-500';
    let submitLabel = 'Impor soal';
    if (form.processing) submitLabel = 'Menyimpan…';
    else if (mode === 'category') submitLabel = 'Simpan kategori';
    function submit(event) {
        event.preventDefault();
        form.post(route(mode === 'category' ? 'admin.question-bank.categories.store' : 'admin.question-bank.import'), { preserveScroll: true, onSuccess: onClose });
    }
    return <Modal show onClose={onClose} maxWidth="lg"><form onSubmit={submit}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100"><h2 className="font-bold text-navy-900">{mode === 'category' ? 'Tambah kategori' : 'Impor bank soal'}</h2><button type="button" onClick={onClose} aria-label="Tutup dialog" className="text-gray-400"><X className="w-5 h-5" /></button></div>
        <div className="p-5 space-y-4">
            {!!Object.keys(form.errors).length && <div role="alert" className="p-3 text-sm text-red-700 rounded-lg bg-red-50">{Object.entries(form.errors).map(([key, error]) => <p key={key}>{error}</p>)}</div>}
            <label className="block space-y-1 text-xs font-semibold text-gray-600">Kursus<select required value={form.data.course_id} onChange={event => form.setData({ ...form.data, course_id: event.target.value, parent_id: '', category_id: '' })} className={input}><option value="">Pilih kursus</option>{courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
            <label className="block space-y-1 text-xs font-semibold text-gray-600">{mode === 'category' ? 'Kategori induk (opsional)' : 'Kategori tujuan'}<select value={mode === 'category' ? form.data.parent_id : form.data.category_id} onChange={event => form.setData(mode === 'category' ? 'parent_id' : 'category_id', event.target.value)} className={input}><option value="">Tanpa kategori induk</option>{categories.filter(category => String(category.course_id) === String(form.data.course_id)).map(category => <option key={category.id} value={category.id}>{categoryLabel(category, categories)}</option>)}</select></label>
            {mode === 'category' ? <label className="block space-y-1 text-xs font-semibold text-gray-600">Nama kategori<input required maxLength={120} value={form.data.name} onChange={event => form.setData('name', event.target.value)} className={input} placeholder="Contoh: BAB 3 — Peralatan" /></label> : <>
                <p className="text-sm text-gray-500">Unggah JSON hasil ekspor Bank Soal E-Training (maks. 5 MB, 500 soal). Soal masuk sebagai Draft untuk diperiksa. Format ini memindahkan teks, opsi, dan pembahasan; file gambar tidak disertakan.</p>
                <input aria-label="File JSON bank soal" required type="file" accept=".json,application/json" onChange={event => form.setData('file', event.target.files[0])} className="w-full p-3 text-sm border border-gray-200 rounded-lg" />
                {form.progress && <p className="text-xs text-navy-600">Mengunggah {form.progress.percentage}%</p>}
            </>}
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-gray-100"><button type="button" onClick={onClose} className="text-sm btn-secondary">Batal</button><button type="submit" disabled={form.processing || !courses.length} className="text-sm btn-gold disabled:opacity-50">{submitLabel}</button></div>
    </form></Modal>;
}
