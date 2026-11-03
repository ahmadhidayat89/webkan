import { Search } from 'lucide-react';
import { formatDuration, getAttemptStatus, questionResult, statusLabels } from './quizReport.mjs';

const statusClasses = {
    passed: 'bg-green-50 text-green-700',
    failed: 'bg-red-50 text-red-700',
    pending: 'bg-amber-50 text-amber-700',
    in_progress: 'bg-navy-50 text-navy-700',
};

function QuestionScore({ answer, question }) {
    const result = questionResult(answer, question);
    const colors = {
        correct: 'text-green-700 bg-green-50',
        incorrect: 'text-red-600 bg-red-50',
        pending: 'text-amber-700 bg-amber-50',
        missing: 'text-gray-400 bg-gray-50',
    };
    return (
        <span title={result.label} className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${colors[result.state]}`}>
            <span aria-hidden="true">{({ correct: '✓', incorrect: '×', pending: '◷', missing: '—' })[result.state]}</span>
            {result.points === null
                ? result.state === 'pending' ? 'Koreksi' : <span className="sr-only">Belum dijawab</span>
                : result.label}
        </span>
    );
}

export default function QuizResultsTable({ attempts, totalAttempts, questions, quizTitle, search, onSearch, status, onStatus, onSelect }) {
    return (
        <section className="card overflow-hidden" aria-labelledby="results-title">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 p-5">
                <div>
                    <h3 id="results-title" className="font-bold text-gray-900">Hasil pengerjaan peserta</h3>
                    <p className="mt-1 text-xs text-gray-500">{attempts.length} dari {totalAttempts} pengerjaan · {questions.length} soal</p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input aria-label="Cari nama atau email peserta" placeholder="Cari nama atau email…" value={search} onChange={event => onSearch(event.target.value)} className="w-full rounded-lg border-gray-200 py-2 pl-9 text-xs sm:w-56" />
                    </div>
                    <select aria-label="Filter status hasil" value={status} onChange={event => onStatus(event.target.value)} className="rounded-lg border-gray-200 py-2 text-xs">
                        <option value="all">Semua status</option>
                        {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                </div>
            </div>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Tabel hasil kuis, geser untuk melihat semua soal">
                <table className="w-full whitespace-nowrap text-left text-xs">
                    <caption className="sr-only">Hasil kuis {quizTitle}. Nilai tiap soal ditampilkan dalam poin.</caption>
                    <thead className="border-b border-gray-200 bg-gray-50 text-gray-500">
                        <tr>
                            {['Peserta', 'Status', 'Mulai', 'Selesai', 'Durasi', 'Nilai /100'].map(label => <th scope="col" key={label} className="px-5 py-4 font-semibold">{label}</th>)}
                            {questions.map((question, index) => <th scope="col" key={question.id} className="px-4 py-4 text-center font-semibold">
                                S{index + 1}<span className="mt-1 block text-[10px] font-normal">/{question.points} poin</span>
                            </th>)}
                            <th scope="col" className="px-5 py-4 font-semibold">Detail</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {attempts.map(attempt => <tr key={attempt.id} className="hover:bg-gray-50/70">
                            <th scope="row" className="px-5 py-4 font-normal">
                                <button type="button" onClick={() => onSelect(attempt.id)} className="text-left font-semibold text-navy-700 hover:underline">{attempt.user_name}</button>
                                <p className="mt-1 text-[11px] text-gray-400">{attempt.user_email}</p>
                            </th>
                            <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusClasses[getAttemptStatus(attempt)]}`}>{statusLabels[getAttemptStatus(attempt)]}</span></td>
                            <td className="px-5 py-4 text-gray-500">{attempt.started_at ?? '—'}</td>
                            <td className="px-5 py-4 text-gray-500">{attempt.finished_at ?? '—'}</td>
                            <td className="px-5 py-4 text-gray-500">{formatDuration(attempt.duration_seconds)}</td>
                            <td className="px-5 py-4 font-bold text-navy-900">
                                {attempt.finished_at ? attempt.score : '—'}
                                {getAttemptStatus(attempt) === 'pending' && <span className="mt-1 block text-[10px] font-normal text-amber-600">Sementara</span>}
                            </td>
                            {questions.map(question => <td key={question.id} className="px-4 py-4 text-center"><QuestionScore question={question} answer={attempt.answers.find(answer => answer.question_id === question.id)} /></td>)}
                            <td className="px-5 py-4"><button type="button" onClick={() => onSelect(attempt.id)} className="font-semibold text-navy-600 hover:underline" aria-label={`Lihat jawaban ${attempt.user_name}`}>Lihat jawaban</button></td>
                        </tr>)}
                    </tbody>
                </table>
                {!attempts.length && <p className="p-12 text-center text-sm text-gray-500">{totalAttempts ? 'Tidak ada hasil yang sesuai pencarian atau filter.' : 'Belum ada peserta yang mengerjakan kuis ini.'}</p>}
            </div>
            <div className="flex flex-wrap justify-between gap-2 border-t border-gray-100 px-5 py-3 text-[11px] text-gray-400">
                <span>Nilai soal dalam poin · Nilai akhir dalam skala 100</span>
                <span>Ekspor dan diagram mengikuti pencarian serta filter.</span>
            </div>
        </section>
    );
}
