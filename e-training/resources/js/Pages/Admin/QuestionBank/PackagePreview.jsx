import { useEffect, useState } from 'react';
import Modal from '@/Components/Modal';
import { X } from 'lucide-react';
import { QUESTION_TYPES } from './helpers';

const withIds = result => ({
    ...result,
    snapshot: {
        ...result.snapshot,
        questions: result.snapshot.questions.map(question => ({
            ...question,
            uid: crypto.randomUUID(),
            options: question.options.map(option => ({ ...option, uid: crypto.randomUUID() })),
        })),
    },
});

export default function PackagePreview({ item, onClose }) {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    useEffect(() => {
        const controller = new AbortController();
        fetch(route('admin.question-bank.packages.show', item.id), { signal: controller.signal, headers: { Accept: 'application/json' } })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Preview gagal dimuat.');
                }
                return response.json();
            })
            .then(result => setData(withIds(result)))
            .catch(error => { if (error.name !== 'AbortError') setError(error.message); });
        return () => controller.abort();
    }, [item.id]);
    return <Modal show onClose={onClose} maxWidth="3xl">
        <div className="flex items-start justify-between p-5 border-b border-gray-100"><div><h2 className="font-bold text-navy-900">{item.title}</h2><p className="mt-1 text-xs text-gray-500">{item.questions_count} pertanyaan tersimpan · {item.effective_questions_count} soal per pengerjaan</p></div><button type="button" onClick={onClose} aria-label="Tutup preview paket" className="text-gray-400"><X className="w-5 h-5" /></button></div>
        <div className="max-h-[70vh] overflow-y-auto p-5 space-y-4">
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            {!data && !error && <p className="text-sm text-gray-400">Memuat isi paket…</p>}
            {data && <>
                <div className="flex flex-wrap gap-3 p-3 text-xs rounded-lg bg-navy-50 text-navy-700"><span>Durasi: {data.snapshot.settings.duration_minutes ? `${data.snapshot.settings.duration_minutes} menit` : 'Tanpa batas'}</span><span>Nilai lulus: {data.snapshot.settings.passing_score}</span><span>Maks. percobaan: {data.snapshot.settings.max_attempts}</span></div>
                {data.snapshot.groups.map(group => <p key={group.key} className="text-xs text-gray-500">Kelompok acak: {group.label} · ambil {group.draw_count} soal</p>)}
                {data.snapshot.questions.map((question, index) => <article key={question.uid} className="p-4 space-y-3 border border-gray-200 rounded-xl">
                    <p className="text-xs font-semibold text-navy-600">Soal {index + 1} · {QUESTION_TYPES[question.type]} · {question.points} poin{question.group_key !== null ? ' · Kelompok acak' : ''}</p>
                    <div className="prose-sm prose max-w-none" dangerouslySetInnerHTML={{ __html: question.question }} />
                    {question.image_url && <img src={question.image_url} alt={`Gambar soal ${index + 1}`} className="max-w-full border rounded-lg max-h-48" />}
                    <ul className="space-y-1 text-sm">{question.options.map((option, position) => <li key={option.uid} className={option.is_correct ? 'font-semibold text-green-700' : 'text-gray-500'}>{String.fromCodePoint(65 + position)}. {option.option_text}{option.is_correct ? ' ✓' : ''}</li>)}</ul>
                    {question.explanation && <p className="text-xs text-gray-500">Pembahasan: {question.explanation}</p>}
                </article>)}
            </>}
        </div>
    </Modal>;
}
