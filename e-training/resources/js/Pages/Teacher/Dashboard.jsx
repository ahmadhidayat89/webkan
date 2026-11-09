import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, Clock, FileText, Users, MessageCircle } from 'lucide-react';

function StatCard({ label, value, description, icon: Icon, attention = false }) {
    return <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <span className={`rounded-xl p-2.5 ${attention ? 'bg-amber-50 text-amber-600' : 'bg-navy-50 text-navy-600'}`}><Icon className="h-5 w-5" /></span>
        </div>
        <p className="mt-3 text-3xl font-bold text-gray-900">{value}</p>
        <p className="mt-1 text-xs text-gray-500">{description}</p>
    </div>;
}

function PendingList({ attempts }) {
    if (!attempts.total) {
        return <div className="flex flex-col items-center px-5 py-12 text-center">
            <span className="mb-4 rounded-full bg-green-50 p-4"><CheckCircle2 className="h-8 w-8 text-green-600" /></span>
            <h3 className="font-bold text-gray-900">Tidak ada penilaian tertunda</h3>
            <p className="mt-2 max-w-md text-sm text-gray-500">Jawaban esai dan jawaban singkat yang perlu diperiksa akan tampil di sini setelah peserta mengumpulkan kuis.</p>
        </div>;
    }

    return <>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="border-y border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500">
                    <tr><th className="px-5 py-3">Peserta & Kuis</th><th className="px-5 py-3">Dikumpulkan</th><th className="px-5 py-3">Perlu Dinilai</th><th className="px-5 py-3 text-right"><span className="sr-only">Tindakan</span></th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {attempts.data.map(attempt => <tr key={attempt.id} className="hover:bg-gray-50/70">
                        <td className="min-w-56 px-5 py-4"><p className="font-semibold text-gray-900">{attempt.student}</p><p className="mt-1 text-gray-700">{attempt.quiz}</p><p className="mt-1 text-xs text-gray-500">{attempt.course}</p></td>
                        <td className="whitespace-nowrap px-5 py-4 text-xs text-gray-500">{attempt.submittedAt}</td>
                        <td className="px-5 py-4"><span className="whitespace-nowrap rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">{attempt.pendingAnswers} jawaban</span></td>
                        <td className="px-5 py-4 text-right"><Link href={attempt.gradingUrl} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-navy-600 px-3 py-2 text-xs font-semibold text-white hover:bg-navy-700">Nilai sekarang <ArrowRight className="h-3.5 w-3.5" /></Link></td>
                    </tr>)}
                </tbody>
            </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-4">
            <p className="text-xs text-gray-500">Menampilkan {attempts.from}–{attempts.to} dari {attempts.total} pengumpulan</p>
            <div className="flex items-center gap-2">
                <PageButton href={attempts.prev_page_url} previous />
                <span className="text-xs text-gray-500">{attempts.current_page} / {attempts.last_page}</span>
                <PageButton href={attempts.next_page_url} />
            </div>
        </div>
    </>;
}

function PageButton({ href, previous = false }) {
    const Icon = previous ? ChevronLeft : ChevronRight;
    const label = previous ? 'Halaman sebelumnya' : 'Halaman berikutnya';
    if (!href) return <span aria-label={label} aria-disabled="true" className="rounded-lg border border-gray-100 p-2 text-gray-300"><Icon className="h-4 w-4" /></span>;
    return <Link href={href} preserveScroll aria-label={label} className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"><Icon className="h-4 w-4" /></Link>;
}

function CourseList({ courses }) {
    if (!courses.length) return <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-10 text-center">
        <BookOpen className="mx-auto mb-3 h-8 w-8 text-gray-300" />
        <h3 className="font-semibold text-gray-800">Belum ada kursus yang ditugaskan</h3>
        <p className="mt-2 text-sm text-gray-500">Kursus akan tampil di sini setelah admin memberikan akses kepada Anda.</p>
    </div>;

    return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map(course => <div key={course.id} className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between"><BookOpen className="h-5 w-5 text-navy-500" /><span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${course.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{course.status}</span></div>
            <h3 className="font-bold leading-relaxed text-gray-900">{course.title}</h3>
            <p className="mb-5 mt-3 flex items-center gap-1.5 text-xs text-gray-500"><Users className="h-3.5 w-3.5" />{course.participants} peserta terdaftar</p>
            <Link href={course.url} className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4 text-sm font-semibold text-navy-600 hover:text-navy-800">Buka kursus <ArrowRight className="h-4 w-4" /></Link>
        </div>)}
    </div>;
}

