import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Search, BookOpen, Users, Video, Edit, Eye, Trash2, X, AlertTriangle } from 'lucide-react';

// Modal dialog pengganti confirm() bawaan browser
function DeleteModal({ course, onConfirm, onCancel }) {
    if (!course) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button type="button" aria-label="Tutup dialog hapus" className="absolute inset-0 border-0 bg-black/50 p-0 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-md w-full animate-fade-in">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Hapus Pelatihan?</h3>
                        <p className="text-sm text-gray-500 mt-0.5">Tindakan ini tidak dapat dibatalkan.</p>
                    </div>
                    <button onClick={onCancel} className="ml-auto p-1.5 rounded-lg hover:bg-gray-100">
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-5">
                    <p className="text-sm text-red-700 font-medium">"{course.title}"</p>
                    <p className="text-xs text-red-500 mt-1">Semua modul, materi, kuis, dan data peserta terkait akan dihapus permanen.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 btn-secondary text-sm py-2.5">
                        Batal
                    </button>
                    <button
                        onClick={() => onConfirm(course.id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-sm py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" /> Ya, Hapus Permanen
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function CreatorStudio({ courses }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [courseToDelete, setCourseToDelete] = useState(null);
    const { post, processing } = useForm({
        title: 'Kursus Baru ' + new Date().getTime(),
        level: 'pemula'
    });

    const createCourse = () => {
        post(route('admin.courses.store'));
    };

    const filteredCourses = courses.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDeleteConfirm = (id) => {
        router.delete(route('admin.courses.destroy', id), {
            onSuccess: () => setCourseToDelete(null),
            onError: () => setCourseToDelete(null),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Studio Konten" />

            {/* Delete Confirmation Modal */}
            <DeleteModal
                course={courseToDelete}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setCourseToDelete(null)}
            />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Video className="w-6 h-6 text-navy-600" />
                            Studio Konten
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Kelola pelatihan, modul, dan materi pembelajaran</p>
                    </div>

                    <button
                        onClick={createCourse}
                        disabled={processing}
                        className="btn-gold flex items-center gap-2 px-4 py-2"
                    >
                        <Plus className="w-4 h-4" />
                        Buat Pelatihan Baru
                    </button>
                </div>

                {/* Filters & Search */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari pelatihan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border-gray-200 rounded-lg text-sm focus:border-navy-500 focus:ring-navy-500"
                        />
                    </div>
                    <p className="text-sm text-gray-500 flex items-center">{filteredCourses.length} pelatihan ditemukan</p>
                </div>

                {/* Courses Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map((course) => (
                        <div key={course.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow group">
                            {/* Thumbnail area */}
                            <div className="aspect-video bg-slate-100 relative">
                                {course.thumbnail ? (
                                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                                        <BookOpen className="w-10 h-10 opacity-40" />
                                        <span className="text-xs font-medium opacity-60">Belum ada thumbnail</span>
                                    </div>
                                )}

                                {/* Hover overlay: Edit & Preview */}
                                <div className="absolute inset-0 bg-navy-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <Link
                                        href={route('admin.courses.edit', course.id)}
                                        className="w-11 h-11 rounded-full bg-white text-navy-600 flex items-center justify-center hover:bg-gold-400 hover:text-white transition-colors shadow-md"
                                        title="Edit Pelatihan"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </Link>
                                    <Link
                                        href={route('course.player', course.id)}
                                        className="w-11 h-11 rounded-full bg-white text-navy-600 flex items-center justify-center hover:bg-navy-600 hover:text-white transition-colors shadow-md"
                                        title="Preview Pelatihan"
                                    >
                                        <Eye className="w-5 h-5" />
                                    </Link>
                                </div>

                                {/* Status badge */}
                                <span className={`absolute top-2 left-2 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                    course.status === 'published'
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-800/70 text-white backdrop-blur-sm'
                                }`}>
                                    {course.status}
                                </span>
                            </div>

                            {/* Content */}
                            <div className="p-4 flex-1 flex flex-col">
                                <p className="text-[10px] font-bold text-navy-400 uppercase mb-1">
                                    {course.category || 'Tanpa Kategori'}
                                </p>
                                <h3 className="font-bold text-gray-900 leading-tight mb-3 line-clamp-2 flex-1">
                                    {course.title}
                                </h3>

                                <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-gray-100">
                                    <div className="flex items-center gap-1.5">
                                        <BookOpen className="w-3.5 h-3.5" />
                                        {course.modules_count} Modul
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5" />
                                        {course.enrollments_count} Peserta
                                    </div>
                                    <div className="ml-auto text-[10px] text-gray-400">{course.created_at}</div>
                                </div>

                                {/* Action row always visible */}
                                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                                    <Link
                                        href={route('admin.courses.edit', course.id)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-navy-600 bg-navy-50 hover:bg-navy-100 rounded-lg transition-colors"
                                    >
                                        <Edit className="w-3.5 h-3.5" /> Edit
                                    </Link>
                                    <Link
                                        href={route('course.player', course.id)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <Eye className="w-3.5 h-3.5" /> Preview
                                    </Link>
                                    <button
                                        onClick={() => setCourseToDelete(course)}
                                        className="px-3 py-2 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1.5"
                                        title="Hapus Pelatihan"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredCourses.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Video className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-gray-900 font-bold text-lg">Belum ada pelatihan</h3>
                        <p className="text-sm text-gray-500 mt-1 mb-4">Buat pelatihan pertama Anda untuk mulai mengajar.</p>
                        <button onClick={createCourse} disabled={processing} className="btn-gold text-sm">
                            <Plus className="w-4 h-4" /> Buat Pelatihan Baru
                        </button>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
