const Partners = ({ partners }) => {

  const defaultPartners = [
    { name: 'IAF', description: 'International Accreditation Forum' },
    { name: 'ILAC-MRA', description: 'International Laboratory Accreditation Cooperation' },
    { name: 'APAC', description: 'Asia Pacific Accreditation Cooperation' },
    { name: 'PAC', description: 'Pacific Accreditation Cooperation' },
    { name: 'EA', description: 'European Cooperation for Accreditation' },
    { name: 'AFRAC', description: 'African Accreditation Cooperation' }
  ];

  const displayPartners = partners && partners.length > 0 ? partners : defaultPartners;

  return (
    <section className="py-16 md:py-24 bg-white relative overflow-hidden">
      {/* Subtle top border line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

      <div className="container relative z-10 px-4 sm:px-6 max-w-6xl mx-auto">

        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-block text-xs font-bold tracking-widest text-primary-600 uppercase mb-3">
            Kemitraan Global
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-4">
            Kemitraan dan Kerjasama
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base">
            Diakui dan bekerja sama dengan organisasi akreditasi internasional terkemuka di seluruh dunia
          </p>
        </div>

        {/* Partners — logo strip style */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-5">
          {displayPartners.map((partner, index) => (
            <a
              key={partner.id || index}
              href={partner.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              title={partner.description || partner.name}
              className="group flex flex-col items-center justify-center w-[140px] sm:w-[160px] bg-white border border-gray-200 rounded-2xl px-4 py-5 hover:border-primary-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              {/* Logo or Initials */}
              <div className="h-14 flex items-center justify-center mb-3">
                {partner.logo ? (
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="max-h-14 max-w-[100px] w-auto object-contain transition-all duration-300"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 flex items-center justify-center group-hover:from-primary-100 group-hover:to-primary-200 transition-all duration-300">
                    <span className="text-sm font-black text-primary-700 tracking-tight">
                      {partner.name?.slice(0, 4)}
                    </span>
                  </div>
                )}
              </div>

              {/* Name */}
              <span className="text-xs sm:text-sm font-bold text-gray-700 group-hover:text-primary-600 transition-colors text-center leading-tight">
                {partner.name}
              </span>
            </a>
          ))}
        </div>

        {/* Divider */}
        <div className="mt-16 md:mt-20 pt-10 border-t border-gray-100">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 md:gap-8 text-center">
            {[
              { number: '100+', label: 'Negara Anggota' },
              { number: '50+', label: 'Tahun Kemitraan' },
              { number: '1000+', label: 'Akreditasi Diakui' },
              { number: '24/7', label: 'Support Global' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-2xl sm:text-3xl md:text-4xl font-black text-primary-600 mb-1">
                  {stat.number}
                </div>
                <div className="text-xs sm:text-sm text-gray-500 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default Partners;
