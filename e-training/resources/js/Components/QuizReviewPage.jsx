import { useEffect, useState } from 'react';

const STATE_UI = {
    correct: ['Benar', 'bg-green-100 text-green-700'],
    wrong: ['Salah', 'bg-red-100 text-red-700'],
    pending: ['Menunggu koreksi', 'bg-blue-100 text-blue-700'],
};

const NAV_UI = {
    correct: 'bg-green-500 border-green-500 text-white',
    wrong: 'bg-red-500 border-red-500 text-white',
    pending: 'bg-blue-500 border-blue-500 text-white',
};

const MANUAL_TYPES = new Set(['essay', 'short_answer']);

function OptionRow({ option, selected, withAnswers }) {
    let style = 'border-gray-200 bg-white text-gray-700';
    if (withAnswers && option.is_correct) style = 'border-green-400 bg-green-50 text-green-800';
    else if (selected) style = 'border-navy-400 bg-navy-50 text-navy-800';

    return (
        <div className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm ${style}`}>
            <span>{option.option_text}</span>
            <span className="flex-shrink-0 text-xs font-bold">
                {selected && 'Jawaban Anda'}
                {selected && withAnswers && option.is_correct && ' · '}
                {withAnswers && option.is_correct && 'Kunci'}
            </span>
        </div>
    );
}

function ReviewItem({ item, index, withAnswers }) {
    const [stateLabel, stateClass] = STATE_UI[item.state] || STATE_UI.wrong;
    const isManual = MANUAL_TYPES.has(item.type);
    const hasText = item.essay_answer && item.essay_answer.trim() !== '';

    return (
        <div id={`review-q-${item.id}`} className="p-4 text-left border border-gray-200 scroll-mt-4 rounded-xl">
            <div className="flex items-start justify-between gap-3 mb-3">
                <p className="text-sm font-bold text-gray-800">Soal {index + 1}</p>
                <div className="flex items-center gap-2">
                    {item.earned_points !== null && (
                        <span className="text-xs font-medium text-gray-500">
                            {item.earned_points}/{item.points} poin
                        </span>
                    )}
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${stateClass}`}>{stateLabel}</span>
                </div>
            </div>

            <div className="mb-3 text-sm text-gray-800" dangerouslySetInnerHTML={{ __html: item.question }} />
            {item.image_path && <img src={item.image_path} alt="Ilustrasi soal" className="mb-3 border rounded-lg max-h-48" />}

            {isManual ? (
                <div className="p-3 text-sm text-gray-700 whitespace-pre-wrap rounded-lg bg-gray-50">
                    {hasText ? item.essay_answer : <span className="italic text-gray-400">Tidak dijawab</span>}
                </div>
            ) : (
                <div className="space-y-2">
                    {item.options.map(opt => (
                        <OptionRow
                            key={opt.id}
                            option={opt}
                            selected={opt.id === item.selected_option_id}
                            withAnswers={withAnswers}
                        />
                    ))}
                    {item.selected_option_id === null && (
                        <p className="text-xs italic text-gray-400">Tidak dijawab</p>
                    )}
                </div>
            )}

            {item.manual_score !== null && (
                <p className="mt-3 text-xs text-gray-500">Nilai dari pengajar: <strong>{item.manual_score}/100</strong></p>
            )}

            {item.feedback && (
                <div className="p-3 mt-3 text-sm border rounded-lg border-amber-200 bg-amber-50 text-amber-900">
                    <p className="mb-1 text-xs font-bold uppercase">Komentar pengajar</p>
                    <p className="whitespace-pre-wrap">{item.feedback}</p>
                </div>
            )}

            {withAnswers && item.explanation && (
                <div className="p-3 mt-3 text-sm text-blue-900 border border-blue-200 rounded-lg bg-blue-50">
                    <p className="mb-1 text-xs font-bold uppercase">Penjelasan</p>
                    <p className="whitespace-pre-wrap">{item.explanation}</p>
                </div>
            )}
        </div>
    );
}

export default function QuizReviewPage({ courseId, quizId, attemptId, title, onBack }) {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const controller = new AbortController();
        setData(null);
        setError(null);
        fetch(route('courses.quizzes.review', { course: courseId, quiz: quizId, attempt: attemptId }), {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
        })
            .then(async res => {
                if (!res.ok) throw new Error(res.status === 403 ? 'Review kuis ini belum dibuka.' : 'Gagal memuat review.');
                return res.json();
            })
            .then(setData)
            .catch(e => { if (e.name !== 'AbortError') setError(e.message); });
        return () => controller.abort();
    }, [courseId, quizId, attemptId]);

    const withAnswers = data?.review_mode === 'with_answers';

    const jumpTo = id => {
        document.getElementById(`review-q-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="p-6 border border-gray-200 shadow-sm card">
                <button onClick={onBack} className="mb-4 text-sm font-bold text-navy-600 hover:text-navy-800">
                    ← Kembali
                </button>

                <h2 className="text-xl font-bold text-gray-900">Review: {title}</h2>
                {data && (
                    <p className="mt-1 text-sm text-gray-500">
                        Nilai: {data.attempt.is_passed === null ? '-' : data.attempt.score}
                        {data.attempt.pending_grading && ' · sebagian soal masih menunggu koreksi'}
                    </p>
                )}

                {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
                {!error && !data && <p className="mt-4 text-sm text-gray-500">Memuat review...</p>}

                {data && (
                    <>
                        <div className="flex flex-wrap gap-2 my-5">
                            {data.items.map((item, i) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => jumpTo(item.id)}
                                    title={(STATE_UI[item.state] || STATE_UI.wrong)[0]}
                                    className={`flex items-center justify-center w-9 h-9 text-sm font-bold border-2 rounded ${NAV_UI[item.state] || NAV_UI.wrong}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <div className="space-y-4">
                            {data.items.map((item, i) => (
                                <ReviewItem key={item.id} item={item} index={i} withAnswers={withAnswers} />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
