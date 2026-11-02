import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown, Video, FileText, HelpCircle, CheckCircle2, Circle, Play, Lock, Clock } from 'lucide-react';

const typeIcons = {
    video: Video,
    document: FileText,
    pdf: FileText,       // backward compat
    quiz: HelpCircle,
    zoom: Video,
};

const typeLabels = {
    video: 'Video',
    document: 'Dokumen',
    pdf: 'Dokumen',      // backward compat
    quiz: 'Kuis',
    zoom: 'Zoom',
};

const typeColors = {
    video: 'text-blue-500 bg-blue-50',
    document: 'text-red-500 bg-red-50',
    pdf: 'text-red-500 bg-red-50',  // backward compat
    quiz: 'text-purple-500 bg-purple-50',
    zoom: 'text-sky-500 bg-sky-50',
};

function StatusIcon({ isCompleted, isActive }) {
    if (isCompleted) {
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
    if (isActive) {
        return <Play className="w-4 h-4 text-navy-500" />;
    }
    return <Circle className="w-4 h-4 text-gray-300" />;
}

// Status jendela waktu modul berdasarkan jam server: 'upcoming' | 'open' | 'closed'
function getModuleWindow(module, now) {
    const start = module.start_at ? Date.parse(module.start_at) : null;
    const end = module.end_at ? Date.parse(module.end_at) : null;

    if (start !== null && now < start) return 'upcoming';
    if (end !== null && now > end) return 'closed';
    return 'open';
}

export default function AccordionMenu({ modules, activeLesson, onSelectLesson, serverNow, bypassSchedule = false }) {
    const now = serverNow ?? Date.now();
    const defaultOpenModules = modules
        .filter((m) => m.lessons.some((l) => l.id === activeLesson?.id))
        .map((m) => `module-${m.id}`);

    return (
        <Accordion.Root
            type="multiple"
            defaultValue={defaultOpenModules.length > 0 ? defaultOpenModules : [`module-${modules[0]?.id}`]}
            className="space-y-1"
        >
            {modules.map((module, moduleIndex) => {
                const completedCount = module.lessons.filter((l) => l.isCompleted).length;
                const totalCount = module.lessons.length;
                const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
                const rawWindowState = getModuleWindow(module, now);
                const windowState = bypassSchedule ? 'open' : rawWindowState;
                const locked = Boolean(module.locked_reason) || windowState === 'upcoming';

                return (
                    <Accordion.Item
                        key={module.id}
                        value={`module-${module.id}`}
                        className="overflow-hidden bg-white border border-gray-100 rounded-lg"
                    >
                        <Accordion.Header>
                            <Accordion.Trigger className="flex items-center justify-between w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 group">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-semibold text-navy-500 uppercase tracking-wider">
                                            Modul {moduleIndex + 1}
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                            {completedCount}/{totalCount} selesai
                                        </span>
                                        {locked && <Lock className="w-3 h-3 text-amber-500" />}
                                        {windowState === 'closed' && <Clock className="w-3 h-3 text-gray-400" />}
                                    </div>
                                    <h3 className="text-sm font-semibold text-gray-800 truncate">
                                        {module.title}
                                    </h3>
                                    {windowState === 'upcoming' && (
                                        <p className="mt-0.5 text-[10px] font-medium text-amber-600">
                                            Dibuka pada {module.start_at_label}
                                        </p>
                                    )}
                                    {windowState === 'closed' && (
                                        <p className="mt-0.5 text-[10px] font-medium text-gray-400">
                                            Ditutup pada {module.end_at_label}
                                        </p>
                                    )}
                                    {/* Mini progress bar */}
                                    <div className="w-full h-0.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                                        <div
                                            className="h-full transition-all duration-500 rounded-full bg-gradient-to-r from-navy-500 to-navy-400"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                </div>
                                <ChevronDown className="flex-shrink-0 w-4 h-4 text-gray-400 accordion-chevron" />
                            </Accordion.Trigger>
                        </Accordion.Header>

                        <Accordion.Content className="overflow-hidden accordion-content">
                            <div className="px-2 pb-2 space-y-0.5">
                                {locked && (
                                    <div className="flex items-start gap-2 p-3 mb-1 border rounded-lg border-amber-200 bg-amber-50">
                                        <Lock className="w-4 h-4 mt-0.5 text-amber-600 flex-shrink-0" />
                                        <p className="text-xs text-amber-700">
                                            {module.locked_reason || `Modul ini dibuka pada ${module.start_at_label}.`}
                                        </p>
                                    </div>
                                )}
                                {windowState === 'closed' && (
                                    <div className="flex items-start gap-2 p-3 mb-1 border border-gray-200 rounded-lg bg-gray-50">
                                        <Clock className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" />
                                        <p className="text-xs text-gray-600">
                                            Akses modul ditutup pada <span className="font-bold">{module.end_at_label}</span>. Materi masih bisa dibaca, tapi kuis tidak bisa dikerjakan.
                                        </p>
                                    </div>
                                )}
                                {(locked ? [] : module.lessons).map((lesson) => {
                                    const Icon = typeIcons[lesson.type] || FileText;
                                    const isActive = activeLesson?.id === lesson.id;
                                    const colorClass = typeColors[lesson.type] || 'text-gray-500 bg-gray-50';

                                    return (
                                        <button
                                            key={lesson.id}
                                            disabled={Boolean(lesson.locked_reason)}
                                            title={lesson.locked_reason || lesson.title}
                                            onClick={() => onSelectLesson(lesson)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group/item disabled:opacity-50 disabled:cursor-not-allowed ${isActive
                                                ? 'bg-navy-50 border-l-3 border-navy-600'
                                                : 'hover:bg-gray-50'
                                                }`}
                                        >
                                            {/* Type Icon */}
                                            <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-navy-100 text-navy-600' : colorClass
                                                }`}>
                                                <Icon className="w-3.5 h-3.5" />
                                            </div>

                                            {/* Lesson Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs font-medium truncate ${isActive ? 'text-navy-800' : 'text-gray-700'
                                                    }`}>
                                                    {lesson.title}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-0.5">
                                                    {typeLabels[lesson.type] || lesson.type}
                                                </p>
                                            </div>

                                            {/* Status Icon */}
                                            <div className="flex-shrink-0">
                                                {lesson.locked_reason ? <Lock className="w-4 h-4 text-amber-500" /> : <StatusIcon isCompleted={lesson.isCompleted} isActive={isActive} />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </Accordion.Content>
                    </Accordion.Item>
                );
            })}
        </Accordion.Root>
    );
}
