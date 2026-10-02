import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { FaHome, FaChevronRight, FaSearch, FaNewspaper, FaFileAlt, FaArrowRight } from 'react-icons/fa';

const formatDate = (dateString) => {
  if (!dateString) return '';
  return format(new Date(dateString), 'd MMMM yyyy', { locale: idLocale });
};

const categoryLabel = (cat) => (cat === 'news' ? 'Berita' : 'Pengumuman');
const categoryColor = (cat) =>
  cat === 'news' ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white';

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';

  const [results, setResults] = useState({ news: [], pages: [] });
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [inputValue, setInputValue] = useState(q);

  useEffect(() => {
    setInputValue(q);
    if (q.length >= 2) fetchResults(q);
    else setResults({ news: [], pages: [] });
  }, [q]);

  const fetchResults = async (query) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setResults(data.data);
        setTotal(data.total);
      }
    } catch (err) {
      console.error('SearchResults fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed.length < 2) return;
    setSearchParams({ q: trimmed });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SEO title={q ? `Hasil Pencarian: ${q}` : 'Pencarian'} />
      <Header />

      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-primary-600/20 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumb */}
          <div className="pt-32 lg:pt-40 pb-4 border-b border-white/10">
            <nav className="flex items-center gap-2 text-sm flex-wrap">
              <Link to="/" className="flex items-center gap-1.5 text-white/50 hover:text-white/80 transition-colors font-medium">
                <FaHome className="text-xs" /><span>Beranda</span>
              </Link>
              <FaChevronRight className="text-white/30 text-[10px]" />
              <span className="text-white/90 font-semibold">Hasil Pencarian</span>
            </nav>
          </div>
          <div className="py-8 md:py-10 lg:py-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3">
              Hasil Pencarian
            </h1>
            {q && (
              <p className="text-white/60 text-sm md:text-base">
                {loading ? 'Mencari...' : `${total} hasil untuk "${q}"`}
              </p>
            )}

            {/* Search Form di dalam banner */}
            <form onSubmit={handleSearch} className="mt-6 flex gap-3 max-w-xl">
              <div className="relative flex-1">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm" />
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Cari berita, halaman..."
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-xl text-sm font-medium"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-white text-primary-800 rounded-xl font-bold text-sm hover:bg-primary-50 transition-colors"
              >
                Cari
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14">

        {!q && (
          <div className="text-center py-20 text-gray-400">
            <FaSearch className="mx-auto text-5xl mb-4 opacity-30" />
            <p className="text-lg font-semibold">Masukkan kata kunci untuk mencari</p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && q && total === 0 && (
          <div className="text-center py-20 text-gray-400">
            <FaSearch className="mx-auto text-5xl mb-4 opacity-30" />
            <p className="text-lg font-semibold">Tidak ada hasil untuk "{q}"</p>
            <p className="text-sm mt-2">Coba kata kunci yang berbeda</p>
          </div>
        )}

        {!loading && total > 0 && (
          <div className="space-y-12">

            {/* Berita */}
            {results.news.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-200">
                  <FaNewspaper className="text-primary-600" />
                  <h2 className="text-xl font-black text-gray-900">
                    Berita &amp; Pengumuman
                  </h2>
                  <span className="ml-auto text-sm text-gray-400">{results.news.length} hasil</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {results.news.map((item) => (
                    <article key={item.id} className="py-5 group">
                      <Link to={item.url} className="flex gap-4 md:gap-6 items-start">
                        {item.image && (
                          <div className="hidden sm:block flex-shrink-0 w-24 h-16 md:w-28 md:h-20 overflow-hidden rounded-lg bg-gray-100">
                            <img src={item.image} alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${categoryColor(item.category)}`}>
                              {categoryLabel(item.category)}
                            </span>
                            <span className="text-xs text-gray-400">{formatDate(item.published_at)}</span>
                          </div>
                          <h3 className="text-base md:text-lg font-bold text-gray-900 group-hover:text-primary-700 transition-colors leading-snug mb-1">
                            {item.title}
                          </h3>
                          {item.excerpt && (
                            <p className="text-sm text-gray-500 line-clamp-2">{item.excerpt}</p>
                          )}
                          <span className="inline-flex items-center gap-1 mt-2 text-sm text-primary-600 font-semibold group-hover:gap-2 transition-all">
                            Baca selengkapnya <FaArrowRight className="text-xs" />
                          </span>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* Halaman */}
            {results.pages.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-200">
                  <FaFileAlt className="text-primary-600" />
                  <h2 className="text-xl font-black text-gray-900">Halaman</h2>
                  <span className="ml-auto text-sm text-gray-400">{results.pages.length} hasil</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {results.pages.map((item) => (
                    <article key={item.id} className="py-5 group">
                      <Link to={item.url} className="block">
                        <h3 className="text-base md:text-lg font-bold text-gray-900 group-hover:text-primary-700 transition-colors leading-snug mb-1">
                          {item.title}
                        </h3>
                        {item.excerpt && (
                          <p className="text-sm text-gray-500 line-clamp-2">{item.excerpt}</p>
                        )}
                        <span className="inline-flex items-center gap-1 mt-2 text-sm text-primary-600 font-semibold group-hover:gap-2 transition-all">
                          Lihat halaman <FaArrowRight className="text-xs" />
                        </span>
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            )}

          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default SearchResults;
