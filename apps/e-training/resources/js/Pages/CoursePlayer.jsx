import { Head } from '@inertiajs/react';
import CoursePlayerLayout from '@/Layouts/CoursePlayerLayout';
import DiscussionPanel from '@/Components/DiscussionPanel';
import { useState, useEffect } from 'react';
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
                <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 rounded-2xl p-8 mb-6 text-center">
                    <div className="w-20 h-20 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Video className="w-10 h-10 text-sky-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">{lesson.title}</h2>
                    <p className="text-sm text-gray-500 mb-6">Sesi Zoom Meeting Online</p>
                    {lesson.video_url ? (
                        <a
                            href={lesson.video_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm shadow-lg shadow-sky-200"
                        >
                            <Video className="w-5 h-5" /> Bergabung ke Zoom Meeting
                        </a>
                    ) : (
                        <p className="text-sm text-gray-400 italic">Link Zoom belum tersedia</p>
                    )}
                </div>
                {lesson.description && (
                    <div className="px-1">
                        <h3 className="text-sm font-bold text-gray-700 mb-1">Instruksi / Deskripsi</h3>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{lesson.description}</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* YouTube Embed or Placeholder */}
            <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video mb-6">
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
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                        <Video className="w-12 h-12 text-white/30 mb-3" />
                        <p className="text-white/60 text-sm mb-1">{lesson.title}</p>
                        {lesson.video_url ? (
                            <a
                                href={lesson.video_url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                            >
                                Buka Video di Tab Baru
                            </a>
                        ) : (
                            <p className="text-white/40 text-xs mt-2">URL video belum diatur oleh instruktur</p>
                        )}
                    </div>
                )}
            </div>

            {/* Lesson Info */}
            <div className="px-1">
                <h2 className="text-lg font-bold text-gray-900 mb-2">{lesson.title}</h2>
                {lesson.description && (
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{lesson.description}</p>
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
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                                selectedFileIdx === idx
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
            <div className="bg-gray-50 border border-gray-200 rounded-t-xl px-4 py-3 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-700 truncate">
                        {selectedFile ? selectedFile.original_name : lesson.title}
                    </span>
                    {selectedFile && (
                        <span className="text-xs text-gray-400 flex-shrink-0">
                            ({Math.round((selectedFile.file_size_kb || 0) / 1024 * 10) / 10} MB)
                        </span>
                    )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
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
                    <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl p-10 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4 text-4xl">
                            📄
                        </div>
                        <h3 className="text-base font-bold text-gray-800 mb-1">{selectedFile?.original_name}</h3>
                        <p className="text-xs text-gray-400 mb-6 max-w-sm">
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
                <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4 text-4xl">
                        {fileIcons[selectedFile?.mime_type] || '📄'}
                    </div>
                    <h3 className="text-base font-bold text-gray-800 mb-1">{selectedFile?.original_name}</h3>
                    <p className="text-xs text-gray-400 mb-6 max-w-xs">
                        File {selectedFile?.mime_type?.split('/')[1]?.toUpperCase() || 'dokumen'} ini tidak dapat dipreview langsung di browser. 
                        Silakan unduh untuk membuka.
                    </p>
                    <a href={fileUrl} download={selectedFile?.original_name} className="inline-flex items-center gap-2 bg-navy-600 hover:bg-navy-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-colors">
                        <Download className="w-4 h-4" /> Unduh &amp; Buka
                    </a>
                </div>
            ) : (
                <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl p-10 flex flex-col items-center justify-center text-center">
                    <FileText className="w-10 h-10 text-gray-200 mb-3" />
                    <p className="text-sm font-medium text-gray-500">Dokumen belum diunggah</p>
                    <p className="text-xs text-gray-400 mt-1">Instruktur belum mengunggah file untuk materi ini.</p>
                </div>
            )}

            {/* Description */}
            {lesson.description && (
                <div className="mt-4 px-1">
                    <h3 className="text-sm font-bold text-gray-700 mb-1">Instruksi / Deskripsi</h3>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{lesson.description}</p>
                </div>
            )}
        </div>
    );
}


