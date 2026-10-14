import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useForm, Head, usePage } from '@inertiajs/react';
import CourseCard from '@/Components/CourseCard';
import { useState } from 'react';
import { Search, SlidersHorizontal, X, Key, ArrowRight, BookOpen } from 'lucide-react';

function CatalogContent() {
    const { auth, courses = [], categories = [] } = usePage().props;
    const role = auth?.user?.role ?? 'peserta';
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('semua');
    const [sortBy, setSortBy] = useState('terbaru');

    const { data, setData, post, processing, reset, errors } = useForm({
        referral_code: '',
    });

    const handleJoin = (e) => {
        e.preventDefault();
        post(route('courses.join'), {
            onSuccess: () => reset(),
        });
    };

    const filteredCourses = courses.filter((course) => {
        const titleMatch = course.title ? course.title.toLowerCase().includes(search.toLowerCase()) : false;
        const descMatch = course.description ? course.description.toLowerCase().includes(search.toLowerCase()) : false;
        const matchesSearch = search === '' || titleMatch || descMatch;

        const matchesCategory =
            activeCategory === 'semua' || course.category_slug === activeCategory;

        return matchesSearch && matchesCategory;
    });

    const sortedCourses = [...filteredCourses].sort((a, b) => {
        if (sortBy === 'populer') return (b.enrolled_students || 0) - (a.enrolled_students || 0);
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        return b.id - a.id;
    });

    return (
        <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                        {role === 'peserta' ? 'Pelatihan Saya' : 'Katalog Pelatihan'}
                    </h1>
                    <p className="text-sm text-gray-500">
                        {role === 'peserta' 
                            ? 'Daftar pelatihan yang sedang Anda ikuti' 
                            : 'Temukan pelatihan SNI dan ISO yang sesuai kebutuhan Anda'}
                    </p>
                </div>

                {role === 'peserta' && (
                    <div className="flex-shrink-0">
                        <form onSubmit={handleJoin} className="flex items-center gap-2">
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Masukkan Kode Referral..."
                                    value={data.referral_code}
                                    onChange={e => setData('referral_code', e.target.value.toUpperCase())}
                                    className="pl-10 pr-4 py-2 text-sm border-gray-200 rounded-xl focus:border-navy-500 focus:ring-navy-500 bg-white shadow-sm w-64"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={processing || !data.referral_code}
                                className="btn-navy py-2 px-4 text-sm flex items-center gap-2 whitespace-nowrap"
                            >
                                {processing ? 'Memproses...' : 'Gabung Kursus'}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </form>
                        {errors.referral_code && <p className="text-red-500 text-[10px] mt-1 ml-1 font-medium">{errors.referral_code}</p>}
                    </div>
                )}
            </div>

            {/* Search & Filter */}
            <div className="card p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari pelatihan..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-navy-500 focus:ring-navy-500 transition-colors"
                        />
                        {search && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <button
                                    onClick={() => setSearch('')}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-gray-400" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="text-sm border-gray-200 rounded-xl bg-gray-50 focus:border-navy-500 focus:ring-navy-500 py-2.5 pr-8"
                        >
                            <option value="terbaru">Terbaru</option>
                            <option value="populer">Paling Populer</option>
                            <option value="rating">Rating Tertinggi</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                    <button
                        onClick={() => setActiveCategory('semua')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                            activeCategory === 'semua'
                                ? 'bg-navy-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        Semua Pelatihan
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.slug}
                            onClick={() => setActiveCategory(cat.slug)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                                activeCategory === cat.slug
                                    ? 'bg-navy-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {cat.name}
                            <span className={`ml-1 ${activeCategory === cat.slug ? 'text-navy-200' : 'text-gray-400'}`}>
                                ({cat.count})
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Results */}
            <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-gray-500">
                    Menampilkan <span className="font-semibold text-gray-700">{sortedCourses.length}</span> pelatihan
                </p>
            </div>

            {sortedCourses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {sortedCourses.map((course, i) => (
                        <CourseCard key={course.id} course={course} role={role} index={i} />
                    ))}
                </div>
            ) : (
                <div className="card p-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">
                        {role === 'peserta' ? 'Belum ada pelatihan' : 'Tidak ditemukan'}
                    </h3>
                    <p className="text-xs text-gray-400 max-w-xs mx-auto">
                        {role === 'peserta' 
                            ? 'Anda belum terdaftar di pelatihan manapun. Gunakan kode referral untuk bergabung.' 
                            : 'Coba ubah kata kunci atau filter kategori'}
                    </p>
                </div>
            )}
        </div>
    );
}

export default function CourseCatalog() {
    return (
        <AuthenticatedLayout>
            <Head title="Katalog Pelatihan" />
            <CatalogContent />
        </AuthenticatedLayout>
    );
}
