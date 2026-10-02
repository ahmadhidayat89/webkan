import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, Link } from '@inertiajs/react';
import CourseCard from '@/Components/CourseCard';
import StatsCard from '@/Components/StatsCard';
import UpcomingEvents from '@/Components/UpcomingEvents';
import EventCalendar from '@/Components/EventCalendar';
import { useRole } from '@/contexts/RoleContext';
import {
    Users,
    BookOpen,
    Award,
    TrendingUp,
    Clock,
    PlusCircle,
    Activity,
    CheckCircle2,
    Shield,
    ArrowRight,
    Wifi,
} from 'lucide-react';

// ─── Dashboard Pelajar ────────────────────────────────────────────────────────
function PelajarDashboard() {
    const { auth, upcomingEvents = [], calendarEvents = [], enrolledCourses = [], availableCourses = [], studentStats = {}, onlineUsers = [] } = usePage().props;
    const user = auth?.user;
    const stats = studentStats;

    return (
        <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Welcome Banner */}
            <div className="card p-6 sm:p-8 mb-8 bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gold-400 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400 rounded-full blur-3xl" />
                </div>
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold mb-1">
                            Selamat Datang, {user?.name?.split(' ')[0] || 'Pelajar'}! 👋
                        </h1>
                        <p className="text-navy-200 text-sm sm:text-base">
                            Lanjutkan perjalanan belajar Anda di platform E-Training KAN.
                        </p>
                        {user?.organization && (
                            <p className="text-navy-300 text-xs mt-1.5">🏢 {user.organization}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatsCard icon={BookOpen} label="Sedang Belajar" value={stats.coursesInProgress || 0} gradient="from-blue-500 to-blue-700" index={0} />
                <StatsCard icon={CheckCircle2} label="Selesai" value={stats.coursesCompleted || 0} gradient="from-green-500 to-green-700" index={1} />
                <StatsCard icon={Award} label="Sertifikat" value={stats.certificates || 0} gradient="from-gold-500 to-gold-700" index={2} />
                <StatsCard icon={Clock} label="Jam Belajar" value={`${stats.totalHoursLearned || 0}j`} gradient="from-purple-500 to-purple-700" index={3} />
            </div>

            {/* Main Content + Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                <div className="lg:col-span-2 space-y-8">
                    {/* Enrolled Courses */}
                    {enrolledCourses.length > 0 && (
                        <section>
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Pelatihan Berlangsung</h2>
                                    <p className="text-sm text-gray-500">Lanjutkan dari terakhir kali</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {enrolledCourses.map((course, i) => (
                                    <CourseCard key={course.id} course={course} role="pelajar" index={i} />
                                ))}
                            </div>
                        </section>
                    )}


                </div>

                {/* Right Sidebar */}
                <div className="space-y-5">
                    <EventCalendar events={calendarEvents} />
                    <UpcomingEvents events={upcomingEvents} />

                    {/* Pelajar Online */}
                    {onlineUsers.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Wifi className="w-4 h-4 text-emerald-500" />
                                <h3 className="text-sm font-bold text-gray-900">Pelajar Online</h3>
                                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full ml-auto">
                                    {onlineUsers.length} aktif
                                </span>
                            </div>
                            <div className="card p-3 space-y-2">
                                {onlineUsers.map(u => (
                                    <div key={u.id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                                        <div className="relative flex-shrink-0">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy-400 to-navy-600 flex items-center justify-center text-white text-xs font-bold">
                                                {u.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-gray-800 truncate">{u.name}</p>
                                            <p className="text-[10px] text-gray-400 truncate">
                                                {u.username ? `@${u.username}` : u.organization || 'Pelajar'}
                                            </p>
                                        </div>
                                        <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full whitespace-nowrap">Online</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Dashboard Admin ──────────────────────────────────────────────────────────
function AdminDashboard() {
    const { auth, upcomingEvents = [], calendarEvents = [], adminStats = {}, adminCourses = [], onlineUsers = [] } = usePage().props;
    const user = auth?.user;
    const stats = adminStats;


    return (
        <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Admin Header */}
            <div className="card p-6 sm:p-8 mb-8 bg-gradient-to-r from-gray-800 via-gray-900 to-navy-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gold-400 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-navy-400 rounded-full blur-3xl" />
                </div>
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-5 h-5 text-gold-400" />
                            <span className="text-xs font-semibold text-gold-400 uppercase tracking-widest">Panel Admin</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold mb-1">
                            Halo, {user?.name?.split(' ')[0] || 'Admin'}!
                        </h1>
                        <p className="text-gray-300 text-sm">
                            Kelola konten pelatihan dan pantau perkembangan pelajar.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href={route('admin.courses.index')} className="flex items-center gap-2 px-4 py-2.5 bg-gold-500 hover:bg-gold-600 rounded-xl text-sm font-semibold text-white transition-all shadow-sm">
                            <PlusCircle className="w-4 h-4" />
                            Buat Pelatihan
                        </Link>
                        <Link href={route('admin.users.index')} className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl text-sm font-semibold text-white transition-all">
                            <Users className="w-4 h-4" />
                            Kelola User
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <StatsCard icon={Users} label="Total Pelajar" value={(stats.totalStudents || 0).toLocaleString()} gradient="from-blue-500 to-blue-700" index={0} />
                <StatsCard icon={BookOpen} label="Pelatihan Aktif" value={stats.activeCourses || 0} gradient="from-navy-500 to-navy-700" index={1} />
                <StatsCard icon={TrendingUp} label="Penyelesaian" value={`${stats.completionRate || 0}%`} gradient="from-green-500 to-green-700" index={2} />
                <StatsCard icon={Award} label="Sertifikat" value={(stats.totalCertificates || 0).toLocaleString()} gradient="from-gold-500 to-gold-700" index={3} />
                <StatsCard icon={Wifi} label="Sedang Online" value={stats.onlineCount || 0} gradient="from-emerald-500 to-emerald-700" index={4} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Courses Grid */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-bold text-gray-900">Pelatihan Anda</h2>
                        <Link href={route('admin.courses.index')} className="flex items-center gap-1 text-sm font-medium text-navy-600 hover:text-navy-800 transition-colors">
                            Tambah Baru <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {adminCourses.slice(0, 4).map((course, i) => (
                            <CourseCard key={course.id} course={course} role="admin" index={i} />
                        ))}
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-5">
                    <EventCalendar events={calendarEvents} />
                    <UpcomingEvents events={upcomingEvents} />

                    {/* Online Users */}
                    {onlineUsers.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Wifi className="w-4 h-4 text-emerald-500" />
                                <h3 className="text-sm font-bold text-gray-900">Sedang Online</h3>
                                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full ml-auto">
                                    {onlineUsers.length} aktif
                                </span>
                            </div>
                            <div className="card p-3 space-y-2">
                                {onlineUsers.map(u => (
                                    <div key={u.id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                                        <div className="relative flex-shrink-0">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy-400 to-navy-600 flex items-center justify-center text-white text-xs font-bold">
                                                {u.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-gray-800 truncate">{u.name}</p>
                                            <p className="text-[10px] text-gray-400 truncate">
                                                {u.username ? `@${u.username}` : u.organization || 'Pelajar'}
                                            </p>
                                        </div>
                                        <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full whitespace-nowrap">Online</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Shortcut ke Log Aktivitas */}
                    <Link
                        href={route('admin.activity-log')}
                        className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200 hover:border-navy-300 hover:shadow-sm transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-navy-50 flex items-center justify-center group-hover:bg-navy-100 transition-colors">
                                <Activity className="w-4 h-4 text-navy-600" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">Log Aktivitas</p>
                                <p className="text-xs text-gray-400">Lihat semua aktivitas pelajar</p>
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-navy-500 group-hover:translate-x-0.5 transition-all" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

// ─── Inner wrapper (harus di dalam AuthenticatedLayout agar useRole() bisa baca context) ──
function DashboardContent() {
    const { role } = useRole();
    return role === 'admin' ? <AdminDashboard /> : <PelajarDashboard />;
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function Dashboard() {
    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />
            <DashboardContent />
        </AuthenticatedLayout>
    );
}
