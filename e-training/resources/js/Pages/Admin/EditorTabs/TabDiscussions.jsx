import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import DiscussionPanel from '@/Components/DiscussionPanel';
import { MessageCircle, Video, FileText, HelpCircle, ExternalLink, CheckCircle2 } from 'lucide-react';

const TYPE_ICONS = {
    video: Video,
    document: FileText,
    pdf: FileText,
    quiz: HelpCircle,
    zoom: Video,
};

const TYPE_LABELS = {
    video: 'Video',
    document: 'Dokumen',
    pdf: 'Dokumen',
    quiz: 'Kuis',
    zoom: 'Zoom',
};

function rowTone(isSelected, isUnread) {
    if (isSelected) return 'bg-navy-50/70';
    if (isUnread) return 'bg-amber-50/40 hover:bg-amber-50/70';
    return 'hover:bg-gray-50';
}

export default function TabDiscussions({ courseId, modules = [], initialLessonId = null, isActive = false }) {
    const allLessons = modules.flatMap((mod, modIdx) =>
        (mod.lessons || []).map((lesson) => ({
            ...lesson,
            moduleTitle: mod.title || `Modul ${modIdx + 1}`,
            moduleIndex: modIdx + 1,
        }))
    );

    const [filterWithDiscussions, setFilterWithDiscussions] = useState(false);
    const [liveStats, setLiveStats] = useState({});

    const pickDefaultLessonId = () => {
        if (initialLessonId && allLessons.some((l) => l.id === Number(initialLessonId))) {
            return Number(initialLessonId);
        }
        const firstUnread = allLessons.find((l) => (l.unread_discussions_count ?? 0) > 0);
        if (firstUnread) return firstUnread.id;
        const firstWithDiscussion = allLessons.find((l) => (l.discussions_count ?? 0) > 0);
        return firstWithDiscussion?.id ?? allLessons[0]?.id ?? null;
    };

    const [selectedLessonId, setSelectedLessonId] = useState(pickDefaultLessonId);

    useEffect(() => {
        if (initialLessonId && allLessons.some((l) => l.id === Number(initialLessonId))) {
            setSelectedLessonId(Number(initialLessonId));
        }
    }, [initialLessonId]);

    useEffect(() => {
        setLiveStats((prev) =>
            selectedLessonId && prev[selectedLessonId]
                ? { [selectedLessonId]: prev[selectedLessonId] }
                : {}
        );
    }, [modules, selectedLessonId]);

    const getLessonCount = (lesson) =>
        liveStats[lesson.id]?.count ?? lesson.discussions_count ?? 0;

    const getLessonUnreadCount = (lesson) => {
        if (isActive && selectedLessonId === lesson.id && liveStats[lesson.id] !== undefined) {
            return 0;
        }
        return liveStats[lesson.id]?.unreadCount ?? lesson.unread_discussions_count ?? 0;
    };

    const getLessonLatest = (lesson) =>
        liveStats[lesson.id] !== undefined ? liveStats[lesson.id].latest : lesson.latest_discussion;

    const filteredLessons = filterWithDiscussions
        ? allLessons.filter((l) => getLessonCount(l) > 0)
        : allLessons;

    const selectedLesson =
        allLessons.find((l) => l.id === selectedLessonId) || filteredLessons[0] || allLessons[0] || null;

    const handleMessagesChange = (lessonId, messages) => {
        const last = messages.length > 0 ? messages[messages.length - 1] : null;
        setLiveStats((prev) => ({
            ...prev,
            [lessonId]: {
                count: messages.length,
                unreadCount: isActive && selectedLessonId === lessonId ? 0 : undefined,
                latest: last
                    ? {
                        user_name: last.user?.name || 'Pengguna',
                        message: last.message || (last.file_name ? `📎 ${last.file_name}` : ''),
                        time_ago: last.time_ago || 'Baru saja',
                    }
                    : null,
            },
        }));
    };

    if (allLessons.length === 0) {
        return (
            <div className="p-12 text-center bg-white border border-gray-200 rounded-2xl">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <h3 className="text-base font-bold text-gray-800">Belum Ada Materi atau Kuis</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Tambahkan modul dan materi terlebih dahulu pada tab Modul &amp; Materi untuk membuka ruang diskusi.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Sidebar Daftar Materi / Kuis */}
            <div className="lg:col-span-5 xl:col-span-4">
                <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">
                    <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 bg-gray-50">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">Daftar Sesi &amp; Kuis</h3>
                            <p className="text-xs text-gray-500">Pilih materi untuk melihat &amp; membalas diskusi</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFilterWithDiscussions((v) => !v)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border ${filterWithDiscussions
                                ? 'bg-navy-600 text-white border-navy-600'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                                }`}
                        >
                            {filterWithDiscussions ? 'Ada Diskusi' : 'Semua Materi'}
                        </button>
                    </div>

                    <div className="divide-y divide-gray-100 max-h-[540px] overflow-y-auto">
                        {filteredLessons.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-sm font-medium text-gray-500">Belum ada materi dengan diskusi aktif.</p>
                            </div>
                        ) : (
                            filteredLessons.map((lesson) => {
                                const Icon = TYPE_ICONS[lesson.type] || FileText;
                                const isSelected = selectedLesson?.id === lesson.id;
                                const count = getLessonCount(lesson);
                                const unreadCount = getLessonUnreadCount(lesson);
                                const isUnread = unreadCount > 0;
                                const latest = getLessonLatest(lesson);

                                return (
                                    <button
                                        key={lesson.id}
                                        type="button"
                                        onClick={() => setSelectedLessonId(lesson.id)}
                                        className={`w-full text-left px-4 py-3.5 transition-colors flex items-start gap-3 ${rowTone(isSelected, isUnread)}`}
                                    >
                                        <div
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${isSelected ? 'bg-navy-600 text-white' : 'bg-gray-100 text-gray-600'
                                                }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-[10px] font-semibold tracking-wider uppercase text-navy-600 truncate">
                                                    Modul {lesson.moduleIndex}: {lesson.moduleTitle}
                                                </span>
                                                {count > 0 && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 text-gray-700 flex-shrink-0">
                                                        <MessageCircle className="w-2.5 h-2.5" />
                                                        {count}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between gap-2 mt-0.5">
                                                <p className="text-sm font-bold text-gray-900 truncate">
                                                    {lesson.title}
                                                </p>
                                                {count > 0 && (
                                                    isUnread ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex-shrink-0">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                            {unreadCount} Belum Dibaca
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-green-50 text-green-700 border border-green-200 flex-shrink-0">
                                                            <CheckCircle2 className="w-2.5 h-2.5" />
                                                            Sudah Dibaca
                                                        </span>
                                                    )
                                                )}
                                            </div>

                                            <p className="text-[11px] text-gray-400">
                                                {TYPE_LABELS[lesson.type] || lesson.type}
                                            </p>

                                            {latest && (
                                                <div className="p-2 mt-2 text-xs bg-white border border-gray-100 rounded-lg">
                                                    <div className="flex items-center justify-between gap-2 text-[10px] text-gray-400">
                                                        <span className="font-semibold text-gray-700 truncate">
                                                            {latest.user_name}
                                                        </span>
                                                        <span className="flex-shrink-0">{latest.time_ago}</span>
                                                    </div>
                                                    <p className="mt-0.5 text-gray-600 truncate">{latest.message}</p>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Area Percakapan Diskusi */}
            <div className="lg:col-span-7 xl:col-span-8">
                {selectedLesson ? (
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-white border border-gray-200 shadow-sm rounded-xl">
                            <div>
                                <p className="text-xs font-semibold text-navy-600">
                                    Modul {selectedLesson.moduleIndex}: {selectedLesson.moduleTitle}
                                </p>
                                <h3 className="text-base font-bold text-gray-900">{selectedLesson.title}</h3>
                            </div>
                            <Link
                                href={route('course.player', { id: courseId, lesson: selectedLesson.id })}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-navy-600 bg-navy-50 hover:bg-navy-100 rounded-lg transition-colors"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Buka di Player
                            </Link>
                        </div>

                        <DiscussionPanel
                            key={`editor-discussion-${selectedLesson.id}`}
                            lessonId={selectedLesson.id}
                            lessonTitle={selectedLesson.title}
                            alwaysOpen
                            isActive={isActive}
                            onMessagesChange={(msgs) => handleMessagesChange(selectedLesson.id, msgs)}
                        />
                    </div>
                ) : null}
            </div>
        </div>
    );
}
