import { useEffect, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { X, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import Modal from '@/Components/Modal';
import RichTextEditor from '@/Components/RichTextEditor';
import { QUESTION_TYPES, defaultOptions } from './helpers';

const inputClass = 'w-full rounded-lg border-gray-200 text-sm';
function Field({ label, children }) {
    return <label className="block space-y-1.5 text-sm font-medium text-navy-800"><span>{label}</span>{children}</label>;
}

export default function PackageEditor({ item, onClose }) {
    const [packageData, setPackageData] = useState(null);
    const [error, setError] = useState('');
    useEffect(() => {
        const controller = new AbortController();
        fetch(route('admin.question-bank.packages.show', item.id), { signal: controller.signal, headers: { Accept: 'application/json' } })
            .then(response => { if (!response.ok) throw new Error('Paket gagal dimuat. Tutup editor dan coba kembali.'); return response.json(); })
            .then(setPackageData).catch(error => { if (error.name !== 'AbortError') setError(error.message); });
        return () => controller.abort();
    }, [item.id]);
    return <Modal show onClose={onClose} maxWidth="3xl">
        {packageData ? <PackageEditForm item={packageData} onClose={onClose} /> : <div className="p-6 space-y-4"><p role={error ? 'alert' : 'status'}>{error || 'Memuat editor paket…'}</p><button type="button" onClick={onClose} className="btn-secondary">Tutup</button></div>}
    </Modal>;
}

function PackageEditForm({ item, onClose }) {
    const form = useForm({
        revision: item.revision, title: item.title, description: item.description || '',
        lesson_description: item.snapshot.lesson_description || '',
        settings: { duration_minutes: '', passing_score: 70, max_attempts: 1, quiz_mode: 'custom', review_mode: 'off', shuffle_questions: false, show_correct_answers: false, ...item.snapshot.settings },
        groups: item.snapshot.groups.map(group => ({ ...group, key: String(group.key) })),
        questions: item.snapshot.questions.map((question, index) => ({ ...question, group_key: question.group_key == null ? null : String(question.group_key), source_index: index, image: null, remove_image: false, clientKey: `existing-${index}` })),
    });
    const [active, setActive] = useState(0);
    const { data } = form;
    const question = data.questions[active];
    function updateQuestion(changes) {
        form.setData('questions', data.questions.map((entry, index) => index === active ? { ...entry, ...changes } : entry));
    }
    function setting(key, value) { form.setData('settings', { ...data.settings, [key]: value }); }
    function addQuestion() {
        const type = data.settings.quiz_mode === 'custom' ? 'multiple_choice' : data.settings.quiz_mode;
        form.setData('questions', [...data.questions, { clientKey: crypto.randomUUID(), question: '', type, points: 1, explanation: '', group_key: null, source_index: null, image: null, remove_image: false, options: defaultOptions(type) }]);
        setActive(data.questions.length);
    }
    function moveQuestion(direction) {
        const next = active + direction;
        const questions = [...data.questions];
        [questions[active], questions[next]] = [questions[next], questions[active]];
        form.setData('questions', questions);
        setActive(next);
    }
    function submit(event) {
        event.preventDefault();
        form.transform(values => ({
            _method: 'patch',
            payload: JSON.stringify({ ...values, questions: values.questions.map(({ clientKey, image_url, image, ...entry }) => entry) }),
            question_images: values.questions.map(entry => entry.image),
        }));
        form.post(route('admin.question-bank.packages.update', item.id), { forceFormData: true, preserveScroll: true, onSuccess: onClose });
    }
    return <form onSubmit={submit}>
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5"><div><h2 className="text-lg font-bold text-navy-900">Edit Paket Kuis</h2><p className="mt-1 text-xs text-gray-500">Perubahan digunakan untuk impor berikutnya. Kuis yang sudah diimpor tetap memakai salinannya.</p></div><button type="button" disabled={form.processing} onClick={onClose} aria-label="Tutup editor paket"><X className="h-5 w-5 text-gray-400" /></button></div>
        <fieldset disabled={form.processing} className="max-h-[68vh] overflow-y-auto space-y-6 p-5 disabled:opacity-70">
            <section className="space-y-4">
                <Field label="Nama paket"><input required maxLength={255} className={inputClass} value={data.title} onChange={event => form.setData('title', event.target.value)} /></Field>
                <Field label="Deskripsi paket"><textarea maxLength={2000} className={inputClass} value={data.description} onChange={event => form.setData('description', event.target.value)} /></Field>
                <h3 className="font-bold text-navy-900">Pengaturan kuis</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Durasi (menit)"><input type="number" min="1" max="10080" placeholder="Tanpa batas" className={inputClass} value={data.settings.duration_minutes ?? ''} onChange={event => setting('duration_minutes', event.target.value)} /></Field>
                    <Field label="Nilai lulus (0–100)"><input required type="number" min="0" max="100" className={inputClass} value={data.settings.passing_score} onChange={event => setting('passing_score', event.target.value)} /></Field>
                    <Field label="Maksimal percobaan"><input required type="number" min="1" max="1000" className={inputClass} value={data.settings.max_attempts} onChange={event => setting('max_attempts', event.target.value)} /></Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2"><Field label="Mode soal"><select className={inputClass} value={data.settings.quiz_mode} onChange={event => setting('quiz_mode', event.target.value)}><option value="custom">Campuran</option>{Object.entries(QUESTION_TYPES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field><Field label="Mode tinjauan"><select className={inputClass} value={data.settings.review_mode} onChange={event => setting('review_mode', event.target.value)}><option value="off">Nonaktif</option><option value="review">Tinjau jawaban</option><option value="with_answers">Tinjau dengan kunci jawaban</option></select></Field></div>
                <div className="flex flex-wrap gap-4 text-sm">{[['shuffle_questions', 'Acak urutan soal'], ['show_correct_answers', 'Tampilkan jawaban benar']].map(([key, label]) => <label key={key} className="flex items-center gap-2"><input type="checkbox" checked={!!data.settings[key]} onChange={event => setting(key, event.target.checked)} />{label}</label>)}</div>
                <Field label="Instruksi kuis"><textarea className={inputClass} value={data.lesson_description} onChange={event => form.setData('lesson_description', event.target.value)} /></Field>
            </section>
            <section className="space-y-3 border-t border-gray-100 pt-5"><h3 className="font-bold text-navy-900">Kelompok soal acak</h3><p className="text-xs text-gray-500">Opsional. Tentukan jumlah soal yang diambil, lalu masukkan pertanyaan ke kelompok di bawah.</p>
                {data.groups.map((group, index) => <div key={group.key} className="flex flex-wrap items-end gap-2 rounded-lg bg-gray-50 p-3"><div className="min-w-40 flex-1"><Field label="Nama kelompok"><input required className={inputClass} value={group.label} onChange={event => form.setData('groups', data.groups.map((entry, i) => i === index ? { ...entry, label: event.target.value } : entry))} /></Field></div><div className="w-28"><Field label="Ambil soal"><input required type="number" min="1" max="500" className={inputClass} value={group.draw_count} onChange={event => form.setData('groups', data.groups.map((entry, i) => i === index ? { ...entry, draw_count: event.target.value } : entry))} /></Field></div><span className="pb-3 text-xs text-gray-500">dari {data.questions.filter(entry => entry.group_key === group.key).length} soal</span><button type="button" aria-label={`Hapus kelompok ${group.label}`} className="btn-secondary p-2.5" onClick={() => form.setData({ ...data, groups: data.groups.filter(entry => entry.key !== group.key), questions: data.questions.map(entry => entry.group_key === group.key ? { ...entry, group_key: null } : entry) })}><Trash2 className="h-4 w-4" /></button></div>)}
                <button type="button" disabled={data.groups.length >= 100} className="btn-secondary text-xs" onClick={() => form.setData('groups', [...data.groups, { key: crypto.randomUUID(), label: `Kelompok ${data.groups.length + 1}`, draw_count: 1 }])}>Tambah kelompok</button>
            </section>
            <section className="space-y-4 border-t border-gray-100 pt-5">
                <div className="flex items-center justify-between gap-3"><h3 className="font-bold text-navy-900">Pertanyaan ({data.questions.length})</h3><button type="button" disabled={data.questions.length >= 500} onClick={addQuestion} className="btn-secondary inline-flex items-center gap-1 text-xs"><Plus className="h-4 w-4" />Tambah soal</button></div>
                <Field label="Pilih pertanyaan untuk diedit"><select className={inputClass} value={active} onChange={event => setActive(Number(event.target.value))}>{data.questions.map((entry, index) => <option key={entry.clientKey} value={index}>Soal {index + 1} · {QUESTION_TYPES[entry.type]} · {entry.points} poin</option>)}</select></Field>
                <div className="flex items-center justify-between"><p className="text-sm font-bold text-navy-700">Soal {active + 1}</p><div className="flex gap-2"><button type="button" aria-label="Pindahkan soal ke atas" disabled={active === 0} className="btn-secondary p-2 disabled:opacity-30" onClick={() => moveQuestion(-1)}><ArrowUp className="h-4 w-4" /></button><button type="button" aria-label="Pindahkan soal ke bawah" disabled={active === data.questions.length - 1} className="btn-secondary p-2 disabled:opacity-30" onClick={() => moveQuestion(1)}><ArrowDown className="h-4 w-4" /></button><button type="button" disabled={data.questions.length === 1} className="btn-secondary text-xs disabled:opacity-30" onClick={() => { form.setData('questions', data.questions.filter((_, index) => index !== active)); setActive(Math.max(0, active - 1)); }}>Hapus soal</button></div></div>
                <div className="grid gap-4 sm:grid-cols-3"><Field label="Tipe pertanyaan"><select className={inputClass} value={question.type} onChange={event => updateQuestion({ type: event.target.value, options: defaultOptions(event.target.value) })}>{Object.entries(QUESTION_TYPES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field><Field label="Poin pertanyaan"><input required type="number" min="1" max="1000" className={inputClass} value={question.points} onChange={event => updateQuestion({ points: event.target.value })} /></Field><Field label="Kelompok"><select className={inputClass} value={question.group_key ?? ''} onChange={event => updateQuestion({ group_key: event.target.value || null })}><option value="">Soal tetap</option>{data.groups.map(group => <option key={group.key} value={group.key}>{group.label}</option>)}</select></Field></div>
                <div><p className="mb-2 text-sm font-medium text-navy-800">Teks pertanyaan</p><RichTextEditor key={question.clientKey} content={question.question} onChange={value => updateQuestion({ question: value })} /></div>
                <Field label="Gambar soal (maks. 5 MB)"><input key={question.clientKey} type="file" accept="image/*" className="block w-full text-sm text-gray-500" onChange={event => updateQuestion({ image: event.target.files[0] || null })} /></Field>
                {question.image && <p className="text-xs text-navy-600">Gambar pengganti: {question.image.name}</p>}
                {question.image_url && <div className="space-y-2"><img src={question.image_url} alt="Gambar pertanyaan tersimpan" className="max-h-40 rounded-lg" /><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={question.remove_image} onChange={event => updateQuestion({ remove_image: event.target.checked })} />Hapus gambar tersimpan</label></div>}
                {['multiple_choice', 'true_false'].includes(question.type) && <div className="space-y-3"><p className="text-sm font-medium text-navy-800">Pilihan jawaban · pilih satu kunci benar</p>{question.options.map((option, index) => <div key={index} className="flex items-center gap-2"><input type="radio" name="correct-option" aria-label={`Kunci jawaban ${String.fromCharCode(65 + index)}`} checked={!!option.is_correct} onChange={() => updateQuestion({ options: question.options.map((entry, i) => ({ ...entry, is_correct: i === index })) })} /><input required aria-label={`Pilihan ${String.fromCharCode(65 + index)}`} readOnly={question.type === 'true_false'} className={inputClass} value={option.option_text} onChange={event => updateQuestion({ options: question.options.map((entry, i) => i === index ? { ...entry, option_text: event.target.value } : entry) })} />{question.type === 'multiple_choice' && <button type="button" disabled={question.options.length <= 2} aria-label={`Hapus pilihan ${String.fromCharCode(65 + index)}`} className="p-2 text-gray-400 disabled:opacity-30" onClick={() => updateQuestion({ options: question.options.filter((_, i) => i !== index) })}><Trash2 className="h-4 w-4" /></button>}</div>)}{question.type === 'multiple_choice' && <button type="button" disabled={question.options.length >= 8} className="btn-secondary text-xs" onClick={() => updateQuestion({ options: [...question.options, { option_text: '', is_correct: false }] })}>Tambah pilihan</button>}</div>}
                <Field label="Pembahasan / panduan penilaian"><textarea className={inputClass} value={question.explanation || ''} onChange={event => updateQuestion({ explanation: event.target.value })} /></Field>
            </section>
        </fieldset>
        <div className="border-t border-gray-100 p-5 space-y-3">
            {Object.keys(form.errors).length > 0 && <div role="alert" className="max-h-32 overflow-auto rounded-lg bg-red-50 p-3 text-sm text-red-700">{Object.entries(form.errors).map(([key, message]) => <p key={key}>{key.startsWith('questions.') ? `Soal ${Number(key.split('.')[1]) + 1}: ` : ''}{message}</p>)}</div>}
            <div className="flex justify-end gap-2"><button type="button" disabled={form.processing} onClick={onClose} className="btn-secondary text-sm">Batal</button><button disabled={form.processing} className="btn-gold text-sm">{form.processing ? 'Menyimpan…' : 'Simpan Perubahan Paket'}</button></div>
        </div>
    </form>;
}
