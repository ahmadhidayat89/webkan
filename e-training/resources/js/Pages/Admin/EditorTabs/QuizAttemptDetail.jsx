import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { getAttemptStatus, isManualQuestion, statusLabels } from './quizReport.mjs';

function ManualGradeForm({ answer, onSave }) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    async function submit(event) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setSaving(true);
        setError('');
        try { await onSave(answer.id, data.get('score'), data.get('feedback')); }
        catch (error_) { setError(error_ instanceof Error ? error_.message : String(error_)); }
        finally { setSaving(false); }
    }
    return <form onSubmit={submit} className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-xs font-bold uppercase text-amber-800">Koreksi manual</p>
        <div className="flex flex-col gap-4 sm:flex-row">
            <div><label htmlFor={`score-${answer.id}`} className="mb-1 block text-xs font-medium text-amber-900">Nilai (0–100)</label><input id={`score-${answer.id}`} name="score" type="number" required min="0" max="100" step="1" defaultValue={answer.manual_score ?? ''} className="w-24 rounded border-amber-300 text-sm focus:border-amber-500 focus:ring-amber-500" /></div>
            <div className="flex-1"><label htmlFor={`feedback-${answer.id}`} className="mb-1 block text-xs font-medium text-amber-900">Komentar (opsional)</label><textarea id={`feedback-${answer.id}`} name="feedback" rows="2" maxLength={1000} defaultValue={answer.admin_feedback ?? ''} className="w-full rounded border-amber-300 text-sm focus:border-amber-500 focus:ring-amber-500" /></div>
        </div>
        {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
        <div className="text-right"><button type="submit" disabled={saving} className="btn-gold px-3 py-1.5 text-xs disabled:opacity-50">{saving ? 'Menyimpan…' : 'Simpan nilai'}</button></div>
    </form>;
}

export default function QuizAttemptDetail({ attempt, questions, onSave }) {
    const orderedAnswers = [...attempt.answers].sort((a, b) => questions.findIndex(q => q.id === a.question_id) - questions.findIndex(q => q.id === b.question_id));
    return <div className="card overflow-hidden">
        <div className="flex items-center justify-between gap-4 bg-navy-900 p-5 text-white">
            <div><h3 className="text-lg font-bold">{attempt.user_name}</h3><p className="text-sm text-navy-200">{attempt.user_email}</p></div>
            <div className="text-right"><p className="text-3xl font-bold">{attempt.finished_at ? `${attempt.score}%` : '—'}</p><p className="text-xs text-navy-200">{statusLabels[getAttemptStatus(attempt)]}</p></div>
        </div>
        <div className="space-y-5 bg-gray-50/50 p-4 sm:p-6">
            <h4 className="font-bold text-gray-900">Detail jawaban</h4>
            {orderedAnswers.length === 0 && <p className="text-sm text-gray-500">Belum ada jawaban tersimpan.</p>}
            {orderedAnswers.map(answer => <article key={answer.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="mb-3 text-xs font-semibold text-navy-600">Soal {questions.findIndex(question => question.id === answer.question_id) + 1}</p>
                <div className="prose prose-sm mb-3 max-w-none text-gray-900" dangerouslySetInnerHTML={{ __html: answer.question_text }} />
                {answer.question_image && <img src={answer.question_image} alt="Gambar soal" className="mb-3 max-h-72 max-w-full rounded-lg border object-contain" />}
                {isManualQuestion(answer.question_type) ? <div className="space-y-3">
                    <div className="rounded-lg border border-navy-100 bg-navy-50/50 p-3"><p className="mb-1 text-xs font-semibold text-navy-700">Jawaban peserta</p><p className="whitespace-pre-wrap text-sm text-gray-800">{answer.essay_answer || '(Kosong)'}</p></div>
                    {attempt.finished_at && <ManualGradeForm answer={answer} onSave={onSave} />}
                </div> : <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
                    {answer.is_correct ? <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" /> : <XCircle className="h-5 w-5 shrink-0 text-red-500" />}
                    <p className={`text-sm ${answer.is_correct ? 'text-green-700' : 'text-red-700'}`}>Jawaban: {answer.selected_option || '(Tidak dijawab)'}</p>
                </div>}
            </article>)}
        </div>
    </div>;
}
