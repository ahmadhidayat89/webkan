import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import {
  FaChevronLeft, FaChevronRight,
  FaHome, FaSearch, FaArrowRight,
} from 'react-icons/fa';

const formatDate = (dateString) => {
  if (!dateString) return '';
  return format(new Date(dateString), 'd MMMM yyyy', { locale: idLocale });
};

const categoryLabel = (cat) => (cat === 'news' ? 'Berita' : 'Pengumuman');
const categoryColor = (cat) =>
  cat === 'news' ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white';

/* ── Featured Carousel ─────────────────────────────────────── */
const FeaturedCarousel = ({ items }) => {
  const [current, setCurrent]   = useState(0);
  const [fading,  setFading]    = useState(false);
  const [progress, setProgress] = useState(0);
  const total      = items.length;
  const DURATION   = 6000;

  /* auto-advance */
  useEffect(() => {
    setProgress(0);
    const start   = Date.now();
    const ticker  = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min((elapsed / DURATION) * 100, 100));
    }, 50);
    const timer = setTimeout(() => go((current + 1) % total), DURATION);
    return () => { clearInterval(ticker); clearTimeout(timer); };
  }, [current, total]);

  const go = (idx) => {
    setFading(true);
    setTimeout(() => { setCurrent(idx); setFading(false); }, 250);
  };

  if (!total) return null;

  const featured  = items[current];
  const getIdx    = (o) => (current + o + total) % total;
  const sideItems = [getIdx(1), getIdx(2)].map((i) => items[i]);

  return (
    <section className="relative overflow-hidden bg-white border-b border-gray-100">


      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <span className="block w-0.5 h-5 rounded-full bg-primary-500" />
            <span className="text-gray-400 text-[11px] font-bold uppercase tracking-widest">Berita Pilihan</span>
          </div>
          <span className="text-gray-400 text-xs font-mono tabular-nums">
            {String(current + 1).padStart(2,'0')} / {String(total).padStart(2,'0')}
          </span>
        </div>

        {/* ── Cards grid ── */}
        <div className={`grid grid-cols-1 lg:grid-cols-5 gap-3 lg:gap-4 transition-opacity duration-250 ${fading ? 'opacity-0' : 'opacity-100'}`}>

          {/* Featured – left 3/5 */}
          <div className="lg:col-span-3 relative group rounded-2xl overflow-hidden" style={{ minHeight: '430px' }}>
            <img
              src={featured.image || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=900&h=600&fit=crop'}
              alt={featured.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            {/* Layers */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,.92) 0%, rgba(0,0,0,.35) 50%, rgba(0,0,0,.05) 100%)' }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(11,17,32,.6) 0%, transparent 60%)' }} />

            {/* Badge + date — top left */}
            <div className="absolute top-5 left-5 flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-[11px] font-black shadow-lg ${categoryColor(featured.category)}`}>
                {categoryLabel(featured.category)}
              </span>
              <span className="text-white/50 text-xs backdrop-blur-sm bg-black/20 px-2 py-0.5 rounded-full">
                {formatDate(featured.published_at)}
              </span>
            </div>

            {/* Content — bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
              <h2 className="text-white font-black text-xl md:text-2xl lg:text-[1.65rem] leading-tight line-clamp-3 mb-3 drop-shadow-xl">
                {featured.title}
              </h2>
              {featured.excerpt && (
                <p className="text-white/60 text-sm leading-relaxed line-clamp-2 mb-4">{featured.excerpt}</p>
              )}
              <Link to={`/berita/${featured.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-xl text-sm font-black hover:bg-primary-50 transition-colors shadow-lg">
                Baca Selengkapnya
                <span className="w-5 h-5 bg-primary-600 rounded-lg flex items-center justify-center">
                  <FaArrowRight className="text-white text-[9px]" />
                </span>
              </Link>
            </div>
          </div>

          {/* Side cards – right 2/5 */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            {sideItems.map((item, i) => (
              <Link key={i} to={`/berita/${item.slug}`}
                className="group relative flex-1 rounded-2xl overflow-hidden cursor-pointer"
                style={{ minHeight: '200px' }}>
                <img
                  src={item.image || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&h=300&fit=crop'}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,.88) 0%, rgba(0,0,0,.15) 60%, transparent 100%)' }} />
                {/* Left accent bar on hover */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-bottom rounded-r" />
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${categoryColor(item.category)}`}>
                      {categoryLabel(item.category)}
                    </span>
                    <span className="text-white/40 text-[10px]">{formatDate(item.published_at)}</span>
                  </div>
                  <h3 className="text-white font-bold text-sm md:text-[15px] leading-snug line-clamp-2 group-hover:text-primary-300 transition-colors">
                    {item.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Bottom controls ── */}
        <div className="flex items-center justify-between mt-5 gap-4">

          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {items.map((_, i) => (
              <button key={i} onClick={() => go(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === current ? 'w-6 h-2 bg-primary-600' : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                }`} />
            ))}
          </div>

          {/* Progress bar */}
          <div className="flex-1 max-w-xs h-0.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full transition-none"
              style={{ width: `${progress}%` }} />
          </div>

          {/* Arrow buttons */}
          <div className="flex items-center gap-2">
            <button onClick={() => go(getIdx(-1))}
              className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-600 hover:text-gray-900 flex items-center justify-center transition-all">
              <FaChevronLeft className="text-xs" />
            </button>
            <button onClick={() => go(getIdx(1))}
              className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-600 hover:text-gray-900 flex items-center justify-center transition-all">
              <FaChevronRight className="text-xs" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};

