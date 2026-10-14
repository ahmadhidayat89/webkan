import { useState, useRef } from 'react';
import { router } from '@inertiajs/react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { PlusCircle, GripVertical, Trash2, Video, FileText, HelpCircle, ChevronDown, ChevronUp, Upload, X, Save, AlertTriangle } from 'lucide-react';
import QuizBuilder from './QuizBuilder';

// Modal konfirmasi hapus — menggantikan confirm() bawaan browser
function ConfirmDeleteModal({ message, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
                <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <p className="text-sm text-gray-700 pt-1.5 font-medium">{message}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={onCancel} className="flex-1 py-2 text-sm font-bold border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        Batal
                    </button>
                    <button onClick={onConfirm} className="flex-1 py-2 text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5">
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function TabModules({ courseId, modules }) {
    const [newModuleTitle, setNewModuleTitle] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'module'|'lesson'|'file', id, label }

    const addModule = (e) => {
        e.preventDefault();
        if (!newModuleTitle.trim()) return;
        router.post(route('admin.modules.store', courseId), {
            title: newModuleTitle.trim()
        }, {
            preserveScroll: true,
            onSuccess: () => setNewModuleTitle('')
        });
    };

    const handleDeleteConfirm = () => {
        if (!deleteTarget) return;
        const target = deleteTarget;
        setDeleteTarget(null); // tutup modal dulu sebelum request

        if (target.type === 'module') {
            router.delete(route('admin.modules.destroy', target.id), { preserveScroll: true });
        } else if (target.type === 'lesson') {
            router.delete(route('admin.lessons.destroy', target.id), { preserveScroll: true });
        } else if (target.type === 'file') {
            router.delete(route('admin.lessons.files.delete', target.id), { preserveScroll: true });
        }
    };

    const onDragEndModules = (result) => {
        if (!result.destination) return;
        if (result.destination.index === result.source.index) return;

        const items = Array.from(modules);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const reorderedData = items.map((item, index) => ({
            id: item.id,
            sort_order: index + 1
        }));

        router.post(route('admin.modules.reorder'), { modules: reorderedData }, {
            preserveScroll: true
        });
    };

    const onDragEndLessons = (moduleId, result) => {
        if (!result.destination) return;
        if (result.destination.index === result.source.index) return;

        const module = modules.find(m => m.id === moduleId);
        const items = Array.from(module.lessons);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const reorderedData = items.map((item, index) => ({
            id: item.id,
            sort_order: index + 1
        }));

        router.post(route('admin.lessons.reorder'), { lessons: reorderedData }, {
            preserveScroll: true
        });
    };

    return (
        <>
            {deleteTarget && (
                <ConfirmDeleteModal
                    message={deleteTarget.label}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}

            <div className="space-y-4 animate-fade-in">
                <DragDropContext onDragEnd={onDragEndModules}>
                    <Droppable droppableId="modules">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="space-y-4"
                            >
                                {modules.map((module, index) => (
                                    <Draggable key={module.id} draggableId={module.id.toString()} index={index}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                            >
                                                <ModuleCard
                                                    module={module}
                                                    index={index}
                                                    dragHandleProps={provided.dragHandleProps}
                                                    onDragEndLessons={onDragEndLessons}
                                                    onDelete={(id) => setDeleteTarget({ type: 'module', id, label: `Hapus modul "${module.title}" beserta semua materinya?` })}
                                                    onDeleteLesson={(lesson) => setDeleteTarget({ type: 'lesson', id: lesson.id, label: `Hapus materi "${lesson.title}"?` })}
                                                    onDeleteFile={(file) => setDeleteTarget({ type: 'file', id: file.id, label: `Hapus file "${file.original_name}"?` })}
                                                />
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>

                <form onSubmit={addModule} className="flex gap-2 items-center bg-gray-50 p-4 rounded-xl border-2 border-dashed border-gray-200">
                    <input
                        type="text"
                        value={newModuleTitle}
                        onChange={e => setNewModuleTitle(e.target.value)}
                        placeholder="Judul modul baru..."
                        className="flex-1 border-gray-300 rounded-lg text-sm focus:border-navy-500"
                    />
                    <button type="submit" className="btn-secondary whitespace-nowrap">
                        <PlusCircle className="w-4 h-4" /> Tambah Modul
                    </button>
                </form>
            </div>
        </>
    );
}

function ModuleCard({ module, index, dragHandleProps, onDragEndLessons, onDelete, onDeleteLesson, onDeleteFile }) {
    const [isOpen, setIsOpen] = useState(true);
    const [title, setTitle] = useState(module.title);
    const [isSaving, setIsSaving] = useState(false);

    const saveModuleTitle = () => {
        if (title.trim() === module.title || !title.trim()) return;
        setIsSaving(true);
        router.patch(route('admin.modules.update', module.id), { title: title.trim() }, {
            preserveScroll: true,
            onFinish: () => setIsSaving(false)
        });
    };

    const addLesson = (type) => {
        const titles = { video: 'Video Baru', document: 'Dokumen Baru', quiz: 'Kuis Baru', zoom: 'Zoom Meeting' };
        router.post(route('admin.lessons.store', module.id), {
            title: titles[type],
            type: type
        }, { preserveScroll: true });
    };

    return (
        <div className="card border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div {...dragHandleProps}>
                    <GripVertical className="w-4 h-4 text-gray-300 cursor-grab flex-shrink-0" />
                </div>
                <span className="text-[10px] font-bold text-navy-500 uppercase tracking-wider flex-shrink-0">Modul {index + 1}</span>
                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    onBlur={saveModuleTitle}
                    className="flex-1 text-sm font-semibold bg-transparent border-none focus:ring-1 focus:ring-navy-300 rounded px-1 p-0 text-gray-800"
                />
                <button onClick={() => setIsOpen(!isOpen)} className="p-1 hover:bg-gray-200 rounded flex-shrink-0">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <button
                    onClick={() => onDelete(module.id)}
                    className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600 flex-shrink-0"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {isOpen && (
                <div className="p-3 space-y-3">
                    <DragDropContext onDragEnd={(result) => onDragEndLessons(module.id, result)}>
                        <Droppable droppableId={`lessons-${module.id}`}>
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="space-y-3"
                                >
                                    {module.lessons.map((lesson, i) => (
                                        <Draggable key={lesson.id} draggableId={lesson.id.toString()} index={i}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                >
                                                    <LessonItem
                                                        lesson={lesson}
                                                        dragHandleProps={provided.dragHandleProps}
                                                        onDelete={() => onDeleteLesson(lesson)}
                                                        onDeleteFile={onDeleteFile}
                                                    />
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>

                    <div className="flex flex-wrap gap-2 pt-2 px-3 border-t border-gray-100">
                        <span className="text-xs text-gray-400 font-medium py-1.5 mr-2">Tambah Materi:</span>
                        <button onClick={() => addLesson('video')} className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors">
                            <Video className="w-3 h-3" /> Video
                        </button>
                        <button onClick={() => addLesson('document')} className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors">
                            <FileText className="w-3 h-3" /> Dokumen
                        </button>
                        <button onClick={() => addLesson('quiz')} className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded transition-colors">
                            <HelpCircle className="w-3 h-3" /> Kuis
                        </button>
                        <button onClick={() => addLesson('zoom')} className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-sky-600 bg-sky-50 hover:bg-sky-100 rounded transition-colors">
                            <Video className="w-3 h-3" /> Zoom
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function LessonItem({ lesson, dragHandleProps, onDelete, onDeleteFile }) {
    const [isExpanded, setIsExpanded] = useState(false);
    // Controlled state — TIDAK pakai onBlur lagi
    const [title, setTitle] = useState(lesson.title);
    const [description, setDescription] = useState(lesson.description || '');
    const [videoUrl, setVideoUrl] = useState(lesson.video_url || '');
    const [startDatetime, setStartDatetime] = useState(lesson.start_datetime ? lesson.start_datetime.slice(0, 16) : '');
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const typeIcons = { video: Video, document: FileText, quiz: HelpCircle, zoom: Video };
    const typeColors = {
        video: 'text-blue-500 bg-blue-50 border-blue-200',
        document: 'text-red-500 bg-red-50 border-red-200',
        quiz: 'text-purple-500 bg-purple-50 border-purple-200',
        zoom: 'text-sky-500 bg-sky-50 border-sky-200',
    };

    const Icon = typeIcons[lesson.type] || FileText;
    const colorClass = typeColors[lesson.type] || 'border-gray-200';

    const saveLesson = () => {
        setIsSaving(true);
        setSaved(false);
        const payload = { title: title.trim() };
        if (description !== (lesson.description || '')) payload.description = description;
        if ((lesson.type === 'video' || lesson.type === 'zoom') && videoUrl !== (lesson.video_url || '')) {
            payload.video_url = videoUrl;
        }
        if (lesson.type === 'zoom' && startDatetime !== (lesson.start_datetime ? lesson.start_datetime.slice(0, 16) : '')) {
            payload.start_datetime = startDatetime;
        }
        router.patch(route('admin.lessons.update', lesson.id), payload, {
            preserveScroll: true,
            onSuccess: () => { setIsSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000); },
            onError: () => setIsSaving(false)
        });
    };

    const uploadFile = (e) => {
        if (e.target.files.length > 0) {
            const form = new FormData();
            form.append('file', e.target.files[0]);
            router.post(route('admin.lessons.files.upload', lesson.id), form, { preserveScroll: true });
        }
    };

    const isDirty = title !== lesson.title
        || description !== (lesson.description || '')
        || ((lesson.type === 'video' || lesson.type === 'zoom') && videoUrl !== (lesson.video_url || ''))
        || (lesson.type === 'zoom' && startDatetime !== (lesson.start_datetime ? lesson.start_datetime.slice(0, 16) : ''));

    return (
        <div className={`border rounded-lg overflow-hidden ${colorClass}`}>
            {/* Header row */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white/60">
                <div {...dragHandleProps}>
                    <GripVertical className="w-3.5 h-3.5 text-gray-400 cursor-grab flex-shrink-0" />
                </div>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="flex-1 text-sm bg-transparent border-none focus:ring-1 focus:ring-navy-300 rounded px-1 p-0 font-medium text-gray-800"
                    placeholder="Judul materi..."
                />
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1 hover:bg-white rounded opacity-60 hover:opacity-100 flex-shrink-0"
                >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {/* Tombol delete: tidak trigger onBlur dari field manapun */}
                <button
                    type="button"
                    onMouseDown={e => e.preventDefault()} // Cegah blur pada input sebelum klik
                    onClick={onDelete}
                    className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600 opacity-60 hover:opacity-100 flex-shrink-0"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {isExpanded && (
                <div className="p-4 bg-white border-t border-gray-100 space-y-4">
                    {/* Deskripsi */}
                    <div>
                        <label htmlFor={`lesson-${lesson.id}-description`} className="block text-xs font-bold text-gray-500 uppercase mb-1">
                            Deskripsi / Perintah <span className="font-normal normal-case text-gray-400">(opsional)</span>
                        </label>
                        <textarea
                            id={`lesson-${lesson.id}-description`}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows="2"
                            placeholder="Tulis instruksi atau deskripsi singkat untuk materi ini..."
                            className="w-full text-sm border-gray-300 rounded focus:border-navy-500 focus:ring-navy-500"
                        />
                    </div>

                    {/* VIDEO / ZOOM URL & TIME */}
                    {(lesson.type === 'video' || lesson.type === 'zoom') && (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    {lesson.type === 'video' ? 'URL YouTube' : 'Link Zoom Meeting'}
                                </label>
                                <input
                                    type="text"
                                    value={videoUrl}
                                    onChange={e => setVideoUrl(e.target.value)}
                                    placeholder={lesson.type === 'video' ? "https://youtube.com/watch?v=..." : "https://zoom.us/j/..."}
                                    className="w-full text-sm border-gray-300 rounded focus:border-navy-500 focus:ring-navy-500"
                                />
                            </div>

                            {lesson.type === 'zoom' && (
                                <div>
                                    <label htmlFor={`lesson-${lesson.id}-start`} className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                        Waktu Pelaksanaan Zoom
                                    </label>
                                    <input
                                        id={`lesson-${lesson.id}-start`}
                                        type="datetime-local"
                                        value={startDatetime}
                                        onChange={e => setStartDatetime(e.target.value)}
                                        className="w-full text-sm border-gray-300 rounded focus:border-navy-500 focus:ring-navy-500"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* DOCUMENT FILES */}
                    {lesson.type === 'document' && (
                        <div>
                            <p className="block text-xs font-bold text-gray-500 uppercase mb-2">File Dokumen (PDF, PPT, Word — Maks 50MB)</p>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {lesson.files && lesson.files.map(f => (
                                    <div key={f.id} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-sm">
                                        <FileText className="w-3 h-3 text-red-500" />
                                        <span className="truncate max-w-[150px] text-xs">{f.original_name}</span>
                                        <button
                                            type="button"
                                            onMouseDown={e => e.preventDefault()}
                                            onClick={() => onDeleteFile(f)}
                                            className="text-gray-400 hover:text-red-500 ml-1"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <label className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded text-sm cursor-pointer hover:bg-gray-50 text-gray-600">
                                <Upload className="w-4 h-4" /> Upload File
                                <input type="file" className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" onChange={uploadFile} />
                            </label>
                        </div>
                    )}

                    {/* QUIZ BUILDER */}
                    {lesson.type === 'quiz' && lesson.quiz && (
                        <div className="bg-gray-50 -mx-4 -mb-4 p-4 border-t border-gray-200">
                            <QuizBuilder quiz={lesson.quiz} />
                        </div>
                    )}

                    {/* Tombol Simpan — hanya muncul jika ada perubahan */}
                    {lesson.type !== 'quiz' && (
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-400">
                                {isDirty ? 'Ada perubahan yang belum disimpan' : saved ? '✓ Tersimpan' : 'Tidak ada perubahan'}
                            </p>
                            <button
                                type="button"
                                onClick={saveLesson}
                                disabled={!isDirty || isSaving}
                                className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${isDirty
                                    ? 'bg-navy-600 hover:bg-navy-700 text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                <Save className="w-3.5 h-3.5" />
                                {isSaving ? 'Menyimpan...' : 'Simpan Materi'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
