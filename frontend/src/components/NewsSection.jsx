import { FaCalendar, FaArrowRight, FaClock } from 'react-icons/fa';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const NewsSection = ({ news }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'd MMMM yyyy', { locale: idLocale });
  };

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-white via-gray-50 to-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container relative z-10 px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 md:mb-12 lg:mb-16 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-primary-100 text-primary-700 rounded-full text-xs md:text-sm font-bold mb-3 md:mb-4">
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-primary-600 rounded-full animate-pulse"></span>
              Berita Terkini
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-2">
              Berita Terbaru
            </h2>
            <div className="w-20 md:w-24 h-1 bg-gradient-to-r from-primary-600 to-primary-400 rounded-full"></div>
          </div>
          <a
            href="/berita"
            className="group inline-flex items-center gap-2 md:gap-3 px-5 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-bold text-sm md:text-base transition-all hover:scale-105 shadow-lg hover:shadow-primary-500/50"
          >
            <span>Lihat Semua</span>
            <FaArrowRight className="group-hover:translate-x-1 transition-transform text-xs md:text-sm" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {news && news.length > 0 ? (
            news.map((item, index) => (
              <article 
                key={item.id} 
                className="group relative bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Image Container */}
                <div className="relative h-48 sm:h-52 md:h-56 overflow-hidden">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=600&fit=crop&q=80'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                  
                  {/* Category Badge */}
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold backdrop-blur-xl shadow-lg ${
                      item.category === 'news' 
                        ? 'bg-blue-500/90 text-white' 
                        : 'bg-orange-500/90 text-white'
                    }`}>
                      {item.category === 'news' ? 'Berita' : 'Pengumuman'}
                    </span>
                  </div>

                  {/* Glow Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-primary-600/30 to-transparent"></div>
                </div>

                {/* Content */}
                <div className="p-5 md:p-6">
                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-xs md:text-sm text-gray-500 mb-3 md:mb-4">
                    <div className="flex items-center gap-1.5">
                      <FaCalendar className="text-primary-600" />
                      <span>{formatDate(item.published_at)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FaClock className="text-primary-600" />
                      <span>5 min read</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl md:text-2xl font-black text-gray-900 mb-3 line-clamp-2 group-hover:text-primary-600 transition-colors leading-tight">
                    {item.title}
                  </h3>

                  {/* Excerpt */}
                  {item.excerpt && (
                    <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 line-clamp-3 leading-relaxed">
                      {item.excerpt}
                    </p>
                  )}

                  {/* Read More Link */}
                  <a
                    href={`/berita/${item.slug}`}
                    className="group/link inline-flex items-center gap-2 text-primary-600 font-bold hover:gap-3 transition-all text-sm md:text-base"
                  >
                    <span>Baca Selengkapnya</span>
                    <FaArrowRight className="group-hover/link:translate-x-2 transition-transform text-xs md:text-sm" />
                  </a>
                </div>

                {/* Decorative Element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-200/20 to-transparent rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
              </article>
            ))
          ) : (
            // Empty State
            <div className="col-span-full">
              <div className="text-center py-16 md:py-20 bg-white rounded-3xl border-2 border-dashed border-gray-300">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 md:w-12 md:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">Belum Ada Berita</h3>
                <p className="text-gray-500">Berita dan pengumuman akan ditampilkan di sini</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default NewsSection;