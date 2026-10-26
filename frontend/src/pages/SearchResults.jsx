import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  FaHome,
  FaChevronRight,
  FaSpinner,
  FaNewspaper,
  FaFileAlt,
  FaQuestionCircle,
} from 'react-icons/fa';

const GROUPS = [
  {
    key: 'news',
    label: 'Berita & Pengumuman',
    icon: FaNewspaper,
  },
  {
    key: 'pages',
    label: 'Halaman',
    icon: FaFileAlt,
  },
  {
    key: 'faqs',
    label: 'FAQ',
    icon: FaQuestionCircle,
  },
];

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const q = searchParams.get('q') || '';

  const [results, setResults] = useState({
    news: [],
    pages: [],
    faqs: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const keyword = q.trim();

    if (!keyword) {
      setResults({
        news: [],
        pages: [],
        faqs: [],
      });

      setLoading(false);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);

      try {
        const response = await fetch(
          `/api/v1/search?q=${encodeURIComponent(keyword)}`
        );

        if (!response.ok) {
          throw new Error('Gagal mengambil hasil pencarian');
        }

        const data = await response.json();

        if (data.success) {
          setResults({
            news: data.data?.news || [],
            pages: data.data?.pages || [],
            faqs: data.data?.faqs || [],
          });
        } else {
          setResults({
            news: [],
            pages: [],
            faqs: [],
          });
        }
      } catch (error) {
        console.error('Search error:', error);

        setResults({
          news: [],
          pages: [],
          faqs: [],
        });
      } finally {
        setLoading(false);
      }
    };

    void fetchResults();
  }, [q]);

  const totalResults =
    results.news.length +
    results.pages.length +
    results.faqs.length;

  const handleResultClick = (url) => {
    if (!url) return;

    if (url.startsWith('/')) {
      void navigate(url);
    } else {
      window.location.href = url;
    }
  };

  // Menebalkan keyword yang sesuai di judul dan snippet
  const highlightKeyword = (text) => {
    if (!text || !q.trim()) {
      return text;
    }

    const keyword = q.trim();

    const escapedKeyword = keyword.replace(
      /[.*+?^${}()|[\]\\]/g,
      String.raw`\$&`
    );

    const parts = text.split(
      new RegExp(`(${escapedKeyword})`, 'gi')
    );

    // Key memakai posisi karakter bagian tersebut di teks asli (unik per bagian)
    let offset = 0;

    return parts.map((part) => {
      const position = offset;
      offset += part.length;

      return part.toLowerCase() === keyword.toLowerCase() ? (
        <strong key={position} className="font-black">
          {part}
        </strong>
      ) : (
        <span key={position}>{part}</span>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      {/* Dark Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
        <div className="container relative z-10 px-6 mx-auto">
          {/* Breadcrumb */}
          <div className="pt-32 pb-4 border-b border-white/10 lg:pt-40">
            <nav className="flex flex-wrap items-center gap-2 text-sm">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex items-center gap-1.5 font-medium text-white/50 transition-colors hover:text-white/80"
              >
                <FaHome className="text-xs" />
                <span>Beranda</span>
              </button>

              <FaChevronRight className="text-xs text-white/30" />

              <span className="font-semibold text-white/80">
                Hasil Pencarian
              </span>
            </nav>
          </div>

          {/* Page Heading */}
          <div className="py-10">
            <h1 className="mb-3 text-4xl font-black leading-tight text-white md:text-5xl">
              Hasil Pencarian
            </h1>

            <div className="w-16 h-1 mb-4 rounded-full bg-primary-400" />

            <p className="text-lg text-white/70">
              {q ? (
                <>
                  Menampilkan {totalResults} hasil pencarian untuk{' '}
                  <span className="font-bold text-white">
                    "{q}"
                  </span>
                </>
              ) : (
                'Masukkan kata kunci untuk mencari'
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="py-12">
        <div className="container px-6 mx-auto">
          <div className="max-w-4xl mx-auto">
            {/* Loading */}
            {loading && (
              <div className="flex justify-center py-20">
                <FaSpinner className="text-4xl animate-spin text-primary-600" />
              </div>
            )}

            {/* Empty Result */}
            {!loading && totalResults === 0 && (
              <div className="px-8 py-16 text-center bg-white border border-gray-200 shadow-sm rounded-2xl">
                <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full">
                  <span className="text-3xl">🔍</span>
                </div>

                <h3 className="mb-3 text-2xl font-black text-gray-800">
                  {q ? 'Tidak Ada Hasil' : 'Mulai Pencarian'}
                </h3>

                <p className="max-w-md mx-auto text-gray-500">
                  {q
                    ? `Tidak ditemukan hasil untuk "${q}". Coba gunakan kata kunci lain.`
                    : 'Gunakan kotak pencarian di bagian atas untuk mencari berita, halaman, atau FAQ.'}
                </p>

                {q && (
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="mt-6 rounded-lg bg-primary-600 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-primary-700"
                  >
                    Kembali ke Beranda
                  </button>
                )}
              </div>
            )}

            {/* Search Results */}
            {!loading && totalResults > 0 && (
              <div className="space-y-8">
                {GROUPS.map((group) => {
                  const items = results[group.key] || [];

                  if (items.length === 0) {
                    return null;
                  }

                  const Icon = group.icon;

                  return (
                    <section
                      key={group.key}
                      className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl"
                    >
                      {/* Group Header */}
                      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 md:px-8">
                        <Icon className="text-primary-600" />

                        <h2 className="font-black text-gray-900">
                          {group.label}
                        </h2>
                      </div>

                      {/* Items */}
                      <div className="divide-y divide-gray-100">
                        {items.map((item) => (
                          <button
                            key={item.id ?? `${group.key}-${item.url}-${item.title}`}
                            type="button"
                            onClick={() =>
                              handleResultClick(item.url)
                            }
                            className="flex items-start justify-between w-full gap-4 px-6 py-5 text-left transition-colors group hover:bg-gray-50 md:px-8"
                          >
                            <div className="min-w-0">
                              <p className="mb-1 font-bold text-gray-900 transition-colors group-hover:text-primary-600">
                                {highlightKeyword(item.title)}
                              </p>

                              {item.snippet && (
                                <p className="text-sm text-gray-500 line-clamp-2">
                                  {highlightKeyword(item.snippet)}
                                </p>
                              )}
                            </div>

                            <FaChevronRight className="mt-1.5 flex-shrink-0 text-xs text-gray-300 transition-all group-hover:translate-x-1 group-hover:text-primary-600" />
                          </button>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SearchResults;
