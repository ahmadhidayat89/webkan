// frontend/src/pages/ProsesAkreditasi.jsx
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import AccreditationTimeline from '../components/AccreditationTimeline';
import { FaHome, FaChevronRight, FaLink } from 'react-icons/fa';

const SIDEBAR_MENU = [
  { label: 'Proses Akreditasi',          href: '/proses-akreditasi', active: true },
  { label: 'Tarif Akreditasi',           href: '/tarif-akreditasi' },
  { label: 'Penanganan Komplain',        href: '/penanganan-komplain' },
  { label: 'Penanganan Banding',         href: '/penanganan-banding' },
  { label: 'Survey Kepuasan Pelanggan',  href: '/survey-kepuasan-pelanggan' },
];

const QUICK_LINKS = [
  { label: 'Tentang KAN',       href: '/tentang-kan' },
  { label: 'Proses Akreditasi', href: '/proses-akreditasi' },
  { label: 'Hubungi Kami',      href: '/kontak' },
];

const CMS_STEPS = [
  ['Persiapan Permohonan',   'Calon pemohon menyiapkan dokumen sistem manajemen'],
  ['Pengajuan Permohonan',   'Permohonan diajukan melalui portal KAN'],
  ['Tinjauan Awal',          'Tim KAN memeriksa kelengkapan dokumen'],
  ['Penugasan Tim Asesor',   'KAN menunjuk tim asesor yang kompeten'],
  ['Asesmen Dokumen',        'Evaluasi kecukupan dokumen sistem manajemen'],
  ['Asesmen Lapangan',       'Kunjungan ke tempat pemohon untuk verifikasi'],
  ['Laporan Asesmen',        'Tim asesor menyusun laporan hasil asesmen'],
  ['Tinjauan dan Keputusan', 'Komite teknis meninjau dan memutuskan'],
  ['Penerbitan Sertifikat',  'KAN menerbitkan sertifikat akreditasi'],
];

