import { FaArrowRight, FaFileAlt, FaUsers, FaCog } from "react-icons/fa";

const QuickLinks = ({ links }) => {
  // Premium icons mapping
  const iconMap = {
    0: <FaUsers className="text-3xl md:text-4xl lg:text-5xl" />,
    1: <FaFileAlt className="text-3xl md:text-4xl lg:text-5xl" />,
    2: <FaCog className="text-3xl md:text-4xl lg:text-5xl" />,
  };

  const gradients = [
    "from-blue-500 to-blue-700",
    "from-purple-500 to-purple-700",
    "from-orange-500 to-orange-700",
  ];

  return (
    <section
      id="quick-links"
      className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-0 left-0 w-64 md:w-96 h-64 md:h-96 bg-primary-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-accent-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="container relative z-10 px-4 sm:px-6">
        {/* Section Header - Responsive */}
        <div className="text-center mb-10 sm:mb-12 md:mb-16 animate-fadeIn">
          <div className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-primary-100 text-primary-700 rounded-full text-xs md:text-sm font-bold mb-3 md:mb-4">
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-primary-600 rounded-full animate-pulse"></span>
            Akses Cepat
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-3 md:mb-4 px-4">
            Layanan{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-800">
             Unggulan
            </span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
            Temukan informasi dan layanan yang Anda butuhkan dengan cepat
          </p>
        </div>

        {/* Premium Cards Grid - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {links && links.length > 0 ? (
            links.map((link, index) => (
              <a
                key={link.id}
                href={link.link}
                className="group relative flex flex-col"
              >
                {/* Card Container with 3D Effect */}
                <div className="relative flex flex-col flex-1 bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl shadow-xl border border-gray-100 overflow-hidden">
                  {/* Gradient Background on Hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${gradients[index % 3]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  ></div>

                  {/* Glow Effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 to-accent-600 rounded-2xl md:rounded-3xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>

                  {/* Content */}
                  <div className="relative z-10 flex flex-col flex-1">
                    {/* Icon Container */}
                    <div className="mb-4 md:mb-6 relative">
                      <div
                        className={`w-14 h-14 sm:w-16 sm:h-16 md:w-18 lg:w-20 md:h-18 lg:h-20 rounded-xl md:rounded-2xl bg-gradient-to-br ${gradients[index % 3]} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}
                      >
                        {iconMap[index] || link.icon || (
                          <FaFileAlt className="text-3xl md:text-4xl lg:text-5xl" />
                        )}
                      </div>
                      {/* Badge */}
                      <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-6 h-6 md:w-8 md:h-8 bg-accent-500 rounded-full flex items-center justify-center text-white text-xs md:text-sm font-bold shadow-lg">
                        {index + 1}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg sm:text-xl md:text-2xl font-black text-gray-900 group-hover:text-white mb-3 md:mb-4 transition-colors duration-500">
                      {link.title}
                    </h3>

                    {/* Description — flex-1 agar dorong arrow ke bawah */}
                    <p className="flex-1 text-sm sm:text-base text-gray-600 group-hover:text-white/90 mb-4 md:mb-6 transition-colors duration-500 line-clamp-3">
                      {link.description || ""}
                    </p>

                    {/* Arrow Icon — selalu di bawah */}
                    <div className="flex items-center gap-2 md:gap-3 text-primary-600 group-hover:text-white font-bold transition-all duration-500 text-sm md:text-base mt-auto">
                      <span className="group-hover:translate-x-1 transition-transform duration-500">
                        Selengkapnya
                      </span>
                      <FaArrowRight className="group-hover:translate-x-2 transition-transform duration-500 text-xs md:text-sm" />
                    </div>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full -translate-y-12 md:-translate-y-16 translate-x-12 md:translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
                  <div className="absolute bottom-0 left-0 w-20 md:w-24 h-20 md:h-24 bg-gradient-to-tr from-white/10 to-transparent rounded-full translate-y-10 md:translate-y-12 -translate-x-10 md:-translate-x-12 group-hover:scale-150 transition-transform duration-700"></div>
                </div>
              </a>
            ))
          ) : (
            // Default cards
            <>
              {[
                {
                  title: "Anggota KAN",
                  description:
                    "Informasi lengkap tentang anggota Komite Akreditasi Nasional",
                  link: "/anggota-kan",
                  index: 0,
                },
                {
                  title: "Dokumentasi Mutu KAN",
                  description:
                    "Dokumen standar dan prosedur akreditasi terkini",
                  link: "/dokumentasi",
                  index: 1,
                },
                {
                  title: "Proses Akreditasi",
                  description:
                    "Panduan lengkap tahapan akreditasi dari awal hingga akhir",
                  link: "/proses-akreditasi",
                  index: 2,
                },
              ].map((item) => (
                <a
                  key={item.index}
                  href={item.link}
                  className="group relative flex flex-col"
                >
                  <div className="relative flex flex-col flex-1 bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${gradients[item.index]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                    ></div>
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 to-accent-600 rounded-2xl md:rounded-3xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>

                    <div className="relative z-10 flex flex-col flex-1">
                      <div className="mb-4 md:mb-6 relative">
                        <div
                          className={`w-14 h-14 sm:w-16 sm:h-16 md:w-18 lg:w-20 md:h-18 lg:h-20 rounded-xl md:rounded-2xl bg-gradient-to-br ${gradients[item.index]} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}
                        >
                          {iconMap[item.index]}
                        </div>
                        <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-6 h-6 md:w-8 md:h-8 bg-accent-500 rounded-full flex items-center justify-center text-white text-xs md:text-sm font-bold shadow-lg">
                          {item.index + 1}
                        </div>
                      </div>

                      <h3 className="text-lg sm:text-xl md:text-2xl font-black text-gray-900 group-hover:text-white mb-3 md:mb-4 transition-colors duration-500">
                        {item.title}
                      </h3>

                      <p className="flex-1 text-sm sm:text-base text-gray-600 group-hover:text-white/90 mb-4 md:mb-6 transition-colors duration-500">
                        {item.description}
                      </p>

                      <div className="flex items-center gap-2 md:gap-3 text-primary-600 group-hover:text-white font-bold transition-all duration-500 text-sm md:text-base mt-auto">
                        <span className="group-hover:translate-x-1 transition-transform duration-500">
                          Selengkapnya
                        </span>
                        <FaArrowRight className="group-hover:translate-x-2 transition-transform duration-500 text-xs md:text-sm" />
                      </div>
                    </div>

                    <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full -translate-y-12 md:-translate-y-16 translate-x-12 md:translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="absolute bottom-0 left-0 w-20 md:w-24 h-20 md:h-24 bg-gradient-to-tr from-white/10 to-transparent rounded-full translate-y-10 md:translate-y-12 -translate-x-10 md:-translate-x-12 group-hover:scale-150 transition-transform duration-700"></div>
                  </div>
                </a>
              ))}
            </>
          )}
        </div>

        {/* Bottom CTA - Responsive */}
        <div className="text-center mt-10 sm:mt-12 md:mt-16">
          <a
            href="/layanan"
            className="inline-flex items-center gap-2 md:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl md:rounded-2xl font-bold text-sm sm:text-base md:text-lg hover:scale-105 transition-all shadow-xl hover:shadow-2xl hover:shadow-primary-500/50"
          >
            <span>Lihat Semua Layanan</span>
            <FaArrowRight className="group-hover:translate-x-1 transition-transform text-xs md:text-sm" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default QuickLinks;
