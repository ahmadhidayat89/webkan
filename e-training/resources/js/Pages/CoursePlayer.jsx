// import { Head, router } from '@inertiajs/react';
import { router } from '@inertiajs/react';

// Format sisa waktu: 75 -> "01:15", 3725 -> "1:02:05"
function formatTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/* ---------- Helper murni (tanpa state) ---------- */

const ESSAY_MODES = new Set(['essay', 'custom']);

const PREVENT_CHEAT_MESSAGE =
    '⚠️ PERINGATAN ⚠️\n\nAksi klik-kanan dan salin-tempel (copy-paste) dinonaktifkan selama kuis berlangsung.';

const TAB_SWITCH_MESSAGE =
    '⚠️ PERINGATAN SISTEM ⚠️\n\nSistem mendeteksi Anda meninggalkan halaman ujian (pindah tab/aplikasi). Mohon jaga integritas akademik dengan tidak mencari referensi dari luar selama kuis berlangsung.';

const handlePreventCheat = (e) => {
    e.preventDefault();
    alert(PREVENT_CHEAT_MESSAGE);
};

// Percobaan terbaru = id terbesar (tidak bergantung pada urutan array dari backend)
const getNewestAttempt = (attempts = []) =>
    attempts.reduce((best, a) => (!best || a.id > best.id ? a : best), null);

// Baca attempt dari props yang BARU diterima dari server (tidak bisa basi)
function findFreshAttempts(page, lessonId) {
    const lessons = page?.props?.courseData?.modules?.flatMap((m) => m.lessons);
    const freshLesson = lessons?.find((l) => l.id === lessonId);
    return freshLesson?.quiz?.attempts || [];
}

// Semua soal dikirim; yang belum dijawab dikirim null (penting saat waktu habis)
function buildAnswerPayload(questions, answers) {
    const payload = {};
    questions.forEach((q) => {
        payload[q.id] = answers[q.id] ?? null;
    });
    return payload;
}

function formatErrorMessage(errors) {
    return (
        errors?.message ||
        Object.values(errors || {}).join('\n') ||
        'Terjadi kesalahan saat mengirim jawaban.'
    );
}

function postQuizAnswers({ courseId, quizId, payload, onSuccess, onError }) {
    try {
        router.post(
            route('courses.quizzes.submit', { course: courseId, quiz: quizId }),
            { answers: payload },
            { preserveScroll: true, onSuccess, onError }
        );
    } catch (error) {
        // Jaga-jaga jika route() atau router.post melempar error sinkron,
        // supaya `processing` tetap direset dan tombol kirim tidak terkunci.
        onError({ message: 'Gagal mengirim jawaban. Silakan coba lagi.' });
    }
}

function getTimerClass(timeLeft) {
    if (timeLeft <= 60) return 'bg-red-50 text-red-600 border-red-200 animate-pulse';
    if (timeLeft <= 300) return 'bg-amber-50 text-amber-600 border-amber-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
}

function getAttemptStatus(attempt) {
    if (attempt.is_passed === null) return { label: 'Menunggu Penilaian', color: 'text-blue-500' };
    if (attempt.is_passed) return { label: 'Lulus', color: 'text-green-600' };
    return { label: 'Belum Lulus', color: 'text-red-500' };
}

/* ---------- Hooks ---------- */

// Hitung mundur berbasis deadline (timestamp), bukan sisa detik,
// supaya tetap akurat walaupun tab di background.
function useQuizCountdown(running, onExpire) {
    const [deadline, setDeadline] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);
    const firedRef = useRef(false);
    const expireRef = useRef(onExpire);
    expireRef.current = onExpire;

    useEffect(() => {
        if (!running || deadline === null) return;

        const tick = () => {
            const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
            setTimeLeft(remaining);

            if (remaining <= 0 && !firedRef.current) {
                firedRef.current = true;
                expireRef.current?.();
            }
        };

        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [running, deadline]);

    const start = (minutes) => {
        const hasLimit = minutes > 0;
        firedRef.current = false;
        setDeadline(hasLimit ? Date.now() + minutes * 60 * 1000 : null);
        setTimeLeft(hasLimit ? minutes * 60 : null);
    };

    const reset = () => {
        setDeadline(null);
        setTimeLeft(null);
    };

    return { timeLeft, start, reset };
}

