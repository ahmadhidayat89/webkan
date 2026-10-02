import { Link } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import AccordionMenu from '@/Components/AccordionMenu';
import { ArrowLeft, PanelLeftClose, PanelLeft, X, Award } from 'lucide-react';
import { useState } from 'react';

export default function CoursePlayerLayout({ course, modules, activeLesson, onSelectLesson, children }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
    const completedLessons = modules.reduce((acc, m) => acc + m.lessons.filter((l) => l.isCompleted).length, 0);
    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top Bar */}
            <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3 z-40 flex-shrink-0">
                <Link
                    href={route('dashboard')}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Kembali</span>
                </Link>

                <div className="w-px h-6 bg-gray-200" />

                <ApplicationLogo showText={false} className="hidden sm:flex" />

                <div className="flex-1 min-w-0">
                    <h1 className="text-sm font-semibold text-gray-800 truncate">
                        {course?.title || 'Kursus'}
                    </h1>
                    <div className="flex items-center gap-2">
                        <div className="w-24 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-navy-500 to-navy-400 rounded-full transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <span className="text-[10px] text-gray-400">{progressPercent}%</span>
                    </div>
                </div>

                {course.certificate_id && (
                    <a
                        href={route('student.certificates.download', course.certificate_id)}
                        className="flex items-center gap-1.5 bg-gold-500 hover:bg-gold-600 text-white px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all shadow-sm"
                    >
                        <Award className="w-3.5 h-3.5" />
                        <span>Sertifikat</span>
                    </a>
                )}

                {/* Desktop sidebar toggle */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-100 transition-colors"
                >
                    {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
                </button>

                {/* Mobile sidebar toggle */}
                <button
                    onClick={() => setMobileSidebarOpen(true)}
                    className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-100 transition-colors"
                >
                    <PanelLeft className="w-4 h-4" />
                </button>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Desktop Sidebar */}
                <aside className={`hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 flex-shrink-0 ${
                    sidebarOpen ? 'w-80' : 'w-0 overflow-hidden'
                }`}>
                    <div className="p-4 border-b border-gray-100">
                        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Materi Kursus</h2>
                        <p className="text-xs text-gray-500">{completedLessons} dari {totalLessons} selesai</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3">
                        <AccordionMenu
                            modules={modules}
                            activeLesson={activeLesson}
                            onSelectLesson={onSelectLesson}
                        />
                    </div>
                </aside>

                {/* Mobile Sidebar Overlay */}
                {mobileSidebarOpen && (
                    <div className="md:hidden fixed inset-0 z-50 flex">
                        <div className="absolute inset-0 bg-black/40" onClick={() => setMobileSidebarOpen(false)} />
                        <div className="relative w-80 max-w-[85vw] bg-white shadow-xl flex flex-col animate-slide-in-left">
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Materi Kursus</h2>
                                    <p className="text-xs text-gray-500">{completedLessons} dari {totalLessons} selesai</p>
                                </div>
                                <button
                                    onClick={() => setMobileSidebarOpen(false)}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <X className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3">
                                <AccordionMenu
                                    modules={modules}
                                    activeLesson={activeLesson}
                                    onSelectLesson={(lesson) => {
                                        onSelectLesson(lesson);
                                        setMobileSidebarOpen(false);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
