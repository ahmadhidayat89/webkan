import { FaArrowRight, FaFileAlt, FaUsers, FaCog } from 'react-icons/fa';

const QuickLinks = ({ links }) => {
  const iconMap = {
    0: <FaUsers className="text-3xl md:text-4xl lg:text-5xl" />,
    1: <FaFileAlt className="text-3xl md:text-4xl lg:text-5xl" />,
    2: <FaCog className="text-3xl md:text-4xl lg:text-5xl" />,
  };

  // Gradient untuk icon
  const iconGradient = 'from-primary-600 to-primary-700';

  // Gradient untuk card saat hover
  const cardHoverGradient = 'from-primary-400 to-primary-500';

  return (
    <section
      id="quick-links"
      className="relative py-12 overflow-hidden sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-gray-50 via-white to-gray-50"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-0 left-0 w-64 h-64 rounded-full md:w-96 md:h-96 bg-primary-200/30 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full md:w-96 md:h-96 bg-primary-200/30 blur-3xl"></div>
      </div>

      <div className="container relative z-10 px-4 sm:px-6">

        {/* Section Header */}
        <div className="mb-10 text-center sm:mb-12 md:mb-16 animate-fadeIn">

          <h2 className="px-4 mb-3 text-3xl font-black text-gray-900 sm:text-4xl md:text-5xl lg:text-6xl md:mb-4">
            Layanan
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-800">
              Unggulan
            </span>
          </h2>

          <p className="max-w-2xl px-4 mx-auto text-base text-gray-600 sm:text-lg md:text-xl">
            Temukan informasi dan layanan yang Anda butuhkan dengan cepat
          </p>

          {/* Lihat Semua Layanan */}
          <a
            href="/layanan-akreditasi"
            className="inline-flex items-center gap-2 mt-4 text-sm font-semibold transition-colors duration-300 md:mt-5 text-primary-600 hover:text-primary-700 sm:text-base group"
          >
            <span>Lihat Semua Layanan</span>
            <FaArrowRight className="text-xs transition-transform duration-300 sm:text-sm group-hover:translate-x-1" />
          </a>
        </div>

        {/* Premium Cards Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 md:gap-8">
          {links && links.length > 0 ? (
            links.map((link, index) => (
              <a
                key={link.id}
                href={link.link}
                className="relative flex flex-col group"
              >
                {/* Card Container */}
                <div className="relative flex flex-col flex-1 p-6 overflow-hidden transition-all duration-500 bg-white border border-gray-100 shadow-xl rounded-2xl md:rounded-3xl md:p-8 hover:-translate-y-2 hover:shadow-2xl">

                  {/* Gradient Background on Hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${cardHoverGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  ></div>

                  {/* Glow Effect */}
                  <div className="absolute transition-opacity duration-500 opacity-0 -inset-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl md:rounded-3xl blur-xl group-hover:opacity-20"></div>

                  {/* Content */}
                  <div className="relative z-10 flex flex-col flex-1">

                    {/* Icon Container */}
                    <div className="relative mb-4 md:mb-6">
                      <div
                        className={`w-14 h-14 sm:w-16 sm:h-16 md:w-18 lg:w-20 md:h-18 lg:h-20 rounded-xl md:rounded-2xl bg-gradient-to-br ${iconGradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}
                      >
                        {iconMap[index] ||
                          link.icon || (
                            <FaFileAlt className="text-3xl md:text-4xl lg:text-5xl" />
                          )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="mb-3 text-lg font-black text-gray-900 transition-colors duration-500 sm:text-xl md:text-2xl group-hover:text-white md:mb-4">
                      {link.title}
                    </h3>

                    {/* Description */}
                    <p className="flex-1 mb-4 text-sm text-gray-600 transition-colors duration-500 sm:text-base group-hover:text-white/90 md:mb-6 line-clamp-3">
                      {link.description || ''}
                    </p>

                    {/* Arrow Icon */}
                    <div className="flex items-center gap-2 mt-auto text-sm font-bold transition-all duration-500 md:gap-3 text-primary-600 group-hover:text-white md:text-base">
                      <span className="transition-transform duration-500 group-hover:translate-x-1">
                        Selengkapnya
                      </span>

                      <FaArrowRight className="text-xs transition-transform duration-500 group-hover:translate-x-2 md:text-sm" />
                    </div>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-24 h-24 transition-transform duration-700 translate-x-12 -translate-y-12 rounded-full md:w-32 md:h-32 bg-gradient-to-br from-white/10 to-transparent md:-translate-y-16 md:translate-x-16 group-hover:scale-150"></div>

                  <div className="absolute bottom-0 left-0 w-20 h-20 transition-transform duration-700 -translate-x-10 translate-y-10 rounded-full md:w-24 md:h-24 bg-gradient-to-tr from-white/10 to-transparent md:translate-y-12 md:-translate-x-12 group-hover:scale-150"></div>
                </div>
              </a>
            ))
          ) : (
            /* Default cards */
            <>
              {[
                {
                  title: 'Anggota KAN',
                  description:
                    'Informasi lengkap tentang anggota Komite Akreditasi Nasional',
                  link: '/anggota-kan',
                  index: 0,
                },
                {
                  title: 'Dokumentasi Mutu KAN',
                  description:
                    'Dokumen standar dan prosedur akreditasi terkini',
                  link: '/unduh',
                  index: 1,
                },
                {
                  title: 'Proses Akreditasi',
                  description:
                    'Panduan lengkap tahapan akreditasi dari awal hingga akhir',
                  link: '/proses-akreditasi',
                  index: 2,
                },
              ].map((item) => (
                <a
                  key={item.index}
                  href={item.link}
                  className="relative flex flex-col group"
                >
                  <div className="relative flex flex-col flex-1 p-6 overflow-hidden transition-all duration-500 bg-white border border-gray-100 shadow-xl rounded-2xl md:rounded-3xl md:p-8 hover:-translate-y-2 hover:shadow-2xl">

                    {/* Gradient Background on Hover */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${cardHoverGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                    ></div>

                    {/* Glow Effect */}
                    <div className="absolute transition-opacity duration-500 opacity-0 -inset-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl md:rounded-3xl blur-xl group-hover:opacity-20"></div>

                    {/* Content */}
                    <div className="relative z-10 flex flex-col flex-1">

                      {/* Icon Container */}
                      <div className="relative mb-4 md:mb-6">
                        <div
                          className={`w-14 h-14 sm:w-16 sm:h-16 md:w-18 lg:w-20 md:h-18 lg:h-20 rounded-xl md:rounded-2xl bg-gradient-to-br ${iconGradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}
                        >
                          {iconMap[item.index]}
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="mb-3 text-lg font-black text-gray-900 transition-colors duration-500 sm:text-xl md:text-2xl group-hover:text-white md:mb-4">
                        {item.title}
                      </h3>

                      {/* Description */}
                      <p className="flex-1 mb-4 text-sm text-gray-600 transition-colors duration-500 sm:text-base group-hover:text-white/90 md:mb-6">
                        {item.description}
                      </p>

                      {/* Arrow Icon */}
                      <div className="flex items-center gap-2 mt-auto text-sm font-bold transition-all duration-500 md:gap-3 text-primary-600 group-hover:text-white md:text-base">
                        <span className="transition-transform duration-500 group-hover:translate-x-1">
                          Selengkapnya
                        </span>

                        <FaArrowRight className="text-xs transition-transform duration-500 group-hover:translate-x-2 md:text-sm" />
                      </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-24 h-24 transition-transform duration-700 translate-x-12 -translate-y-12 rounded-full md:w-32 md:h-32 bg-gradient-to-br from-white/10 to-transparent md:-translate-y-16 md:translate-x-16 group-hover:scale-150"></div>

                    <div className="absolute bottom-0 left-0 w-20 h-20 transition-transform duration-700 -translate-x-10 translate-y-10 rounded-full md:w-24 md:h-24 bg-gradient-to-tr from-white/10 to-transparent md:translate-y-12 md:-translate-x-12 group-hover:scale-150"></div>
                  </div>
                </a>
              ))}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default QuickLinks;