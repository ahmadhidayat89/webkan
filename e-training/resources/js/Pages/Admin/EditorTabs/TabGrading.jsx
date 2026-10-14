import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { CheckCircle2, XCircle, Search, Save, AlertCircle } from 'lucide-react';

export default function TabGrading({ courseId, modules }) {
    const [selectedQuizId, setSelectedQuizId] = useState('');
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedAttempt, setSelectedAttempt] = useState(null);

    // Get all quizzes from modules
    const quizzes = modules.flatMap(m =>
        m.lessons.filter(l => l.type === 'quiz' && l.quiz).map(l => ({
            id: l.quiz.id,
            title: `${m.title} - ${l.title}`,
            quiz: l.quiz
        }))
    );

    useEffect(() => {
        if (selectedQuizId) {
            setLoading(true);
            fetch(route('admin.grading.attempts', selectedQuizId))
                .then(res => res.json())
                .then(data => {
                    setAttempts(data);
                    setLoading(false);
                });
        } else {
            setAttempts([]);
            setSelectedAttempt(null);
        }
    }, [selectedQuizId]);

    const handleSaveManualScore = (answerId, score, feedback) => {
        router.patch(route('admin.grading.essay', answerId), {
            manual_score: score,
            admin_feedback: feedback
        }, {
            preserveScroll: true,
            onSuccess: () => {
                // Refresh data
                fetch(route('admin.grading.attempts', selectedQuizId))
                    .then(res => res.json())
                    .then(data => {
                        setAttempts(data);
                        // update selected attempt
                        if (selectedAttempt) {
                            setSelectedAttempt(data.find(a => a.id === selectedAttempt.id));
                        }
                    });
            }
        });
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 animate-fade-in">
            {/* Left Sidebar: Quiz Selection & List of Attempts */}
            <div className="w-full lg:w-1/3 flex flex-col gap-4">
                <div className="card p-4">
                    <label htmlFor="quiz-select" className="block text-sm font-bold text-gray-700 mb-2">Pilih Kuis</label>
                    <select
                        id="quiz-select"
                        value={selectedQuizId}
                        onChange={e => setSelectedQuizId(e.target.value)}
                        className="w-full text-sm border-gray-200 rounded-lg bg-gray-50 focus:border-navy-500"
                    >
                        <option value="">-- Pilih Kuis --</option>
                        {quizzes.map(q => (
                            <option key={q.id} value={q.id}>{q.title}</option>
                        ))}
                    </select>
                </div>

                {selectedQuizId && (
                    <div className="card border border-gray-200 flex-1 min-h-[400px] flex flex-col">
                        <div className="p-3 border-b border-gray-100 bg-gray-50">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" placeholder="Cari nama peserta..." className="w-full text-xs pl-9 py-2 border-gray-200 rounded-lg" />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="p-8 text-center text-gray-400">Loading...</div>
                            ) : attempts.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-sm">Belum ada yang mengerjakan kuis ini.</div>
                            ) : (
                                <ul className="divide-y divide-gray-100">
                                    {attempts.map(attempt => (
                                        <li
                                            key={attempt.id}
                                            onClick={() => setSelectedAttempt(attempt)}
                                            className={`p-3 cursor-pointer hover:bg-navy-50 transition-colors ${selectedAttempt?.id === attempt.id ? 'bg-navy-50 border-l-4 border-navy-500' : ''}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-bold text-sm text-gray-900">{attempt.user_name}</p>
                                                    <p className="text-[10px] text-gray-500">{attempt.started_at}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${attempt.is_passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {attempt.score}%
                                                    </span>
                                                </div>
                                            </div>
                                            {attempt.pending_grading && (
                                                <div className="mt-2 text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded inline-flex items-center gap-1 font-medium">
                                                    <AlertCircle className="w-3 h-3" /> Butuh Koreksi Essay
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Right Panel: Grading details */}
            <div className="w-full lg:w-2/3">
                {selectedAttempt ? (
                    <div className="card overflow-hidden">
                        <div className="bg-navy-900 text-white p-5">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold">{selectedAttempt.user_name}</h3>
                                    <p className="text-navy-200 text-sm">{selectedAttempt.user_email}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold">{selectedAttempt.score}<span className="text-lg text-navy-300">%</span></div>
                                    <p className="text-xs text-navy-200 uppercase tracking-wider">{selectedAttempt.is_passed ? 'LULUS' : 'TIDAK LULUS'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-6 bg-gray-50/50">
                            <h4 className="font-bold text-gray-900 border-b border-gray-200 pb-2">Detail Jawaban</h4>

                            {selectedAttempt.answers.map((ans, idx) => (
                                <div key={ans.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 flex-shrink-0 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600 text-sm">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-900 mb-3" dangerouslySetInnerHTML={{ __html: ans.question_text }}></div>

                                            {ans.question_image && (
                                                <img src={ans.question_image} className="max-w-md rounded-lg mb-3 border" alt="Soal" />
                                            )}

                                            {ans.question_type === 'multiple_choice' ? (
                                                <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                    {ans.is_correct ? (
                                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                    ) : (
                                                        <XCircle className="w-5 h-5 text-red-500" />
                                                    )}
                                                    <span className={`text-sm ${ans.is_correct ? 'text-green-700 font-medium' : 'text-red-700'}`}>
                                                        Jawaban: {ans.selected_option || '(Tidak dijawab)'}
                                                    </span>
                                                </div>
                                            ) : (
                                                /* ESSAY GRADING */
                                                <div className="space-y-3">
                                                    <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                                        <p className="text-xs font-bold text-blue-800 uppercase mb-1">Jawaban Peserta:</p>
                                                        <div className="text-sm text-gray-800 whitespace-pre-wrap">{ans.essay_answer || '(Kosong)'}</div>
                                                    </div>

                                                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                                                        <p className="text-xs font-bold text-amber-800 uppercase mb-3">Koreksi Manual Admin</p>
                                                        <div className="flex flex-col sm:flex-row gap-4">
                                                            <div>
                                                                <label htmlFor={`score-${ans.id}`} className="block text-xs font-medium text-amber-900 mb-1">Nilai (0-100)</label>
                                                                <input
                                                                    type="number"
                                                                    className="w-24 text-sm border-amber-300 rounded focus:ring-amber-500 focus:border-amber-500"
                                                                    defaultValue={ans.manual_score ?? ''}
                                                                    id={`score-${ans.id}`}
                                                                    min="0" max="100"
                                                                />
                                                            </div>
                                                            <div className="flex-1">
                                                                <label htmlFor={`feedback-${ans.id}`} className="block text-xs font-medium text-amber-900 mb-1">Feedback / Komentar (Opsional)</label>
                                                                <textarea
                                                                    className="w-full text-sm border-amber-300 rounded focus:ring-amber-500 focus:border-amber-500"
                                                                    rows="2"
                                                                    defaultValue={ans.admin_feedback || ''}
                                                                    id={`feedback-${ans.id}`}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="mt-3 text-right">
                                                            <button
                                                                onClick={() => {
                                                                    const score = document.getElementById(`score-${ans.id}`).value;
                                                                    const feedback = document.getElementById(`feedback-${ans.id}`).value;
                                                                    handleSaveManualScore(ans.id, score, feedback);
                                                                }}
                                                                className="btn-gold py-1.5 px-3 text-xs"
                                                            >
                                                                Simpan Nilai Essay
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="card h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400 p-8">
                        <CheckCircle2 className="w-16 h-16 text-gray-200 mb-4" />
                        <h3 className="text-lg font-bold text-gray-600 mb-2">Pilih Peserta</h3>
                        <p className="text-sm text-center">Pilih salah satu peserta di sidebar kiri untuk melihat detail jawaban dan memberikan penilaian essay.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
