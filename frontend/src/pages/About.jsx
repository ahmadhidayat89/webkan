import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  FaHome,
  FaChevronRight,
  FaArrowRight,
  FaArrowLeft,
  FaCheckCircle,
  FaAward,
  FaUsers,
  FaGlobe,
  FaStar,
  FaClipboardList,
} from 'react-icons/fa';

const About = () => {
  const navigate = useNavigate();

  // =========================
  // Sidebar
  // =========================
  const sidebarPages = [
    { href: '/tentang-kan', label: 'Profil KAN' },
    { href: '/sejarah-fungsi', label: 'Sejarah dan Fungsi KAN' },
    { href: '/struktur-organisasi', label: 'Struktur Organisasi' },
    { href: '/ketidakberpihakan', label: 'Ketidakberpihakan' },
    { href: '/pengakuan-internasional', label: 'Pengakuan Internasional' },
    { href: '/anggota-kan', label: 'Anggota KAN' },
    { href: '/maklumat-layanan', label: 'Maklumat Layanan' },
    { href: '/standar-layanan', label: 'Standar Layanan Akreditasi' },
  ];

  // =========================
  // Statistik
  // =========================
  const stats = [
    {
      value: 1997,
      suffix: '',
      label: 'Tahun Berdiri',
    },
    {
      value: 500,
      suffix: '+',
      label: 'LPK Terakreditasi',
    },
    {
      value: 10,
      suffix: '+',
      label: 'Pengakuan Internasional',
    },
    {
      value: 25,
      suffix: '+',
      label: 'Tahun Pengalaman',
    },
  ];

  const statsRef = useRef(null);
  const [isStatsVisible, setIsStatsVisible] = useState(false);

  useEffect(() => {
    const element = statsRef.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsStatsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.3,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  // =========================
  // Nilai-Nilai KAN
  // =========================
  const values = [
    {
      icon: FaCheckCircle,
      color: 'from-blue-500 to-blue-600',
      label: 'Integritas',
      desc: 'Menjunjung tinggi kejujuran dan transparansi dalam setiap tindakan',
    },
    {
      icon: FaAward,
      color: 'from-primary-600 to-primary-700',
      label: 'Profesionalisme',
      desc: 'Berkomitmen pada standar kompetensi tertinggi',
    },
    {
      icon: FaUsers,
      color: 'from-violet-600 to-violet-700',
      label: 'Kolaborasi',
      desc: 'Bekerja sama untuk kemajuan akreditasi nasional',
    },
    {
      icon: FaGlobe,
      color: 'from-cyan-600 to-cyan-700',
      label: 'Internasional',
      desc: 'Diakui dan dipercaya di tingkat global',
    },
  ];

  // =========================
  // Visi & Misi
  // =========================
  const vision =
    'Menjadi lembaga akreditasi yang diakui secara internasional dan terpercaya dalam memberikan jaminan kompetensi lembaga penilaian kesesuaian.';

  const missions = [
    'Memberikan layanan akreditasi yang berkualitas tinggi dan dapat dipertanggungjawabkan',
    'Meningkatkan kompetensi lembaga penilaian kesesuaian di Indonesia',
    'Memperluas pengakuan internasional melalui kerjasama bilateral dan multilateral',
    'Mendukung daya saing produk dan jasa Indonesia di pasar global',
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      {/* =========================
          Dark Banner
      ========================= */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute rounded-full -top-20 -right-20 w-96 h-96 bg-primary-600/20 blur-3xl"></div>

          <div className="absolute bottom-0 w-64 h-64 rounded-full left-1/4 bg-white/5 blur-3xl"></div>

          <div className="absolute w-32 h-32 rounded-full top-1/2 right-1/3 bg-primary-400/10 blur-2xl"></div>
        </div>

        <div className="container relative z-10 px-6 mx-auto">
          {/* Breadcrumb */}
          <div className="pt-32 pb-4 border-b lg:pt-40 border-white/10">
            <nav className="flex flex-wrap items-center gap-2 text-sm">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-1.5 font-medium text-white/50 hover:text-white/80 transition-colors"
              >
                <FaHome className="text-xs" />
                <span>Beranda</span>
              </button>

              <FaChevronRight className="text-xs text-white/30" />

              <span className="text-white/50">
                Tentang KAN
              </span>

              <FaChevronRight className="text-xs text-white/30" />

              <span className="font-semibold text-white/80">
                Profil KAN
              </span>
            </nav>
          </div>

          {/* Title */}
          <div className="py-10">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h1 className="mb-3 text-4xl font-black leading-tight text-white md:text-5xl">
                  Profil KAN
                </h1>

                <div className="w-16 h-1 rounded-full bg-primary-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================
          Content Area
      ========================= */}
      <main className="py-12">
        <div className="container px-6 mx-auto">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-start gap-8">

              {/* =========================
                  Sidebar
              ========================= */}
              <aside className="flex-shrink-0 hidden lg:block w-72">
                <div className="sticky space-y-4 top-28">

                  <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-sm font-semibold transition-colors text-primary-600 hover:text-primary-700"
                  >
                    <FaArrowLeft className="text-xs" />
                    <span>Kembali ke Beranda</span>
                  </button>

                  <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">
                    <nav className="p-2">
                      {sidebarPages.map((page) => {
                        const isActive =
                          page.href === '/tentang-kan';

                        return (
                          <button
                            key={page.href}
                            onClick={() =>
                              navigate(page.href)
                            }
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                              isActive
                                ? 'bg-primary-50 text-primary-700 font-bold border-l-4 border-primary-600 pl-3'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-primary-600'
                            }`}
                          >
                            <span>{page.label}</span>
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                </div>
              </aside>

              {/* =========================
                  Main Content
              ========================= */}
              <div className="flex-1 min-w-0">
                <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">

                  <div className="p-8 space-y-12 md:p-12">

                    {/* =========================
                        Pengantar + Statistik
                    ========================= */}
                    <section>
                      <h2 className="pb-3 mb-4 text-2xl font-black text-gray-900 border-b border-gray-100">
                        Komite Akreditasi Nasional
                      </h2>

                      <p className="mb-6 leading-relaxed text-gray-700">
                        Lembaga non-struktural yang bertanggung jawab
                        langsung kepada Presiden Republik Indonesia dalam
                        bidang akreditasi.
                      </p>

                      {/* Statistik */}
                      <div
                        ref={statsRef}
                        className="grid grid-cols-2 gap-4 md:grid-cols-4"
                      >
                        {stats.map((stat, i) => (
                          <div
                            key={i}
                            className={`relative overflow-hidden p-5 text-center bg-primary-50 rounded-xl border border-primary-100 transition-all duration-500 hover:bg-primary-100 hover:-translate-y-1 hover:shadow-md group ${
                              isStatsVisible
                                ? 'opacity-100 translate-y-0'
                                : 'opacity-0 translate-y-5'
                            }`}
                            style={{
                              transitionDelay: `${i * 100}ms`,
                            }}
                          >
                            {/* Decorative Circle */}
                            <div className="absolute top-0 right-0 w-16 h-16 transition-transform duration-500 translate-x-8 -translate-y-8 rounded-full bg-primary-200/30 group-hover:scale-150"></div>

                            {/* Number */}
                            <div className="relative mb-1 text-2xl font-black md:text-3xl text-primary-700">
                              {isStatsVisible ? (
                                <AnimatedNumber
                                  value={stat.value}
                                  suffix={stat.suffix}
                                />
                              ) : (
                                <>
                                  0
                                  {stat.suffix}
                                </>
                              )}
                            </div>

                            {/* Label */}
                            <div className="relative text-xs font-semibold text-gray-500">
                              {stat.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* =========================
                        Visi & Misi
                    ========================= */}
                    <section>
                      <h2 className="pb-3 mb-6 text-2xl font-black text-gray-900 border-b border-gray-100">
                        Visi &amp; Misi
                      </h2>

                      <div className="grid gap-8 md:grid-cols-2">

                        {/* Visi */}
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-xl">
                              <FaStar className="text-lg text-primary-600" />
                            </div>

                            <h3 className="text-xl font-black text-gray-900">
                              Visi
                            </h3>
                          </div>

                          <p className="pl-4 leading-relaxed text-gray-700 border-l-4 border-primary-500">
                            {vision}
                          </p>
                        </div>

                        {/* Misi */}
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="flex items-center justify-center w-10 h-10 bg-accent-100 rounded-xl">
                              <FaClipboardList className="text-lg text-accent-600" />
                            </div>

                            <h3 className="text-xl font-black text-gray-900">
                              Misi
                            </h3>
                          </div>

                          <ul className="space-y-3">
                            {missions.map((mission, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-3"
                              >
                                <FaCheckCircle className="flex-shrink-0 mt-1 text-primary-600" />

                                <span className="leading-relaxed text-gray-700">
                                  {mission}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </section>

                    {/* =========================
                        Nilai-Nilai KAN
                    ========================= */}
                    <section>
                      <h2 className="pb-3 mb-4 text-2xl font-black text-gray-900 border-b border-gray-100">
                        Nilai-Nilai KAN
                      </h2>

                      <p className="mb-6 text-gray-500">
                        Prinsip yang menjadi landasan setiap langkah KAN
                      </p>

                      <div className="grid gap-4 sm:grid-cols-2">
                        {values.map((val, i) => {
                          const Icon = val.icon;

                          return (
                            <div
                              key={i}
                              className="p-5 text-center transition-all bg-gray-50 border border-gray-100 group rounded-xl hover:shadow-md hover:-translate-y-0.5"
                            >
                              <div
                                className={`w-14 h-14 bg-gradient-to-br ${val.color} rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-lg`}
                              >
                                <Icon className="text-xl text-white" />
                              </div>

                              <h3 className="mb-1.5 text-lg font-black text-gray-900">
                                {val.label}
                              </h3>

                              <p className="text-sm leading-relaxed text-gray-500">
                                {val.desc}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </section>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

/* =========================
   Animated Number
========================= */
const AnimatedNumber = ({ value, suffix = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    const duration = 1200;

    const animate = (currentTime) => {
      if (!startTime) {
        startTime = currentTime;
      }

      const progress = Math.min(
        (currentTime - startTime) / duration,
        1
      );

      // Ease-out effect
      const easedProgress =
        1 - Math.pow(1 - progress, 3);

      const currentValue = Math.floor(
        easedProgress * value
      );

      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    const animationFrame =
      requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [value]);

  return (
    <>
      {count}
      {suffix}
    </>
  );
};

export default About;