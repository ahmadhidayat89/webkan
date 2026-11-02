import { useState } from 'react';
import { router } from '@inertiajs/react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { PlusCircle, GripVertical, Trash2, Video, FileText, HelpCircle, ChevronDown, ChevronUp, Upload, X, Save, AlertTriangle } from 'lucide-react';
import QuizBuilder from './QuizBuilder';

// FIX: ternary bersarang diganti fungsi dengan early return
function getSaveStatusText(isDirty, saved) {
    if (isDirty) return 'Ada perubahan yang belum disimpan';
    if (saved) return '✓ Tersimpan';
    return 'Tidak ada perubahan';
}

// Modal konfirmasi hapus — menggantikan confirm() bawaan browser
function ConfirmDeleteModal({ message, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
                type="button"
                aria-label="Tutup dialog"
                tabIndex={-1}
                className="absolute inset-0 w-full h-full cursor-default bg-black/40 backdrop-blur-sm"
                onClick={onCancel}
            />
            <div className="relative w-full max-w-sm p-6 bg-white shadow-xl rounded-2xl">
                <div className="flex items-start gap-3 mb-4">
                    <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-red-100 rounded-full">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <p className="text-sm text-gray-700 pt-1.5 font-medium">{message}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={onCancel} className="flex-1 py-2 text-sm font-bold transition-colors border border-gray-200 rounded-lg hover:bg-gray-50">
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

                <form onSubmit={addModule} className="flex items-center gap-2 p-4 border-2 border-gray-200 border-dashed bg-gray-50 rounded-xl">
                    <input
                        type="text"
                        value={newModuleTitle}
                        onChange={e => setNewModuleTitle(e.target.value)}
                        aria-label="Judul modul baru"
                        placeholder="Judul modul baru..."
                        className="flex-1 text-sm border-gray-300 rounded-lg focus:border-navy-500"
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
    const [startAt, setStartAt] = useState(module.start_at || '');
    const [endAt, setEndAt] = useState(module.end_at || '');

    const isScheduleDirty = startAt !== (module.start_at || '') || endAt !== (module.end_at || '');

    const saveSchedule = () => {
        if (startAt && endAt && endAt <= startAt) {
            alert('Waktu selesai harus setelah waktu mulai.');
            return;
        }
        router.patch(route('admin.modules.update', module.id), {
            title: title.trim() || module.title,
            start_at: startAt,
            end_at: endAt,
        }, {
            preserveScroll: true,
            onError: (errors) => alert(Object.values(errors).join('\n')),
        });
    };

    // FIX: state isSaving dihapus karena nilainya tidak pernah dibaca
    const saveModuleTitle = () => {
        if (title.trim() === module.title || !title.trim()) return;
        router.patch(route('admin.modules.update', module.id), { title: title.trim() }, {
            preserveScroll: true
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
        <div className="overflow-hidden border border-gray-200 card">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div {...dragHandleProps}>
                    <GripVertical className="flex-shrink-0 w-4 h-4 text-gray-300 cursor-grab" />
                </div>
                <span className="text-[10px] font-bold text-navy-500 uppercase tracking-wider flex-shrink-0">Modul {index + 1}</span>
                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    onBlur={saveModuleTitle}
                    aria-label={`Judul modul ${index + 1}`}
                    className="flex-1 p-0 px-1 text-sm font-semibold text-gray-800 bg-transparent border-none rounded focus:ring-1 focus:ring-navy-300"
                />
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label={isOpen ? 'Tutup modul' : 'Buka modul'}
                    className="flex-shrink-0 p-1 rounded hover:bg-gray-200"
                >
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <button
                    onClick={() => onDelete(module.id)}
                    aria-label="Hapus modul"
                    className="flex-shrink-0 p-1 text-red-400 rounded hover:bg-red-50 hover:text-red-600"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {isOpen && (
                <div className="p-3 space-y-3">
                    <div className="flex flex-wrap items-end gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex-1 min-w-[180px]">
                            <label htmlFor={`module-${module.id}-start`} className="block mb-1 text-xs font-bold text-gray-500 uppercase">Akses Dibuka</label>
                            <input
                                id={`module-${module.id}-start`}
                                type="datetime-local"
                                value={startAt}
                                onChange={e => setStartAt(e.target.value)}
                                className="w-full text-sm border-gray-300 rounded focus:border-navy-500 focus:ring-navy-500"
                            />
                        </div>
                        <div className="flex-1 min-w-[180px]">
                            <label htmlFor={`module-${module.id}-end`} className="block mb-1 text-xs font-bold text-gray-500 uppercase">Akses Ditutup</label>
                            <input
                                id={`module-${module.id}-end`}
                                type="datetime-local"
                                value={endAt}
                                onChange={e => setEndAt(e.target.value)}
                                className="w-full text-sm border-gray-300 rounded focus:border-navy-500 focus:ring-navy-500"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={saveSchedule}
                            disabled={!isScheduleDirty}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${isScheduleDirty
                                ? 'bg-navy-600 hover:bg-navy-700 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            Simpan Jadwal
                        </button>
                    </div>

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

                    <div className="flex flex-wrap gap-2 px-3 pt-2 border-t border-gray-100">
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

    // PERUBAHAN 1: khusus kuis, judul disimpan otomatis saat kolom judul ditinggalkan
    const saveQuizTitle = () => {
        const newTitle = title.trim();
        if (lesson.type !== 'quiz' || !newTitle || newTitle === lesson.title) return;
        router.patch(route('admin.lessons.update', lesson.id), { title: newTitle }, {
            preserveScroll: true
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
                <Icon className="flex-shrink-0 w-4 h-4" />
                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    onBlur={saveQuizTitle} // PERUBAHAN 2: simpan otomatis (hanya berlaku untuk kuis)
                    aria-label="Judul materi"
                    className="flex-1 p-0 px-1 text-sm font-medium text-gray-800 bg-transparent border-none rounded focus:ring-1 focus:ring-navy-300"
                    placeholder="Judul materi..."
                />
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    aria-label={isExpanded ? 'Tutup detail materi' : 'Buka detail materi'}
                    className="flex-shrink-0 p-1 rounded hover:bg-white opacity-60 hover:opacity-100"
                >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {/* Tombol delete: tidak trigger onBlur dari field manapun */}
                <button
                    type="button"
                    onMouseDown={e => e.preventDefault()} // Cegah blur pada input sebelum klik
                    onClick={onDelete}
                    aria-label="Hapus materi"
                    className="flex-shrink-0 p-1 text-red-400 rounded hover:bg-red-50 hover:text-red-600 opacity-60 hover:opacity-100"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {isExpanded && (
                <div className="p-4 space-y-4 bg-white border-t border-gray-100">
                    {/* Deskripsi */}
                    <div>
                        <label htmlFor={`lesson-${lesson.id}-description`} className="block mb-1 text-xs font-bold text-gray-500 uppercase">
                            Deskripsi / Perintah <span className="font-normal text-gray-400 normal-case">(opsional)</span>
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
                                <label htmlFor={`lesson-${lesson.id}-url`} className="block mb-1 text-xs font-bold text-gray-500 uppercase">
                                    {lesson.type === 'video' ? 'URL YouTube' : 'Link Zoom Meeting'}
                                </label>
                                <input
                                    id={`lesson-${lesson.id}-url`}
                                    type="text"
                                    value={videoUrl}
                                    onChange={e => setVideoUrl(e.target.value)}
                                    placeholder={lesson.type === 'video' ? "https://youtube.com/watch?v=..." : "https://zoom.us/j/..."}
                                    className="w-full text-sm border-gray-300 rounded focus:border-navy-500 focus:ring-navy-500"
                                />
                            </div>

                            {lesson.type === 'zoom' && (
                                <div>
                                    <label htmlFor={`lesson-${lesson.id}-start`} className="block mb-1 text-xs font-bold text-gray-500 uppercase">
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
                            <p className="block mb-2 text-xs font-bold text-gray-500 uppercase">File Dokumen (PDF, PPT, Word — Maks 50MB)</p>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {lesson.files?.map(f => (
                                    <div key={f.id} className="flex items-center gap-2 px-2 py-1 text-sm border border-gray-200 rounded bg-gray-50">
                                        <FileText className="w-3 h-3 text-red-500" />
                                        <span className="truncate max-w-[150px] text-xs">{f.original_name}</span>
                                        <button
                                            type="button"
                                            onMouseDown={e => e.preventDefault()}
                                            onClick={() => onDeleteFile(f)}
                                            aria-label={`Hapus file ${f.original_name}`}
                                            className="ml-1 text-gray-400 hover:text-red-500"
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
                        <div className="p-4 -mx-4 border-t border-gray-200 bg-gray-50">
                            <QuizBuilder quiz={lesson.quiz} />
                        </div>
                    )}

                    {/* Simpan judul dan deskripsi untuk semua jenis materi, termasuk kuis. */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-400">
                            {getSaveStatusText(isDirty, saved)}
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
                </div>
            )}
        </div>
    );
}