export default function Dashboard({ stats, pendingAttempts, courses, recentDiscussions = [] }) {
    const { auth } = usePage().props;

    useEffect(() => {
        const intervalId = setInterval(() => {
            if (document.visibilityState === 'visible') {
                router.reload({ only: ['recentDiscussions', 'stats', 'pendingAttempts'], preserveScroll: true, preserveState: true });
            }
        }, 5000);

        return () => clearInterval(intervalId);
    }, []);

    return <AuthenticatedLayout>
        <Head title="Dashboard Pengajar" />
        <div className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="mb-1 text-sm font-medium text-navy-600">Selamat datang, {auth.user.name}</p><h1 className="text-2xl font-bold text-gray-900">Dashboard Pengajar</h1><p className="mt-2 text-sm text-gray-500">Pantau kursus Anda dan selesaikan penilaian peserta.</p></div>
                <Link href={route('admin.courses.index')} className="btn-secondary shrink-0 justify-center text-sm"><BookOpen className="h-4 w-4" />Kursus Mengajar</Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Kursus Mengajar" value={stats.courses} description="Kursus yang ditugaskan admin" icon={BookOpen} />
                <StatCard label="Peserta" value={stats.participants} description="Peserta unik di seluruh kursus Anda" icon={Users} />
                <StatCard label="Menunggu Penilaian" value={stats.pendingAttempts} description={`Pengumpulan dari ${stats.pendingQuizzes} kuis`} icon={ClipboardList} attention />
                <StatCard label="Jawaban Perlu Dinilai" value={stats.pendingAnswers} description="Jawaban esai dan jawaban singkat" icon={FileText} attention />
            </div>

            <section aria-labelledby="pending-grading-heading" className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3 p-5">
                    <div><h2 id="pending-grading-heading" className="flex items-center gap-2 text-lg font-bold text-gray-900"><Clock className="h-5 w-5 text-amber-500" />Perlu Dinilai</h2><p className="mt-1 text-sm text-gray-500">Pengumpulan yang paling lama menunggu ditampilkan lebih dulu.</p></div>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">{stats.pendingAttempts} pengumpulan</span>
                </div>
                <PendingList attempts={pendingAttempts} />
            </section>

            <section aria-labelledby="recent-discussions-heading" className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3 p-5 border-b border-gray-100">
                    <div>
                        <h2 id="recent-discussions-heading" className="flex items-center gap-2 text-lg font-bold text-gray-900">
                            <MessageCircle className="h-5 w-5 text-navy-600" />
                            Diskusi Modul Terbaru
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">1 notifikasi per modul yang menampilkan pesan terbaru dari peserta.</p>
                    </div>
                    <span className="rounded-full bg-navy-50 px-3 py-1 text-xs font-semibold text-navy-700">
                        {recentDiscussions.length} modul aktif
                    </span>
                </div>
                {recentDiscussions.length === 0 ? (
                    <div className="flex flex-col items-center px-5 py-10 text-center">
                        <MessageCircle className="mb-3 h-8 w-8 text-gray-300" />
                        <h3 className="font-bold text-gray-800">Belum ada diskusi</h3>
                        <p className="mt-1 text-sm text-gray-500">Pertanyaan peserta pada materi atau kuis akan tampil di sini.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {recentDiscussions.map((item) => (
                            <div
                                key={item.id}
                                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 transition-colors ${
                                    !item.is_read ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-gray-50/70'
                                }`}
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                        {!item.is_read ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                Pesan Baru ({item.unread_count} Belum Dibaca)
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-[11px] font-semibold text-green-700">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Sudah Dibaca
                                            </span>
                                        )}
                                        <span className="font-bold text-gray-900">{item.user_name}</span>
                                        <span>•</span>
                                        <span className="font-medium text-navy-600 truncate">{item.course_title}</span>
                                        <span>•</span>
                                        <span className="font-semibold text-gray-700 truncate">{item.module_title}</span>
                                        <span className="text-gray-400">({item.lesson_title})</span>
                                        <span>•</span>
                                        <span className="flex-shrink-0 text-gray-400">{item.time_ago}</span>
                                    </div>
                                    <p className="mt-1.5 text-sm text-gray-700 line-clamp-2">{item.message}</p>
                                </div>
                                <Link
                                    href={item.reply_url}
                                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-navy-600 px-3 py-2 text-xs font-semibold text-white hover:bg-navy-700 self-start sm:self-center"
                                >
                                    Buka &amp; Balas <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section aria-labelledby="teaching-courses-heading" className="space-y-4">
                <div className="flex items-center justify-between gap-3"><h2 id="teaching-courses-heading" className="text-lg font-bold text-gray-900">Kursus Saya</h2><Link href={route('admin.courses.index')} className="text-sm font-semibold text-navy-600 hover:underline">Lihat semua</Link></div>
                <CourseList courses={courses} />
            </section>
        </div>
    </AuthenticatedLayout>;
}
