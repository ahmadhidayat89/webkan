import { useEffect, useMemo, useState } from 'react';
import {
    FaHome,
    FaArrowRight,
    FaChevronRight,
    FaSortAmountDown,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

import Header from '../components/Header';
import Footer from '../components/Footer';

const News = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [categoryFilter, setCategoryFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('newest');

    // Slider
    const [currentSlide, setCurrentSlide] = useState(0);

    // ============================================================
    // FORMAT DATE
    // ============================================================
    const formatDate = (dateString) => {
        if (!dateString) return '-';

        try {
            return format(
                new Date(dateString),
                'd MMMM yyyy',
                { locale: idLocale }
            );
        } catch {
            return '-';
        }
    };

    // ============================================================
    // FETCH NEWS
    // ============================================================
    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/v1/news');
            const data = await response.json();

            console.log('ALL NEWS:', data);

            if (data.success) {
                if (Array.isArray(data.data)) {
                    setNews(data.data);
                } else if (Array.isArray(data.data?.data)) {
                    setNews(data.data.data);
                } else {
                    setNews([]);
                }
            } else {
                setError(
                    data.message || 'Gagal mengambil data berita.'
                );
            }
        } catch (err) {
            console.error('Error fetching news:', err);

            setError(
                'Terjadi kesalahan saat mengambil data berita.'
            );
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // LATEST NEWS FOR SLIDER
    // ============================================================
    const latestNews = useMemo(() => {
        return [...news]
            .sort((a, b) => {
                const dateA = new Date(
                    a.published_at || a.created_at
                ).getTime();

                const dateB = new Date(
                    b.published_at || b.created_at
                ).getTime();

                return dateB - dateA;
            })
            .slice(0, 2);
    }, [news]);

    // ============================================================
    // AUTO SLIDER
    // ============================================================
    useEffect(() => {
        if (latestNews.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentSlide((prev) =>
                prev === latestNews.length - 1
                    ? 0
                    : prev + 1
            );
        }, 5000);

        return () => clearInterval(interval);
    }, [latestNews.length]);

    // ============================================================
    // RESET SLIDER
    // ============================================================
    useEffect(() => {
        if (
            latestNews.length > 0 &&
            currentSlide >= latestNews.length
        ) {
            setCurrentSlide(0);
        }
    }, [latestNews.length, currentSlide]);

    // ============================================================
    // FILTER + SORT NEWS
    // ============================================================
    const filteredNews = useMemo(() => {
        let result = [...news];

        // Filter kategori
        if (categoryFilter !== 'all') {
            result = result.filter(
                (item) =>
                    item.category === categoryFilter
            );
        }

        // Sort tanggal
        result.sort((a, b) => {
            const dateA = new Date(
                a.published_at || a.created_at
            ).getTime();

            const dateB = new Date(
                b.published_at || b.created_at
            ).getTime();

            return sortOrder === 'newest'
                ? dateB - dateA
                : dateA - dateB;
        });

        return result;
    }, [news, categoryFilter, sortOrder]);

    // ============================================================
    // LOADING
    // ============================================================
    if (loading) {
        return (
            <div className="min-h-screen bg-white">

                <Header />

                <div className="flex items-center justify-center min-h-[60vh]">

                    <div className="text-center">

                        <div className="inline-block w-12 h-12 border-4 rounded-full border-primary-200 border-t-primary-600 animate-spin"></div>

                        <p className="mt-4 text-sm text-gray-500">
                            Memuat berita...
                        </p>

                    </div>

                </div>

                <Footer />

            </div>
        );
    }

    // ============================================================
    // ERROR
    // ============================================================
    if (error) {
        return (
            <div className="min-h-screen bg-white">

                <Header />

                <div className="flex items-center justify-center min-h-[60vh] px-6">

                    <div className="text-center">

                        <div className="mb-4 text-5xl">
                            ⚠️
                        </div>

                        <h1 className="mb-2 text-2xl font-bold text-gray-800">
                            Gagal Memuat Berita
                        </h1>

                        <p className="mb-6 text-gray-500">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={fetchNews}
                            className="px-6 py-3 font-semibold text-white transition-colors rounded-lg bg-primary-600 hover:bg-primary-700"
                        >
                            Coba Lagi
                        </button>

                    </div>

                </div>

                <Footer />

            </div>
        );
    }

    // ============================================================
    // MAIN
    // ============================================================
    return (
        <div className="min-h-screen bg-white">

            {/* ========================================================
                NAVBAR
            ======================================================== */}
            <Header />

            {/* ========================================================
                NEWS HERO SLIDER
            ======================================================== */}
            {latestNews.length > 0 && (

                <section className="relative z-0 h-[390px] overflow-hidden bg-gray-900 sm:h-[420px] lg:h-[440px]">

                    {/* ====================================================
                        SLIDES
                    ==================================================== */}
                    {latestNews.map((item, index) => {

                        const isActive =
                            index === currentSlide;

                        return (
                            <Link
                                key={item.id}
                                to={`/berita/${item.slug}`}
                                className={`absolute inset-0 block cursor-pointer transition-opacity duration-700 ${
                                    isActive
                                        ? 'z-10 opacity-100'
                                        : 'z-0 opacity-0 pointer-events-none'
                                }`}
                            >

                                {/* Background Image */}
                                <img
                                    src={
                                        item.image ||
                                        'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1600&h=900&fit=crop&q=80'
                                    }
                                    alt={item.title}
                                    className="absolute inset-0 object-cover w-full h-full"
                                />

                                {/* Dark Overlay */}
                                <div className="absolute inset-0 bg-black/35"></div>

                                {/* Bottom Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10"></div>

                                {/* Left Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/15 to-transparent"></div>

                                {/* =================================================
                                    CONTENT
                                ================================================= */}
                                <div className="container relative z-20 h-full px-6 mx-auto">

                                    <div className="flex flex-col justify-between h-full pb-8 pt-28 sm:pt-32 sm:pb-9 lg:pt-36 lg:pb-10">

                                        {/* Breadcrumb */}
                                        <nav
                                            className="flex flex-wrap items-center gap-2 text-sm"
                                            onClick={(e) =>
                                                e.preventDefault()
                                            }
                                        >

                                            <div className="flex items-center gap-1.5">
                                                <FaHome className="text-xs text-white/50" />

                                                <span className="font-medium text-white/60">
                                                    Beranda
                                                </span>
                                            </div>

                                            <FaChevronRight className="text-xs text-white/40" />

                                            <span className="font-semibold text-white">
                                                Berita
                                            </span>

                                        </nav>

                                        {/* News Information */}
                                        <div className="max-w-4xl">

                                            {/* Category */}
                                            <div className="mb-3">

                                                <span className="inline-flex px-3 py-1.5 text-xs font-bold tracking-wide text-white uppercase rounded-full bg-primary-600/90 backdrop-blur-sm">

                                                    {item.category === 'announcement'
                                                        ? 'Pengumuman'
                                                        : 'Berita'}

                                                </span>

                                            </div>

                                            {/* Title */}
                                            <h1 className="text-2xl font-black leading-tight text-white sm:text-3xl md:text-4xl lg:text-5xl line-clamp-2">

                                                {item.title}

                                            </h1>

                                            {/* Date */}
                                            <div className="mt-3 text-sm text-white/75 sm:text-base">

                                                {formatDate(
                                                    item.published_at ||
                                                    item.created_at
                                                )}

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </Link>
                        );
                    })}

                    {/* ====================================================
                        SLIDE INDICATORS
                    ==================================================== */}
                    {latestNews.length > 1 && (

                        <div className="absolute z-30 flex items-center gap-2 -translate-x-1/2 bottom-5 left-1/2">

                            {latestNews.map((item, index) => (

                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setCurrentSlide(index);
                                    }}
                                    aria-label={`Buka slide ${index + 1}`}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                        index === currentSlide
                                            ? 'w-7 bg-white'
                                            : 'w-1.5 bg-white/50 hover:bg-white/80'
                                    }`}
                                />

                            ))}

                        </div>

                    )}

                </section>

            )}

            {/* ========================================================
                MAIN CONTENT
            ======================================================== */}
            <main className="relative py-6 overflow-hidden sm:py-8 md:py-10 lg:py-12 bg-gradient-to-br from-white via-gray-50 to-white">

                {/* Background Pattern */}
                <div className="absolute inset-0 pointer-events-none">

                    <div className="absolute top-0 right-0 rounded-full w-96 h-96 bg-primary-200/20 blur-3xl"></div>

                    <div className="absolute bottom-0 left-0 rounded-full w-96 h-96 bg-accent-200/20 blur-3xl"></div>

                </div>

                <div className="container relative z-10 px-4 mx-auto sm:px-6">

                    {/* ====================================================
                        FILTER
                    ==================================================== */}
                    <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between md:mb-8 lg:mb-10">

                        {/* Category Filter */}
                        <div className="flex flex-wrap gap-2">

                            <button
                                type="button"
                                onClick={() =>
                                    setCategoryFilter('all')
                                }
                                className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                                    categoryFilter === 'all'
                                        ? 'bg-primary-600 text-white shadow-md'
                                        : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
                                }`}
                            >
                                Semua
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setCategoryFilter('news')
                                }
                                className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                                    categoryFilter === 'news'
                                        ? 'bg-primary-600 text-white shadow-md'
                                        : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
                                }`}
                            >
                                Berita
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setCategoryFilter('announcement')
                                }
                                className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                                    categoryFilter === 'announcement'
                                        ? 'bg-primary-600 text-white shadow-md'
                                        : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
                                }`}
                            >
                                Pengumuman
                            </button>

                        </div>

                        {/* Sort */}
                        <div className="flex items-center gap-2">

                            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500">

                                <FaSortAmountDown className="text-primary-600" />

                                <span>
                                    Urutkan:
                                </span>

                            </div>

                            <select
                                value={sortOrder}
                                onChange={(e) =>
                                    setSortOrder(e.target.value)
                                }
                                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg outline-none cursor-pointer focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                            >

                                <option value="newest">
                                    Terbaru
                                </option>

                                <option value="oldest">
                                    Terlama
                                </option>

                            </select>

                        </div>

                    </div>

                    {/* ====================================================
                        NEWS GRID
                    ==================================================== */}
                    {filteredNews.length > 0 ? (

                        <>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 md:gap-8">

                                {filteredNews.map((item, index) => {

                                    console.log('CARD NEWS:', {
                                        id: item.id,
                                        title: item.title,
                                        slug: item.slug,
                                    });

                                    return (
                                        <article
                                            key={item.id}
                                            className="relative overflow-hidden transition-all duration-500 bg-white shadow-lg group rounded-2xl md:rounded-3xl hover:shadow-2xl hover:-translate-y-2"
                                            style={{
                                                animationDelay: `${index * 100}ms`,
                                            }}
                                        >

                                            {/* Image */}
                                            <Link
                                                to={`/berita/${item.slug}`}
                                                className="block"
                                            >

                                                <div className="relative h-48 overflow-hidden sm:h-52 md:h-56">

                                                    <img
                                                        src={
                                                            item.image ||
                                                            'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=600&fit=crop&q=80'
                                                        }
                                                        alt={item.title}
                                                        className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                                                    />

                                                    {/* Overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

                                                    {/* Hover Overlay */}
                                                    <div className="absolute inset-0 transition-opacity duration-500 opacity-0 group-hover:opacity-100 bg-gradient-to-t from-primary-600/30 to-transparent"></div>

                                                    {/* Category */}
                                                    <div className="absolute top-4 left-4">

                                                        <span className="px-3 py-1.5 text-xs font-bold text-white rounded-full bg-primary-600/90 backdrop-blur-sm">

                                                            {item.category === 'announcement'
                                                                ? 'Pengumuman'
                                                                : 'Berita'}

                                                        </span>

                                                    </div>

                                                </div>

                                            </Link>

                                            {/* Content */}
                                            <div className="p-5 md:p-6">

                                                {/* Date */}
                                                <div className="mb-3 text-xs text-gray-500 md:text-sm">

                                                    {formatDate(
                                                        item.published_at ||
                                                        item.created_at
                                                    )}

                                                </div>

                                                {/* Title */}
                                                <h3 className="mb-3 text-lg font-black leading-tight text-gray-900 transition-colors sm:text-xl line-clamp-2 group-hover:text-primary-600">

                                                    {item.title}

                                                </h3>

                                                {/* Excerpt */}
                                                {item.excerpt && (

                                                    <p className="mb-5 text-sm leading-relaxed text-gray-600 md:text-base line-clamp-3">

                                                        {item.excerpt}

                                                    </p>

                                                )}

                                                {/* Read More */}
                                                <Link
                                                    to={`/berita/${item.slug}`}
                                                    className="inline-flex items-center gap-2 text-sm font-bold transition-all group/link text-primary-600 hover:gap-3 md:text-base"
                                                >

                                                    <span>
                                                        Baca Selengkapnya
                                                    </span>

                                                    <FaArrowRight className="text-xs transition-transform group-hover/link:translate-x-2 md:text-sm" />

                                                </Link>

                                            </div>

                                            {/* Decorative Circle */}
                                            <div className="absolute top-0 right-0 w-32 h-32 transition-transform duration-700 translate-x-16 -translate-y-16 rounded-full bg-gradient-to-br from-primary-200/20 to-transparent group-hover:scale-150"></div>

                                        </article>
                                    );
                                })}

                            </div>

                            {/* Result Count */}
                            <div className="mt-8 text-sm text-gray-500">

                                Menampilkan{' '}

                                <span className="font-semibold text-gray-700">
                                    {filteredNews.length}
                                </span>{' '}

                                berita

                            </div>

                        </>

                    ) : (

                        <>
                            {/* ====================================================
                                EMPTY STATE
                            ==================================================== */}

                            <div className="px-6 py-16 text-center bg-white border-2 border-gray-200 border-dashed rounded-3xl md:py-20">

                                <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full">

                                    <svg
                                        className="w-10 h-10 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >

                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                                        />

                                    </svg>

                                </div>

                                <h3 className="mb-2 text-xl font-bold text-gray-800 md:text-2xl">
                                    Tidak Ada Berita
                                </h3>

                                <p className="text-gray-500">
                                    Tidak ada berita yang sesuai dengan
                                    filter yang dipilih.
                                </p>

                            </div>
                        </>

                    )}

                </div>

            </main>

            {/* ========================================================
                FOOTER
            ======================================================== */}
            <Footer />

        </div>
    );
};

export default News; 