// Anti-nyontek: peringatan saat pindah tab
function useTabSwitchWarning(active) {
    useEffect(() => {
        if (!active) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') alert(TAB_SWITCH_MESSAGE);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [active]);
}

/* ---------- Komponen tampilan ---------- */

function QuizEmptyState() {
    return (
        <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500">
            <AlertCircle className="w-12 h-12 mb-4 text-gray-300" />
            <h2 className="text-lg font-bold text-gray-700">Kuis Belum Tersedia</h2>
            <p className="mt-1 text-sm">Belum ada pertanyaan yang dibuat untuk kuis ini.</p>
        </div>
    );
}

function AttemptHistory({ attempts }) {
    return (
        <div className="p-4 mb-6 text-left border border-gray-200 bg-gray-50 rounded-xl">
            <h3 className="mb-3 text-sm font-bold text-gray-800">Riwayat Percobaan Anda</h3>
            <div className="space-y-2">
                {attempts.map((attempt, idx) => {
                    const status = getAttemptStatus(attempt);
                    return (
                        <div key={attempt.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg">
                            <div>
                                <p className="text-xs text-gray-500">Percobaan #{attempts.length - idx} &bull; {attempt.created_at}</p>
                                <p className={`text-sm font-bold mt-0.5 ${status.color}`}>{status.label}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500">Nilai</p>
                                <p className="text-lg font-black text-gray-800">{attempt.is_passed === null ? '-' : attempt.score}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function QuizStartAction({ isExpired, limitReached, attempts, maxAttempts, onStart }) {
    if (isExpired) {
        return (
            <p className="text-sm font-medium text-amber-600">
                Masa kursus telah berakhir. Kuis tidak dapat dikerjakan, tapi riwayat nilai tetap bisa dilihat.
            </p>
        );
    }

    if (limitReached) {
        return (
            <p className="text-sm font-medium text-red-500">
                Batas percobaan tercapai ({attempts.length}/{maxAttempts}).
            </p>
        );
    }

    const hasAttempts = attempts.length > 0;
    return (
        <button onClick={onStart} className="flex items-center justify-center gap-2 px-8 py-3 mx-auto text-sm btn-gold">
            {hasAttempts ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {hasAttempts ? 'Ulangi Kuis' : 'Mulai Kuis'}
        </button>
    );
}

function QuizIntro({ lesson, quiz, attempts, isExpired, onStart }) {
    // Batas percobaan (max_attempts dikirim dari controller)
    const limitReached = !!quiz.max_attempts && attempts.length >= quiz.max_attempts;

    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="p-8 text-center border border-gray-200 shadow-sm card">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full">
                    <HelpCircle className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-gray-900">{lesson.title}</h2>
                <div className="flex justify-center gap-6 mb-6 text-sm text-gray-600">
                    <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> {quiz.questions.length} Soal</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {quiz.duration_minutes ? `${quiz.duration_minutes} Menit` : 'Tanpa Batas'}</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Min. {quiz.passing_score}</span>
                </div>

                {attempts.length > 0 && <AttemptHistory attempts={attempts} />}

                <QuizStartAction
                    isExpired={isExpired}
                    limitReached={limitReached}
                    attempts={attempts}
                    maxAttempts={quiz.max_attempts}
                    onStart={onStart}
                />
            </div>
        </div>
    );
}

function QuizPendingResult({ onBack }) {
    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="p-8 text-center border-2 border-blue-200 shadow-sm card bg-blue-50/50">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full">
                    <CheckCircle2 className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-gray-900">Jawaban Berhasil Terkirim!</h2>
                <p className="max-w-md mx-auto mb-6 text-sm text-gray-600">
                    Kuis ini mengandung soal essay. Nilai akhir Anda akan muncul setelah instruktur selesai mengoreksi dan memberikan penilaian.
                </p>
                <button onClick={onBack} className="flex items-center gap-2 mx-auto text-sm btn-primary">
                    <RotateCcw className="w-4 h-4" /> Kembali
                </button>
            </div>
        </div>
    );
}

function QuizResult({ attempt, passingScore, autoSubmitted, onBack }) {
    const score = attempt?.score ?? null;
    const passed = attempt?.is_passed === true;
    const tone = passed
        ? { card: 'border-green-200 bg-green-50/50', circle: 'bg-green-100' }
        : { card: 'border-red-200 bg-red-50/50', circle: 'bg-red-100' };

    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <div className={`card p-8 text-center border-2 shadow-sm ${tone.card}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${tone.circle}`}>
                    {passed ? <CheckCircle2 className="w-8 h-8 text-green-600" /> : <AlertCircle className="w-8 h-8 text-red-600" />}
                </div>
                <h2 className="mb-2 text-xl font-bold text-gray-900">
                    {passed ? 'Selamat! Anda Lulus! 🎉' : 'Belum Lulus'}
                </h2>
                <p className="mb-6 text-sm text-gray-600">
                    Skor Anda: <span className="text-lg font-bold">{score ?? '-'}</span> / 100
                    {autoSubmitted && (
                        <><br /><span className="text-xs text-amber-600">Waktu habis, jawaban dikirim otomatis.</span></>
                    )}
                    <br /><span className="text-xs text-gray-400">Skor minimum: {passingScore}</span>
                </p>
                <button onClick={onBack} className="flex items-center gap-2 mx-auto text-sm btn-primary">
                    <RotateCcw className="w-4 h-4" /> Kembali
                </button>
            </div>
        </div>
    );
}

function QuizHeader({ title, current, total, timeLeft, durationMinutes }) {
    return (
        <div className="flex items-center justify-between p-4 mb-6 card">
            <div>
                <h2 className="text-sm font-bold text-gray-900">{title}</h2>
                <p className="text-xs text-gray-500">Pertanyaan {current + 1} dari {total}</p>
            </div>
            {timeLeft === null ? (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    {durationMinutes ? `${durationMinutes} menit` : 'Tanpa batas waktu'}
                </div>
            ) : (
                <div
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold tabular-nums border ${getTimerClass(timeLeft)}`}
                    title="Sisa waktu pengerjaan"
                >
                    <Clock className="w-4 h-4" />
                    {formatTime(timeLeft)}
                </div>
            )}
        </div>
    );
}

function OptionButton({ option, letter, selected, disabled, onSelect }) {
    const buttonClass = selected
        ? 'border-navy-500 bg-navy-50'
        : 'border-gray-100 hover:border-navy-200 hover:bg-gray-50';
    const letterClass = selected
        ? 'border-navy-500 bg-navy-500 text-white'
        : 'border-gray-300 text-gray-500';
    const textClass = selected ? 'text-navy-800 font-medium' : 'text-gray-700';

    return (
        <button
            disabled={disabled}
            onClick={() => onSelect(option.id)}
            className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${buttonClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all ${letterClass}`}>
                {letter}
            </div>
            <span className={`text-sm ${textClass}`}>{option.option_text}</span>
        </button>
    );
}

function AnswerInput({ question, answer, processing, onAnswer }) {
    if (question.type === 'multiple_choice') {
        return (
            <div className="space-y-3">
                {question.options.map((option, oIdx) => (
                    <OptionButton
                        key={option.id}
                        option={option}
                        letter={String.fromCharCode(65 + oIdx)}
                        selected={answer === option.id}
                        disabled={processing}
                        onSelect={onAnswer}
                    />
                ))}
            </div>
        );
    }

    return (
        <textarea
            className="w-full p-3 text-sm border-gray-300 rounded-lg focus:ring-navy-500 focus:border-navy-500"
            rows="6"
            placeholder="Ketik jawaban Anda di sini..."
            value={answer || ''}
            onChange={(e) => onAnswer(e.target.value)}
            disabled={processing}
        />
    );
}

function QuestionFooter({ index, total, processing, canSubmit, onPrev, onNext, onSubmit }) {
    const isLast = index === total - 1;

    return (
        <div className="flex items-center justify-between pt-6 mt-8 border-t border-gray-100">
            <button
                onClick={onPrev}
                disabled={index === 0 || processing}
                className="flex items-center gap-2 text-sm btn-secondary disabled:opacity-40"
            >
                <ChevronLeft className="w-4 h-4" /> Sebelumnya
            </button>

            {isLast ? (
                <button
                    onClick={onSubmit}
                    disabled={!canSubmit || processing}
                    className="flex items-center gap-2 text-sm btn-gold disabled:opacity-40"
                >
                    <Send className="w-4 h-4" /> {processing ? 'Memproses...' : 'Kirim Jawaban'}
                </button>
            ) : (
                <button
                    onClick={onNext}
                    disabled={processing}
                    className="flex items-center gap-2 text-sm btn-primary"
                >
                    Selanjutnya <ChevronRight className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}

function QuestionPanel({ question, index, total, answer, processing, canSubmit, onAnswer, onPrev, onNext, onSubmit }) {
    return (
        <div className="flex-1 bg-white border border-gray-200 rounded-xl p-6 min-h-[400px]">
            <div className="flex items-start gap-3 mb-6">
                <span className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-sm font-bold text-white rounded-full bg-navy-600">
                    {index + 1}
                </span>
                <div
                    className="flex-1 pt-1 font-semibold prose-sm prose text-gray-900 max-w-none"
                    dangerouslySetInnerHTML={{ __html: question.question }}
                />
            </div>

            {question.image_path && (
                <img src={question.image_path} alt="Ilustrasi soal" className="object-contain mb-5 border rounded-lg max-h-64" />
            )}

            <AnswerInput question={question} answer={answer} processing={processing} onAnswer={onAnswer} />

            <QuestionFooter
                index={index}
                total={total}
                processing={processing}
                canSubmit={canSubmit}
                onPrev={onPrev}
                onNext={onNext}
                onSubmit={onSubmit}
            />
        </div>
    );
}

function getNavButtonClass(isCurrent, isAnswered) {
    if (isCurrent) return 'bg-navy-600 text-white border-navy-600 shadow-md scale-105';
    if (isAnswered) return 'bg-navy-100 text-navy-700 border-navy-200';
    return 'bg-white text-gray-700 border-gray-200 hover:border-navy-300 hover:bg-navy-50';
}

function QuestionSidebar({ questions, answers, current, processing, canSubmit, onJump, onSubmit }) {
    const total = questions.length;
    const answeredCount = Object.keys(answers).length;

    return (
        <div className="flex-shrink-0 w-full space-y-4 lg:w-56">
            <div className="p-4 bg-white border border-gray-200 shadow-sm rounded-xl">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-gray-800">Navigasi Soal</h3>
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{total} Soal</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                    {questions.map((q, idx) => (
                        <button
                            key={q.id}
                            onClick={() => onJump(idx)}
                            disabled={processing}
                            className={`aspect-square flex items-center justify-center rounded font-bold text-sm transition-all border-2 ${getNavButtonClass(current === idx, !!answers[q.id])} ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {idx + 1}
                        </button>
                    ))}
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5 text-xs text-gray-500">
                    <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 rounded bg-navy-600 border-navy-600"></div><span>Sedang dikerjakan</span></div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 rounded bg-navy-100 border-navy-200"></div><span>Sudah dijawab</span></div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 bg-white border-2 border-gray-200 rounded"></div><span>Belum dijawab</span></div>
                </div>
            </div>

            <button
                onClick={onSubmit}
                disabled={!canSubmit || processing}
                className="flex items-center justify-center w-full gap-2 py-3 text-sm btn-gold disabled:opacity-40"
            >
                <Send className="w-4 h-4" /> {processing ? 'Memproses...' : 'Selesai & Kirim'}
            </button>
            {answeredCount < total && (
                <p className="text-xs text-center text-gray-400">
                    {answeredCount}/{total} soal terjawab
                </p>
            )}
        </div>
    );
}

/* ---------- Komponen utama (hanya orkestrasi) ---------- */

function QuizContent({ lesson, courseId, isExpired, onQuizActiveChange }) {
    const quiz = lesson.quiz;
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [started, setStarted] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [autoSubmitted, setAutoSubmitted] = useState(false);
    // Hasil attempt yang baru saja dikirim, diambil langsung dari respons server
    const [result, setResult] = useState(null);
    const submitRef = useRef(null); // selalu menunjuk handleSubmit terbaru

    const inProgress = started && !submitted;
    const { timeLeft, start, reset } = useQuizCountdown(inProgress, () => submitRef.current?.(true));
    useTabSwitchWarning(inProgress);

    const questions = quiz?.questions || [];
    if (questions.length === 0) return <QuizEmptyState />;

    const totalQuestions = questions.length;
    const attempts = quiz.attempts || [];
    const allAnswered = questions.every((q) => answers[q.id] !== undefined && answers[q.id] !== '');
    const canSubmit = allAnswered || timeLeft === 0;
    const question = questions[currentQuestion];

    const handleAnswer = (value) => {
        if (submitted || processing) return;
        setAnswers({ ...answers, [question.id]: value });
    };

    const handleSubmit = (auto = false) => {
        // onClick mengirim event sebagai argumen, jadi hanya nilai `true` yang dianggap otomatis
        const isAuto = auto === true;
        if (processing || (!isAuto && !canSubmit)) return;

        if (isAuto) setAutoSubmitted(true);
        setProcessing(true);

        postQuizAnswers({
            courseId,
            quizId: quiz.id,
            payload: buildAnswerPayload(questions, answers),
            onSuccess: (page) => {
                onQuizActiveChange(false);
                setResult(getNewestAttempt(findFreshAttempts(page, lesson.id)));
                setProcessing(false);
                setSubmitted(true);
            },
            onError: (errors) => {
                setProcessing(false);
                alert(formatErrorMessage(errors));
            },
        });
    };

    // Selalu simpan handleSubmit terbaru untuk dipanggil oleh timer
    submitRef.current = handleSubmit;

    const handleStart = () => {
        setAutoSubmitted(false);
        start(Number(quiz.duration_minutes));
        setStarted(true);
        onQuizActiveChange(true);
    };

    const handleReset = () => {
        setAnswers({});
        setResult(null);
        reset();
        setSubmitted(false);
        setStarted(false); // Kembali ke halaman awal
        setCurrentQuestion(0);
    };

    if (!started && !submitted) {
        return <QuizIntro lesson={lesson} quiz={quiz} attempts={attempts} isExpired={isExpired} onStart={handleStart} />;
    }

    if (submitted && ESSAY_MODES.has(quiz.quiz_mode)) {
        return <QuizPendingResult onBack={handleReset} />;
    }

    if (submitted) {
        return (
            <QuizResult
                attempt={result ?? getNewestAttempt(attempts)}
                passingScore={quiz.passing_score}
                autoSubmitted={autoSubmitted}
                onBack={handleReset}
            />
        );
    }

    return (
        <div
            className="animate-fade-in"
            onContextMenu={handlePreventCheat}
            onCopy={handlePreventCheat}
            onPaste={handlePreventCheat}
            onCut={handlePreventCheat}
        >
            <QuizHeader
                title={lesson.title}
                current={currentQuestion}
                total={totalQuestions}
                timeLeft={timeLeft}
                durationMinutes={quiz.duration_minutes}
            />

            <div className="flex flex-col-reverse gap-6 lg:flex-row">
                <QuestionPanel
                    question={question}
                    index={currentQuestion}
                    total={totalQuestions}
                    answer={answers[question.id]}
                    processing={processing}
                    canSubmit={canSubmit}
                    onAnswer={handleAnswer}
                    onPrev={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                    onNext={() => setCurrentQuestion(Math.min(totalQuestions - 1, currentQuestion + 1))}
                    onSubmit={handleSubmit}
                />
                <QuestionSidebar
                    questions={questions}
                    answers={answers}
                    current={currentQuestion}
                    processing={processing}
                    canSubmit={canSubmit}
                    onJump={setCurrentQuestion}
                    onSubmit={handleSubmit}
                />
            </div>
        </div>
    );
}
