import { useState } from 'react';
import { Link, useForm, router } from '@inertiajs/react';
import { LibraryBig, Shuffle, Copy, Trash2 } from 'lucide-react';
import BankQuestionPicker from '@/Components/BankQuestionPicker';

export default function QuizBankTools({ quiz }) {
    const [mode, setMode] = useState(null);
    const collect = useForm({ status: 'draft' });
    const groups = quiz.random_groups ?? [];
    const fixedCount = quiz.questions.filter(question => !question.random_group_id).length;
    const drawnCount = groups.reduce((sum, group) => sum + Number(group.draw_count), 0);
    return <div className="p-4 space-y-3 border rounded-xl border-navy-100 bg-navy-50/40">
        <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h3 className="flex items-center gap-2 text-sm font-bold text-navy-900"><LibraryBig className="w-4 h-4" /> Bank Soal</h3><p className="mt-1 text-xs text-gray-500">{fixedCount} soal tetap{groups.length ? ` + ${drawnCount} soal acak dari ${groups.length} kelompok` : ''}. Salinan versi menjaga isi kuis tetap konsisten.</p></div>
            <Link href={route('admin.question-bank.index', { course_id: quiz.course_id })} className="text-xs font-semibold text-navy-600 hover:underline">Kelola bank soal →</Link>
        </div>
        <div className="flex flex-wrap gap-2">
            <button type="button" disabled={quiz.questions_locked} onClick={() => setMode('fixed')} className="inline-flex items-center gap-2 px-3 py-2 text-xs btn-secondary disabled:opacity-50"><LibraryBig className="w-4 h-4" /> Ambil dari Bank Soal</button>
            <button type="button" disabled={quiz.questions_locked} onClick={() => setMode('random')} className="inline-flex items-center gap-2 px-3 py-2 text-xs btn-secondary disabled:opacity-50"><Shuffle className="w-4 h-4" /> Tambah Soal Acak</button>
            <button type="button" disabled={collect.processing || !quiz.questions.some(question => !question.bank_question_id)} onClick={() => collect.post(route('admin.question-bank.quiz.collect', quiz.id), { preserveScroll: true })} className="inline-flex items-center gap-2 px-3 py-2 text-xs btn-secondary disabled:opacity-50"><Copy className="w-4 h-4" /> {collect.processing ? 'Menyalin…' : 'Simpan soal kuis ke bank (Draft)'}</button>
        </div>
        {collect.recentlySuccessful && <output className="block text-xs text-green-700">Soal tersimpan di bank sebagai Draft. Periksa dan ubah menjadi Ready sebelum digunakan kembali.</output>}
        {!!Object.keys(collect.errors).length && <p role="alert" className="text-xs text-red-600">{Object.values(collect.errors).join(' ')}</p>}
        {quiz.questions_locked && <p className="p-3 text-xs rounded-lg bg-amber-50 text-amber-800">Kuis sudah mulai dikerjakan. Isi soal dikunci untuk menjaga jawaban dan nilai peserta. Soal tetap bisa disimpan ke bank untuk kuis baru.</p>}
        {!!groups.length && <div className="space-y-2">{groups.map(group => <div key={group.id} className="flex items-center justify-between px-3 py-2 text-xs bg-white border rounded-lg border-navy-100"><span className="text-navy-700"><Shuffle className="mr-2 inline h-3.5 w-3.5" />{group.label} · ambil {group.draw_count} dari {quiz.questions.filter(question => question.random_group_id === group.id).length} soal</span>{!quiz.questions_locked && <button type="button" aria-label={`Hapus kelompok ${group.label}`} onClick={() => router.delete(route('admin.question-bank.quiz.groups.delete', { quiz: quiz.id, group: group.id }), { preserveScroll: true })} className="text-red-400"><Trash2 className="w-4 h-4" /></button>}</div>)}</div>}
        {mode && <BankQuestionPicker quiz={quiz} mode={mode} onClose={() => setMode(null)} />}
    </div>;
}
