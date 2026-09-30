import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  FaArrowLeft,
  FaShare,
  FaHome,
  FaChevronRight,
} from 'react-icons/fa';

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

      console.log('================ NEWS DETAIL ================');
      console.log('SLUG DARI URL:', slug);
      console.log('URL API:', `/api/v1/news/${slug}`);
      console.log('RESPONSE API:', data);
      console.log('DATA BERITA:', data.data);
      console.log('=============================================');
      
      if (data.success && data.data) {
        setNews(data.data);
        setRelatedNews(data.related || []);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: news.title,
        text: news.excerpt,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  // =========================================================
  // LOADING
  // =========================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-16 h-16 border-4 rounded-full border-primary-600 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // =========================================================
  // NOT FOUND
  // =========================================================
  if (notFound || !news) {
    return (
      <div className="min-h-screen bg-gray-50">

        <Header />

        <div className="pt-32 pb-20 lg:pt-40">
          <div className="container px-6 mx-auto">

            <div className="max-w-4xl mx-auto text-center">

              <div className="mb-8 text-9xl">
                404
              </div>

              <h1 className="mb-4 text-4xl font-black text-gray-900">
                Berita Tidak Ditemukan
              </h1>

              <p className="mb-8 text-xl text-gray-600">
                Maaf, berita yang Anda cari tidak ditemukan.
              </p>

              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 px-8 py-4 font-bold text-white transition-all shadow-lg bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl hover:scale-105"
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

      {/* =========================================================
          HEADER
      ========================================================= */}
      <Header />


      {/* =========================================================
          DARK BANNER
          HANYA SAMPAI BREADCRUMB
      ========================================================= */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">

        {/* Decorative Blur */}
        <div className="absolute inset-0 pointer-events-none">

          <div className="absolute rounded-full w-80 h-80 -top-20 -right-20 bg-primary-600/20 blur-3xl"></div>

          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white/5 blur-3xl"></div>

        </div>


        {/* =======================================================
            BREADCRUMB
        ======================================================= */}
        <div className="container relative z-10 px-6 mx-auto">

          <div className="pt-32 pb-6 border-b border-white/10 lg:pt-40">

            <nav className="flex flex-wrap items-center gap-2 text-sm">

              {/* Beranda */}
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-1.5 font-medium text-white/50 transition-colors hover:text-white/80"
              >
                <FaHome className="text-xs" />

                <span>
                  Beranda
                </span>
              </button>


              {/* Separator */}
              <FaChevronRight className="text-xs text-white/30" />


              {/* Berita */}
              <button
                onClick={() => navigate('/#news')}
                className="font-medium transition-colors text-white/50 hover:text-white/80"
              >
                Berita
              </button>


              {/* Separator */}
              <FaChevronRight className="text-xs text-white/30" />


              {/* Current Article */}
              <span className="font-semibold line-clamp-1 text-white/80">
                {title}
              </span>

            </nav>

          </div>

        </div>

      </div>


      {/* =========================================================
          MAIN CONTENT
      ========================================================= */}
      <article className="py-10">

        <div className="container px-6 mx-auto">

          <div className="mx-auto max-w-7xl">

            {/* =====================================================
                TWO COLUMN LAYOUT
            ===================================================== */}
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">


              {/* ===================================================
                  LEFT COLUMN - DETAIL BERITA
              =================================================== */}
              <main>

                {/* =================================================
                    FEATURED IMAGE
                ================================================= */}
                {news.image && (
                  <div className="mb-6 overflow-hidden bg-white shadow-md rounded-xl">

                    <img
                      src={news.image}
                      alt={title}
                      className="object-cover w-full h-auto"
                    />

                  </div>
                )}


                {/* =================================================
                    TITLE
                ================================================= */}
                <h1 className="mb-4 text-3xl font-black leading-tight text-gray-900 md:text-4xl">
                  {title}
                </h1>


                {/* =================================================
                    META INFORMATION
                ================================================= */}
                <div className="flex flex-wrap items-center gap-2 mb-6 text-sm text-gray-500">

                  {/* Category */}
                  <span>
                    {news.category === 'news'
                      ? 'Berita'
                      : 'Pengumuman'}
                  </span>


                  {/* Dot */}
                  <span className="text-gray-400">
                    •
                  </span>


                  {/* Date */}
                  <span>
                    {new Date(news.created_at).toLocaleDateString(
                      'id-ID',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }
                    )}
                  </span>


                  {/* Dot */}
                  <span className="text-gray-400">
                    •
                  </span>


                  {/* Author */}
                  <span>
                    by Admin
                  </span>

                </div>


                {/* =================================================
                    SHARE BUTTON
                ================================================= */}
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 mb-8 font-semibold text-white transition-all rounded-lg shadow-sm bg-primary-600 hover:bg-primary-700"
                >
                  <FaShare />

                  <span>
                    Bagikan
                  </span>

                </button>


                {/* =================================================
                    EXCERPT
                ================================================= */}
                {excerpt && (
                  <div className="p-5 mb-8 border-l-4 bg-primary-50 border-primary-600 rounded-r-xl">

                    <p className="text-base font-semibold leading-relaxed text-gray-700 md:text-lg">
                      {excerpt}
                    </p>

                  </div>
                )}


                {/* =================================================
                    ARTICLE CONTENT
                ================================================= */}
                <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl md:p-8">

                  <div
                    className="prose prose-lg max-w-none prose-headings:font-black prose-headings:text-gray-900 prose-h2:text-3xl prose-h3:text-2xl prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-primary-600 prose-a:font-semibold hover:prose-a:text-primary-700 prose-img:rounded-xl prose-img:shadow-lg prose-li:text-gray-700"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        content?.replace(/\n/g, '<br/>') ||
                        excerpt ||
                        ''
                      ),
                    }}
                  />

                </div>


                {/* =================================================
                    BACK BUTTON
                ================================================= */}
                <div className="mt-8">

                  <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-6 py-3 font-bold text-gray-700 transition-all bg-gray-100 rounded-lg hover:bg-gray-200"
                  >

                    <FaArrowLeft />

                    <span>
                      Kembali
                    </span>

                  </button>

                </div>

              </main>


              {/* ===================================================
                  RIGHT COLUMN - ARTIKEL LAINNYA
              =================================================== */}
              {relatedNews.length > 0 && (
                <aside>

                  <div className="p-5 bg-white border border-gray-200 shadow-sm rounded-xl">

                    {/* Sidebar Title */}
                    <h2 className="pb-3 mb-5 text-lg font-black text-gray-900 uppercase border-b border-gray-200">
                      Artikel Lainnya
                    </h2>


                    {/* Related News */}
                    <div className="space-y-5">

                      {relatedNews.map((item) => (

                        <button
                          key={item.id}
                          onClick={() =>
                            navigate(`/berita/${item.slug}`)
                          }
                          className="flex w-full gap-3 text-left group"
                        >

                          {/* Thumbnail */}
                          {item.image && (
                            <div className="flex-shrink-0 h-20 overflow-hidden bg-gray-100 rounded-md w-28">

                              <img
                                src={item.image}
                                alt={item.title}
                                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                              />

                            </div>
                          )}


                          {/* Article Info */}
                          <div className="flex-1 min-w-0">

                            {/* Category */}
                            <span className="block mb-1 text-[10px] text-gray-500">
                              {item.category === 'news'
                                ? 'Berita'
                                : 'Pengumuman'}
                            </span>


                            {/* Title */}
                            <h3 className="text-sm font-bold leading-snug text-gray-900 transition-colors line-clamp-3 group-hover:text-primary-600">
                              {item.title}
                            </h3>


                            {/* Date */}
                            {item.created_at && (
                              <p className="mt-1 text-[10px] text-gray-500">

                                {new Date(
                                  item.created_at
                                ).toLocaleDateString(
                                  'id-ID',
                                  {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                  }
                                )}

                              </p>
                            )}

                          </div>

                        </button>

                      ))}

                    </div>

                  </div>

                </aside>
              )}

            </div>

          </div>

        </div>

      </article>


      {/* =========================================================
          FOOTER
      ========================================================= */}
      <Footer />

    </div>
  );
};

export default NewsDetail;