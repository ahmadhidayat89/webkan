import { FaArrowRight, FaClock } from 'react-icons/fa';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const NewsSection = ({ news }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'd MMMM yyyy', { locale: idLocale });
  };

  return (
    <section className="relative py-12 overflow-hidden sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-white via-gray-50 to-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 right-0 rounded-full w-96 h-96 bg-primary-200/20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 rounded-full w-96 h-96 bg-accent-200/20 blur-3xl"></div>
      </div>

      <div className="container relative z-10 px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col items-start justify-between gap-4 mb-10 sm:flex-row sm:items-center md:mb-12 lg:mb-16">
          <div>
            <h2 className="mb-2 text-3xl font-black text-gray-900 sm:text-4xl md:text-5xl lg:text-6xl">
              Berita Terbaru
            </h2>

            {/* <div className="w-20 h-1 rounded-full md:w-24 bg-gradient-to-r from-primary-600 to-primary-400"></div> */}
          </div>

          <a
            href="/berita"
            className="inline-flex items-center gap-2 text-sm font-semibold transition-colors duration-300 text-primary-600 hover:text-primary-700 sm:text-base group"
          >
            <span>Lihat Semua</span>
            <FaArrowRight className="text-xs transition-transform duration-300 sm:text-sm group-hover:translate-x-1" />
          </a>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 md:gap-8">
          {news && news.length > 0 ? (
            news.map((item, index) => (
              <article
                key={item.id}
                className="relative overflow-hidden transition-all duration-500 bg-white shadow-lg group rounded-2xl md:rounded-3xl hover:shadow-2xl hover:-translate-y-2"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Image Container */}
                <div className="relative h-48 overflow-hidden sm:h-52 md:h-56">
                  <img
                    src={
                      item.image ||
                      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=600&fit=crop&q=80'
                    }
                    alt={item.title}
                    className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

                  {/* Glow Effect */}
                  <div className="absolute inset-0 transition-opacity duration-500 opacity-0 group-hover:opacity-100 bg-gradient-to-t from-primary-600/30 to-transparent"></div>
                </div>

                {/* Content */}
                <div className="p-5 md:p-6">
                  {/* Meta Info */}
                  <div className="flex items-center gap-4 mb-3 text-xs text-gray-500 md:text-sm md:mb-4">
                    <span>
                      {formatDate(item.published_at)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <FaClock className="text-primary-600" />
                      <span>5 min read</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="mb-3 text-lg font-black leading-tight text-gray-900 transition-colors sm:text-xl md:text-2xl line-clamp-2 group-hover:text-primary-600">
                    {item.title}
                  </h3>

                  {/* Excerpt */}
                  {item.excerpt && (
                    <p className="mb-4 text-sm leading-relaxed text-gray-600 md:text-base md:mb-6 line-clamp-3">
                      {item.excerpt}
                    </p>
                  )}

                  {/* Read More Link */}
                  <Link
                    to={`/berita/${item.slug}`}
                    className="inline-flex items-center gap-2 text-sm font-bold transition-all group/link text-primary-600 hover:gap-3 md:text-base"
                  >
                    <span>Baca Selengkapnya</span>
                    <FaArrowRight className="text-xs transition-transform group-hover/link:translate-x-2 md:text-sm" />
                  </Link>
                </div>

                {/* Decorative Element */}
                <div className="absolute top-0 right-0 w-32 h-32 transition-transform duration-700 translate-x-16 -translate-y-16 rounded-full bg-gradient-to-br from-primary-200/20 to-transparent group-hover:scale-150"></div>
              </article>
            ))
          ) : (
            // Empty State
            <div className="col-span-full">
              <div className="py-16 text-center bg-white border-2 border-gray-300 border-dashed md:py-20 rounded-3xl">
                <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full md:w-24 md:h-24">
                  <svg
                    className="w-10 h-10 text-gray-400 md:w-12 md:h-12"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                    />
                  </svg>
                </div>

                <h3 className="mb-2 text-xl font-bold text-gray-800 md:text-2xl">
                  Belum Ada Berita
                </h3>

                <p className="text-gray-500">
                  Berita dan pengumuman akan ditampilkan di sini
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default NewsSection;