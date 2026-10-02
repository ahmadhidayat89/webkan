import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown, Video, FileText, HelpCircle, CheckCircle2, Circle, Play } from 'lucide-react';

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

export default function AccordionMenu({ modules, activeLesson, onSelectLesson }) {
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

                return (
                    <Accordion.Item
                        key={module.id}
                        value={`module-${module.id}`}
                        className="border border-gray-100 rounded-lg overflow-hidden bg-white"
                    >
                        <Accordion.Header>
                            <Accordion.Trigger className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors group">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-semibold text-navy-500 uppercase tracking-wider">
                                            Modul {moduleIndex + 1}
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                            {completedCount}/{totalCount} selesai
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-semibold text-gray-800 truncate">
                                        {module.title}
                                    </h3>
                                    {/* Mini progress bar */}
                                    <div className="w-full h-0.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-navy-500 to-navy-400 rounded-full transition-all duration-500"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                </div>
                                <ChevronDown className="w-4 h-4 text-gray-400 accordion-chevron flex-shrink-0" />
                            </Accordion.Trigger>
                        </Accordion.Header>

                        <Accordion.Content className="accordion-content overflow-hidden">
                            <div className="px-2 pb-2 space-y-0.5">
                                {module.lessons.map((lesson) => {
                                    const Icon = typeIcons[lesson.type] || FileText;
                                    const isActive = activeLesson?.id === lesson.id;
                                    const colorClass = typeColors[lesson.type] || 'text-gray-500 bg-gray-50';

                                    return (
                                        <button
                                            key={lesson.id}
                                            onClick={() => onSelectLesson(lesson)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group/item ${
                                                isActive
                                                    ? 'bg-navy-50 border-l-3 border-navy-600'
                                                    : 'hover:bg-gray-50'
                                            }`}
                                        >
                                            {/* Type Icon */}
                                            <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                                                isActive ? 'bg-navy-100 text-navy-600' : colorClass
                                            }`}>
                                                <Icon className="w-3.5 h-3.5" />
                                            </div>

                                            {/* Lesson Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs font-medium truncate ${
                                                    isActive ? 'text-navy-800' : 'text-gray-700'
                                                }`}>
                                                    {lesson.title}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-0.5">
                                                    {typeLabels[lesson.type] || lesson.type}
                                                </p>
                                            </div>

                                            {/* Status Icon */}
                                            <div className="flex-shrink-0">
                                                {lesson.isCompleted ? (
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                ) : isActive ? (
                                                    <Play className="w-4 h-4 text-navy-500" />
                                                ) : (
                                                    <Circle className="w-4 h-4 text-gray-300" />
                                                )}
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
