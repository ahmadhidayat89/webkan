import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Image, CheckCircle2, Plus, X } from 'lucide-react';

// Tampilan area thumbnail: file baru yang dipilih, thumbnail tersimpan, atau kosong
function ThumbnailPreview({ pending, saved }) {
    if (pending instanceof File) {
        return (
            <div className="p-8 text-center bg-navy-50">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm font-bold text-navy-700">{pending.name}</p>
                <p className="text-xs text-gray-500">Akan diupload saat disimpan</p>
            </div>
        );
    }

    if (saved) {
        return (
            <img src={saved} alt="Thumbnail pelatihan" className="object-cover w-full h-48 opacity-80 group-hover:opacity-100" />
        );
    }

    return (
        <div className="p-8 text-center bg-gray-50">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-gray-200 rounded-xl">
                <Image className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600">Klik atau drop untuk upload thumbnail</p>
            <p className="mt-1 text-xs text-gray-400">PNG, JPG hingga 2MB • Rasio 16:9</p>
        </div>
    );
}

export default function TabDetail({ course, categories }) {
    const { data, setData, patch, post, recentlySuccessful, errors } = useForm({
        title: course.title,
        description: course.description || '',
        short_description: course.short_description || '',
        category_id: course.category_id || '',
        level: course.level || 'pemula',
        duration_hours: course.duration_hours || '',
        deadline_at: course.deadline_at || '',
        status: course.status || 'draft',
        _method: 'PATCH', // for thumbnail upload
    });

    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const { data: catData, setData: setCatData, post: postCat, processing: processingCat, reset: resetCat, errors: catErrors } = useForm({
        name: '',
    });

    const handleCategoryChange = (e) => {
        if (e.target.value === 'add_new') {
            setIsAddingCategory(true);
        } else {
            setData('category_id', e.target.value);
        }
    };

    const submitCategory = (e) => {
        e.preventDefault();
        postCat(route('admin.categories.store'), {
            onSuccess: () => {
                setIsAddingCategory(false);
                resetCat();
            },
        });
    };

    const submit = (e) => {
        e.preventDefault();
        patch(route('admin.courses.update', course.id), {
            preserveScroll: true,
        });
    };

    const submitWithFile = (e) => {
        const fileInput = document.getElementById('thumbnail-upload');
        if (fileInput.files.length > 0) {
            setData('thumbnail', fileInput.files[0]);
            post(route('admin.courses.update', course.id), {
                forceFormData: true,
                preserveScroll: true,
            });
        } else {
            submit(e);
        }
    };

    return (
        <form id="course-detail-form" onSubmit={submitWithFile} className="p-6 space-y-5 card animate-fade-in">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Detail Pelatihan</h2>
                {recentlySuccessful && (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg text-sm font-bold">
                        <CheckCircle2 className="w-4 h-4" /> Berhasil disimpan!
                    </div>
                )}
            </div>

            <div>
                <label htmlFor="detail-title" className="block text-sm font-medium text-gray-700 mb-1.5">Judul Pelatihan</label>
                <input
                    id="detail-title"
                    type="text"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    className="w-full px-4 py-3 text-sm border-gray-200 rounded-xl bg-gray-50 focus:border-navy-500 focus:ring-navy-500"
                />
                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
            </div>

            <div>
                <label htmlFor="detail-description" className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi Lengkap</label>
                <textarea
                    id="detail-description"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 text-sm border-gray-200 resize-none rounded-xl bg-gray-50 focus:border-navy-500 focus:ring-navy-500"
                />
            </div>

            <div>
                <label htmlFor="detail-short-description" className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi Singkat (Katalog)</label>
                <textarea
                    id="detail-short-description"
                    value={data.short_description}
                    onChange={(e) => setData('short_description', e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 text-sm border-gray-200 resize-none rounded-xl bg-gray-50 focus:border-navy-500 focus:ring-navy-500"
                />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                    <label htmlFor="detail-category" className="block text-sm font-medium text-gray-700 mb-1.5">Kategori</label>
                    {!isAddingCategory ? (
                        <select
                            id="detail-category"
                            value={data.category_id}
                            onChange={handleCategoryChange}
                            className="w-full px-4 py-3 text-sm border-gray-200 rounded-xl bg-gray-50"
                        >
                            <option value="">Pilih...</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                            <option value="add_new" className="font-bold text-navy-600">+ Tambah Kategori Baru</option>
                        </select>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                                <input
                                    id="detail-category"
                                    type="text"
                                    placeholder="Nama kategori..."
                                    value={catData.name}
                                    onChange={e => setCatData('name', e.target.value)}
                                    className="flex-1 px-3 py-2 text-sm border-gray-200 rounded-xl bg-gray-50 focus:border-navy-500 focus:ring-navy-500"
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            submitCategory(e);
                                        }
                                        if (e.key === 'Escape') {
                                            setIsAddingCategory(false);
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={submitCategory}
                                    disabled={processingCat}
                                    className="p-2 text-white bg-navy-600 rounded-xl hover:bg-navy-700 disabled:opacity-50"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAddingCategory(false)}
                                    className="p-2 text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            {catErrors.name && <p className="text-red-500 text-[10px] font-medium">{catErrors.name}</p>}
                        </div>
                    )}
                </div>
                <div>
                    <label htmlFor="detail-level" className="block text-sm font-medium text-gray-700 mb-1.5">Level</label>
                    <select
                        id="detail-level"
                        value={data.level}
                        onChange={(e) => setData('level', e.target.value)}
                        className="w-full px-4 py-3 text-sm border-gray-200 rounded-xl bg-gray-50"
                    >
                        <option value="pemula">Pemula</option>
                        <option value="menengah">Menengah</option>
                        <option value="lanjutan">Lanjutan</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="detail-duration" className="block text-sm font-medium text-gray-700 mb-1.5">Durasi (Jam)</label>
                    <input
                        id="detail-duration"
                        type="number"
                        value={data.duration_hours}
                        onChange={(e) => setData('duration_hours', e.target.value)}
                        className="w-full px-4 py-3 text-sm border-gray-200 rounded-xl bg-gray-50"
                    />
                </div>
                <div>
                    <label htmlFor="detail-status" className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                    <select
                        id="detail-status"
                        value={data.status}
                        onChange={(e) => setData('status', e.target.value)}
                        className={`w-full text-sm border-gray-200 rounded-xl px-4 py-3 font-bold ${data.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}
                    >
                        <option value="draft">DRAFT</option>
                        <option value="published">PUBLISHED</option>
                    </select>
                </div>
            </div>
            <div>
                <label htmlFor="detail-deadline" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Batas Penyelesaian Kursus <span className="font-normal text-gray-400">(opsional)</span>
                </label>
                <input
                    id="detail-deadline"
                    type="datetime-local"
                    value={data.deadline_at}
                    onChange={(e) => setData('deadline_at', e.target.value)}
                    className="w-full px-4 py-3 text-sm border-gray-200 sm:w-72 rounded-xl bg-gray-50 focus:border-navy-500 focus:ring-navy-500"
                />
                <p className="mt-1 text-xs text-gray-400">Setelah batas ini lewat, peserta masih bisa membuka materi tapi hanya bisa melihat (tidak bisa mengerjakan kuis atau menandai selesai).</p>
                {errors.deadline_at && <p className="mt-1 text-xs text-red-500">{errors.deadline_at}</p>}
            </div>
            <div>
                <label htmlFor="thumbnail-upload" className="block text-sm font-medium text-gray-700 mb-1.5">Thumbnail</label>
                <div className="relative overflow-hidden transition-all border-2 border-gray-200 border-dashed rounded-xl hover:border-navy-300">
                    <input
                        id="thumbnail-upload"
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                            if (e.target.files.length > 0) {
                                // preview can be handled, but simple approach is just setting data
                                setData('thumbnail', e.target.files[0]);
                            }
                        }}
                    />
                    <ThumbnailPreview pending={data.thumbnail} saved={course.thumbnail} />
                </div>
                {errors.thumbnail && <p className="mt-1 text-xs text-red-500">{errors.thumbnail}</p>}
            </div>
        </form>
    );
}
