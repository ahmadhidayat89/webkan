const Partners = ({ partners }) => {

  const defaultPartners = [
    { name: 'IAF', description: 'International Accreditation Forum' },
    { name: 'ILAC-MRA', description: 'International Laboratory Accreditation Cooperation' },
    { name: 'APAC', description: 'Asia Pacific Accreditation Cooperation' },
    { name: 'PAC', description: 'Pacific Accreditation Cooperation' },
    { name: 'EA', description: 'European Cooperation for Accreditation' },
    { name: 'AFRAC', description: 'African Accreditation Cooperation' }
  ];

  const displayPartners =
    partners && partners.length > 0 ? partners : defaultPartners;

  const stats = [
    {
      number: '100+',
      label: 'Negara Anggota'
    },
    {
      number: '50+',
      label: 'Tahun Kemitraan'
    },
    {
      number: '1000+',
      label: 'Akreditasi Diakui'
    },
    {
      number: '24/7',
      label: 'Support Global'
    },
  ];

  return (
    <section className="relative py-16 overflow-hidden bg-white md:py-24">

      <div className="container relative z-10 max-w-6xl px-4 mx-auto sm:px-6">

        {/* Main 2 Column Layout */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20">

          {/* ================= LEFT SIDE ================= */}
          <div>

            {/* Header */}
            <div className="mb-10">

              {/* Kemitraan Global */}
              <span className="inline-block mb-3 text-xs font-bold tracking-widest text-gray-400 uppercase">
                Kemitraan Global
              </span>

              <h2 className="mb-4 text-3xl font-black leading-tight text-gray-900 sm:text-4xl md:text-5xl">
                Kemitraan dan Kerjasama
              </h2>

              <p className="max-w-xl text-sm leading-relaxed text-gray-500 sm:text-base">
                Diakui dan bekerja sama dengan organisasi akreditasi
                internasional terkemuka di seluruh dunia
              </p>

            </div>

            {/* Partners */}
            <div className="flex flex-wrap gap-3 sm:gap-4">

              {displayPartners.map((partner, index) => (
                <a
                  key={partner.id || index}
                  href={partner.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={partner.description || partner.name}
                  className="group flex flex-col items-center justify-center
                    w-[130px] sm:w-[145px]
                    bg-white border border-gray-200 rounded-2xl
                    px-4 py-5
                    hover:border-primary-300
                    hover:shadow-lg
                    hover:-translate-y-1
                    transition-all duration-300 cursor-pointer"
                >

                  {/* Logo */}
                  <div className="flex items-center justify-center mb-3 h-14">
                    {partner.logo ? (
                      <img
                        src={`/storage/${partner.logo}`}
                        alt={partner.name}
                        className="max-h-14 max-w-[100px] w-auto object-contain
                          grayscale group-hover:grayscale-0
                          transition-all duration-400"
                      />
                    ) : (
                      <div
                        className="flex items-center justify-center transition-all duration-300 border w-14 h-14 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200 group-hover:from-primary-100 group-hover:to-primary-200"
                      >
                        <span className="text-sm font-black tracking-tight text-primary-700">
                          {partner.name?.slice(0, 4)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <span
                    className="text-xs font-bold leading-tight text-center text-gray-700 transition-colors sm:text-sm group-hover:text-primary-600"
                  >
                    {partner.name}
                  </span>

                </a>
              ))}

            </div>
          </div>


          {/* ================= RIGHT SIDE ================= */}
          <div className="lg:-mt-5">

            {/* Statistics */}

            {stats.map((stat, i) => (

              <div
                key={i}
                className={`
                  py-6
                  ${i !== 0 ? 'border-t border-gray-200' : ''}
                  ${i === stats.length - 1 ? 'border-b border-gray-200' : ''}
                `}
              >

                {/* Label */}
                <div className="mb-1 text-xs font-bold tracking-widest text-gray-400 uppercase">
                  {stat.label}
                </div>

                {/* Number */}
                <div className="text-3xl font-black sm:text-4xl md:text-5xl text-primary-600">
                  {stat.number}
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