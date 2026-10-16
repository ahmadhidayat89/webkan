import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOComponent from '../components/SEO';
import AccreditationTimeline from '../components/AccreditationTimeline';
import { FaHome, FaChevronRight, FaArrowLeft } from 'react-icons/fa';

const SIDEBAR_MENU = [
  { label: 'Proses Akreditasi', href: '/proses-akreditasi', active: true },
  { label: 'Tarif Akreditasi', href: '/tarif-akreditasi' },
  { label: 'Penanganan Komplain', href: '/penanganan-komplain' },
  { label: 'Penanganan Banding', href: '/penanganan-banding' },
  { label: 'Survey Kepuasan Pelanggan', href: '/survey-kepuasan-pelanggan' },
];

const CMS_STEPS = [
  ['Persiapan Permohonan', 'Calon pemohon menyiapkan dokumen sistem manajemen'],
  ['Pengajuan Permohonan', 'Permohonan diajukan melalui portal KAN'],
  ['Tinjauan Awal', 'Tim KAN memeriksa kelengkapan dokumen'],
  ['Penugasan Tim Asesor', 'KAN menunjuk tim asesor yang kompeten'],
  ['Asesmen Dokumen', 'Evaluasi kecukupan dokumen sistem manajemen'],
  ['Asesmen Lapangan', 'Kunjungan ke tempat pemohon untuk verifikasi'],
  ['Laporan Asesmen', 'Tim asesor menyusun laporan hasil asesmen'],
  ['Tinjauan dan Keputusan', 'Komite teknis meninjau dan memutuskan'],
  ['Penerbitan Sertifikat', 'KAN menerbitkan sertifikat akreditasi'],
];

/* Style konten bersama — pakai konstanta yang sama di halaman Tarif, Komplain, Banding, dll. */
const CONTENT_STYLE = {
  h2: 'pb-3 mb-4 text-3xl font-bold text-gray-900 border-b border-gray-200',
  h3: 'pb-2 mb-4 text-2xl font-bold text-gray-900 border-b border-gray-200',
  p: 'mb-6 text-base leading-relaxed text-gray-700 md:text-lg',
  li: 'flex items-start gap-3 text-base leading-relaxed text-gray-700 md:text-lg',
  strong: 'font-bold text-gray-900',
};

