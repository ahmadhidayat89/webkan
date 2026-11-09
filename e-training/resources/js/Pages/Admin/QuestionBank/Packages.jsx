import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Archive, ArchiveRestore, ArrowRight, Eye, LibraryBig, PackageOpen, Search, Pencil, Trash2 } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ImportQuizPackage from '@/Components/ImportQuizPackage';
import PackagePreview from './PackagePreview';
import PackageEditor from './PackageEditor';
import DeletePackage from './DeletePackage';

export default function Packages({ packages, courses, filters }) {
    const { flash, errors } = usePage().props;
    const [query, setQuery] = useState(filters);
    const [dialog, setDialog] = useState(null);
    const [archiving, setArchiving] = useState(null);
    useEffect(() => setQuery(filters), [filters]);
    function applyFilters(values) {
        router.get(route('admin.question-bank.packages.index'), Object.fromEntries(Object.entries({ ...values, archived: Number(values.archived) }).filter(([, value]) => value !== '' && value != null)), { preserveState: true, preserveScroll: true });
    }
    function search(event) { event.preventDefault(); applyFilters(query); }
    function archive(item) {
        if (archiving !== null) return;
        setArchiving(item.id);
        router.patch(route('admin.question-bank.packages.archive', item.id), { archived: !item.archived_at }, {
            preserveScroll: true, onFinish: () => setArchiving(null),
        });
    }
    return <AuthenticatedLayout><Head title="Bank Soal — Paket Kuis" />
        <div className="px-4 py-8 mx-auto space-y-6 max-w-7xl sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div><p className="flex items-center gap-2 mb-2 text-xs font-semibold tracking-wider uppercase text-gold-600"><LibraryBig className="w-4 h-4" /> Studio pembelajaran</p><h1 className="text-2xl font-bold text-navy-900">Bank Soal</h1><p className="max-w-2xl mt-2 text-sm text-gray-500">Simpan satu kuis lengkap sebagai paket, lalu gunakan untuk membuat kuis baru di modul lain.</p></div>
                <Link href={route('admin.courses.index')} className="inline-flex items-center gap-2 text-sm btn-gold">Buka editor kursus <ArrowRight className="w-4 h-4" /></Link>
            </div>
            <nav aria-label="Jenis koleksi bank soal" className="inline-flex gap-1 p-1 text-sm bg-white border border-gray-200 rounded-xl"><Link href={route('admin.question-bank.packages.index')} className="px-4 py-2 font-semibold rounded-lg bg-navy-50 text-navy-700">Paket Kuis</Link><Link href={route('admin.question-bank.index', { view: 'questions' })} className="px-4 py-2 text-gray-500 rounded-lg hover:bg-gray-50">Soal Satuan</Link></nav>
            {flash?.success && <output className="block p-4 text-sm text-green-700 border border-green-200 bg-green-50 rounded-xl">{flash.success} <button type="button" onClick={() => applyFilters({ ...query, archived: 1 })} className="ml-2 underline">Lihat Arsip</button></output>}
            {!!Object.keys(errors ?? {}).length && !dialog && <p role="alert" className="p-4 text-sm text-red-700 rounded-xl bg-red-50">{Object.values(errors).join(' ')}</p>}
            <div className="p-4 text-sm text-gray-500 card sm:p-5"><strong className="font-semibold text-navy-800">Cara menyimpan:</strong> buka kuis di Modul & Materi → klik <strong className="font-semibold text-navy-800">Simpan Paket Kuis</strong>. Untuk menggunakan kembali, pilih <strong className="font-semibold text-navy-800">Buat Kuis dari Paket</strong> di bawah atau <strong className="font-semibold text-navy-800">Impor Paket Kuis</strong> pada modul tujuan.</div>
            <form onSubmit={search} className="flex flex-col gap-3 p-4 card sm:flex-row sm:items-center">
                <div className="relative flex-1"><Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" /><input aria-label="Cari nama paket" placeholder="Cari nama paket kuis…" value={query.search || ''} onChange={event => setQuery({ ...query, search: event.target.value })} className="w-full text-sm border-gray-200 rounded-lg pl-9" /></div>
                <select aria-label="Filter kursus paket" value={query.course_id || ''} onChange={event => setQuery({ ...query, course_id: event.target.value })} className="text-sm border-gray-200 rounded-lg sm:max-w-xs"><option value="">Semua kursus</option>{courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}</select>
                <select aria-label="Filter arsip paket" value={Number(query.archived) ? '1' : '0'} onChange={event => { const next = { ...query, archived: event.target.value }; setQuery(next); applyFilters(next); }} className="text-sm border-gray-200 rounded-lg"><option value="0">Paket aktif</option><option value="1">Arsip</option></select>
                <button type="submit" className="text-sm btn-secondary">Cari</button>
            </form>
            <p className="text-xs text-gray-400">{packages.total} paket kuis{Number(query.archived) ? ' di arsip' : ''}</p>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{packages.data.map(item => <article key={item.id} className="flex flex-col min-w-0 p-5 card">
                <div className="flex items-start justify-between gap-3 mb-4"><div className="p-3 rounded-xl bg-navy-50 text-navy-600"><PackageOpen className="w-5 h-5" /></div><span className="rounded-full bg-gold-50 px-2.5 py-1 text-[10px] font-semibold text-gold-700">{item.archived_at ? 'Arsip' : 'Paket Kuis'}</span></div>
                <h2 className="text-lg font-bold break-words text-navy-900">{item.title}</h2><p className="mt-1 text-xs text-gray-400">{item.course?.title}</p>
                {item.description && <p className="mt-3 text-sm text-gray-500 line-clamp-3">{item.description}</p>}
                <div className="grid grid-cols-2 gap-3 p-3 my-4 text-xs text-gray-500 rounded-lg bg-gray-50"><p><strong className="block text-lg text-navy-800">{item.effective_questions_count}</strong>soal per pengerjaan</p><p><strong className="block text-lg text-navy-800">{item.questions_count}</strong>pertanyaan tersimpan</p></div>
                <p className="mb-4 text-[11px] text-gray-400">Oleh {item.author?.name} · {new Date(item.created_at).toLocaleDateString('id-ID')} · Dipakai {item.usages_count} kuis</p>
                <div className="flex flex-wrap gap-2 pt-4 mt-auto border-t border-gray-100">
                    {!item.archived_at && <button type="button" onClick={() => setDialog({ mode: 'import', item })} className="flex-1 px-3 py-2 text-xs btn-gold">Buat Kuis dari Paket</button>}
                    {!item.archived_at && <button type="button" aria-label={`Edit paket ${item.title}`} onClick={() => setDialog({ mode: 'edit', item })} className="inline-flex items-center gap-1 px-3 py-2 text-xs btn-secondary"><Pencil className="h-3.5 w-3.5" />Edit Paket</button>}
                    <button type="button" aria-label={`Preview paket ${item.title}`} title="Lihat isi paket" onClick={() => setDialog({ mode: 'preview', item })} className="px-3 py-2 btn-secondary"><Eye className="w-4 h-4" /></button>
                    <button type="button" aria-label={`${item.archived_at ? 'Pulihkan' : 'Arsipkan'} paket ${item.title}`} title={item.archived_at ? 'Pulihkan paket' : 'Arsipkan paket'} disabled={archiving !== null} onClick={() => archive(item)} className="inline-flex items-center gap-1 px-3 py-2 text-xs btn-secondary disabled:opacity-50">{item.archived_at ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}{item.archived_at ? 'Pulihkan' : 'Arsipkan'}</button>
                    {item.archived_at && <button type="button" disabled={archiving !== null} aria-label={`Hapus permanen paket ${item.title}`} onClick={() => setDialog({ mode: 'delete', item })} className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"><Trash2 className="w-4 h-4" />Hapus Permanen</button>}
                </div>
            </article>)}</div>
            {!packages.data.length && <div className="flex flex-col items-center px-6 py-16 text-center card"><PackageOpen className="w-12 h-12 mb-4 text-navy-200" /><h2 className="font-bold text-gray-700">Belum ada paket kuis yang ditampilkan</h2><p className="max-w-md mt-2 text-sm text-gray-400">Simpan kuis yang sudah dibuat melalui editor kuis, atau sesuaikan filter pencarian.</p></div>}
            <div className="flex justify-end gap-2">{[['Sebelumnya', packages.prev_page_url], ['Berikutnya', packages.next_page_url]].map(([label, url]) => url ? <Link key={label} href={url} preserveScroll className="text-xs btn-secondary">{label}</Link> : <span key={label} className="px-3 py-2 text-xs text-gray-300">{label}</span>)}</div>
        </div>
        {dialog?.mode === 'import' && <ImportQuizPackage preset={dialog.item} onClose={() => setDialog(null)} />}
        {dialog?.mode === 'edit' && <PackageEditor item={dialog.item} onClose={() => setDialog(null)} />}
        {dialog?.mode === 'preview' && <PackagePreview item={dialog.item} onClose={() => setDialog(null)} />}
        {dialog?.mode === 'delete' && <DeletePackage item={dialog.item} onClose={() => setDialog(null)} />}
    </AuthenticatedLayout>;
}
