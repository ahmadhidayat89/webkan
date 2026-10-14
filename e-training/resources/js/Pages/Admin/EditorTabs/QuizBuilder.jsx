import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { CheckCircle2, Image as ImageIcon, Plus, Trash2, Save, GripVertical } from 'lucide-react';
import RichTextEditor from '@/Components/RichTextEditor';

export default function QuizBuilder({ quiz }) {
    const [settings, setSettings] = useState({
        duration_minutes: quiz.duration_minutes || '',
        passing_score: quiz.passing_score || 70,
        max_attempts: quiz.max_attempts || 3,
        quiz_mode: quiz.quiz_mode || 'custom',
        deadline_at: quiz.deadline_at ? new Date(quiz.deadline_at).toISOString().slice(0, 16) : '',
        shuffle_questions: quiz.shuffle_questions || false,
    });

    const [questions, setQuestions] = useState(quiz.questions || []);
    const [activeQIndex, setActiveQIndex] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    const activeQ = questions[activeQIndex] || null;

    const saveSettings = () => {
        router.patch(route('admin.quizzes.settings', quiz.id), settings, {
            preserveScroll: true,
            onSuccess: () => alert('Setting kuis berhasil disimpan!')
        });
    };

    const addQuestion = (type) => {
        setIsSaving(true);
        router.post(route('admin.quizzes.questions.store', quiz.id), {
            question: '<p>Pertanyaan baru</p>',
            type: type,
            points: 1,
            options: type === 'multiple_choice' ? [
                { option_text: 'Opsi A', is_correct: true },
                { option_text: 'Opsi B', is_correct: false },
            ] : []
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSaving(false);
                // Move to the newly added question
                setActiveQIndex(questions.length);
            },
            onError: (errors) => {
                setIsSaving(false);
                console.error(errors);
                alert('Gagal menambahkan soal. Periksa kembali isian Anda.');
            }
        });
    };

    const updateQuestion = (newContent) => {
        const newQs = [...questions];
        newQs[activeQIndex] = { ...activeQ, ...newContent };
        setQuestions(newQs);
    };

    const saveActiveQuestion = () => {
        if (!activeQ) return;
        setIsSaving(true);
        router.patch(route('admin.quizzes.questions.update', activeQ.id), {
            question: activeQ.question,
            type: activeQ.type,
            points: activeQ.points,
            explanation: activeQ.explanation,
            options: activeQ.options,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSaving(false);
                alert('Soal berhasil disimpan!');
            },
            onError: (errors) => {
                setIsSaving(false);
                console.error(errors);
                alert('Gagal menyimpan soal. Periksa kembali isian Anda.');
            }
        });
    };

    const deleteQuestion = (id) => {
        if (!confirm('Hapus pertanyaan ini secara permanen?')) return;
        setIsSaving(true);
        router.delete(route('admin.quizzes.questions.delete', id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsSaving(false);
                setActiveQIndex(Math.max(0, activeQIndex - 1));
            },
            onError: (errors) => {
                setIsSaving(false);
                console.error(errors);
                alert('Gagal menghapus soal.');
            }
        });
    };

    const handleImageUpload = (e) => {
        if (e.target.files.length > 0 && activeQ) {
            setIsSaving(true);
            const form = new FormData();
            form.append('image', e.target.files[0]);
            router.post(route('admin.quizzes.questions.image', activeQ.id), form, {
                preserveScroll: true,
                onSuccess: () => setIsSaving(false),
                onError: (errors) => {
                    setIsSaving(false);
                    console.error(errors);
                    alert('Gagal mengupload gambar.');
                }
            });
        }
    };

    useEffect(() => {
        setQuestions(quiz.questions || []);
    }, [quiz.questions]);

    return (
        <div className="flex flex-col gap-4">
            {/* Setting bar */}
            <div className="p-4 border border-gray-200 bg-gray-50 rounded-xl">
                <div className="grid items-end grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
                    <div>
                        <label className="block mb-1 text-xs font-bold text-gray-600 uppercase">Mode Kuis</label>
                        <select
                            value={settings.quiz_mode}
                            onChange={e => setSettings({ ...settings, quiz_mode: e.target.value })}
                            className="w-full py-2 text-sm border-gray-300 rounded-lg"
                        >
                            <option value="custom">Campuran (PG & Essay)</option>
                            <option value="multiple_choice">Pilihan Ganda Saja</option>
                            <option value="essay">Essay Saja</option>
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1 text-xs font-bold text-gray-600 uppercase">Durasi (Menit)</label>
                        <input
                            type="number"
                            value={settings.duration_minutes}
                            onChange={e => setSettings({ ...settings, duration_minutes: e.target.value })}
                            className="w-full py-2 text-sm border-gray-300 rounded-lg"
                            placeholder="Tanpa batas"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-xs font-bold text-gray-600 uppercase">Passing Score</label>
                        <input
                            type="number"
                            value={settings.passing_score}
                            onChange={e => setSettings({ ...settings, passing_score: e.target.value })}
                            className="w-full py-2 text-sm border-gray-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-xs font-bold text-gray-600 uppercase">Maks. Attempt</label>
                        <input
                            type="number"
                            min="1"
                            value={settings.max_attempts}
                            onChange={e => setSettings({ ...settings, max_attempts: e.target.value })}
                            className="w-full py-2 text-sm border-gray-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-xs font-bold text-gray-600 uppercase">Deadline</label>
                        <input
                            type="datetime-local"
                            value={settings.deadline_at}
                            onChange={e => setSettings({ ...settings, deadline_at: e.target.value })}
                            className="w-full py-2 text-sm border-gray-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <button onClick={saveSettings} className="w-full h-10 text-sm btn-secondary">
                            Simpan Setting
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2 pt-4 mt-4 border-t border-gray-200">
                    <input
                        type="checkbox"
                        id="shuffle_q"
                        checked={settings.shuffle_questions}
                        onChange={e => setSettings({ ...settings, shuffle_questions: e.target.checked })}
                        className="rounded text-navy-600 focus:ring-navy-500"
                    />
                    <label htmlFor="shuffle_q" className="text-sm font-medium text-gray-700">
                        Acak Soal & Opsi saat peserta mengerjakan (Exam Mode)
                    </label>
                </div>
            </div>

            <div className="flex flex-col-reverse gap-6 lg:flex-row">
                {/* Content Editor */}
                <div className="flex-1 bg-white border border-gray-200 rounded-xl p-5 md:p-8 relative min-h-[500px]">
                    {isSaving && (
                        <div className="absolute top-4 right-4 text-xs font-bold text-navy-700 bg-navy-50 px-3 py-1.5 rounded-lg border border-navy-100 flex items-center gap-2 z-10 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-navy-500 animate-pulse"></span> Menyimpan...
                        </div>
                    )}

                    {activeQ ? (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                                <h3 className="flex items-center gap-3 text-xl font-black text-gray-800">
                                    Soal Nomor {activeQIndex + 1}
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${activeQ.type === 'multiple_choice' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                        {activeQ.type === 'multiple_choice' ? 'Pilihan Ganda' : 'Essay'}
                                    </span>
                                </h3>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                                        <span className="text-xs font-bold text-gray-500 uppercase">Poin:</span>
                                        <input
                                            type="number"
                                            className="w-16 px-2 py-1 text-sm font-bold text-center border-gray-300 rounded"
                                            value={activeQ.points}
                                            onChange={e => updateQuestion({ points: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Pertanyaan RTE */}
                            <div>
                                <label className="block mb-2 text-sm font-bold text-gray-700">Teks Pertanyaan</label>
                                <RichTextEditor
                                    key={`q-${activeQ.id || 'new'}-${activeQIndex}`}
                                    content={activeQ.question}
                                    onChange={html => updateQuestion({ question: html })}
                                />
                            </div>

                            {/* Image Upload */}
                            <div className="p-4 border border-gray-100 bg-gray-50 rounded-xl">
                                <label className="block mb-2 text-sm font-bold text-gray-700">Gambar Pendukung (Opsional)</label>
                                {activeQ.image_path ? (
                                    <div className="relative inline-block">
                                        <img src={activeQ.image_path} className="border rounded-lg shadow-sm max-h-48" alt="Ilustrasi Soal" />
                                        <label className="absolute p-2 transition-colors bg-white border rounded-full shadow-md cursor-pointer -bottom-3 -right-3 hover:bg-gray-50">
                                            <ImageIcon className="w-4 h-4 text-gray-600" />
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                        </label>
                                    </div>
                                ) : (
                                    <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 transition-colors bg-white border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-100 hover:border-gray-400">
                                        <ImageIcon className="w-5 h-5 text-gray-400" /> Pilih Gambar
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    </label>
                                )}
                            </div>

                            {/* Opsi / Kunci Jawaban */}
                            {activeQ.type === 'multiple_choice' ? (
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="block text-sm font-bold text-gray-700">Pilihan Jawaban</label>
                                        <span className="text-xs font-medium text-gray-500">{activeQ.options.length}/8 Opsi</span>
                                    </div>
                                    <div className="space-y-3">
                                        {activeQ.options.map((opt, oIdx) => (
                                            <div key={opt.id || oIdx} className="flex items-center gap-3">
                                                <button
                                                    onClick={() => {
                                                        const newOpts = activeQ.options.map((o, i) => ({ ...o, is_correct: i === oIdx }));
                                                        updateQuestion({ options: newOpts });
                                                    }}
                                                    className={`w-8 h-8 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${opt.is_correct ? 'border-green-500 bg-green-500 text-white shadow-sm' : 'border-gray-300 hover:border-green-400 bg-gray-50'}`}
                                                    title={opt.is_correct ? "Jawaban Benar" : "Tandai sebagai Benar"}
                                                >
                                                    {opt.is_correct ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-xs font-bold text-gray-400">{String.fromCharCode(65 + oIdx)}</span>}
                                                </button>
                                                <input
                                                    type="text"
                                                    className={`flex-1 border-gray-300 rounded-lg py-2.5 px-4 text-sm focus:ring-navy-500 focus:border-navy-500 transition-colors ${opt.is_correct ? 'bg-green-50 border-green-200' : 'bg-white'}`}
                                                    value={opt.option_text}
                                                    placeholder={`Opsi ${String.fromCharCode(65 + oIdx)}`}
                                                    onChange={e => {
                                                        const newOpts = [...activeQ.options];
                                                        newOpts[oIdx].option_text = e.target.value;
                                                        updateQuestion({ options: newOpts });
                                                    }}
                                                />
                                                <button
                                                    onClick={() => {
                                                        const newOpts = activeQ.options.filter((_, i) => i !== oIdx);
                                                        updateQuestion({ options: newOpts });
                                                    }}
                                                    className="flex items-center justify-center w-10 h-10 text-red-400 transition-colors border border-transparent rounded-lg hover:text-red-600 hover:bg-red-50 hover:border-red-100"
                                                    title="Hapus Opsi"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}

                                        {activeQ.options.length < 8 && (
                                            <button
                                                onClick={() => {
                                                    const newOpts = [...activeQ.options, { option_text: '', is_correct: false }];
                                                    updateQuestion({ options: newOpts });
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 mt-4 text-sm font-bold transition-colors border border-dashed rounded-lg text-navy-600 hover:text-navy-800 hover:bg-navy-50 border-navy-300"
                                            >
                                                <Plus className="w-4 h-4" /> Tambah Opsi Jawaban
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block mb-2 text-sm font-bold text-gray-700">Panduan Jawaban Benar (Info Admin)</label>
                                    <textarea
                                        className="w-full p-4 text-sm border-gray-300 rounded-xl bg-gray-50 focus:ring-navy-500 focus:border-navy-500"
                                        rows="4"
                                        placeholder="Ketik referensi/panduan jawaban benar untuk mempermudah admin saat mengoreksi..."
                                        value={activeQ.explanation || ''}
                                        onChange={e => updateQuestion({ explanation: e.target.value })}
                                    />
                                </div>
                            )}

                            {/* Tombol Aksi Bawah */}
                            <div className="flex flex-col items-center justify-between gap-4 pt-6 mt-6 border-t border-gray-200 sm:flex-row">
                                <button onClick={() => deleteQuestion(activeQ.id)} className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-red-500 transition-colors rounded-lg hover:text-red-700 hover:bg-red-50">
                                    <Trash2 className="w-4 h-4" /> Hapus Soal
                                </button>
                                <button onClick={saveActiveQuestion} className="btn-gold flex items-center gap-2 px-6 py-2.5 w-full sm:w-auto text-sm">
                                    <Save className="w-4 h-4" /> Simpan Soal Ini
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full py-20 text-center text-gray-400">
                            <div className="flex items-center justify-center w-20 h-20 mb-4 rounded-full bg-gray-50">
                                <GripVertical className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="mb-2 text-lg font-bold text-gray-600">Pilih atau Buat Soal</h3>
                            <p className="max-w-sm text-sm">Gunakan panel navigasi di sebelah kanan untuk memilih nomor soal atau menambahkan soal baru.</p>
                        </div>
                    )}
                </div>

                {/* Sidebar Navigation (Exam Browser Style) */}
                <div className="flex flex-col flex-shrink-0 w-full gap-4 lg:w-72">
                    <div className="p-5 bg-white border border-gray-200 shadow-sm rounded-xl">
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-800">Navigasi Soal</h3>
                            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{questions.length} Soal</span>
                        </div>

                        <div className="grid grid-cols-5 gap-2">
                            {questions.map((q, idx) => (
                                <button
                                    key={q.id || idx}
                                    onClick={() => setActiveQIndex(idx)}
                                    className={`aspect-square flex items-center justify-center rounded font-bold text-sm transition-all border-2 ${activeQIndex === idx
                                            ? 'bg-navy-600 text-white border-navy-600 shadow-md transform scale-105 z-10'
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-navy-400 hover:bg-navy-50'
                                        }`}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>

                        {/* Add Buttons based on mode */}
                        <div className="pt-4 mt-6 space-y-2 border-t border-gray-100">
                            <p className="mb-2 text-xs font-bold text-gray-400 uppercase">Tambah Soal Baru</p>
                            {(settings.quiz_mode === 'custom' || settings.quiz_mode === 'multiple_choice') && (
                                <button onClick={() => addQuestion('multiple_choice')} className="flex items-center justify-center w-full gap-2 py-2 text-sm font-bold text-blue-600 transition-colors border-2 border-blue-300 border-dashed rounded-lg hover:bg-blue-50">
                                    <Plus className="w-4 h-4" /> Pilihan Ganda
                                </button>
                            )}
                            {(settings.quiz_mode === 'custom' || settings.quiz_mode === 'essay') && (
                                <button onClick={() => addQuestion('essay')} className="flex items-center justify-center w-full gap-2 py-2 text-sm font-bold text-purple-600 transition-colors border-2 border-purple-300 border-dashed rounded-lg hover:bg-purple-50">
                                    <Plus className="w-4 h-4" /> Soal Essay
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Legend info */}
                    <div className="p-4 space-y-2 text-xs text-gray-600 border border-gray-200 bg-gray-50 rounded-xl">
                        <p className="mb-1 font-bold text-gray-800">Informasi:</p>
                        <p>• Pastikan menekan tombol <strong>Simpan Soal Ini</strong> sebelum berpindah ke soal lain.</p>
                        <p>• Maksimal opsi jawaban Pilihan Ganda adalah 8 opsi.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}