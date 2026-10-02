import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  FaHome, FaChevronRight, FaArrowRight,
  FaCheckCircle, FaAward, FaUsers, FaGlobe,
  FaHistory, FaSitemap, FaBalanceScale, FaStar, FaIdCard, FaFileAlt, FaClipboardList,
} from 'react-icons/fa';

const About = () => {
  const navigate = useNavigate();
  const [cms, setCms] = useState(null);

  useEffect(() => {
    fetch('/api/v1/page-content/tentang-kan')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data && data.data.content_id) {
          try { setCms(JSON.parse(data.data.content_id)); } catch { /* use defaults */ }
        }
      })
      .catch(() => {});
  }, []);

  const subPages = [
    {
      icon: FaHistory,
      href: '/sejarah-fungsi',
      label: 'Sejarah dan Fungsi KAN',
      desc: 'Perjalanan dan peran KAN sejak berdiri hingga kini',
      color: 'from-blue-600 to-blue-700',
    },
    {
      icon: FaSitemap,
      href: '/struktur-organisasi',
      label: 'Struktur Organisasi',
      desc: 'Susunan kepengurusan dan organisasi KAN',
      color: 'from-indigo-600 to-indigo-700',
    },
    {
      icon: FaBalanceScale,
      href: '/ketidakberpihakan',
      label: 'Ketidakberpihakan',
      desc: 'Komitmen KAN dalam menjaga independensi dan objektivitas',
      color: 'from-violet-600 to-violet-700',
    },
    {
      icon: FaGlobe,
      href: '/pengakuan-internasional',
      label: 'Pengakuan Internasional',
      desc: 'Keanggotaan dan pengakuan KAN di kancah internasional',
      color: 'from-cyan-600 to-cyan-700',
    },
    {
      icon: FaIdCard,
      href: '/anggota-kan',
      label: 'Anggota KAN',
      desc: 'Daftar lembaga penilaian kesesuaian yang terakreditasi',
      color: 'from-teal-600 to-teal-700',
    },
    {
      icon: FaFileAlt,
      href: '/maklumat-layanan',
      label: 'Maklumat Layanan',
      desc: 'Komitmen dan janji pelayanan KAN kepada masyarakat',
      color: 'from-emerald-600 to-emerald-700',
    },
    {
      icon: FaClipboardList,
      href: '/standar-layanan',
      label: 'Standar Layanan Akreditasi',
      desc: 'Standar dan prosedur layanan akreditasi KAN',
      color: 'from-green-600 to-green-700',
    },
  ];

  const stats = [
    { value: cms?.stat_1_value || '1997', label: cms?.stat_1_label || 'Tahun Berdiri' },
    { value: cms?.stat_2_value || '500+', label: cms?.stat_2_label || 'LPK Terakreditasi' },
    { value: cms?.stat_3_value || '10+',  label: cms?.stat_3_label || 'Pengakuan Internasional' },
    { value: cms?.stat_4_value || '25+',  label: cms?.stat_4_label || 'Tahun Pengalaman' },
  ];

  const VALUE_ICONS   = [FaCheckCircle, FaAward, FaUsers, FaGlobe, FaStar, FaBalanceScale, FaClipboardList, FaHistory];
  const VALUE_COLORS  = [
    'from-blue-500 to-blue-600', 'from-primary-600 to-primary-700',
    'from-violet-600 to-violet-700', 'from-cyan-600 to-cyan-700',
    'from-emerald-600 to-emerald-700', 'from-amber-600 to-amber-700',
    'from-rose-600 to-rose-700', 'from-teal-600 to-teal-700',
  ];

  const cmsValues = cms?.values || [
    { label: 'Integritas',      desc: 'Menjunjung tinggi kejujuran dan transparansi dalam setiap tindakan' },
    { label: 'Profesionalisme', desc: 'Berkomitmen pada standar kompetensi tertinggi' },
    { label: 'Kolaborasi',      desc: 'Bekerja sama untuk kemajuan akreditasi nasional' },
    { label: 'Internasional',   desc: 'Diakui dan dipercaya di tingkat global' },
  ];

  const vision = cms?.vision || 'Menjadi lembaga akreditasi yang diakui secara internasional dan terpercaya dalam memberikan jaminan kompetensi lembaga penilaian kesesuaian.';

  const missions = cms?.missions || [
    'Memberikan layanan akreditasi yang berkualitas tinggi dan dapat dipertanggungjawabkan',
    'Meningkatkan kompetensi lembaga penilaian kesesuaian di Indonesia',
    'Memperluas pengakuan internasional melalui kerjasama bilateral dan multilateral',
    'Mendukung daya saing produk dan jasa Indonesia di pasar global',
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      {/* Dark Banner + Stats — satu kesatuan */}
      <div className="relative bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          {/* Breadcrumb — di dalam banner, di bawah navbar */}
          <div className="pt-32 lg:pt-40 pb-4 border-b border-white/10">
            <nav className="flex items-center gap-2 text-sm flex-wrap">
              <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-white/50 hover:text-white/80 transition-colors font-medium">
                <FaHome className="text-xs" />
                <span>Beranda</span>
              </button>
              <FaChevronRight className="text-xs text-white/30" />
              <span className="text-white/80 font-semibold">Tentang KAN</span>
            </nav>
          </div>

          {/* Title */}
          <div className="py-10">
            <p className="text-primary-300 font-bold text-sm uppercase tracking-widest mb-3">
              Komite Akreditasi Nasional
            </p>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-3">
              Tentang KAN
            </h1>
            <div className="w-16 h-1 bg-primary-400 rounded-full mb-5"></div>
            <p className="text-white/70 text-lg max-w-2xl leading-relaxed">
              {cms?.hero_desc || 'Lembaga non-struktural yang bertanggung jawab langsung kepada Presiden Republik Indonesia dalam bidang akreditasi.'}
            </p>
          </div>

          {/* Stats — di dalam banner, dipisah garis atas */}
          <div className="border-t border-white/10 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-black text-white mb-1">{stat.value}</div>
                <div className="text-sm text-white/50 font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="py-14">
        <div className="container mx-auto px-6">

          {/* Subpages Navigation */}
          <div className="mb-16">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
                Informasi Tentang KAN
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                Jelajahi informasi lengkap mengenai Komite Akreditasi Nasional
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {subPages.map((page, i) => {
                const Icon = page.icon;
                return (
                  <a
                    key={i}
                    href={page.href}
                    className="group bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${page.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                      <Icon className="text-xl text-white" />
                    </div>
                    <h3 className="font-black text-gray-900 mb-2 group-hover:text-primary-600 transition-colors leading-tight">
                      {page.label}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed flex-1">
                      {page.desc}
                    </p>
                    <div className="flex items-center gap-1.5 mt-4 text-primary-600 font-bold text-sm group-hover:gap-3 transition-all">
                      <span>Selengkapnya</span>
                      <FaArrowRight className="text-xs" />
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Visi & Misi */}
          <div className="mb-16">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-primary-700 to-primary-800 px-8 py-6">
                <h2 className="text-2xl font-black text-white">
                  Visi & Misi
                </h2>
              </div>
              <div className="p-8 md:p-12 grid md:grid-cols-2 gap-10">
                {/* Visi */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                      <FaStar className="text-primary-600 text-lg" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900">
                      Visi
                    </h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed border-l-4 border-primary-500 pl-4">
                    {vision}
                  </p>
                </div>

                {/* Misi */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-accent-100 rounded-xl flex items-center justify-center">
                      <FaClipboardList className="text-accent-600 text-lg" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900">
                      Misi
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    {missions.map((m, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <FaCheckCircle className="text-primary-600 flex-shrink-0 mt-1" />
                        <span className="text-gray-700 leading-relaxed">{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Nilai-Nilai */}
          <div className="mb-16">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
                Nilai-Nilai KAN
              </h2>
              <p className="text-gray-500">
                Prinsip yang menjadi landasan setiap langkah KAN
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {cmsValues.map((val, i) => {
                const Icon = VALUE_ICONS[i % VALUE_ICONS.length];
                const color = VALUE_COLORS[i % VALUE_COLORS.length];
                return (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all group text-center">
                    <div className={`w-16 h-16 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                      <Icon className="text-2xl text-white" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 mb-2">
                      {val.label}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {val.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