export default function ProsesAkreditasi() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100">
      <SEOComponent
        title="Proses Akreditasi — KAN"
        description="Pelajari tahapan lengkap proses akreditasi KAN dari permohonan hingga penerbitan sertifikat."
      />

      <Header />

      {/* DARK BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute rounded-full -top-20 -right-20 w-96 h-96 bg-primary-600/20 blur-3xl" />
          <div className="absolute bottom-0 w-64 h-64 rounded-full left-1/4 bg-white/5 blur-3xl" />
          <div className="absolute w-32 h-32 rounded-full top-1/2 right-1/3 bg-primary-400/10 blur-2xl" />
        </div>

        <div className="container relative z-10 px-6 mx-auto">
          {/* Breadcrumb */}
          <div className="pt-32 pb-4 border-b lg:pt-40 border-white/10">
            <nav className="flex flex-wrap items-center gap-2 text-sm">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-1.5 font-medium transition-colors text-white/50 hover:text-white/80"
              >
                <FaHome className="text-xs" />
                <span>Beranda</span>
              </button>

              <FaChevronRight className="text-xs text-white/30" />

              <span className="font-medium text-white/50">Proses Akreditasi</span>

              <FaChevronRight className="text-xs text-white/30" />

              <span className="font-semibold text-white/80">Proses Akreditasi</span>
            </nav>
          </div>

          {/* Title */}
          <div className="py-10">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h1 className="mb-3 text-4xl font-black leading-tight text-white md:text-5xl">
                  Proses Akreditasi
                </h1>
                <div className="w-16 h-1 rounded-full bg-primary-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT AREA */}
      <main className="py-12">
        <div className="container px-6 mx-auto">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-start gap-8">
              {/* SIDEBAR */}
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
                      {SIDEBAR_MENU.map((page) => (
                        <button
                          key={page.href}
                          onClick={() => navigate(page.href)}
                          className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                            page.active
                              ? 'bg-primary-50 text-primary-700 font-bold border-l-4 border-primary-600 pl-3'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-primary-600'
                          }`}
                        >
                          <span>{page.label}</span>
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>
              </aside>

              {/* MAIN CONTENT */}
              <div className="flex-1 min-w-0">
                {/* CMS Content */}
                <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">
                  <div className="p-8 md:p-12">
                    <h2 className={CONTENT_STYLE.h2}>Proses Akreditasi KAN</h2>

                    <p className={CONTENT_STYLE.p}>
                      Akreditasi adalah pengakuan formal oleh KAN bahwa suatu
                      lembaga penilaian kesesuaian telah memenuhi persyaratan
                      kompetensi yang ditetapkan berdasarkan standar internasional.
                    </p>

                    <h3 className={CONTENT_STYLE.h3}>Alur Proses Akreditasi</h3>

                    <ol className="flex flex-col gap-3 mb-8">
                      {CMS_STEPS.map(([title, description], index) => (
                        <li key={index} className={CONTENT_STYLE.li}>
                          <span className="flex items-center justify-center flex-shrink-0 mt-0.5 text-sm font-bold rounded-full w-7 h-7 bg-primary-50 text-primary-600">
                            {index + 1}
                          </span>
                          <div>
                            <strong className={CONTENT_STYLE.strong}>{title}</strong>{' '}
                            – {description}
                          </div>
                        </li>
                      ))}
                    </ol>

                    <h3 className={CONTENT_STYLE.h3}>Jenis Akreditasi</h3>

                    <p className="text-base leading-relaxed text-gray-700 md:text-lg">
                      KAN memberikan akreditasi kepada berbagai jenis lembaga
                      penilaian kesesuaian seperti laboratorium pengujian,
                      laboratorium kalibrasi, lembaga inspeksi, lembaga sertifikasi,
                      dan lembaga verifikasi/validasi.
                    </p>
                  </div>
                </div>

                <div className="h-px bg-gray-200 my-7" />

                {/* TIMELINE */}
                <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">
                  <div className="p-8 md:p-12">
                    <div className="mb-9">
                      <h3 className={CONTENT_STYLE.h3}>Tahapan Proses Akreditasi</h3>
                      <p className="text-base text-gray-600 md:text-lg">
                        Tahapan proses akreditasi KAN dari permohonan hingga
                        penerbitan sertifikat.
                      </p>
                    </div>

                    <AccreditationTimeline />
                  </div>
                </div>

                {/* INFO BOX */}
                <div className="flex items-start gap-5 p-6 border mt-7 rounded-2xl bg-gradient-to-br from-primary-50 to-blue-50 border-primary-200">
                  <span className="flex-shrink-0 text-3xl">💡</span>

                  <div>
                    <div className="mb-2 text-xl font-bold text-gray-900">
                      Butuh Informasi Lebih Lanjut?
                    </div>

                    <p className="text-base leading-relaxed text-gray-700 md:text-lg">
                      Jika Anda memiliki pertanyaan seputar proses akreditasi
                      atau membutuhkan bantuan teknis, tim Sekretariat KAN siap
                      membantu.
                    </p>

                    <button
                      onClick={() => navigate('/kontak')}
                      className="inline-block px-5 py-2.5 mt-4 text-base font-semibold text-white transition-colors rounded-lg bg-primary-600 hover:bg-primary-700"
                    >
                      Hubungi Kami →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MOBILE SECTION NAVIGATION */}
          <div className="mt-6 lg:hidden">
            <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">
              <div className="px-5 py-3 bg-gradient-to-r from-primary-600 to-primary-700">
                <h3 className="text-sm font-black tracking-wide text-white uppercase">
                  Proses Akreditasi
                </h3>
              </div>

              <nav className="grid grid-cols-2 gap-1 p-2">
                {SIDEBAR_MENU.map((page) => (
                  <button
                    key={page.href}
                    onClick={() => navigate(page.href)}
                    className={`text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      page.active
                        ? 'bg-primary-50 text-primary-700 font-bold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {page.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
