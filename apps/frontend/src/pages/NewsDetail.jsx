import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { FaCalendar, FaUser, FaArrowLeft, FaShare, FaHome, FaChevronRight } from 'react-icons/fa';

const NewsDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [news, setNews] = useState(null);
  const [relatedNews, setRelatedNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchNewsDetail();
  }, [slug]);

  const fetchNewsDetail = async () => {
    try {
      setLoading(true);
      setNotFound(false);

      const response = await fetch(`/api/v1/news/${slug}`);
      const data = await response.json();

      if (data.success && data.data) {
        setNews(data.data);
        setRelatedNews(data.related || []);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      console.error('NewsDetail fetch error:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (!news) return;
    if (navigator.share) {
      navigator.share({
        title: news.title,
        text: news.excerpt,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => toast.success('Link berhasil disalin!'))
        .catch(() => toast.error('Gagal menyalin link.'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (notFound || !news) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-32 lg:pt-40 pb-20">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <div className="text-9xl mb-8">404</div>
              <h1 className="text-4xl font-black text-gray-900 mb-4">
                Berita Tidak Ditemukan
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Maaf, berita yang Anda cari tidak ditemukan.
              </p>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-bold hover:scale-105 transition-all shadow-lg"
              >
                <FaArrowLeft />
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const title = news.title;
  const content = news.content;
  const excerpt = news.excerpt;

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={news?.title}
        description={news?.excerpt}
        image={news?.image}
        type="article"
      />
      <Header />

      {/* Dark Banner */}
      <div className="relative bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary-600/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto px-6 relative z-10">
          {/* Breadcrumb */}
          <div className="pt-32 lg:pt-40 pb-4 border-b border-white/10">
            <nav className="flex items-center gap-2 text-sm flex-wrap">
              <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-white/50 hover:text-white/80 transition-colors font-medium">
                <FaHome className="text-xs" />
                <span>Beranda</span>
              </button>
              <FaChevronRight className="text-xs text-white/30" />
              <button onClick={() => navigate('/#news')} className="text-white/50 hover:text-white/80 transition-colors font-medium">
                Berita
              </button>
              <FaChevronRight className="text-xs text-white/30" />
              <span className="text-white/80 font-semibold line-clamp-1">{title}</span>
            </nav>
          </div>
          {/* Title + category */}
          <div className="py-10">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 ${
              news.category === 'news' ? 'bg-blue-500/30 text-blue-200' : 'bg-orange-500/30 text-orange-200'
            }`}>
              {news.category === 'news' ? 'Berita' : 'Pengumuman'}
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-3">
              {title}
            </h1>
            <div className="w-16 h-1 bg-primary-400 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <article className="py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-6">
                <div className="flex items-center gap-2">
                  <FaCalendar className="text-primary-600" />
                  <span>{new Date(news.created_at).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
                {news.created_by && (
                  <>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center gap-2">
                      <FaUser className="text-primary-600" />
                      <span>Admin KAN</span>
                    </div>
                  </>
                )}
              </div>

              {/* Share Button */}
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-all"
              >
                <FaShare />
                <span>Bagikan</span>
              </button>
            </div>

            {/* Featured Image */}
            {news.image && (
              <div className="mb-8 rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={news.image}
                  alt={title}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}

            {/* Excerpt */}
            {excerpt && (
              <div className="bg-primary-50 border-l-4 border-primary-600 p-6 rounded-r-xl mb-8">
                <p className="text-lg text-gray-700 font-semibold leading-relaxed">
                  {excerpt}
                </p>
              </div>
            )}

            {/* Content */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 md:p-12">
              <div 
                className="prose prose-lg max-w-none prose-headings:font-black prose-h2:text-3xl prose-h3:text-2xl prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-primary-600 prose-a:font-semibold hover:prose-a:text-primary-700 prose-img:rounded-xl prose-img:shadow-lg"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content || excerpt || '', {
                  ALLOWED_TAGS: ['p','br','strong','em','u','s','h1','h2','h3','h4','ul','ol','li','a','img','table','thead','tbody','tr','th','td','blockquote','pre','code','figure','figcaption','hr'],
                  ALLOWED_ATTR: ['href','src','alt','title','target','rel','class','style'],
                  ALLOW_DATA_ATTR: false,
                }) }}
              />
            </div>

            {/* Back Button */}
            <div className="mt-8">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-700 transition-all"
              >
                <FaArrowLeft />
                Kembali
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* Related News */}
      {relatedNews.length > 0 && (
        <section className="py-12 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-black text-gray-900 mb-8">
                Berita Terkait
              </h2>

              <div className="grid md:grid-cols-3 gap-6">
                {relatedNews.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navigate(`/berita/${item.slug}`)}
                    className="group bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-2xl transition-all text-left"
                  >
                    {item.image && (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${
                        item.category === 'news'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {item.category === 'news' ? 'News' : 'Announcement'}
                      </span>
                      <h3 className="font-black text-lg text-gray-900 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {item.excerpt}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default NewsDetail;
