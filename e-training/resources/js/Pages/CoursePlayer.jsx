import { Head, router } from '@inertiajs/react';
import CoursePlayerLayout from '@/Layouts/CoursePlayerLayout';
import DiscussionPanel from '@/Components/DiscussionPanel';
import useExamLock from '@/hooks/useExamLock';
import { useState, useEffect, useRef } from 'react';
import {
    Play,
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
import QuizReviewPage from '@/Components/QuizReviewPage';

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
                        className="absolute inset-0 w-full h-full border-0"
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

const FILE_ICONS = {
    'application/pdf': '📄',
    'application/msword': '📝',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
    'application/vnd.ms-powerpoint': '📊',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📊',
    'application/vnd.ms-excel': '📊',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
};

function PdfContent({ lesson }) {
    const hasFile = (lesson.files?.length ?? 0) > 0;
    const [selectedFileIdx, setSelectedFileIdx] = useState(0);
    const [showPreview, setShowPreview] = useState(false);

    const selectedFile = hasFile ? lesson.files[selectedFileIdx] : null;
    const fileUrl = selectedFile ? selectedFile.file_path : null;

    // Detect if it's a PDF by mime_type OR by file extension
    const isPdf = Boolean(
        selectedFile?.mime_type === 'application/pdf' ||
        selectedFile?.original_name?.toLowerCase().endsWith('.pdf')
    );

    // Satu fungsi dengan if berurutan menggantikan ternary bersarang
    const renderViewer = () => {
        if (isPdf && fileUrl && showPreview) {
            return (
                <iframe
                    key={fileUrl}
                    src={fileUrl}
                    className="w-full border border-t-0 border-gray-200 rounded-b-xl"
                    style={{ height: '75vh', minHeight: '500px' }}
                    title={selectedFile?.original_name || lesson.title}
                />
            );
        }

        if (isPdf && fileUrl) {
            return (
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
            );
        }

        if (hasFile && fileUrl) {
            return (
                <div className="flex flex-col items-center justify-center p-8 text-center bg-white border border-t-0 border-gray-200 rounded-b-xl">
                    <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 text-4xl rounded-2xl bg-blue-50">
                        {FILE_ICONS[selectedFile?.mime_type] || '📄'}
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
            );
        }

        return (
            <div className="flex flex-col items-center justify-center p-10 text-center bg-white border border-t-0 border-gray-200 rounded-b-xl">
                <FileText className="w-10 h-10 mb-3 text-gray-200" />
                <p className="text-sm font-medium text-gray-500">Dokumen belum diunggah</p>
                <p className="mt-1 text-xs text-gray-400">Instruktur belum mengunggah file untuk materi ini.</p>
            </div>
        );
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
                            <span>{FILE_ICONS[f.mime_type] || '📄'}</span>
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
            {renderViewer()}

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

// ───────────────────────────────────────────────────────────────────────────
// Helper murni (tanpa state React), dipisah dari handleSubmit supaya
// logikanya gampang dibaca dan dites terpisah.
// ───────────────────────────────────────────────────────────────────────────

function buildAnswerPayload(quiz, answers) {
    const payload = {};
    quiz.questions.forEach((q) => {
        payload[q.id] = answers[q.id] ?? null;
    });
    return payload;
}

// Percobaan terbaru = id terbesar (tidak bergantung urutan array dari backend)
function pickLatestAttempt(attempts) {
    return attempts.reduce((best, a) => (!best || a.id > best.id ? a : best), null);
}

// Ambil daftar attempt terbaru dari props Inertia yang baru diterima setelah submit,
// supaya tidak bergantung pada kapan React selesai re-render (tidak bisa basi).
function findFreshAttempts(page, lessonId) {
    const freshLesson = page?.props?.courseData?.modules
        ?.flatMap((m) => m.lessons)
        ?.find((l) => l.id === lessonId);
    return freshLesson?.quiz?.attempts || [];
}

// Blokir klik-kanan dan salin-tempel selama kuis (tanpa alert, karena alert
// bisa memicu event blur dan dihitung sebagai pelanggaran palsu)
function preventCheat(e) {
    e.preventDefault();
}

// Status satu percobaan: label dan warna teks (menggantikan ternary bersarang)
function getAttemptStatus(attempt) {
    if (attempt.is_passed === null) {
        return { label: 'Menunggu Penilaian', colorClass: 'text-blue-500' };
    }
    if (attempt.is_passed) {
        return { label: 'Lulus', colorClass: 'text-green-600' };
    }
    return { label: 'Belum Lulus', colorClass: 'text-red-500' };
}

// Warna timer berdasarkan sisa waktu
function getTimerClass(timeLeft) {
    if (timeLeft <= 60) return 'bg-red-50 text-red-600 border-red-200 animate-pulse';
    if (timeLeft <= 300) return 'bg-amber-50 text-amber-600 border-amber-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
}

// Warna tombol navigasi soal: aktif / sudah dijawab / belum dijawab
function getNavButtonClass(isCurrent, isAnswered) {
    if (isCurrent) return 'bg-navy-600 text-white border-navy-600 shadow-md scale-105';
    if (isAnswered) return 'bg-navy-100 text-navy-700 border-navy-200';
    return 'bg-white text-gray-700 border-gray-200 hover:border-navy-300 hover:bg-navy-50';
}

// Status jendela waktu kuis berdasarkan jam server: 'upcoming' | 'open' | 'closed'
function getQuizWindow(quiz, serverNow) {
    const start = quiz.start_at ? Date.parse(quiz.start_at) : null;
    const end = quiz.deadline_at ? Date.parse(quiz.deadline_at) : null;

    if (start !== null && serverNow < start) return 'upcoming';
    if (end !== null && serverNow > end) return 'closed';
    return 'open';
}

// Status jendela waktu modul berdasarkan jam server: 'upcoming' | 'open' | 'closed'
function getModuleWindow(module, serverNow) {
    const start = module.start_at ? Date.parse(module.start_at) : null;
    const end = module.end_at ? Date.parse(module.end_at) : null;

    if (start !== null && serverNow < start) return 'upcoming';
    if (end !== null && serverNow > end) return 'closed';
    return 'open';
}

function allModulesHaveSchedule(modules) {
    return (modules || []).some((m) => m.start_at || m.end_at);
}

// Batas waktu pengerjaan (dalam jam perangkat): yang lebih awal antara
// durasi kuis dan tenggat kuis. Contoh: durasi 90 menit, mulai 11.00, tenggat 12.00 -> 12.00.
function computeAttemptDeadline(quiz, clockOffset, ignoreDeadline = false) {
    const serverNow = Date.now() + clockOffset;
    const minutes = Number(quiz.duration_minutes);
    const limits = [];

    if (minutes > 0) limits.push(serverNow + minutes * 60 * 1000);
    if (quiz.deadline_at && !ignoreDeadline) limits.push(Date.parse(quiz.deadline_at));

    return limits.length > 0 ? Math.min(...limits) - clockOffset : null;
}

// ───────────────────────────────────────────────────────────────────────────
// Custom hooks, memisahkan efek samping (timer & anti-nyontek) dari
// render logic supaya tidak menumpuk kompleksitas di satu komponen.
// Anti-nyontek (layar penuh + kunci) ada di hooks/useExamLock.js
// ───────────────────────────────────────────────────────────────────────────

// Hitung mundur: disimpan sebagai batas waktu (timestamp), bukan sisa detik,
// supaya tetap akurat walau tab di background. Memanggil submitRef.current(true)
// sekali saat waktu benar-benar habis.
function useQuizCountdown(deadline, active, submitRef) {
    const [timeLeft, setTimeLeft] = useState(null);
    const firedRef = useRef(false);

    useEffect(() => {
        if (!active || deadline === null) return undefined;

        firedRef.current = false;

        const tick = () => {
            const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
            setTimeLeft(remaining);

            if (remaining <= 0 && !firedRef.current) {
                firedRef.current = true;
                submitRef.current?.(true);
            }
        };

        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [active, deadline, submitRef]);

    return timeLeft;
}

// Jam server saat ini (ms). Diperbarui tiap detik selama `active`, supaya status
// "belum dibuka / sudah ditutup" di halaman awal kuis ikut berubah tanpa refresh.
function useServerNow(clockOffset, active) {
    const [now, setNow] = useState(() => Date.now() + clockOffset);

    useEffect(() => {
        if (!active) return undefined;

        const tick = () => setNow(Date.now() + clockOffset);
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [active, clockOffset]);

    return now;
}

// ───────────────────────────────────────────────────────────────────────────
// Sub-komponen kuis: masing-masing menangani satu "layar", supaya QuizContent
// tidak lagi memuat semua kondisi render sekaligus.
// ───────────────────────────────────────────────────────────────────────────

// Satu baris info kuis (gaya LMS): label di kiri, nilai di kanan
function QuizInfoRow({ label, value }) {
    return (
        <div className="flex flex-col gap-0.5 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <dt className="text-gray-500">{label}</dt>
            <dd className="font-semibold text-gray-800">{value}</dd>
        </div>
    );
}

// Aksi di bagian bawah intro: pesan (kursus berakhir, kuis belum dibuka / sudah ditutup,
// batas percobaan) atau tombol mulai
function QuizIntroAction({ isExpired, windowState, limitReached, attempts, quiz, onStart }) {
    if (isExpired) {
        return (
            <p className="text-sm font-medium text-amber-600">
                Masa kursus telah berakhir. Kuis tidak dapat dikerjakan, tapi riwayat nilai tetap bisa dilihat.
            </p>
        );
    }

    if (windowState === 'closed') {
        return (
            <p className="text-sm font-medium text-red-500">
                Kuis ini sudah ditutup pada {quiz.deadline_at_label}. Hubungi admin atau pengajar jika membutuhkan keringanan.
            </p>
        );
    }

    if (windowState === 'upcoming') {
        return (
            <p className="text-sm font-medium text-amber-600">
                Kuis ini akan dibuka pada {quiz.start_at_label}.
            </p>
        );
    }

    if (limitReached) {
        return (
            <p className="text-sm font-medium text-red-500">
                Batas percobaan tercapai ({attempts.length}/{quiz.max_attempts}). Hubungi admin atau pengajar jika membutuhkan keringanan.
            </p>
        );
    }

    return (
        <button
            onClick={onStart}
            className="flex items-center justify-center gap-2 px-8 py-3 mx-auto text-sm btn-gold"
        >
            {attempts.length > 0 ? (
                <><RotateCcw className="w-4 h-4" /> <span>Ulangi Kuis</span></>
            ) : (
                <><Play className="w-4 h-4" /> <span>Mulai Kuis</span></>
            )}
        </button>
    );
}

function QuizIntro({ lesson, quiz, attempts, isExpired, windowState, limitReached, onStart, courseId }) {
    const [reviewAttemptId, setReviewAttemptId] = useState(null);
    const reviewOpen = (quiz.review_mode ?? 'off') !== 'off';

    if (reviewAttemptId) {
        return (
            <QuizReviewPage
                courseId={courseId}
                quizId={quiz.id}
                attemptId={reviewAttemptId}
                title={lesson.title}
                onBack={() => setReviewAttemptId(null)}
            />
        );
    }

    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="p-8 text-center border border-gray-200 shadow-sm card">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full">
                    <HelpCircle className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="mb-5 text-xl font-bold text-gray-900">{lesson.title}</h2>

                <dl className="px-4 mb-4 text-left border border-gray-200 divide-y divide-gray-100 rounded-xl">
                    <QuizInfoRow label="Jumlah soal" value={`${quiz.questions.length} soal`} />
                    <QuizInfoRow label="Tipe ujian" value={quiz.exam_type === 'open_book' ? 'Open Book' : 'Close Book'} />
                    <QuizInfoRow label="Percobaan diizinkan" value={quiz.max_attempts || 'Tanpa batas'} />
                    {quiz.start_at_label && <QuizInfoRow label="Kuis dibuka pada" value={quiz.start_at_label} />}
                    {quiz.deadline_at_label && <QuizInfoRow label="Kuis ditutup pada" value={quiz.deadline_at_label} />}
                    <QuizInfoRow label="Batas waktu" value={quiz.duration_minutes ? `${quiz.duration_minutes} menit` : 'Tanpa batas'} />
                    <QuizInfoRow label="Nilai minimum lulus" value={quiz.passing_score} />
                </dl>
                <p className="mb-4 text-sm text-gray-600">
                    {quiz.exam_type === 'open_book'
                        ? 'Anda boleh membuka materi melalui sidebar dan berpindah tab. Jawaban tetap tersimpan saat melihat materi, dan waktu pengerjaan terus berjalan. Layar penuh tidak diwajibkan.'
                        : 'Kuis wajib dikerjakan dalam layar penuh. Keluar layar penuh atau berpindah tab dihitung sebagai pelanggaran. Setelah 3 pelanggaran, jawaban dikirim otomatis.'}
                </p>
                {quiz.has_override && (
                    <p className="mb-4 text-xs text-green-700">
                        Anda mendapat keringanan dari admin/pengajar untuk kuis ini.
                    </p>
                )}

                {Boolean(quiz.duration_minutes) && Boolean(quiz.deadline_at) && (
                    <p className="mb-6 text-xs text-gray-400">
                        Pengerjaan otomatis berakhir saat kuis ditutup, walaupun batas waktu belum habis.
                    </p>
                )}

                {attempts.length > 0 && (
                    <div className="p-4 mb-6 text-left border border-gray-200 bg-gray-50 rounded-xl">
                        <h3 className="mb-3 text-sm font-bold text-gray-800">Riwayat Percobaan Anda</h3>
                        <div className="space-y-2">
                            {attempts.map((attempt, idx) => {
                                const status = getAttemptStatus(attempt);
                                const canReview = reviewOpen && attempt.is_finished;
                                const Card = canReview ? 'button' : 'div';

                                return (
                                    <Card
                                        key={attempt.id}
                                        {...(canReview ? { type: 'button', onClick: () => setReviewAttemptId(attempt.id) } : {})}
                                        className={`flex items-center justify-between w-full p-3 text-left bg-white border border-gray-100 rounded-lg ${canReview ? 'cursor-pointer hover:border-navy-300 hover:bg-navy-50/40' : ''}`}
                                    >
                                        <div>
                                            <p className="text-xs text-gray-500">Percobaan #{attempts.length - idx} &bull; {attempt.created_at}</p>
                                            <p className={`text-sm font-bold mt-0.5 ${status.colorClass}`}>
                                                {status.label}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">Nilai</p>
                                            <p className="text-lg font-black text-gray-800">{attempt.is_passed === null ? '-' : attempt.score}</p>
                                            {canReview && <p className="text-[10px] font-bold text-navy-600">Lihat review</p>}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}

                <QuizIntroAction
                    isExpired={isExpired}
                    windowState={windowState}
                    limitReached={limitReached}
                    attempts={attempts}
                    quiz={quiz}
                    onStart={onStart}
                />
            </div>
        </div>
    );
}

function QuizEssayPendingResult({ onReset }) {
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
                <button onClick={onReset} className="flex items-center gap-2 mx-auto text-sm btn-primary">
                    <RotateCcw className="w-4 h-4" /> <span>Kembali</span>
                </button>
            </div>
        </div>
    );
}

function QuizScoreResult({ quiz, shownAttempt, autoSubmitted, onReset }) {
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
                <button onClick={onReset} className="flex items-center gap-2 mx-auto text-sm btn-primary">
                    <RotateCcw className="w-4 h-4" /> <span>Kembali</span>
                </button>
            </div>
        </div>
    );
}

function QuestionInput({ question, value, processing, onAnswer }) {
    if (question.type === 'multiple_choice' || question.type === 'true_false') {
        return (
            <div className="space-y-3">
                {question.options.map((option, oIdx) => (
                    <button
                        key={option.id}
                        disabled={processing}
                        onClick={() => onAnswer(option.id)}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${value === option.id
                            ? 'border-navy-500 bg-navy-50'
                            : 'border-gray-100 hover:border-navy-200 hover:bg-gray-50'
                            } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all ${value === option.id
                            ? 'border-navy-500 bg-navy-500 text-white'
                            : 'border-gray-300 text-gray-500'
                            }`}>
                            {String.fromCodePoint(65 + oIdx)}
                        </div>
                        <span className={`text-sm ${value === option.id ? 'text-navy-800 font-medium' : 'text-gray-700'}`}>
                            {option.option_text}
                        </span>
                    </button>
                ))}
            </div>
        );
    }

    if (question.type === 'short_answer') {
        return (
            <div>
                <input
                    type="text"
                    className="w-full p-3 text-sm border-gray-300 rounded-lg focus:ring-navy-500 focus:border-navy-500"
                    placeholder="Ketik jawaban singkat Anda..."
                    value={value || ''}
                    onChange={(e) => onAnswer(e.target.value)}
                    disabled={processing}
                    maxLength={255}
                />
                <p className="mt-1 text-xs text-right text-gray-400">
                    {(value || '').length}/255
                </p>
            </div>
        );
    }

    return (
        <textarea
            className="w-full p-3 text-sm border-gray-300 rounded-lg focus:ring-navy-500 focus:border-navy-500"
            rows="6"
            placeholder="Ketik jawaban Anda di sini..."
            value={value || ''}
            onChange={(e) => onAnswer(e.target.value)}
            disabled={processing}
        />
    );
}

function QuizTakingView({
    lesson,
    quiz,
    question,
    currentQuestion,
    totalQuestions,
    answers,
    allAnswered,
    processing,
    timeLeft,
    onAnswer,
    onClear,
    onNavigate,
    onSubmit,
}) {
    const canSubmit = (allAnswered || timeLeft === 0) && !processing;

    return (
        <div
            className="animate-fade-in"
            onContextMenu={quiz.exam_type === 'open_book' ? undefined : preventCheat}
            onCopy={quiz.exam_type === 'open_book' ? undefined : preventCheat}
            onPaste={quiz.exam_type === 'open_book' ? undefined : preventCheat}
            onCut={quiz.exam_type === 'open_book' ? undefined : preventCheat}
        >
            {/* Quiz Header */}
            <div className="flex items-center justify-between p-4 mb-6 card">
                <div>
                    <h2 className="text-sm font-bold text-gray-900">{lesson.title}</h2>
                    <p className="text-xs text-gray-500">Pertanyaan {currentQuestion + 1} dari {totalQuestions}</p>
                </div>
                {timeLeft !== null ? (
                    <div
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold tabular-nums border ${getTimerClass(timeLeft)}`}
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

                    <QuestionInput
                        question={question}
                        value={answers[question.id]}
                        processing={processing}
                        onAnswer={onAnswer}
                    />

                    {/* Navigation arrows */}
                    <div className="flex items-center justify-between pt-6 mt-8 border-t border-gray-100">
                        <button
                            onClick={() => onNavigate(Math.max(0, currentQuestion - 1))}
                            disabled={currentQuestion === 0 || processing}
                            className="flex items-center gap-2 text-sm btn-secondary disabled:opacity-40"
                        >
                            <ChevronLeft className="w-4 h-4" /> Sebelumnya
                        </button>

                        {Boolean(answers[question.id]) && (
                            <button
                                type="button"
                                onClick={onClear}
                                disabled={processing}
                                className="px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:text-red-500 disabled:opacity-40"
                            >
                                Hapus Jawaban
                            </button>
                        )}

                        {currentQuestion === totalQuestions - 1 ? (
                            <button
                                onClick={() => onSubmit()}
                                disabled={!canSubmit}
                                className="flex items-center gap-2 text-sm btn-gold disabled:opacity-40"
                            >
                                <Send className="w-4 h-4" /> <span>{processing ? 'Memproses...' : 'Kirim Jawaban'}</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => onNavigate(Math.min(totalQuestions - 1, currentQuestion + 1))}
                                disabled={processing}
                                className="flex items-center gap-2 text-sm btn-primary"
                            >
                                <span>Selanjutnya</span> <ChevronRight className="w-4 h-4" />
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
                                    onClick={() => onNavigate(idx)}
                                    disabled={processing}
                                    className={`aspect-square flex items-center justify-center rounded font-bold text-sm transition-all border-2 ${getNavButtonClass(currentQuestion === idx, Boolean(answers[q.id]))} ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                        onClick={() => onSubmit()}
                        disabled={!canSubmit}
                        className="flex items-center justify-center w-full gap-2 py-3 text-sm btn-gold disabled:opacity-40"
                    >
                        <Send className="w-4 h-4" /> <span>{processing ? 'Memproses...' : 'Selesai & Kirim'}</span>
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

// ───────────────────────────────────────────────────────────────────────────
// Komponen utama kuis. Sekarang hanya berisi: state, kalkulasi, dan beberapa
// "if (...) return <Komponen />" — logika per layar sudah dipindah ke
// komponen di atas, dan efek samping (timer, kunci ujian) dipindah ke hook.
// ───────────────────────────────────────────────────────────────────────────

function QuizContent({ lesson, courseId, isExpired, clockOffset, bypassSchedule = false, onQuizActiveChange, isVisible = true, onReturnToQuiz }) {
    const [drawnQuestions, setDrawnQuestions] = useState(null);
    const quiz = lesson.quiz ? { ...lesson.quiz, questions: drawnQuestions ?? lesson.quiz.questions } : null;
    const isCloseBook = quiz?.exam_type !== 'open_book';
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [started, setStarted] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState(null);
    const [deadline, setDeadline] = useState(null);
    const [autoSubmitted, setAutoSubmitted] = useState(false);

    const submitRef = useRef(null); // selalu menunjuk handleSubmit terbaru

    const handleSubmit = (auto = false) => {
        // onClick mengirim event sebagai argumen, jadi hanya nilai `true` yang dianggap otomatis
        const isAuto = auto === true;

        if (processing) return;
        if (!isAuto && !allAnswered && timeLeft !== 0) return;

        if (isAuto) setAutoSubmitted(true);
        setProcessing(true);

        const payload = buildAnswerPayload(quiz, answers);

        router.post(route('courses.quizzes.submit', { course: courseId, quiz: quiz.id }), {
            answers: payload
        }, {
            preserveScroll: true,
            onSuccess: (page) => {
                onQuizActiveChange(false);
                const freshAttempts = findFreshAttempts(page, lesson.id);
                setResult(pickLatestAttempt(freshAttempts));
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
    };

    // Selalu simpan handleSubmit terbaru, supaya hook timer memanggil versi yang
    // tahu nilai `answers` dan `timeLeft` paling baru, bukan versi lama (closure basi).
    submitRef.current = handleSubmit;

    const timeLeft = useQuizCountdown(deadline, started && !submitted, submitRef);
    const { isFullscreen, violations, warning, enterFullscreen, dismissWarning } = useExamLock({
        active: isCloseBook && started && !submitted,
        maxViolations: 3,
        onLimitReached: () => submitRef.current?.(true), // kumpulkan otomatis
    });
    const now = useServerNow(clockOffset, !started && !submitted);

    if (!quiz?.questions?.length) {
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
    const windowState = bypassSchedule ? 'open' : getQuizWindow(quiz, now);

    const handleAnswer = (value) => {
        if (submitted || processing) return;
        setAnswers({ ...answers, [question.id]: value });
    };

    const handleClearAnswer = () => {
        if (submitted || processing) return;
        setAnswers((prev) => {
            const next = { ...prev };
            delete next[question.id];
            return next;
        });
    };

    const handleStart = () => {
        if (processing || (!bypassSchedule && getQuizWindow(quiz, Date.now() + clockOffset) !== 'open')) return;
        if (isCloseBook) enterFullscreen(); // harus langsung dari klik, sebelum request apa pun
        const begin = () => {
            setAutoSubmitted(false);
            setDeadline(computeAttemptDeadline(quiz, clockOffset, bypassSchedule));
            setStarted(true);
            onQuizActiveChange(true);
        };
        if (!quiz.has_random_questions) { begin(); return; }
        setProcessing(true);
        router.post(route('courses.quizzes.start', { course: courseId, quiz: quiz.id }), {}, {
            preserveScroll: true,
            onSuccess: page => {
                const freshLesson = page.props.courseData.modules.flatMap(module => module.lessons).find(item => item.id === lesson.id);
                setDrawnQuestions(freshLesson.quiz.questions);
                begin();
            },
            onError: errors => alert(Object.values(errors).join('\n')),
            onFinish: () => setProcessing(false),
        });
    };

    const handleReset = () => {
        setDrawnQuestions(null);
        setAnswers({});
        setResult(null);
        setDeadline(null);
        setSubmitted(false);
        setStarted(false); // Kembali ke halaman awal
        setCurrentQuestion(0);
    };

    const latestAttempt = pickLatestAttempt(attempts);

    // Batas percobaan (max_attempts dikirim dari controller)
    const limitReached = !!quiz.max_attempts && attempts.length >= quiz.max_attempts;

    // Tetap mounted saat peserta membaca materi: jawaban, urutan soal acak,
    // deadline, dan auto-submit berjalan dalam sesi kuis yang sama.
    if (!isVisible) {
        if (!started || submitted) return null;

        return (
            <section aria-label="Kuis Open Book sedang berlangsung" className="sticky z-30 flex flex-wrap items-center justify-between gap-3 p-4 mb-6 border shadow-sm top-3 rounded-xl border-navy-200 bg-navy-50">
                <div className="min-w-0">
                    <p className="text-sm font-bold text-navy-900">{lesson.title} · Open Book</p>
                    <p className="mt-1 text-xs text-navy-700">
                        {Object.keys(answers).length}/{totalQuestions} soal terjawab. Jawaban tersimpan selama melihat materi; waktu tetap berjalan.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <span aria-label="Sisa waktu kuis" className={`flex items-center gap-2 px-3 py-2 text-sm font-bold border rounded-lg tabular-nums ${timeLeft === null ? 'bg-white text-gray-600 border-gray-200' : getTimerClass(timeLeft)}`}>
                        <Clock className="w-4 h-4" />
                        {timeLeft === null ? 'Tanpa batas waktu' : formatTime(timeLeft)}
                    </span>
                    <button type="button" onClick={onReturnToQuiz} className="text-sm btn-primary">
                        {processing ? 'Lihat Pengiriman Kuis' : 'Kembali ke Kuis'}
                    </button>
                </div>
            </section>
        );
    }

    if (!started && !submitted) {
        return (
            <QuizIntro
                courseId={courseId}
                lesson={lesson}
                quiz={quiz}
                attempts={attempts}
                isExpired={isExpired}
                windowState={windowState}
                limitReached={limitReached}
                onStart={handleStart}
            />
        );
    }

    if (submitted) {
        // Layar hasil ditentukan dari status attempt (dari server),
        // bukan dari quiz_mode. is_passed null = masih menunggu koreksi essay.
        const shownAttempt = result ?? latestAttempt;

        if (shownAttempt?.is_passed === null) {
            return <QuizEssayPendingResult onReset={handleReset} />;
        }

        return (
            <QuizScoreResult
                quiz={quiz}
                shownAttempt={shownAttempt}
                autoSubmitted={autoSubmitted}
                onReset={handleReset}
            />
        );
    }

    return (
        <>
            {isCloseBook && (!isFullscreen || warning) && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white p-6">
                    <div className="max-w-md text-center">
                        <div className="mb-3 text-4xl">⚠️</div>
                        <h2 className="mb-2 text-xl font-black text-gray-800">Kuis Dikunci</h2>
                        <p className="mb-2 text-sm text-gray-600">
                            {warning || 'Kuis harus dikerjakan dalam mode layar penuh.'}
                        </p>
                        <p className="mb-2 text-xs font-bold text-red-600">
                            Pelanggaran: {violations} dari 3. Setelah 3 kali, kuis dikumpulkan otomatis.
                        </p>
                        <p className="mb-5 text-xs text-gray-400">Waktu pengerjaan tetap berjalan.</p>
                        <button
                            onClick={async () => { await enterFullscreen(); dismissWarning(); }}
                            className="px-6 py-2.5 text-sm font-bold text-white rounded-lg bg-navy-600 hover:bg-navy-700"
                        >
                            Kembali ke Layar Penuh
                        </button>
                    </div>
                </div>
            )}
            <QuizTakingView
                lesson={lesson}
                quiz={quiz}
                question={question}
                currentQuestion={currentQuestion}
                totalQuestions={totalQuestions}
                answers={answers}
                allAnswered={allAnswered}
                processing={processing}
                timeLeft={timeLeft}
                onAnswer={handleAnswer}
                onClear={handleClearAnswer}
                onNavigate={setCurrentQuestion}
                onSubmit={handleSubmit}
            />
        </>
    );
}

function useRefreshOpenedModules(modules, serverNow, now) {
    const refreshed = useRef(new Set());

    useEffect(() => {
        const serverTime = Date.parse(serverNow);
        const newlyOpened = modules.filter((module) => {
            const start = Date.parse(module.start_at);
            return module.locked_reason && start > serverTime && start <= now && !refreshed.current.has(module.id);
        });
        if (newlyOpened.length === 0) return;

        newlyOpened.forEach((module) => refreshed.current.add(module.id));
        router.reload({ only: ['courseData'] });
    }, [modules, serverNow, now]);
}

function ModuleLockedNotice({ module, lesson }) {
    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="p-8 text-center border shadow-sm border-amber-200 card bg-amber-50/50">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100">
                    <Clock className="w-8 h-8 text-amber-600" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-gray-900">Materi Belum Bisa Diakses</h2>
                <p className="text-sm text-gray-600">
                    {lesson.locked_reason || module.locked_reason || `${module.title} akan dibuka pada ${module.start_at_label}.`}
                </p>
            </div>
        </div>
    );
}

// ───────────────────────────────────────────────────────────────────────────
// Helper murni untuk CoursePlayer (dipisah supaya komponen utama tetap ringkas)
// ───────────────────────────────────────────────────────────────────────────

function computeClockOffset(serverNow) {
    return serverNow ? Date.parse(serverNow) - Date.now() : 0;
}

function resolveInitialLessonId(allLessons, initialLessonId) {
    const initial = initialLessonId
        ? allLessons.find((l) => String(l.id) === String(initialLessonId))
        : null;
    return initial?.id ?? allLessons[0]?.id ?? null;
}

function findModuleOfLesson(modules, lessonId) {
    return modules?.find((m) => m.lessons.some((l) => l.id === lessonId));
}

// Mengembalikan pesan alasan kenapa pindah materi ditolak, atau null jika boleh
function getLessonSelectBlock({ course, lesson, runningQuizLesson, now }) {
    if (runningQuizLesson && lesson.id !== runningQuizLesson.id) {
        if (runningQuizLesson.quiz?.exam_type !== 'open_book') {
            return 'Kuis sedang berlangsung. Selesaikan dan kirim kuis sebelum berpindah materi.';
        }
        if (lesson.type === 'quiz') {
            return 'Selesaikan kuis yang sedang berlangsung sebelum membuka kuis lain. Anda tetap bisa melihat materi.';
        }
    }

    const targetModule = findModuleOfLesson(course.modules, lesson.id);
    if (targetModule && !course.can_bypass_schedule && getModuleWindow(targetModule, now) === 'upcoming') {
        return `Modul ini baru dibuka pada ${targetModule.start_at_label}.`;
    }

    return null;
}

function getLessonAccess({ course, activeLesson, isExpired, now }) {
    const activeModule = findModuleOfLesson(course.modules, activeLesson.id);
    const moduleWindow = activeModule && !course.can_bypass_schedule
        ? getModuleWindow(activeModule, now)
        : 'open';
    const hasLockReason = Boolean(activeModule?.locked_reason || activeLesson.locked_reason);
    const moduleLocked = hasLockReason || moduleWindow === 'upcoming';
    const cannotComplete = activeLesson.isCompleted || isExpired || moduleLocked || moduleWindow !== 'open';

    return { activeModule, moduleLocked, cannotComplete };
}

function shouldShowDiscussion({ course, lesson, moduleLocked, quizActive }) {
    if (moduleLocked) return false;
    if (lesson.type !== 'quiz') return true;

    const hasAttempts = (lesson.quiz?.attempts?.length ?? 0) > 0;
    const hasCompletedQuiz = Boolean(course.can_bypass_schedule || lesson.isCompleted || hasAttempts);
    return !quizActive && hasCompletedQuiz;
}

// Kuis yang harus tetap ter-mount: yang sedang berjalan + kuis yang sedang dibuka
function getMountedQuizLessons(allLessons, runningQuizLessonId, activeLesson, moduleLocked) {
    return allLessons.filter((lesson) => {
        if (lesson.id === runningQuizLessonId) return true;
        return lesson.id === activeLesson.id && lesson.type === 'quiz' && !moduleLocked;
    });
}

// State kuis yang sedang berjalan + handler dari QuizContent
function useRunningQuiz(setActiveLessonId) {
    const [runningQuizLessonId, setRunningQuizLessonId] = useState(null);

    const handleQuizActiveChange = (lessonId, active) => {
        if (active) {
            setRunningQuizLessonId(lessonId);
            return;
        }
        setRunningQuizLessonId(null);
        // Auto-submit saat membaca materi juga membuka hasil kuis.
        setActiveLessonId(lessonId);
    };

    return { runningQuizLessonId, handleQuizActiveChange };
}

// ───────────────────────────────────────────────────────────────────────────
// Sub-komponen CoursePlayer
// ───────────────────────────────────────────────────────────────────────────

function ExpiredNotice({ deadlineAt }) {
    return (
        <div className="flex items-center gap-2 p-3 mb-4 text-sm border text-amber-700 border-amber-200 bg-amber-50 rounded-xl">
            <AlertCircle className="flex-shrink-0 w-4 h-4" />
            <span>
                Masa kursus berakhir{deadlineAt ? ` pada ${deadlineAt}` : ''}. Kamu hanya bisa melihat materi.
            </span>
        </div>
    );
}

function EmptyCoursePlayer({ course }) {
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

function LessonContent({ lesson, module, showLocked }) {
    if (showLocked) return <ModuleLockedNotice module={module} lesson={lesson} />;

    switch (lesson.type) {
        case 'document':
            return <PdfContent lesson={lesson} />;
        case 'quiz':
            return null; // Sesi kuis dirender terpisah agar tetap hidup saat melihat materi.
        default:
            return <VideoContent lesson={lesson} />; // video, zoom, dan tipe lain
    }
}

function LessonNavigation({ lesson, currentIndex, total, cannotComplete, onPrev, onNext, onComplete }) {
    const completeClass = cannotComplete
        ? 'text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed'
        : 'text-green-600 bg-green-50 hover:bg-green-100 border-green-200';

    return (
        <div className="flex flex-col justify-between gap-4 pt-6 mt-8 border-t border-gray-100 sm:flex-row sm:items-center">
            <button
                onClick={onPrev}
                disabled={currentIndex === 0}
                className="justify-center w-full text-sm btn-secondary disabled:opacity-40 sm:w-auto"
            >
                <ChevronLeft className="w-4 h-4" />
                Sebelumnya
            </button>
            <button
                onClick={onComplete}
                disabled={cannotComplete}
                className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-colors border w-full sm:w-auto ${completeClass}`}
            >
                <CheckCircle2 className="w-4 h-4" />
                {lesson.isCompleted ? 'Sudah Selesai' : 'Tandai Selesai'}
            </button>
            <button
                onClick={onNext}
                disabled={currentIndex === total - 1}
                className="justify-center w-full text-sm btn-primary disabled:opacity-40 sm:w-auto"
            >
                Selanjutnya
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}

// ───────────────────────────────────────────────────────────────────────────
// Komponen utama
// ───────────────────────────────────────────────────────────────────────────

export default function CoursePlayer({ courseData, initialLessonId }) {
    const course = courseData;
    const isExpired = !!course.isExpired;
    const allLessons = course.modules?.flatMap((m) => m.lessons) || [];

    // Simpan hanya ID, bukan objek lesson.
    // Objek lesson diambil dari props terbaru di setiap render, jadi setelah
    // submit kuis (Inertia mengirim props baru) data attempt langsung segar.
    const [activeLessonId, setActiveLessonId] = useState(
        () => resolveInitialLessonId(allLessons, initialLessonId)
    );
    const { runningQuizLessonId, handleQuizActiveChange } = useRunningQuiz(setActiveLessonId);
    // Selisih jam server dan jam perangkat, supaya batas waktu kuis tidak bergantung jam perangkat
    const [clockOffset] = useState(() => computeClockOffset(course.server_now));
    const hasModuleSchedule = allModulesHaveSchedule(course.modules);
    const now = useServerNow(clockOffset, hasModuleSchedule);
    useRefreshOpenedModules(course.modules || [], course.server_now, now);

    const activeLesson = allLessons.find((l) => l.id === activeLessonId) || null;
    const runningQuizLesson = allLessons.find((l) => l.id === runningQuizLessonId) || null;
    const quizActive = runningQuizLesson !== null;
    const isOpenBookActive = runningQuizLesson?.quiz?.exam_type === 'open_book';

    if (!activeLesson) return <EmptyCoursePlayer course={course} />;

    const currentIndex = allLessons.findIndex((l) => l.id === activeLesson.id);
    const { activeModule, moduleLocked, cannotComplete } = getLessonAccess({ course, activeLesson, isExpired, now });
    const showDiscussion = shouldShowDiscussion({ course, lesson: activeLesson, moduleLocked, quizActive });

    const handleSelectLesson = (lesson) => {
        const blockMessage = getLessonSelectBlock({ course, lesson, runningQuizLesson, now });
        if (blockMessage) {
            alert(blockMessage);
            return;
        }
        setActiveLessonId(lesson.id);
    };

    const handlePrev = () => handleSelectLesson(allLessons[currentIndex - 1]);
    const handleNext = () => handleSelectLesson(allLessons[currentIndex + 1]);

    const handleComplete = () => {
        if (cannotComplete) return;

        router.post(
            route('course.lesson.complete', { course: course.id, lesson: activeLesson.id }),
            {},
            { preserveScroll: true }
        );
    };

    return (
        <>
            <Head title={activeLesson.title} />
            <CoursePlayerLayout
                course={course}
                modules={course.modules}
                activeLesson={activeLesson}
                serverNow={now}
                bypassSchedule={Boolean(course.can_bypass_schedule)}
                hideSidebar={quizActive && !isOpenBookActive}
                onSelectLesson={handleSelectLesson}
            >
                <div className="max-w-4xl p-4 pb-24 mx-auto sm:p-6 lg:p-8">
                    {isExpired && <ExpiredNotice deadlineAt={course.deadline_at} />}

                    {getMountedQuizLessons(allLessons, runningQuizLessonId, activeLesson, moduleLocked).map((lesson) => (
                        <QuizContent
                            key={`quiz-${lesson.id}`}
                            lesson={lesson}
                            courseId={course.id}
                            isExpired={isExpired}
                            clockOffset={clockOffset}
                            bypassSchedule={Boolean(course.can_bypass_schedule)}
                            isVisible={lesson.id === activeLesson.id}
                            onReturnToQuiz={() => setActiveLessonId(lesson.id)}
                            onQuizActiveChange={(active) => handleQuizActiveChange(lesson.id, active)}
                        />
                    ))}

                    <LessonContent
                        lesson={activeLesson}
                        module={activeModule}
                        showLocked={moduleLocked && activeLesson.id !== runningQuizLessonId}
                    />

                    {activeLesson.type !== 'quiz' && (
                        <LessonNavigation
                            lesson={activeLesson}
                            currentIndex={currentIndex}
                            total={allLessons.length}
                            cannotComplete={cannotComplete}
                            onPrev={handlePrev}
                            onNext={handleNext}
                            onComplete={handleComplete}
                        />
                    )}

                    {/* Diskusi per Sesi */}
                    {showDiscussion && (
                        <DiscussionPanel
                            key={`discussion-${activeLesson.id}`}
                            lessonId={activeLesson.id}
                            lessonTitle={activeLesson.title}
                        />
                    )}
                </div>
            </CoursePlayerLayout>
        </>
    );
}