function QuizContent({ lesson, courseId }) {
    const quiz = lesson.quiz;
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [started, setStarted] = useState(false);
    const [processing, setProcessing] = useState(false);

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
                <p className="text-sm mt-1">Belum ada pertanyaan yang dibuat untuk kuis ini.</p>
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

    const handleSubmit = () => {
        if (!allAnswered || processing) return;
        setProcessing(true);
        
        import('@inertiajs/react').then(({ router }) => {
            router.post(route('courses.quizzes.submit', { course: courseId, quiz: quiz.id }), {
                answers: answers
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    setProcessing(false);
                    setSubmitted(true);
                },
                onError: () => {
                    setProcessing(false);
                    alert("Terjadi kesalahan saat mengirim jawaban.");
                }
            });
        });
    };

    const handleReset = () => {
        setAnswers({});
        setSubmitted(false);
        setStarted(false); // Kembali ke halaman awal
        setCurrentQuestion(0);
    };

    const latestAttempt = attempts.length > 0 ? attempts[0] : null;

    if (!started && !submitted) {
        return (
            <div className="animate-fade-in max-w-2xl mx-auto">
                <div className="card p-8 text-center border border-gray-200 shadow-sm">
                    <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                        <HelpCircle className="w-8 h-8 text-purple-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{lesson.title}</h2>
                    <div className="flex justify-center gap-6 text-sm text-gray-600 mb-6">
                        <span className="flex items-center gap-1.5"><FileText className="w-4 h-4"/> {quiz.questions.length} Soal</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4"/> {quiz.duration_minutes ? `${quiz.duration_minutes} Menit` : 'Tanpa Batas'}</span>
                        <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4"/> Min. {quiz.passing_score}</span>
                    </div>

                    {attempts.length > 0 && (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-left">
                            <h3 className="font-bold text-gray-800 text-sm mb-3">Riwayat Percobaan Anda</h3>
                            <div className="space-y-2">
                                {attempts.map((attempt, idx) => (
                                    <div key={attempt.id} className="flex items-center justify-between bg-white border border-gray-100 p-3 rounded-lg">
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

                    <button 
                        onClick={() => setStarted(true)} 
                        className="btn-gold flex items-center justify-center gap-2 mx-auto px-8 py-3 text-sm"
                    >
                        {attempts.length > 0 ? (
                            <><RotateCcw className="w-4 h-4" /> Ulangi Kuis</>
                        ) : (
                            <><Play className="w-4 h-4" /> Mulai Kuis</>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    if (submitted) {
        if (quiz.quiz_mode === 'essay' || quiz.quiz_mode === 'custom') {
            return (
                <div className="animate-fade-in max-w-2xl mx-auto">
                    <div className="card p-8 text-center border-2 border-blue-200 bg-blue-50/50 shadow-sm">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-blue-100">
                            <CheckCircle2 className="w-8 h-8 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            Jawaban Berhasil Terkirim!
                        </h2>
                        <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                            Kuis ini mengandung soal essay. Nilai akhir Anda akan muncul setelah instruktur selesai mengoreksi dan memberikan penilaian.
                        </p>
                        <button onClick={handleReset} className="btn-primary text-sm mx-auto flex items-center gap-2">
                            <RotateCcw className="w-4 h-4" /> Kembali
                        </button>
                    </div>
                </div>
            );
        }

        // Skor terbaru
        const score = latestAttempt ? latestAttempt.score : 0;
        const passed = score >= quiz.passing_score;
        return (
            <div className="animate-fade-in max-w-2xl mx-auto">
                <div className={`card p-8 text-center border-2 shadow-sm ${passed ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${passed ? 'bg-green-100' : 'bg-red-100'}`}>
                        {passed ? <CheckCircle2 className="w-8 h-8 text-green-600" /> : <AlertCircle className="w-8 h-8 text-red-600" />}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                        {passed ? 'Selamat! Anda Lulus! 🎉' : 'Belum Lulus'}
                    </h2>
                    <p className="text-sm text-gray-600 mb-6">
                        Skor Anda: <span className="font-bold text-lg">{score}</span> / 100
                        <br /><span className="text-xs text-gray-400">Skor minimum: {quiz.passing_score}</span>
                    </p>
                    <button onClick={handleReset} className="btn-primary text-sm mx-auto flex items-center gap-2">
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
            <div className="card p-4 mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-bold text-gray-900">{lesson.title}</h2>
                    <p className="text-xs text-gray-500">Pertanyaan {currentQuestion + 1} dari {totalQuestions}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    {quiz.duration_minutes ? `${quiz.duration_minutes} menit` : 'Tanpa batas waktu'}
                </div>
            </div>

            {/* 2-Column: Question Area + Sidebar Nav */}
            <div className="flex flex-col-reverse lg:flex-row gap-6">
                {/* Left: Question Content */}
                <div className="flex-1 bg-white border border-gray-200 rounded-xl p-6 min-h-[400px]">
                    <div className="flex items-start gap-3 mb-6">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-navy-600 text-white flex items-center justify-center text-sm font-bold">
                            {currentQuestion + 1}
                        </span>
                        <div
                            className="flex-1 prose prose-sm max-w-none text-gray-900 font-semibold pt-1"
                            dangerouslySetInnerHTML={{ __html: question.question }}
                        />
                    </div>

                    {question.image_path && (
                        <img src={question.image_path} alt="Ilustrasi soal" className="mb-5 rounded-lg max-h-64 object-contain border" />
                    )}

                    {question.type === 'multiple_choice' ? (
                        <div className="space-y-3">
                            {question.options.map((option, oIdx) => (
                                <button
                                    key={option.id}
                                    disabled={processing}
                                    onClick={() => handleAnswer(option.id)}
                                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                                        answers[question.id] === option.id
                                            ? 'border-navy-500 bg-navy-50'
                                            : 'border-gray-100 hover:border-navy-200 hover:bg-gray-50'
                                    } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all ${
                                        answers[question.id] === option.id
                                            ? 'border-navy-500 bg-navy-500 text-white'
                                            : 'border-gray-300 text-gray-500'
                                    }`}>
                                        {String.fromCharCode(65 + oIdx)}
                                    </div>
                                    <span className={`text-sm ${
                                        answers[question.id] === option.id ? 'text-navy-800 font-medium' : 'text-gray-700'
                                    }`}>
                                        {option.option_text}
                                    </span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <textarea
                            className="w-full border-gray-300 rounded-lg p-3 text-sm focus:ring-navy-500 focus:border-navy-500"
                            rows="6"
                            placeholder="Ketik jawaban Anda di sini..."
                            value={answers[question.id] || ''}
                            onChange={(e) => handleAnswer(e.target.value)}
                            disabled={processing}
                        />
                    )}

                    {/* Navigation arrows */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                        <button
                            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                            disabled={currentQuestion === 0 || processing}
                            className="btn-secondary text-sm disabled:opacity-40 flex items-center gap-2"
                        >
                            <ChevronLeft className="w-4 h-4" /> Sebelumnya
                        </button>

                        {currentQuestion === totalQuestions - 1 ? (
                            <button
                                onClick={handleSubmit}
                                disabled={!allAnswered || processing}
                                className="btn-gold text-sm disabled:opacity-40 flex items-center gap-2"
                            >
                                <Send className="w-4 h-4" /> {processing ? 'Memproses...' : 'Kirim Jawaban'}
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentQuestion(Math.min(totalQuestions - 1, currentQuestion + 1))}
                                disabled={processing}
                                className="btn-primary text-sm flex items-center gap-2"
                            >
                                Selanjutnya <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Right: Sidebar navigation (Exam Browser Style) */}
                <div className="w-full lg:w-56 flex-shrink-0 space-y-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                            <h3 className="font-bold text-gray-800 text-sm">Navigasi Soal</h3>
                            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{totalQuestions} Soal</span>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                            {quiz.questions.map((q, idx) => (
                                <button
                                    key={q.id}
                                    onClick={() => setCurrentQuestion(idx)}
                                    disabled={processing}
                                    className={`aspect-square flex items-center justify-center rounded font-bold text-sm transition-all border-2 ${
                                        currentQuestion === idx
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
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border-2 bg-navy-600 border-navy-600"></div><span>Sedang dikerjakan</span></div>
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border-2 bg-navy-100 border-navy-200"></div><span>Sudah dijawab</span></div>
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border-2 bg-white border-gray-200"></div><span>Belum dijawab</span></div>
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={!allAnswered || processing}
                        className="w-full btn-gold text-sm disabled:opacity-40 flex items-center justify-center gap-2 py-3"
                    >
                        <Send className="w-4 h-4" /> {processing ? 'Memproses...' : 'Selesai & Kirim'}
                    </button>
                    {!allAnswered && (
                        <p className="text-center text-xs text-gray-400">
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
    const allLessons = course.modules?.flatMap((m) => m.lessons) || [];
    
    // Temukan lesson awal jika ada initialLessonId
    const initialLesson = initialLessonId 
        ? allLessons.find(l => l.id.toString() === initialLessonId.toString())
        : null;

    const [activeLesson, setActiveLesson] = useState(initialLesson || allLessons[0] || null);

    if (!activeLesson) {
        return (
            <CoursePlayerLayout
                course={course}
                modules={course.modules || []}
                activeLesson={null}
                onSelectLesson={() => {}}
            >
                <div className="flex flex-col items-center justify-center h-full text-center py-32 px-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="w-10 h-10 text-gray-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Materi Belum Tersedia</h2>
                    <p className="text-sm text-gray-500 max-w-sm">Pelatihan ini belum memiliki modul atau materi apapun.</p>
                </div>
            </CoursePlayerLayout>
        );
    }

    const currentIndex = allLessons.findIndex((l) => l.id === activeLesson.id);

    const handlePrev = () => {
        if (currentIndex > 0) setActiveLesson(allLessons[currentIndex - 1]);
    };
    const handleNext = () => {
        if (currentIndex < allLessons.length - 1) setActiveLesson(allLessons[currentIndex + 1]);
    };

    const renderContent = () => {
        switch (activeLesson.type) {
            case 'video':
            case 'zoom':
                return <VideoContent lesson={activeLesson} />;
            case 'document':
                return <PdfContent lesson={activeLesson} />;
            case 'quiz':
                return <QuizContent lesson={activeLesson} courseId={course.id} />;
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
                onSelectLesson={setActiveLesson}
            >
                <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto pb-24">
                    {renderContent()}

                    {/* Navigation between lessons */}
                    {activeLesson.type !== 'quiz' && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-100">
                            <button
                                onClick={handlePrev}
                                disabled={currentIndex === 0}
                                className="btn-secondary text-sm disabled:opacity-40 w-full sm:w-auto justify-center"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Sebelumnya
                            </button>

                            <button 
                                onClick={() => {
                                    if (!activeLesson.isCompleted) {
                                        import('@inertiajs/react').then(({ router }) => {
                                            router.post(route('course.lesson.complete', { course: course.id, lesson: activeLesson.id }), {}, {
                                                preserveScroll: true
                                            });
                                        });
                                    }
                                }}
                                disabled={activeLesson.isCompleted}
                                className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-colors border w-full sm:w-auto ${
                                    activeLesson.isCompleted
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
                                className="btn-primary text-sm disabled:opacity-40 w-full sm:w-auto justify-center"
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
