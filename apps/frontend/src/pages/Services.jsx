import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import {
  FaHome, FaChevronRight, FaArrowRight, FaCheckCircle,
  FaFlask, FaClipboardCheck, FaCertificate,
  FaIndustry, FaHeartbeat, FaLeaf, FaUsers,
} from 'react-icons/fa';

const services = [
  {
    icon: FaFlask,
    title: 'Laboratorium',
    desc: 'Akreditasi untuk laboratorium pengujian dan kalibrasi sesuai ISO/IEC 17025.',
    features: ['Pengujian Kimia', 'Pengujian Fisika', 'Pengujian Biologi', 'Kalibrasi'],
    color: 'from-blue-600 to-blue-700',
    link: '/layanan/laboratorium',
  },
  {
    icon: FaClipboardCheck,
    title: 'Lembaga Inspeksi',
    desc: 'Akreditasi lembaga inspeksi berdasarkan ISO/IEC 17020.',
    features: ['Inspeksi Tipe A', 'Inspeksi Tipe B', 'Inspeksi Tipe C', 'Inspeksi Khusus'],
    color: 'from-violet-600 to-violet-700',
    link: '/layanan/lembaga-inspeksi',
  },
  {
    icon: FaLeaf,
    title: 'Verifikasi & Validasi GRK',
    desc: 'Akreditasi lembaga verifikasi dan validasi gas rumah kaca (ISO 14065).',
    features: ['Verifikasi Emisi', 'Validasi Proyek', 'Carbon Credit'],
    color: 'from-teal-600 to-teal-700',
    link: '/layanan/lembaga-verifikasi-validasi-grk',
  },
  {
    icon: FaUsers,
    title: 'Penyelenggara Uji Profisiensi',
    desc: 'Akreditasi penyelenggara uji profisiensi sesuai ISO/IEC 17043.',
    features: ['Uji Banding Antar Lab', 'Skema Profisiensi', 'Evaluasi Kinerja'],
    color: 'from-cyan-600 to-cyan-700',
    link: '/layanan/penyelenggara-uji-profisiensi',
  },
  {
    icon: FaIndustry,
    title: 'Produsen Bahan Acuan',
    desc: 'Akreditasi produsen bahan acuan berdasarkan ISO 17034.',
    features: ['Bahan Acuan Kimia', 'Bahan Acuan Biologi', 'Bahan Acuan Fisika'],
    color: 'from-orange-600 to-orange-700',
    link: '/layanan/produsen-bahan-acuan',
  },
  {
    icon: FaCertificate,
    title: 'Sistem Manajemen',
    desc: 'Akreditasi lembaga sertifikasi sistem manajemen (ISO/IEC 17021).',
    features: ['ISO 9001', 'ISO 14001', 'ISO 45001', 'ISO 22000'],
    color: 'from-green-600 to-green-700',
    link: '/layanan/sistem-manajemen',
  },
  {
    icon: FaHeartbeat,
    title: 'Sertifikasi Person',
    desc: 'Akreditasi lembaga sertifikasi personel sesuai ISO/IEC 17024.',
    features: ['Sertifikasi Kompetensi', 'Uji Kompetensi', 'Pemeliharaan Sertifikat'],
    color: 'from-rose-600 to-rose-700',
    link: '/layanan/sertifikasi-person',
  },
  {
    icon: FaCheckCircle,
    title: 'Sertifikasi Produk (SNI ISO/IEC 17065)',
    desc: 'Akreditasi lembaga sertifikasi produk berdasarkan ISO/IEC 17065.',
    features: ['Sertifikasi SNI', 'Sertifikasi Produk', 'Inspeksi Produk'],
    color: 'from-primary-600 to-primary-700',
    link: '/layanan/sertifikasi-sni-iso-iec-17065',
  },
  {
    icon: FaLeaf,
    title: 'Sertifikasi Pembangunan Berkelanjutan',
    desc: 'Akreditasi lembaga sertifikasi untuk skema pembangunan berkelanjutan.',
    features: ['Green Building', 'Ekolabel', 'Berkelanjutan'],
    color: 'from-emerald-600 to-emerald-700',
    link: '/layanan/sertifikasi-pembangunan-berkelanjutan',
  },
];

const processSteps = [
  { num: '01', title: 'Pengajuan', desc: 'Mengisi formulir permohonan dan melengkapi dokumen persyaratan akreditasi.' },
  { num: '02', title: 'Evaluasi', desc: 'Tinjauan dokumen dan asesmen lapangan oleh asesor KAN yang kompeten.' },
  { num: '03', title: 'Keputusan', desc: 'Komite akreditasi melakukan kajian dan membuat keputusan akreditasi.' },
  { num: '04', title: 'Sertifikat', desc: 'Penerbitan sertifikat akreditasi beserta lampiran ruang lingkup.' },
];

