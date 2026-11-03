import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Archive, ArchiveRestore, BookOpen, CheckCircle2, Copy, Download, Edit3, Eye, FolderTree, History, LibraryBig, Plus, Search, Upload } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import QuestionForm from './QuestionForm';
import QuestionPreview from './QuestionPreview';
import BankToolsDialog from './BankToolsDialog';
import { categoryLabel, QUESTION_TYPES } from './helpers';

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
    function action(name, question) {
        const options = { preserveScroll: true };
        if (name === 'duplicate') router.post(route('admin.question-bank.duplicate', question.id), {}, options);
        else router.patch(route('admin.question-bank.archive', question.id), {}, options);
    }
    const visibleCategories = categories.filter(category => !query.course_id || String(category.course_id) === String(query.course_id));
    return <AuthenticatedLayout><Head title="Bank Soal" />
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold-600"><LibraryBig className="h-4 w-4" /> Studio pembelajaran</div><h1 className="text-2xl font-bold text-navy-900">Bank Soal</h1><p className="mt-2 max-w-xl text-sm text-gray-500">Kelola koleksi soal, periksa versinya, dan gunakan kembali di berbagai kuis.</p></div>
                <div className="flex flex-wrap gap-2">
                    <a href={route('admin.question-bank.export', { course_id: query.course_id || undefined, category_id: query.category_id || undefined })} className="btn-secondary inline-flex items-center gap-2 text-sm"><Download className="h-4 w-4" /> Ekspor JSON</a>
                    <button type="button" onClick={() => setDialog({ mode: 'import' })} className="btn-secondary inline-flex items-center gap-2 text-sm"><Upload className="h-4 w-4" /> Impor</button>
                    <button type="button" disabled={!courses.length} onClick={() => setDialog({ mode: 'create' })} className="btn-gold inline-flex items-center gap-2 text-sm disabled:opacity-50"><Plus className="h-4 w-4" /> Tambah soal</button>
                </div>
            </div>
            {flash?.success && <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{flash.success}</div>}
            {!!Object.keys(errors ?? {}).length && !dialog && <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{Object.values(errors).join(' ')}</div>}
            <div className="grid grid-cols-3 gap-3">{[
                ['Total soal aktif', Number(stats.ready ?? 0) + Number(stats.draft ?? 0), LibraryBig],
                ['Ready · siap digunakan', stats.ready ?? 0, CheckCircle2], ['Draft · perlu diperiksa', stats.draft ?? 0, Edit3],
            ].map(([label, value, Icon]) => <div key={label} className="card p-4 sm:p-5"><div className="mb-3 flex items-center justify-between gap-2 text-xs text-gray-500"><span>{label}</span><Icon className="h-4 w-4 shrink-0 text-gold-500" /></div><p className="text-2xl font-bold text-navy-900">{value}</p></div>)}</div>
            <div className="grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
                <aside className="card p-4">
                    <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-navy-900"><FolderTree className="h-4 w-4" /> Kategori soal</h2>
                    <label className="block space-y-2 text-xs font-medium text-gray-500">Kursus<select aria-label="Filter kursus bank soal" value={query.course_id || ''} onChange={event => filter({ course_id: event.target.value, category_id: '' })} className={input}><option value="">Semua kursus</option>{courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
                    <div className="mt-4 max-h-80 space-y-1 overflow-y-auto">
                        <button type="button" onClick={() => filter({ category_id: '' })} className={`w-full rounded-lg px-3 py-2.5 text-left text-xs font-medium ${!query.category_id ? 'bg-navy-50 text-navy-700' : 'text-gray-500 hover:bg-gray-50'}`}>Semua kategori</button>
                        {visibleCategories.map(category => <button type="button" key={category.id} onClick={() => filter({ category_id: category.id, course_id: category.course_id })} title={categoryLabel(category, categories)} className={`w-full rounded-lg px-3 py-2.5 text-left text-xs ${String(query.category_id) === String(category.id) ? 'bg-navy-50 font-semibold text-navy-700' : 'text-gray-500 hover:bg-gray-50'}`}>{category.parent_id ? '↳ ' : ''}{category.name}</button>)}
                        {!visibleCategories.length && <p className="px-3 py-2 text-xs text-gray-400">Belum ada kategori.</p>}
                    </div>
                    <button type="button" disabled={!courses.length} onClick={() => setDialog({ mode: 'category' })} className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-navy-200 py-2 text-xs font-semibold text-navy-600 disabled:opacity-50"><Plus className="h-3.5 w-3.5" /> Tambah kategori</button>
                    <p className="mt-5 border-t border-gray-100 pt-4 text-xs leading-relaxed text-gray-400">Soal dibagikan kepada pengajar yang memiliki akses ke kursus pemilik bank. Hanya soal Ready yang bisa ditambahkan ke kuis.</p>
                </aside>
                <section className="card min-w-0 overflow-hidden">
                    <form onSubmit={event => { event.preventDefault(); filter({}); }} className="space-y-3 border-b border-gray-100 p-5">
                        <div className="flex gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input aria-label="Cari soal" placeholder="Cari nama atau teks soal…" value={query.search || ''} onChange={event => setQuery({ ...query, search: event.target.value })} className={`${input} pl-9`} /></div><button className="btn-secondary text-sm">Cari</button></div>
                        <div className="flex flex-wrap gap-2">
                            <select aria-label="Filter status soal" value={query.status || ''} onChange={event => filter({ status: event.target.value })} className="rounded-lg border-gray-200 py-2 text-xs"><option value="">Semua status aktif</option><option value="ready">Ready</option><option value="draft">Draft</option><option value="archived">Arsip</option></select>
                            <select aria-label="Filter tipe soal" value={query.type || ''} onChange={event => filter({ type: event.target.value })} className="rounded-lg border-gray-200 py-2 text-xs"><option value="">Semua jenis soal</option>{Object.entries(QUESTION_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                            <input aria-label="Filter tag" placeholder="Tag, lalu tekan Cari" value={query.tag || ''} onChange={event => setQuery({ ...query, tag: event.target.value })} className="w-40 rounded-lg border-gray-200 py-2 text-xs" />
                            <button type="button" onClick={() => { setQuery({}); router.get(route('admin.question-bank.index')); }} className="px-2 text-xs text-gray-400 hover:text-navy-600">Reset filter</button>
                        </div>
                    </form>
                    <div className="overflow-x-auto"><table className="w-full text-left text-xs">
                        <thead className="border-b border-gray-100 bg-gray-50 text-gray-500"><tr>{['Soal', 'Status', 'Versi', 'Digunakan', 'Aksi'].map(label => <th key={label} scope="col" className="whitespace-nowrap px-4 py-3 font-medium">{label}</th>)}</tr></thead>
                        <tbody className="divide-y divide-gray-100">{questions.data.map(question => <tr key={question.id} className="hover:bg-gray-50/50">
                            <th scope="row" className="min-w-[240px] px-4 py-4 font-normal"><button type="button" onClick={() => setDialog({ mode: 'preview', question })} className="text-left text-sm font-semibold text-navy-800 hover:underline">{question.title}</button><p className="mt-1 text-[11px] text-gray-500">{QUESTION_TYPES[question.type]} · {question.points} poin · {question.category?.name ?? 'Tanpa kategori'}</p><p className="mt-1 text-[10px] text-gray-400">{question.course?.title}</p><div className="mt-2 flex flex-wrap gap-1">{question.tags?.map(tag => <span key={tag} className="rounded bg-navy-50 px-1.5 py-0.5 text-[10px] text-navy-600">{tag}</span>)}</div></th>
                            <td className="px-4 py-4"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${question.archived_at ? 'bg-gray-100 text-gray-500' : question.status === 'ready' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{question.archived_at ? 'Arsip' : question.status === 'ready' ? 'Ready' : 'Draft'}</span></td>
                            <td className="px-4 py-4 text-gray-600">v{question.version}</td><td className="px-4 py-4 text-gray-500">{question.usages_count} kuis</td>
                            <td className="px-4 py-4"><div className="flex gap-1">{[
                                ['preview', 'Preview', Eye], ...(!question.archived_at ? [['edit', 'Edit', Edit3]] : []), ['history', 'Riwayat versi', History], ['duplicate', 'Duplikasi', Copy], ['archive', question.archived_at ? 'Pulihkan' : 'Arsipkan', question.archived_at ? ArchiveRestore : Archive],
                            ].map(([mode, label, Icon]) => <button type="button" key={mode} title={label} aria-label={`${label}: ${question.title}`} onClick={() => ['duplicate', 'archive'].includes(mode) ? action(mode, question) : setDialog({ mode, question })} className="rounded-lg p-2 text-gray-400 hover:bg-navy-50 hover:text-navy-600"><Icon className="h-4 w-4" /></button>)}</div></td>
                        </tr>)}</tbody>
                    </table></div>
                    {!questions.data.length && <div className="flex flex-col items-center px-6 py-16 text-center"><BookOpen className="mb-4 h-10 w-10 text-navy-200" /><h3 className="font-bold text-gray-700">{courses.length ? 'Belum ada soal yang ditampilkan' : 'Belum ada kursus yang dapat dikelola'}</h3><p className="mt-2 max-w-md text-sm text-gray-400">{courses.length ? 'Tambahkan soal baru, impor file, atau simpan soal yang sudah ada melalui editor kuis.' : 'Admin perlu menugaskan Anda sebagai pengajar pada kursus terlebih dahulu.'}</p></div>}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 p-4"><p className="text-xs text-gray-400">{questions.from ?? 0}–{questions.to ?? 0} dari {questions.total} soal</p><div className="flex flex-wrap gap-1">{questions.links.map((link, index) => link.url ? <Link key={index} href={link.url} preserveScroll className={`rounded-lg px-3 py-1.5 text-xs ${link.active ? 'bg-navy-600 text-white' : 'border border-gray-200 text-gray-500'}`} dangerouslySetInnerHTML={{ __html: link.label }} /> : <span key={index} className="px-3 py-1.5 text-xs text-gray-300" dangerouslySetInnerHTML={{ __html: link.label }} />)}</div></div>
                </section>
            </div>
        </div>
        {['create', 'edit'].includes(dialog?.mode) && <QuestionForm key={dialog.question?.id ?? 'new'} question={dialog.question} courses={courses} categories={categories} initialCourseId={query.course_id} onClose={() => setDialog(null)} />}
        {['preview', 'history'].includes(dialog?.mode) && <QuestionPreview question={dialog.question} history={dialog.mode === 'history'} onClose={() => setDialog(null)} />}
        {['category', 'import'].includes(dialog?.mode) && <BankToolsDialog mode={dialog.mode} courses={courses} categories={categories} initialCourseId={query.course_id} onClose={() => setDialog(null)} />}
    </AuthenticatedLayout>;
}
