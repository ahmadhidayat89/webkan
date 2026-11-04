import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Archive, ArchiveRestore, BookOpen, CheckCircle2, Copy, Download, Edit3, Eye, FolderTree, History, LibraryBig, Plus, Search, Upload } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import QuestionForm from './QuestionForm';
import QuestionPreview from './QuestionPreview';
import BankToolsDialog from './BankToolsDialog';
import { categoryLabel, QUESTION_TYPES } from './helpers';

function action(name, question) {
    const options = { preserveScroll: true };
    if (name === 'duplicate') router.post(route('admin.question-bank.duplicate', question.id), {}, options);
    else router.patch(route('admin.question-bank.archive', question.id), {}, options);
}

function StatusBadge({ question }) {
    let label = 'Draft';
    let style = 'bg-amber-50 text-amber-700';
    if (question.archived_at) {
        label = 'Arsip';
        style = 'bg-gray-100 text-gray-500';
    } else if (question.status === 'ready') {
        label = 'Ready';
        style = 'bg-green-50 text-green-700';
    }
    return <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${style}`}>{label}</span>;
}

function Pagination({ links }) {
    const seen = {};
    return links.map(link => {
        seen[link.label] = (seen[link.label] ?? 0) + 1;
        const key = `${link.label}-${seen[link.label]}`;
        if (!link.url) {
            return <span key={key} className="px-3 py-1.5 text-xs text-gray-300" dangerouslySetInnerHTML={{ __html: link.label }} />;
        }
        const style = link.active ? 'bg-navy-600 text-white' : 'border border-gray-200 text-gray-500';
        return <Link key={key} href={link.url} preserveScroll className={`rounded-lg px-3 py-1.5 text-xs ${style}`} dangerouslySetInnerHTML={{ __html: link.label }} />;
    });
}

export default function QuestionBank({ questions, courses, categories, filters, stats }) {
    const { flash, errors } = usePage().props;
    const [query, setQuery] = useState(filters);
    const [dialog, setDialog] = useState(null);
    useEffect(() => setQuery(filters), [filters]);
    const input = 'w-full rounded-lg border-gray-200 text-sm focus:border-navy-500 focus:ring-navy-500';
    function filter(changes) {
        const next = { ...query, ...changes };
        setQuery(next);
        router.get(route('admin.question-bank.index'), Object.fromEntries(Object.entries(next).filter(([, value]) => value !== '' && value != null)), { preserveState: true, preserveScroll: true });
    }
    const visibleCategories = categories.filter(
        category => !query.course_id || String(category.course_id) === String(query.course_id));
    return <AuthenticatedLayout><Head title="Bank Soal" />
        <div className="px-4 py-8 mx-auto space-y-6 max-w-7xl sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div><div className="flex items-center gap-2 mb-2 text-xs font-semibold tracking-wider uppercase text-gold-600"><LibraryBig className="w-4 h-4" /> Studio pembelajaran</div><h1 className="text-2xl font-bold text-navy-900">Bank Soal</h1><p className="max-w-xl mt-2 text-sm text-gray-500">Kelola koleksi soal, periksa versinya, dan gunakan kembali di berbagai kuis.</p></div>
                <div className="flex flex-wrap gap-2">
                    <a href={route('admin.question-bank.export', { course_id: query.course_id || undefined, category_id: query.category_id || undefined })} className="inline-flex items-center gap-2 text-sm btn-secondary"><Download className="w-4 h-4" /> Ekspor JSON</a>
                    <button type="button" onClick={() => setDialog({ mode: 'import' })} className="inline-flex items-center gap-2 text-sm btn-secondary"><Upload className="w-4 h-4" /> Impor</button>
                    <button type="button" disabled={!courses.length} onClick={() => setDialog({ mode: 'create' })} className="inline-flex items-center gap-2 text-sm btn-gold disabled:opacity-50"><Plus className="w-4 h-4" /> Tambah soal</button>
                </div>
            </div>
            {flash?.success && <output className="block p-4 text-sm text-green-700 border border-green-200 rounded-xl bg-green-50">{flash.success}</output>}
            {!!Object.keys(errors ?? {}).length && !dialog && <div role="alert" className="p-4 text-sm text-red-700 rounded-xl bg-red-50">{Object.values(errors).join(' ')}</div>}
            <div className="grid grid-cols-3 gap-3">{[
                ['Total soal aktif', Number(stats.ready ?? 0) + Number(stats.draft ?? 0), LibraryBig],
                ['Ready · siap digunakan', stats.ready ?? 0, CheckCircle2], ['Draft · perlu diperiksa', stats.draft ?? 0, Edit3],
            ].map(([label, value, Icon]) => <div key={label} className="p-4 card sm:p-5"><div className="flex items-center justify-between gap-2 mb-3 text-xs text-gray-500"><span>{label}</span><Icon className="w-4 h-4 shrink-0 text-gold-500" /></div><p className="text-2xl font-bold text-navy-900">{value}</p></div>)}</div>
            <div className="grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
                <aside className="p-4 card">
                    <h2 className="flex items-center gap-2 mb-4 text-sm font-bold text-navy-900"><FolderTree className="w-4 h-4" /> Kategori soal</h2>
                    <label className="block space-y-2 text-xs font-medium text-gray-500">Kursus<select aria-label="Filter kursus bank soal" value={query.course_id || ''} onChange={event => filter({ course_id: event.target.value, category_id: '' })} className={input}><option value="">Semua kursus</option>{courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
                    <div className="mt-4 space-y-1 overflow-y-auto max-h-80">
                        <button type="button" onClick={() => filter({ category_id: '' })} className={`w-full rounded-lg px-3 py-2.5 text-left text-xs font-medium ${!query.category_id ? 'bg-navy-50 text-navy-700' : 'text-gray-500 hover:bg-gray-50'}`}>Semua kategori</button>
                        {visibleCategories.map(category => <button type="button" key={category.id} onClick={() => filter({ category_id: category.id, course_id: category.course_id })} title={categoryLabel(category, categories)} className={`w-full rounded-lg px-3 py-2.5 text-left text-xs ${String(query.category_id) === String(category.id) ? 'bg-navy-50 font-semibold text-navy-700' : 'text-gray-500 hover:bg-gray-50'}`}>{category.parent_id ? '↳ ' : ''}{category.name}</button>)}
                        {!visibleCategories.length && <p className="px-3 py-2 text-xs text-gray-400">Belum ada kategori.</p>}
                    </div>
                    <button type="button" disabled={!courses.length} onClick={() => setDialog({ mode: 'category' })} className="inline-flex items-center justify-center w-full gap-1 py-2 mt-4 text-xs font-semibold border border-dashed rounded-lg border-navy-200 text-navy-600 disabled:opacity-50"><Plus className="h-3.5 w-3.5" /> Tambah kategori</button>
                    <p className="pt-4 mt-5 text-xs leading-relaxed text-gray-400 border-t border-gray-100">Soal dibagikan kepada pengajar yang memiliki akses ke kursus pemilik bank. Hanya soal Ready yang bisa ditambahkan ke kuis.</p>
                </aside>
                <section className="min-w-0 overflow-hidden card">
                    <form onSubmit={event => { event.preventDefault(); filter({}); }} className="p-5 space-y-3 border-b border-gray-100">
                        <div className="flex gap-2"><div className="relative flex-1"><Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" /><input aria-label="Cari soal" placeholder="Cari nama atau teks soal…" value={query.search || ''} onChange={event => setQuery({ ...query, search: event.target.value })} className={`${input} pl-9`} /></div><button type="submit" className="text-sm btn-secondary">Cari</button></div>
                        <div className="flex flex-wrap gap-2">
                            <select aria-label="Filter status soal" value={query.status || ''} onChange={event => filter({ status: event.target.value })} className="py-2 text-xs border-gray-200 rounded-lg"><option value="">Semua status aktif</option><option value="ready">Ready</option><option value="draft">Draft</option><option value="archived">Arsip</option></select>
                            <select aria-label="Filter tipe soal" value={query.type || ''} onChange={event => filter({ type: event.target.value })} className="py-2 text-xs border-gray-200 rounded-lg"><option value="">Semua jenis soal</option>{Object.entries(QUESTION_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                            <input aria-label="Filter tag" placeholder="Tag, lalu tekan Cari" value={query.tag || ''} onChange={event => setQuery({ ...query, tag: event.target.value })} className="w-40 py-2 text-xs border-gray-200 rounded-lg" />
                            <button type="button" onClick={() => { setQuery({}); router.get(route('admin.question-bank.index')); }} className="px-2 text-xs text-gray-400 hover:text-navy-600">Reset filter</button>
                        </div>
                    </form>
                    <div className="overflow-x-auto"><table className="w-full text-xs text-left">
                        <thead className="text-gray-500 border-b border-gray-100 bg-gray-50"><tr>{['Soal', 'Status', 'Versi', 'Digunakan', 'Aksi'].map(label => <th key={label} scope="col" className="px-4 py-3 font-medium whitespace-nowrap">{label}</th>)}</tr></thead>
                        <tbody className="divide-y divide-gray-100">{questions.data.map(question => <tr key={question.id} className="hover:bg-gray-50/50">
                            <th scope="row" className="min-w-[240px] px-4 py-4 font-normal"><button type="button" onClick={() => setDialog({ mode: 'preview', question })} className="text-sm font-semibold text-left text-navy-800 hover:underline">{question.title}</button><p className="mt-1 text-[11px] text-gray-500">{QUESTION_TYPES[question.type]} · {question.points} poin · {question.category?.name ?? 'Tanpa kategori'}</p><p className="mt-1 text-[10px] text-gray-400">{question.course?.title}</p><div className="flex flex-wrap gap-1 mt-2">{question.tags?.map(tag => <span key={tag} className="rounded bg-navy-50 px-1.5 py-0.5 text-[10px] text-navy-600">{tag}</span>)}</div></th>
                            <td className="px-4 py-4"><StatusBadge question={question} /></td>
                            <td className="px-4 py-4 text-gray-600">v{question.version}</td><td className="px-4 py-4 text-gray-500">{question.usages_count} kuis</td>
                            <td className="px-4 py-4"><div className="flex gap-1">{[
                                ['preview', 'Preview', Eye], ...(!question.archived_at ? [['edit', 'Edit', Edit3]] : []), ['history', 'Riwayat versi', History], ['duplicate', 'Duplikasi', Copy], ['archive', question.archived_at ? 'Pulihkan' : 'Arsipkan', question.archived_at ? ArchiveRestore : Archive],
                            ].map(([mode, label, Icon]) => <button type="button" key={mode} title={label} aria-label={`${label}: ${question.title}`} onClick={() => ['duplicate', 'archive'].includes(mode) ? action(mode, question) : setDialog({ mode, question })} className="p-2 text-gray-400 rounded-lg hover:bg-navy-50 hover:text-navy-600"><Icon className="w-4 h-4" /></button>)}</div></td>
                        </tr>)}</tbody>
                    </table></div>
                    {!questions.data.length && <div className="flex flex-col items-center px-6 py-16 text-center"><BookOpen className="w-10 h-10 mb-4 text-navy-200" /><h3 className="font-bold text-gray-700">{courses.length ? 'Belum ada soal yang ditampilkan' : 'Belum ada kursus yang dapat dikelola'}</h3><p className="max-w-md mt-2 text-sm text-gray-400">{courses.length ? 'Tambahkan soal baru, impor file, atau simpan soal yang sudah ada melalui editor kuis.' : 'Admin perlu menugaskan Anda sebagai pengajar pada kursus terlebih dahulu.'}</p></div>}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-gray-100"><p className="text-xs text-gray-400">{questions.from ?? 0}–{questions.to ?? 0} dari {questions.total} soal</p><div className="flex flex-wrap gap-1"><Pagination links={questions.links} /></div></div>
                </section>
            </div>
        </div>
        {['create', 'edit'].includes(dialog?.mode) && <QuestionForm key={dialog.question?.id ?? 'new'} question={dialog.question} courses={courses} categories={categories} initialCourseId={query.course_id} onClose={() => setDialog(null)} />}
        {['preview', 'history'].includes(dialog?.mode) && <QuestionPreview question={dialog.question} history={dialog.mode === 'history'} onClose={() => setDialog(null)} />}
        {['category', 'import'].includes(dialog?.mode) && <BankToolsDialog mode={dialog.mode} courses={courses} categories={categories} initialCourseId={query.course_id} onClose={() => setDialog(null)} />}
    </AuthenticatedLayout>;
}