export default function ProsesAkreditasi() {
  const navigate = useNavigate();

  return (
    <>
      <SEO
        title="Proses Akreditasi — KAN"
        description="Pelajari 11 tahapan lengkap proses akreditasi KAN dari permohonan hingga penerbitan sertifikat."
      />
      <Header />

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 text-white px-8 relative overflow-hidden">
        <div className="absolute top-[-60px] right-[-60px] w-72 h-72 rounded-full bg-white/5 pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">

          {/* Breadcrumb */}
          <div className="pt-32 lg:pt-36 pb-4 border-b border-white/10">
            <nav className="flex items-center gap-1.5 text-sm flex-wrap">
              <button onClick={() => navigate('/')} className="flex items-center gap-1 text-white/50 hover:text-white/80 transition-colors font-medium">
                <FaHome className="text-xs" /> Beranda
              </button>
              <FaChevronRight className="text-xs text-white/30" />
              <Link to="/layanan" className="text-white/50 hover:text-white/80 transition-colors">Layanan</Link>
              <FaChevronRight className="text-xs text-white/30" />
              <span className="text-white/80 font-semibold">Proses Akreditasi</span>
            </nav>
          </div>

          {/* Hero content */}
          <div className="py-10">
            <span className="inline-flex items-center gap-1.5 bg-white/15 border border-white/25 px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide mb-4">
              📋 Panduan Akreditasi
            </span>
            <h1 className="text-3xl font-extrabold mb-2.5 leading-tight">Proses Akreditasi KAN</h1>
            <p className="text-base opacity-85 max-w-xl leading-relaxed">
              Pelajari tahapan lengkap proses akreditasi dari permohonan hingga penerbitan sertifikat secara transparan dan terstandar.
            </p>
            <div className="flex gap-8 mt-7">
              {[['11', 'Tahapan Proses'], ['ISO', 'Berstandar Internasional'], ['100%', 'Transparan & Terstandar']].map(([num, label]) => (
                <div key={label}>
                  <div className="text-2xl font-extrabold">{num}</div>
                  <div className="text-xs opacity-75 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Page Body */}
      <div className="max-w-6xl mx-auto px-8 py-10 pb-20 grid grid-cols-[260px_1fr] gap-7 items-start">

        {/* Sidebar */}
        <aside className="sticky top-[88px] flex flex-col gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-blue-600 text-sm font-semibold hover:gap-2.5 transition-all mb-1"
          >
            ← Kembali ke Beranda
          </button>

          {/* Menu */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-blue-600 text-white text-xs font-bold tracking-widest px-4 py-3.5 uppercase">
              Proses Akreditasi
            </div>
            {SIDEBAR_MENU.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-2.5 px-4 py-3 text-sm border-b border-gray-50 last:border-0 transition-all
                  ${item.active
                    ? 'bg-blue-50 text-blue-600 font-semibold border-l-[3px] border-l-blue-600 pl-[13px]'
                    : 'text-slate-500 hover:bg-gray-50 hover:text-blue-600'
                  }`}
              >
                {item.active && <span className="text-base leading-none">•</span>}
                {item.label}
              </Link>
            ))}
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-bold text-blue-950 mb-3 pb-2.5 border-b border-gray-50">
              <FaLink className="text-blue-600 text-xs" /> Tautan Cepat
            </div>
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="block text-blue-600 text-sm py-1.5 border-b border-gray-50 last:border-0 hover:pl-1.5 transition-all"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex flex-col gap-7 min-w-0">

          {/* CMS Content Box */}
          <div className="bg-white rounded-2xl px-9 py-8 shadow-sm">
            <h2 className="text-xl font-extrabold text-blue-950 mb-3">Proses Akreditasi KAN</h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-5">
              Akreditasi adalah pengakuan formal oleh KAN bahwa suatu lembaga penilaian kesesuaian telah
              memenuhi persyaratan kompetensi yang ditetapkan berdasarkan standar internasional.
            </p>

            <h3 className="text-base font-bold text-blue-950 mb-3">Alur Proses Akreditasi</h3>
            <ol className="flex flex-col gap-2.5 mb-6">
              {CMS_STEPS.map(([title, desc], i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700 leading-relaxed">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <div><strong className="text-blue-950">{title}</strong> – {desc}</div>
                </li>
              ))}
            </ol>

            <h3 className="text-base font-bold text-blue-950 mb-2">Jenis Akreditasi</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              KAN memberikan akreditasi kepada berbagai jenis lembaga penilaian kesesuaian seperti laboratorium
              pengujian, laboratorium kalibrasi, lembaga inspeksi, lembaga sertifikasi, dan lembaga verifikasi/validasi.
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-200" />

          {/* Timeline Box */}
          <div className="bg-white rounded-2xl px-9 py-8 shadow-sm">
            <div className="mb-9">
              <h3 className="text-lg font-bold text-blue-950 mb-1.5">Tahapan Proses Akreditasi</h3>
              <p className="text-sm text-slate-500">
                Scroll untuk melihat setiap tahapan — animasi muncul dan menghilang sesuai posisi layar.
              </p>
            </div>
            <AccreditationTimeline />
          </div>

          {/* Info Box */}
          <div className="bg-gradient-to-br from-blue-50 to-green-50 border border-blue-200 rounded-2xl p-6 flex gap-5 items-start">
            <span className="text-2xl flex-shrink-0">💡</span>
            <div>
              <div className="text-sm font-bold text-blue-950 mb-1">Butuh Informasi Lebih Lanjut?</div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Jika Anda memiliki pertanyaan seputar proses akreditasi atau membutuhkan bantuan teknis,
                tim Sekretariat KAN siap membantu.
              </p>
              <Link
                to="/kontak"
                className="inline-block mt-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Hubungi Kami →
              </Link>
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </>
  );
}
