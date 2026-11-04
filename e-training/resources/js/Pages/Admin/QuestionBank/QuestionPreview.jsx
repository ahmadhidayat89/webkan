import { useEffect, useState } from 'react';
import Modal from '@/Components/Modal';
import { X, CheckCircle2, Clock3 } from 'lucide-react';
import { QUESTION_TYPES } from './helpers';

export default function QuestionPreview({ question, history = false, onClose }) {
    const [versions, setVersions] = useState([]);
    const [selected, setSelected] = useState(null);
    const [error, setError] = useState('');
    useEffect(() => {
        if (!history) return;
        const controller = new AbortController();
        fetch(route('admin.question-bank.history', question.id), { signal: controller.signal, headers: { Accept: 'application/json' } })
            .then(response => { if (!response.ok) throw new Error('Riwayat gagal dimuat.'); return response.json(); })
            .then(setVersions).catch(error => { if (error.name !== 'AbortError') setError(error.message); });
        return () => controller.abort();
    }, [question.id, history]);
    const shown = selected?.snapshot ?? question;
    return <Modal show onClose={onClose} maxWidth="2xl">
        <div className="flex items-start justify-between border-b border-gray-100 p-5"><div><h2 className="text-lg font-bold text-navy-900">{history ? 'Riwayat versi soal' : 'Preview soal'}</h2><p className="mt-1 text-xs text-gray-500">{QUESTION_TYPES[shown.type]} · {shown.points} poin · Versi {selected?.version ?? question.version}</p></div><button type="button" onClick={onClose} aria-label="Tutup preview" className="p-2 text-gray-400"><X className="h-5 w-5" /></button></div>
        <div className="max-h-[75vh] space-y-5 overflow-y-auto p-6">
            {history && <div className="flex flex-wrap gap-2">{versions.map(version => <button type="button" key={version.version} onClick={() => setSelected(version)} className={`rounded-lg border px-3 py-2 text-xs ${selected?.version === version.version ? 'border-navy-300 bg-navy-50 text-navy-700' : 'border-gray-200 text-gray-500'}`}><Clock3 className="mr-1 inline h-3 w-3" />v{version.version} · {new Date(version.created_at).toLocaleDateString('id-ID')}</button>)}{!versions.length && !error && <p className="text-xs text-gray-400">Memuat riwayat…</p>}</div>}
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <h3 className="font-bold text-gray-900">{shown.title}</h3>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: shown.question }} />
            {shown.image_path && <img src={`/storage/${shown.image_path}`} alt="Gambar soal" className="max-h-64 max-w-full rounded-lg border object-contain" />}
            <div className="space-y-2">{shown.options?.map((option, index) => <div key={index} className={`flex items-center gap-3 rounded-lg border p-3 text-sm ${option.is_correct ? 'border-green-200 bg-green-50 text-green-800' : 'border-gray-200 text-gray-600'}`}><span>{String.fromCodePoint(65 + index)}.</span><span>{option.option_text}</span>{option.is_correct && <CheckCircle2 className="ml-auto h-4 w-4 shrink-0" />}</div>)}</div>
            {shown.explanation && <div className="rounded-lg bg-gray-50 p-4"><p className="mb-1 text-xs font-bold text-gray-600">Pembahasan / panduan koreksi</p><p className="whitespace-pre-wrap text-sm text-gray-600">{shown.explanation}</p></div>}
            <p className="text-xs text-gray-400">Salinan pada kuis tidak berubah ketika versi bank diperbarui.</p>
        </div>
    </Modal>;
}