/* ── Main Page ─────────────────────────────────────────────── */
const NewsList = () => {
  const [featured, setFeatured] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const listRef = useRef(null);

  useEffect(() => { fetchFeatured(); }, []);
  useEffect(() => { fetchNews(); }, [page]);

  const fetchFeatured = async () => {
    try {
      const res = await fetch('/api/v1/news?per_page=5');
      const data = await res.json();
      if (data.success) setFeatured(data.data.data || []);
    } catch (err) { console.error('NewsList featured error:', err); }
  };

  const fetchNews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ per_page: 8, page });
      const res = await fetch(`/api/v1/news?${params}`);
      const data = await res.json();
      if (data.success) {
        setNews(data.data.data || []);
        setMeta({
          current_page: data.data.current_page,
          last_page: data.data.last_page,
          total: data.data.total,
        });
      }
    } catch (err) {
      console.error('NewsList fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePage = (p) => {
    setPage(p);
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

const displayed = search.trim()
    ? news.filter((n) =>
        n.title?.toLowerCase().includes(search.toLowerCase()) ||
        n.excerpt?.toLowerCase().includes(search.toLowerCase()))
    : news;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SEO title="Berita" description="Berita dan pengumuman terbaru dari Komite Akreditasi Nasional (KAN)." />
      <Header />

      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-primary-600/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-primary-400/10 rounded-full blur-2xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumb */}
          <div className="pt-32 lg:pt-40 pb-4 border-b border-white/10">
            <nav className="flex items-center gap-2 text-sm flex-wrap">
              <Link to="/" className="flex items-center gap-1.5 text-white/50 hover:text-white/80 transition-colors font-medium">
                <FaHome className="text-xs" /><span>Beranda</span>
              </Link>
              <FaChevronRight className="text-white/30 text-[10px]" />
              <span className="text-white/90 font-semibold">Berita</span>
            </nav>
          </div>
          <div className="py-8 md:py-10 lg:py-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3">
              Berita &amp; Pengumuman
            </h1>
            <p className="text-white/60 text-sm md:text-base">
              Informasi terkini seputar akreditasi dan kegiatan KAN
            </p>
          </div>
        </div>
      </div>

      {/* Carousel */}
      {featured.length > 0 && <FeaturedCarousel items={featured} />}

      {/* Filter + List */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10" ref={listRef}>

        {/* List Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
          <h2 className="text-xl font-black text-gray-900">Berita</h2>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berita..."
              className="pl-8 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400 w-44 md:w-60" />
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-semibold">Tidak ada berita ditemukan</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayed.map((item) => (
              <article key={item.id} className="py-6 group">
                <Link to={`/berita/${item.slug}`} className="flex gap-4 md:gap-8 items-start">
                  {/* Date column */}
                  <div className="hidden sm:block flex-shrink-0 w-28 pt-0.5">
                    <p className="text-sm text-gray-400">{formatDate(item.published_at)}</p>
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-1.5 sm:hidden">{formatDate(item.published_at)}</p>
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base md:text-lg font-bold text-gray-900 group-hover:text-primary-700 transition-colors leading-snug mb-1.5">
                          {item.title}
                        </h3>
                        {item.excerpt && (
                          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{item.excerpt}</p>
                        )}
                        <span className="inline-flex items-center gap-1 mt-2 text-sm text-teal-600 font-semibold group-hover:gap-2 transition-all">
                          Baca selengkapnya <FaArrowRight className="text-xs" />
                        </span>
                      </div>
                      {item.image && (
                        <div className="hidden sm:block flex-shrink-0 w-24 h-16 md:w-28 md:h-20 overflow-hidden rounded-lg bg-gray-100">
                          <img src={item.image} alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Badge */}
                  <div className="hidden md:block flex-shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${categoryColor(item.category)}`}>
                      {categoryLabel(item.category)}
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!search && meta.last_page > 1 && (
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Halaman {meta.current_page} dari {meta.last_page} &nbsp;·&nbsp; {meta.total} artikel
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => handlePage(page - 1)} disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:border-primary-400 hover:text-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <FaChevronLeft className="text-xs" />
              </button>
              {Array.from({ length: meta.last_page }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === meta.last_page || Math.abs(p - page) <= 1)
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '...'
                    ? <span key={`d${i}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">…</span>
                    : <button key={p} onClick={() => handlePage(p)}
                        className={`w-8 h-8 flex items-center justify-center rounded border text-sm font-semibold transition-all ${
                          p === page
                            ? 'bg-primary-700 text-white border-primary-700'
                            : 'border-gray-200 text-gray-600 hover:border-primary-400 hover:text-primary-600'
                        }`}>{p}</button>
                )}
              <button onClick={() => handlePage(page + 1)} disabled={page === meta.last_page}
                className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:border-primary-400 hover:text-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <FaChevronRight className="text-xs" />
              </button>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default NewsList;