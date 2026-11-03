import { useEffect, useMemo, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { ArrowLeft, Download, FileQuestion } from 'lucide-react';
import QuizAttemptDetail from './QuizAttemptDetail';
import QuizGradeDistribution from './QuizGradeDistribution';
import QuizResultsTable from './QuizResultsTable';
import { createReportCsv, getAttemptStatus } from './quizReport.mjs';

async function fetchAttempts(quizId, signal) {
    const response = await fetch(route('admin.grading.attempts', quizId), { signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Gagal memuat hasil kuis. Silakan coba lagi.');
    return response.json();
}
export default function TabGrading({ modules, initialQuizId = null, initialAttemptId = null }) {
    const quizzes = useMemo(() => modules.flatMap(module => module.lessons.filter(lesson => lesson.type === 'quiz' && lesson.quiz).map(lesson => ({ ...lesson.quiz, title: `${module.title} - ${lesson.title}` }))), [modules]);
    const [selectedQuizId, setSelectedQuizId] = useState(() => quizzes.some(quiz => String(quiz.id) === String(initialQuizId)) ? String(initialQuizId) : '');
    const detailRef = useRef(null);
    const activeQuizRef = useRef(selectedQuizId);
    activeQuizRef.current = selectedQuizId;
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [selectedAttemptId, setSelectedAttemptId] = useState(null);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [reload, setReload] = useState(0);
    const selectedQuiz = quizzes.find(quiz => String(quiz.id) === selectedQuizId);
    const questions = selectedQuiz?.questions ?? [];
    const selectedAttempt = attempts.find(attempt => attempt.id === selectedAttemptId);
    useEffect(() => {
        if (initialQuizId && quizzes.some(quiz => String(quiz.id) === String(initialQuizId))) {
            setSelectedQuizId(String(initialQuizId));
        }
    }, [initialQuizId, quizzes]);
    useEffect(() => {
        if (selectedAttemptId !== null) detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [selectedAttemptId]);

    useEffect(() => {
        const controller = new AbortController();
        setAttempts([]); setSelectedAttemptId(null); setLoadError(null); setSearch(''); setStatus('all');
        if (!selectedQuizId) { setLoading(false); return; }
        setLoading(true);
        fetchAttempts(selectedQuizId, controller.signal).then(data => {
            setAttempts(data);
            setSelectedAttemptId(data.find(attempt => String(attempt.id) === String(initialAttemptId))?.id ?? null);
        }).catch(error => { if (error.name !== 'AbortError') setLoadError(error.message); })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [selectedQuizId, initialAttemptId, reload]);
    const filteredAttempts = useMemo(() => attempts.filter(attempt => `${attempt.user_name} ${attempt.user_email}`.toLocaleLowerCase('id-ID').includes(search.trim().toLocaleLowerCase('id-ID')) && (status === 'all' || getAttemptStatus(attempt) === status)), [attempts, search, status]);
    const graded = filteredAttempts.filter(attempt => ['passed', 'failed'].includes(getAttemptStatus(attempt)));
    const average = graded.length ? (graded.reduce((sum, attempt) => sum + Number(attempt.score), 0) / graded.length).toLocaleString('id-ID', { maximumFractionDigits: 1 }) : '—';
    const stats = [['Total pengerjaan', filteredAttempts.length], ['Rata-rata nilai', average], ['Lulus', graded.filter(attempt => attempt.is_passed).length], ['Menunggu koreksi', filteredAttempts.filter(attempt => getAttemptStatus(attempt) === 'pending').length]];
    function exportResults() {
        const url = URL.createObjectURL(new Blob([createReportCsv(filteredAttempts, questions)], { type: 'text/csv;charset=utf-8;' }));
        const link = document.createElement('a'); link.href = url; link.download = `hasil-kuis-${selectedQuizId}.csv`; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    function saveManualScore(answerId, score, feedback) {
        const quizId = selectedQuizId;
        return new Promise((resolve, reject) => router.patch(route('admin.grading.essay', answerId), { manual_score: score, admin_feedback: feedback }, { preserveScroll: true,
            onSuccess: async () => {
                try {
                    const updated = await fetchAttempts(quizId);
                    if (activeQuizRef.current === quizId) setAttempts(updated);
                }
                catch {
                    if (activeQuizRef.current === quizId) setLoadError('Nilai tersimpan, tetapi data gagal diperbarui. Muat ulang laporan.');
                }
                resolve();
            },
            onError: errors => reject(new Error(Object.values(errors).join(' '))),
            onCancel: () => reject(new Error('Penyimpanan dibatalkan. Silakan coba lagi.')),
        }));
    }
    let reportBody = null;
    if (!selectedQuizId) {
        reportBody = (
            <div className="card flex min-h-[280px] flex-col items-center justify-center p-8 text-center">
                <FileQuestion className="mb-4 h-12 w-12 text-navy-200" />
                <h3 className="font-bold text-gray-700">Pilih kuis untuk melihat laporan</h3>
                <p className="mt-2 text-sm text-gray-500">{quizzes.length ? 'Hasil pengerjaan dan distribusi nilai akan tampil di sini.' : 'Belum ada kuis pada kursus ini.'}</p>
            </div>
        );
    } else if (loading) {
        reportBody = <output className="card block p-16 text-center text-sm text-gray-500">Memuat hasil kuis…</output>;
    } else if (!loadError) {
        reportBody = (
            <>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{stats.map(([label, value]) => <div key={label} className="card p-4 sm:p-5"><p className="mb-3 text-xs text-gray-500">{label}</p><p className="text-2xl font-bold text-navy-900">{value}</p></div>)}</div>
                <QuizResultsTable
                    key={selectedQuizId}
                    attempts={filteredAttempts}
                    totalAttempts={attempts.length}
                    questions={questions}
                    quizTitle={selectedQuiz?.title}
                    search={search}
                    onSearch={setSearch}
                    status={status}
                    onStatus={setStatus}
                    onSelect={setSelectedAttemptId}
                />
                <QuizGradeDistribution attempts={filteredAttempts} />
                {selectedAttempt && <section ref={detailRef} className="scroll-mt-24" aria-label={`Detail jawaban ${selectedAttempt.user_name}`}><button type="button" onClick={() => setSelectedAttemptId(null)} className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-navy-600"><ArrowLeft className="h-4 w-4" /> Tutup detail jawaban</button><QuizAttemptDetail key={selectedAttempt.id} attempt={selectedAttempt} questions={questions} onSave={saveManualScore} /></section>}
            </>
        );
    }
    return <div className="space-y-6 animate-fade-in">
        <section className="card flex flex-col justify-between gap-5 p-5 sm:p-6 lg:flex-row lg:items-end">
            <div className="min-w-0 flex-1"><h2 className="text-lg font-bold text-gray-900">Laporan hasil kuis</h2><p className="mt-1 text-sm text-gray-500">Tinjau nilai peserta, analisis hasil, dan unduh laporan kuis.</p>
                <label htmlFor="quiz-select" className="mb-2 mt-5 block text-xs font-semibold text-gray-700">Pilih kuis</label>
                <select id="quiz-select" value={selectedQuizId} onChange={event => setSelectedQuizId(event.target.value)} className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm focus:border-navy-500 focus:ring-navy-500 lg:max-w-xl"><option value="">-- Pilih Kuis --</option>{quizzes.map(quiz => <option key={quiz.id} value={quiz.id}>{quiz.title}</option>)}</select>
            </div>
            <button type="button" onClick={exportResults} disabled={loading || !!loadError || !filteredAttempts.length} className="btn-gold inline-flex items-center justify-center gap-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"><Download className="h-4 w-4" /> Ekspor CSV</button>
        </section>
        {loadError && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{loadError}<button type="button" onClick={() => setReload(value => value + 1)} className="shrink-0 font-semibold underline">Muat ulang</button></div>}
        {reportBody}
    </div>;
}
