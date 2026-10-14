import { Head } from '@inertiajs/react';
import CoursePlayerLayout from '@/Layouts/CoursePlayerLayout';
import DiscussionPanel from '@/Components/DiscussionPanel';
import { useState, useEffect, useRef } from 'react';
import {
    Play,
    Pause,
    Volume2,
    Maximize,
    FileText,
    Download,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Send,
    RotateCcw,
    AlertCircle,
    Video,
    Eye,
    HelpCircle,
} from 'lucide-react';

// Helper: konversi URL YouTube ke embed URL
function getYouTubeEmbedUrl(url) {
    if (!url) return null;

    let videoId = null;

    // 1. Cek pola youtu.be/ID
    const shortUrlMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortUrlMatch) {
        videoId = shortUrlMatch[1];
    } else {
        // 2. Cek pola youtube.com/watch?...&v=ID
        const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
        if (watchMatch) {
            videoId = watchMatch[1];
        } else {
            // 3. Cek pola youtube.com/embed/ID atau youtube.com/shorts/ID
            const embedMatch = url.match(/youtube\.com\/(?:embed|shorts)\/([a-zA-Z0-9_-]{11})/);
            if (embedMatch) {
                videoId = embedMatch[1];
            }
        }
    }

    if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=0`;
    }

    return null;
}

function VideoContent({ lesson }) {
    const embedUrl = getYouTubeEmbedUrl(lesson.video_url);

    if (lesson.type === 'zoom') {
        return (
            <div className="animate-fade-in">
                <div className="p-8 mb-6 text-center border bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200 rounded-2xl">
                    <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 bg-sky-100 rounded-2xl">
                        <Video className="w-10 h-10 text-sky-500" />
                    </div>
                    <h2 className="mb-1 text-xl font-bold text-gray-900">{lesson.title}</h2>
                    <p className="mb-6 text-sm text-gray-500">Sesi Zoom Meeting Online</p>
                    {lesson.video_url ? (
                        <a
                            href={lesson.video_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white transition-colors shadow-lg bg-sky-500 hover:bg-sky-600 rounded-xl shadow-sky-200"
                        >
                            <Video className="w-5 h-5" /> Bergabung ke Zoom Meeting
                        </a>
                    ) : (
                        <p className="text-sm italic text-gray-400">Link Zoom belum tersedia</p>
                    )}
                </div>
                {lesson.description && (
                    <div className="px-1">
                        <h3 className="mb-1 text-sm font-bold text-gray-700">Instruksi / Deskripsi</h3>
                        <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-line">{lesson.description}</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* YouTube Embed or Placeholder */}
            <div className="relative mb-6 overflow-hidden bg-gray-900 rounded-xl aspect-video">
                {embedUrl ? (
                    <iframe
                        src={embedUrl}
                        className="absolute inset-0 w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={lesson.title}
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                        <Video className="w-12 h-12 mb-3 text-white/30" />
                        <p className="mb-1 text-sm text-white/60">{lesson.title}</p>
                        {lesson.video_url ? (
                            <a
                                href={lesson.video_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 mt-3 text-xs font-bold text-white transition-colors rounded-lg bg-white/20 hover:bg-white/30"
                            >
                                Buka Video di Tab Baru
                            </a>
                        ) : (
                            <p className="mt-2 text-xs text-white/40">URL video belum diatur oleh instruktur</p>
                        )}
                    </div>
                )}
            </div>

            {/* Lesson Info */}
            <div className="px-1">
                <h2 className="mb-2 text-lg font-bold text-gray-900">{lesson.title}</h2>
                {lesson.description && (
                    <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-line">{lesson.description}</p>
                )}
            </div>
        </div>
    );
}

function PdfContent({ lesson }) {
    const hasFile = lesson.files && lesson.files.length > 0;
    const [selectedFileIdx, setSelectedFileIdx] = useState(0);
    const [showPreview, setShowPreview] = useState(false);

    const selectedFile = hasFile ? lesson.files[selectedFileIdx] : null;
    const fileUrl = selectedFile ? selectedFile.file_path : null;

    // Detect if it's a PDF by mime_type OR by file extension
    const isPdf = selectedFile && (
        selectedFile.mime_type === 'application/pdf' ||
        (selectedFile.original_name && selectedFile.original_name.toLowerCase().endsWith('.pdf'))
    );

    const fileIcons = {
        'application/pdf': '📄',
        'application/msword': '📝',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
        'application/vnd.ms-powerpoint': '📊',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📊',
        'application/vnd.ms-excel': '📊',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
    };

    return (
        <div className="animate-fade-in">
            {/* Multi-file tabs jika ada lebih dari 1 file */}
            {hasFile && lesson.files.length > 1 && (
                <div className="flex gap-2 mb-3 overflow-x-auto">
                    {lesson.files.map((f, idx) => (
                        <button
                            key={f.id}
                            onClick={() => {
                                setSelectedFileIdx(idx);
                                setShowPreview(false); // Reset preview state when changing file
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${selectedFileIdx === idx
                                ? 'bg-navy-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <span>{fileIcons[f.mime_type] || '📄'}</span>
                            <span className="truncate max-w-[120px]">{f.original_name}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border border-gray-200 bg-gray-50 rounded-t-xl">
                <div className="flex items-center min-w-0 gap-2">
                    <FileText className="flex-shrink-0 w-4 h-4 text-red-500" />
                    <span className="text-sm font-semibold text-gray-700 truncate">
                        {selectedFile ? selectedFile.original_name : lesson.title}
                    </span>
                    {selectedFile && (
                        <span className="flex-shrink-0 text-xs text-gray-400">
                            ({Math.round((selectedFile.file_size_kb || 0) / 1024 * 10) / 10} MB)
                        </span>
                    )}
                </div>
                <div className="flex flex-shrink-0 gap-2">
                    {fileUrl && (
                        <>
                            {isPdf && !showPreview && (
                                <button onClick={() => setShowPreview(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-navy-600 rounded-lg hover:bg-navy-700 transition-colors">
                                    <Eye className="w-3.5 h-3.5" /> Preview
                                </button>
                            )}
                            <a href={fileUrl} download={selectedFile?.original_name} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                                <Download className="w-3.5 h-3.5" /> Unduh
                            </a>
                        </>
                    )}
                </div>
            </div>

            {/* Viewer */}
            {isPdf && fileUrl ? (
                showPreview ? (
                    <iframe
                        key={fileUrl}
                        src={fileUrl}
                        className="w-full border border-t-0 border-gray-200 rounded-b-xl"
                        style={{ height: '75vh', minHeight: '500px' }}
                        title={selectedFile?.original_name || lesson.title}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center p-10 text-center bg-white border border-t-0 border-gray-200 rounded-b-xl">
                        <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 text-4xl rounded-2xl bg-red-50">
                            📄
                        </div>
                        <h3 className="mb-1 text-base font-bold text-gray-800">{selectedFile?.original_name}</h3>
                        <p className="max-w-sm mb-6 text-xs text-gray-400">
                            Dokumen PDF siap dilihat. Klik tombol di bawah untuk menampilkan preview dokumen, atau unduh langsung ke perangkat Anda.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowPreview(true)} className="inline-flex items-center gap-2 bg-navy-600 hover:bg-navy-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-colors">
                                <Eye className="w-4 h-4" /> Lihat Preview
                            </button>
                            <a href={fileUrl} download={selectedFile?.original_name} className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm px-6 py-2.5 rounded-xl transition-colors border border-gray-200">
                                <Download className="w-4 h-4" /> Unduh
                            </a>
                        </div>
                    </div>
                )
            ) : hasFile && fileUrl ? (
                <div className="flex flex-col items-center justify-center p-8 text-center bg-white border border-t-0 border-gray-200 rounded-b-xl">
                    <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 text-4xl rounded-2xl bg-blue-50">
                        {fileIcons[selectedFile?.mime_type] || '📄'}
                    </div>
                    <h3 className="mb-1 text-base font-bold text-gray-800">{selectedFile?.original_name}</h3>
                    <p className="max-w-xs mb-6 text-xs text-gray-400">
                        File {selectedFile?.mime_type?.split('/')[1]?.toUpperCase() || 'dokumen'} ini tidak dapat dipreview langsung di browser.
                        Silakan unduh untuk membuka.
                    </p>
                    <a href={fileUrl} download={selectedFile?.original_name} className="inline-flex items-center gap-2 bg-navy-600 hover:bg-navy-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-colors">
                        <Download className="w-4 h-4" /> Unduh &amp; Buka
                    </a>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-10 text-center bg-white border border-t-0 border-gray-200 rounded-b-xl">
                    <FileText className="w-10 h-10 mb-3 text-gray-200" />
                    <p className="text-sm font-medium text-gray-500">Dokumen belum diunggah</p>
                    <p className="mt-1 text-xs text-gray-400">Instruktur belum mengunggah file untuk materi ini.</p>
                </div>
            )}

            {/* Description */}
            {lesson.description && (
                <div className="px-1 mt-4">
                    <h3 className="mb-1 text-sm font-bold text-gray-700">Instruksi / Deskripsi</h3>
                    <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-line">{lesson.description}</p>
                </div>
            )}
        </div>
    );
}


// Format sisa waktu: 75 -> "01:15", 3725 -> "1:02:05"
function formatTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function QuizContent({ lesson, courseId, isExpired, onQuizActiveChange }) {
    const quiz = lesson.quiz;
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [started, setStarted] = useState(false);
    const [processing, setProcessing] = useState(false);
    // Hasil attempt yang baru saja dikirim, diambil langsung dari respons server (lihat onSuccess)
    const [result, setResult] = useState(null);

    // Hitung mundur: yang disimpan adalah batas waktu (timestamp), bukan sisa detik,
    // supaya tetap akurat walaupun tab di background atau timer browser ditahan.
    const [deadline, setDeadline] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);
    const [autoSubmitted, setAutoSubmitted] = useState(false);
    const submitRef = useRef(null); // selalu menunjuk handleSubmit terbaru
    const autoSubmitFiredRef = useRef(false);

    useEffect(() => {
        if (!started || submitted || deadline === null) return;

        const tick = () => {
            const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
            setTimeLeft(remaining);

            if (remaining <= 0 && !autoSubmitFiredRef.current) {
                autoSubmitFiredRef.current = true;
                submitRef.current?.(true); // waktu habis: kirim otomatis
            }
        };

        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [started, submitted, deadline]);

    // Fitur Anti-Nyontek: Deteksi pindah tab
    useEffect(() => {
        if (!started || submitted) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                alert("⚠️ PERINGATAN SISTEM ⚠️\n\nSistem mendeteksi Anda meninggalkan halaman ujian (pindah tab/aplikasi). Mohon jaga integritas akademik dengan tidak mencari referensi dari luar selama kuis berlangsung.");
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [started, submitted]);

    // Fitur Anti-Nyontek: Blokir Copy Paste & Klik Kanan
    const handlePreventCheat = (e) => {
        e.preventDefault();
        alert("⚠️ PERINGATAN ⚠️\n\nAksi klik-kanan dan salin-tempel (copy-paste) dinonaktifkan selama kuis berlangsung.");
    };

    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500">
                <AlertCircle className="w-12 h-12 mb-4 text-gray-300" />
                <h2 className="text-lg font-bold text-gray-700">Kuis Belum Tersedia</h2>
                <p className="mt-1 text-sm">Belum ada pertanyaan yang dibuat untuk kuis ini.</p>
            </div>
        );
    }

    const question = quiz.questions[currentQuestion];
    const totalQuestions = quiz.questions.length;
    const allAnswered = quiz.questions.every(q => answers[q.id] !== undefined && answers[q.id] !== '');
    const attempts = quiz.attempts || [];

    const handleAnswer = (value) => {
        if (submitted || processing) return;
        setAnswers({ ...answers, [question.id]: value });
    };

    const handleSubmit = (auto = false) => {
        // onClick mengirim event sebagai argumen, jadi hanya nilai `true` yang dianggap otomatis
        const isAuto = auto === true;

        if (processing) return;
        if (!isAuto && !allAnswered && timeLeft !== 0) return;

        if (isAuto) setAutoSubmitted(true);
        setProcessing(true);

        // Kirim semua soal; yang belum dijawab dikirim null (penting saat waktu habis)
        const payload = {};
        quiz.questions.forEach((q) => {
            payload[q.id] = answers[q.id] ?? null;
        });

        import('@inertiajs/react').then(({ router }) => {
            router.post(route('courses.quizzes.submit', { course: courseId, quiz: quiz.id }), {
                answers: payload
            }, {
                preserveScroll: true,
                onSuccess: (page) => {
                    onQuizActiveChange(false);
                    // Baca attempt terbaru dari props yang BARU diterima dari server.
                    // Tidak bergantung pada kapan React me-render ulang, jadi tidak bisa basi.
                    const freshLesson = page?.props?.courseData?.modules
                        ?.flatMap((m) => m.lessons)
                        ?.find((l) => l.id === lesson.id);
                    const freshAttempts = freshLesson?.quiz?.attempts || [];
                    const newest = freshAttempts.reduce(
                        (best, a) => (!best || a.id > best.id ? a : best),
                        null
                    );

                    // DEBUG sementara: hapus baris ini kalau sudah beres
                    console.debug('[Kuis] attempt terbaru dari server:', newest, 'semua:', freshAttempts);

                    setResult(newest);
                    setProcessing(false);
                    setSubmitted(true);
                },
                onError: (errors) => {
                    setProcessing(false);
                    alert(
                        errors?.message ||
                        Object.values(errors || {}).join('\n') ||
                        'Terjadi kesalahan saat mengirim jawaban.'
                    );
                }
            });
        });
    };

    // Selalu simpan handleSubmit terbaru untuk dipanggil oleh timer
    submitRef.current = handleSubmit;

    const handleStart = () => {
        const minutes = Number(quiz.duration_minutes);
        const hasLimit = minutes > 0;

        autoSubmitFiredRef.current = false;
        setAutoSubmitted(false);
        setDeadline(hasLimit ? Date.now() + minutes * 60 * 1000 : null);
        setTimeLeft(hasLimit ? minutes * 60 : null);
        setStarted(true);
        onQuizActiveChange(true);
    };

    const handleReset = () => {
        setAnswers({});
        setResult(null);
        setDeadline(null);
        setTimeLeft(null);
        setSubmitted(false);
        setStarted(false); // Kembali ke halaman awal
        setCurrentQuestion(0);
    };

    // Percobaan terbaru = id terbesar (tidak bergantung pada urutan array dari backend)
    const latestAttempt = attempts.reduce(
        (best, a) => (!best || a.id > best.id ? a : best),
        null
    );

    // Batas percobaan (max_attempts dikirim dari controller)
    const limitReached = !!quiz.max_attempts && attempts.length >= quiz.max_attempts;

    if (!started && !submitted) {
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

                    {attempts.length > 0 && (
                        <div className="p-4 mb-6 text-left border border-gray-200 bg-gray-50 rounded-xl">
                            <h3 className="mb-3 text-sm font-bold text-gray-800">Riwayat Percobaan Anda</h3>
                            <div className="space-y-2">
                                {attempts.map((attempt, idx) => (
                                    <div key={attempt.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg">
                                        <div>
                                            <p className="text-xs text-gray-500">Percobaan #{attempts.length - idx} &bull; {attempt.created_at}</p>
                                            <p className={`text-sm font-bold mt-0.5 ${attempt.is_passed === null ? 'text-blue-500' : attempt.is_passed ? 'text-green-600' : 'text-red-500'}`}>
                                                {attempt.is_passed === null ? 'Menunggu Penilaian' : attempt.is_passed ? 'Lulus' : 'Belum Lulus'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">Nilai</p>
                                            <p className="text-lg font-black text-gray-800">{attempt.is_passed === null ? '-' : attempt.score}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {isExpired ? (
                        <p className="text-sm font-medium text-amber-600">
                            Masa kursus telah berakhir. Kuis tidak dapat dikerjakan, tapi riwayat nilai tetap bisa dilihat.
                        </p>
                    ) : limitReached ? (
                        <p className="text-sm font-medium text-red-500">
                            Batas percobaan tercapai ({attempts.length}/{quiz.max_attempts}).
                        </p>
                    ) : (
                        <button
                            onClick={handleStart}
                            className="flex items-center justify-center gap-2 px-8 py-3 mx-auto text-sm btn-gold"
                        >
                            {attempts.length > 0 ? (
                                <><RotateCcw className="w-4 h-4" /> Ulangi Kuis</>
                            ) : (
                                <><Play className="w-4 h-4" /> Mulai Kuis</>
                            )}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (submitted) {
        if (quiz.quiz_mode === 'essay' || quiz.quiz_mode === 'custom') {
            return (
                <div className="max-w-2xl mx-auto animate-fade-in">
                    <div className="p-8 text-center border-2 border-blue-200 shadow-sm card bg-blue-50/50">
                        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full">
                            <CheckCircle2 className="w-8 h-8 text-blue-600" />
                        </div>
                        <h2 className="mb-2 text-xl font-bold text-gray-900">
                            Jawaban Berhasil Terkirim!
                        </h2>
                        <p className="max-w-md mx-auto mb-6 text-sm text-gray-600">
                            Kuis ini mengandung soal essay. Nilai akhir Anda akan muncul setelah instruktur selesai mengoreksi dan memberikan penilaian.
                        </p>
                        <button onClick={handleReset} className="flex items-center gap-2 mx-auto text-sm btn-primary">
                            <RotateCcw className="w-4 h-4" /> Kembali
                        </button>
                    </div>
                </div>
            );
        }

        // Hasil attempt yang baru saja dikirim (dari respons server). latestAttempt hanya cadangan.
        const shownAttempt = result ?? latestAttempt;
        const score = shownAttempt?.score ?? null;
        const passed = shownAttempt ? shownAttempt.is_passed === true : false;
        return (
            <div className="max-w-2xl mx-auto animate-fade-in">
                <div className={`card p-8 text-center border-2 shadow-sm ${passed ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${passed ? 'bg-green-100' : 'bg-red-100'}`}>
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
                        <br /><span className="text-xs text-gray-400">Skor minimum: {quiz.passing_score}</span>
                    </p>
                    <button onClick={handleReset} className="flex items-center gap-2 mx-auto text-sm btn-primary">
                        <RotateCcw className="w-4 h-4" /> Kembali
                    </button>
                </div>
            </div>
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
            {/* Quiz Header */}
            <div className="flex items-center justify-between p-4 mb-6 card">
                <div>
                    <h2 className="text-sm font-bold text-gray-900">{lesson.title}</h2>
                    <p className="text-xs text-gray-500">Pertanyaan {currentQuestion + 1} dari {totalQuestions}</p>
                </div>
                {timeLeft !== null ? (
                    <div
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold tabular-nums border ${timeLeft <= 60
                            ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                            : timeLeft <= 300
                                ? 'bg-amber-50 text-amber-600 border-amber-200'
                                : 'bg-gray-50 text-gray-700 border-gray-200'
                            }`}
                        title="Sisa waktu pengerjaan"
                    >
                        <Clock className="w-4 h-4" />
                        {formatTime(timeLeft)}
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        {quiz.duration_minutes ? `${quiz.duration_minutes} menit` : 'Tanpa batas waktu'}
                    </div>
                )}
            </div>

            {/* 2-Column: Question Area + Sidebar Nav */}
            <div className="flex flex-col-reverse gap-6 lg:flex-row">
                {/* Left: Question Content */}
                <div className="flex-1 bg-white border border-gray-200 rounded-xl p-6 min-h-[400px]">
                    <div className="flex items-start gap-3 mb-6">
                        <span className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-sm font-bold text-white rounded-full bg-navy-600">
                            {currentQuestion + 1}
                        </span>
                        <div
                            className="flex-1 pt-1 font-semibold prose-sm prose text-gray-900 max-w-none"
                            dangerouslySetInnerHTML={{ __html: question.question }}
                        />
                    </div>

                    {question.image_path && (
                        <img src={question.image_path} alt="Ilustrasi soal" className="object-contain mb-5 border rounded-lg max-h-64" />
                    )}

                    {question.type === 'multiple_choice' ? (
                        <div className="space-y-3">
                            {question.options.map((option, oIdx) => (
                                <button
                                    key={option.id}
                                    disabled={processing}
                                    onClick={() => handleAnswer(option.id)}
                                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${answers[question.id] === option.id
                                        ? 'border-navy-500 bg-navy-50'
                                        : 'border-gray-100 hover:border-navy-200 hover:bg-gray-50'
                                        } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all ${answers[question.id] === option.id
                                        ? 'border-navy-500 bg-navy-500 text-white'
                                        : 'border-gray-300 text-gray-500'
                                        }`}>
                                        {String.fromCharCode(65 + oIdx)}
                                    </div>
                                    <span className={`text-sm ${answers[question.id] === option.id ? 'text-navy-800 font-medium' : 'text-gray-700'
                                        }`}>
                                        {option.option_text}
                                    </span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <textarea
                            className="w-full p-3 text-sm border-gray-300 rounded-lg focus:ring-navy-500 focus:border-navy-500"
                            rows="6"
                            placeholder="Ketik jawaban Anda di sini..."
                            value={answers[question.id] || ''}
                            onChange={(e) => handleAnswer(e.target.value)}
                            disabled={processing}
                        />
                    )}

                    {/* Navigation arrows */}
                    <div className="flex items-center justify-between pt-6 mt-8 border-t border-gray-100">
                        <button
                            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                            disabled={currentQuestion === 0 || processing}
                            className="flex items-center gap-2 text-sm btn-secondary disabled:opacity-40"
                        >
                            <ChevronLeft className="w-4 h-4" /> Sebelumnya
                        </button>

                        {currentQuestion === totalQuestions - 1 ? (
                            <button
                                onClick={handleSubmit}
                                disabled={(!allAnswered && timeLeft !== 0) || processing}
                                className="flex items-center gap-2 text-sm btn-gold disabled:opacity-40"
                            >
                                <Send className="w-4 h-4" /> {processing ? 'Memproses...' : 'Kirim Jawaban'}
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentQuestion(Math.min(totalQuestions - 1, currentQuestion + 1))}
                                disabled={processing}
                                className="flex items-center gap-2 text-sm btn-primary"
                            >
                                Selanjutnya <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Right: Sidebar navigation (Exam Browser Style) */}
                <div className="flex-shrink-0 w-full space-y-4 lg:w-56">
                    <div className="p-4 bg-white border border-gray-200 shadow-sm rounded-xl">
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
                            <h3 className="text-sm font-bold text-gray-800">Navigasi Soal</h3>
                            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{totalQuestions} Soal</span>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                            {quiz.questions.map((q, idx) => (
                                <button
                                    key={q.id}
                                    onClick={() => setCurrentQuestion(idx)}
                                    disabled={processing}
                                    className={`aspect-square flex items-center justify-center rounded font-bold text-sm transition-all border-2 ${currentQuestion === idx
                                        ? 'bg-navy-600 text-white border-navy-600 shadow-md scale-105'
                                        : answers[q.id]
                                            ? 'bg-navy-100 text-navy-700 border-navy-200'
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-navy-300 hover:bg-navy-50'
                                        } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                        onClick={handleSubmit}
                        disabled={(!allAnswered && timeLeft !== 0) || processing}
                        className="flex items-center justify-center w-full gap-2 py-3 text-sm btn-gold disabled:opacity-40"
                    >
                        <Send className="w-4 h-4" /> {processing ? 'Memproses...' : 'Selesai & Kirim'}
                    </button>
                    {!allAnswered && (
                        <p className="text-xs text-center text-gray-400">
                            {Object.keys(answers).length}/{totalQuestions} soal terjawab
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}


export default function CoursePlayer({ courseData, initialLessonId }) {
    const course = courseData;
    const isExpired = !!course.isExpired;
    const allLessons = course.modules?.flatMap((m) => m.lessons) || [];

    // Temukan lesson awal jika ada initialLessonId
    const initialLesson = initialLessonId
        ? allLessons.find(l => l.id.toString() === initialLessonId.toString())
        : null;

    // PERBAIKAN: simpan hanya ID, bukan objek lesson.
    // Objek lesson diambil dari props terbaru di setiap render, jadi setelah
    // submit kuis (Inertia mengirim props baru) data attempt langsung segar.
    const [activeLessonId, setActiveLessonId] = useState(
        initialLesson?.id ?? allLessons[0]?.id ?? null
    );
    const [quizActive, setQuizActive] = useState(false);
    const activeLesson = allLessons.find((l) => l.id === activeLessonId) || null;

    if (!activeLesson) {
        return (
            <CoursePlayerLayout
                course={course}
                modules={course.modules || []}
                activeLesson={null}
                onSelectLesson={() => { }}
            >
                <div className="flex flex-col items-center justify-center h-full px-4 py-32 text-center">
                    <div className="flex items-center justify-center w-20 h-20 mb-4 bg-gray-100 rounded-full">
                        <AlertCircle className="w-10 h-10 text-gray-400" />
                    </div>
                    <h2 className="mb-2 text-xl font-bold text-gray-900">Materi Belum Tersedia</h2>
                    <p className="max-w-sm text-sm text-gray-500">Pelatihan ini belum memiliki modul atau materi apapun.</p>
                </div>
            </CoursePlayerLayout>
        );
    }

    const currentIndex = allLessons.findIndex((l) => l.id === activeLesson.id);

    const handlePrev = () => {
        if (currentIndex > 0) setActiveLessonId(allLessons[currentIndex - 1].id);
    };
    const handleNext = () => {
        if (currentIndex < allLessons.length - 1) setActiveLessonId(allLessons[currentIndex + 1].id);
    };

    const isQuizActive =
        activeLesson?.type === 'quiz' && quizActive;

    const renderContent = () => {
        switch (activeLesson.type) {
            case 'video':
            case 'zoom':
                return <VideoContent lesson={activeLesson} />;
            case 'document':
                return <PdfContent lesson={activeLesson} />;
            case 'quiz':
                return (
                    <QuizContent
                        lesson={activeLesson}
                        courseId={course.id}
                        isExpired={isExpired}
                        onQuizActiveChange={setQuizActive}
                    />
                );
            default:
                return <VideoContent lesson={activeLesson} />;
        }
    };

    return (
        <>
            <Head title={activeLesson.title} />
            <CoursePlayerLayout
                course={course}
                modules={course.modules}
                activeLesson={activeLesson}
                onSelectLesson={(lesson) => {
                    if (quizActive && lesson.id !== activeLesson.id) {
                        alert(
                            '⚠️ Kuis sedang berlangsung.\n\n' +
                            'Anda tidak dapat berpindah ke materi lain sebelum menyelesaikan dan mengirim kuis.'
                        );
                        return;
                    }

                    setActiveLessonId(lesson.id);
                }}
            >
                <div className="max-w-4xl p-4 pb-24 mx-auto sm:p-6 lg:p-8">
                    {isExpired && (
                        <div className="flex items-center gap-2 p-3 mb-4 text-sm border text-amber-700 border-amber-200 bg-amber-50 rounded-xl">
                            <AlertCircle className="flex-shrink-0 w-4 h-4" />
                            <span>
                                Masa kursus berakhir{course.deadline_at ? ` pada ${course.deadline_at}` : ''}. Kamu hanya bisa melihat materi.
                            </span>
                        </div>
                    )}

                    {renderContent()}

                    {/* Navigation between lessons */}
                    {activeLesson.type !== 'quiz' && (
                        <div className="flex flex-col justify-between gap-4 pt-6 mt-8 border-t border-gray-100 sm:flex-row sm:items-center">
                            <button
                                onClick={handlePrev}
                                disabled={currentIndex === 0}
                                className="justify-center w-full text-sm btn-secondary disabled:opacity-40 sm:w-auto"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Sebelumnya
                            </button>
                            <button
                                onClick={() => {
                                    if (!activeLesson.isCompleted && !isExpired) {
                                        import('@inertiajs/react').then(({ router }) => {
                                            router.post(route('course.lesson.complete', { course: course.id, lesson: activeLesson.id }), {}, {
                                                preserveScroll: true
                                            });
                                        });
                                    }
                                }}
                                disabled={activeLesson.isCompleted || isExpired}
                                className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-colors border w-full sm:w-auto ${(activeLesson.isCompleted || isExpired)
                                    ? 'text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed'
                                    : 'text-green-600 bg-green-50 hover:bg-green-100 border-green-200'
                                    }`}
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                {activeLesson.isCompleted ? 'Sudah Selesai' : 'Tandai Selesai'}
                            </button>

                            <button
                                onClick={handleNext}
                                disabled={currentIndex === allLessons.length - 1}
                                className="justify-center w-full text-sm btn-primary disabled:opacity-40 sm:w-auto"
                            >
                                Selanjutnya
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Diskusi per Sesi */}
                    <DiscussionPanel
                        key={activeLesson.id}
                        lessonId={activeLesson.id}
                        lessonTitle={activeLesson.title}
                    />
                </div>
            </CoursePlayerLayout>
        </>
    );
}