const benefits = [
  'Pengakuan Internasional',
  'Meningkatkan Kredibilitas',
  'Akses Pasar Global',
  'Peningkatan Kompetensi',
  'Jaminan Kualitas',
  'Kepercayaan Stakeholder',
];

const Services = () => {
  const navigate = useNavigate();
  const [cms, setCms] = useState(null);

  useEffect(() => {
    fetch('/api/v1/page-content/layanan')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data && data.data.content_id) {
          try { setCms(JSON.parse(data.data.content_id)); } catch { /* use defaults */ }
        }
      })
      .catch(() => {});
  }, []);

  const servicesList = services.map((svc, i) => ({
    ...svc,
    title: cms?.[`card_${i + 1}_title`] || svc.title,
    desc:  cms?.[`card_${i + 1}_desc`]  || svc.desc,
  }));

  const stepsList = processSteps.map((step, i) => ({
    ...step,
    title: cms?.[`step_${i + 1}_title`] || step.title,
    desc:  cms?.[`step_${i + 1}_desc`]  || step.desc,
  }));

  const benefitsList = benefits.map((b, i) => cms?.[`benefit_${i + 1}`] || b);

  return (
    <div className="min-h-screen bg-gray-100">
      <SEO title="Layanan Akreditasi — KAN" description="Berbagai layanan akreditasi KAN untuk lembaga penilaian kesesuaian sesuai standar internasional." />
      <Header />

      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl"></div>
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
              <span className="text-white/80 font-semibold">Layanan Akreditasi</span>
            </nav>
          </div>

          {/* Title */}
          <div className="py-10">
            <p className="text-primary-300 font-bold text-sm uppercase tracking-widest mb-3">
              Komite Akreditasi Nasional
            </p>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-3">
              Layanan Akreditasi
            </h1>
            <div className="w-16 h-1 bg-primary-400 rounded-full mb-5"></div>
            <p className="text-white/70 text-lg max-w-2xl leading-relaxed">
              {cms?.hero_desc || 'KAN menyediakan berbagai layanan akreditasi untuk lembaga penilaian kesesuaian sesuai standar internasional ISO/IEC 17000 series.'}
            </p>
          </div>
        </div>
      </div>

      <main className="py-14">
        <div className="container mx-auto px-6">

          {/* Services Grid */}
          <div className="mb-16">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
                Ruang Lingkup Layanan
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                Pilih layanan akreditasi yang sesuai dengan jenis lembaga penilaian kesesuaian Anda
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {servicesList.map((service, index) => {
                const Icon = service.icon;
                return (
                  <div
                    key={index}
                    className="group bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                  >
                    <div className={`w-14 h-14 bg-gradient-to-br ${service.color} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-md`}>
                      <Icon className="text-2xl text-white" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 mb-2">{service.title}</h3>
                    <p className="text-gray-500 text-sm mb-4 leading-relaxed">{service.desc}</p>
                    <div className="space-y-1.5 flex-1 mb-5">
                      {service.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <FaCheckCircle className="text-primary-500 flex-shrink-0 text-xs" />
                          <span className="text-gray-600">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => navigate(service.link)}
                      className="flex items-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors group/btn w-fit"
                    >
                      <span>Selengkapnya</span>
                      <FaArrowRight className="text-xs group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Process Steps */}
          <div className="mb-16">
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 md:p-10">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">Proses Akreditasi</h2>
                <p className="text-gray-500 max-w-lg mx-auto">Tahapan proses untuk mendapatkan akreditasi dari KAN</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stepsList.map((step, index) => (
                  <div key={index} className="relative">
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 h-full">
                      <div className="text-5xl font-black text-primary-100 mb-3 leading-none">{step.num}</div>
                      <h3 className="text-base font-black text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                    </div>
                    {index < stepsList.length - 1 && (
                      <div className="hidden lg:flex absolute top-1/2 -right-3 z-10 items-center justify-center w-6 h-6 -translate-y-1/2">
                        <FaChevronRight className="text-primary-400 text-xs" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="mb-16">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">Manfaat Akreditasi</h2>
              <p className="text-gray-500 max-w-lg mx-auto">Keuntungan yang didapat lembaga Anda setelah mendapatkan akreditasi KAN</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {benefitsList.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 bg-white rounded-2xl shadow-md border border-gray-200 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <FaCheckCircle className="text-white text-sm" />
                  </div>
                  <span className="font-bold text-gray-800">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* CTA */}
      <div className="relative bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary-600/20 rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto px-6 py-16 relative z-10 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            {cms?.cta_title || 'Siap Mendapatkan Akreditasi?'}
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
            {cms?.cta_desc || 'Hubungi kami untuk informasi lebih lanjut tentang proses dan persyaratan akreditasi.'}
          </p>
          <a
            href="/kontak"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-primary-800 rounded-xl font-bold text-sm hover:bg-primary-50 transition-colors shadow-lg"
          >
            Hubungi Kami <FaArrowRight className="text-xs" />
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Services;
