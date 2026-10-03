import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FaSearch,
  FaBars,
  FaTimes,
} from 'react-icons/fa';
import logoKan from '../assets/kan.png';

const Header = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetch('/api/v1/settings?group=general')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data?.site_logo) {
          setLogoUrl(data.data.site_logo);
        }
      })
      .catch(() => { });
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    navigate(`/cari?q=${encodeURIComponent(trimmed)}`);
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    {
      label: 'Beranda',
      href: '/',
    },
    {
      label: 'Tentang KAN',
      href: '/tentang-kan',
      dropdown: [
        { label: 'Profil KAN', href: '/tentang-kan' },
        { label: 'Sejarah dan Fungsi KAN', href: '/sejarah-fungsi' },
        { label: 'Struktur Organisasi', href: '/struktur-organisasi' },
        { label: 'Ketidakberpihakan', href: '/ketidakberpihakan' },
        { label: 'Pengakuan Internasional', href: '/pengakuan-internasional' },
        { label: 'Anggota KAN', href: '/anggota-kan' },
        { label: 'Maklumat Layanan', href: '/maklumat-layanan' },
        { label: 'Standar Layanan Akreditasi', href: '/standar-layanan' }
      ]
    },
    {
      label: 'Proses Akreditasi',
      href: '/proses-akreditasi',
      dropdown: [
        { label: 'Proses Akreditasi', href: '/proses-akreditasi' },
        { label: 'Tarif Akreditasi', href: '/tarif-akreditasi' },
        { label: 'Penanganan Komplain', href: '/penanganan-komplain' },
        { label: 'Penanganan Banding', href: '/penanganan-banding' },
        { label: 'Survey Kepuasan Pelanggan', href: '/survey-kepuasan-pelanggan' },
      ]
    },
    {
      label: 'Layanan Akreditasi',
      href: '/layanan-akreditasi',
      dropdown: [
        { label: 'Layanan Akreditasi', href: '/layanan-akreditasi' },
        { label: 'Laboratorium', href: '/layanan/laboratorium' },
        {
          label: 'Lembaga Verifikasi dan/atau Validasi Gas Rumah Kaca',
          href: '/layanan/lembaga-verifikasi-validasi-grk'
        },
        {
          label: 'Penyelenggara Uji Profisiensi',
          href: '/layanan/penyelenggara-uji-profisiensi'
        },
        {
          label: 'Produsen Bahan Acuan',
          href: '/layanan/produsen-bahan-acuan'
        },
        {
          label: 'Sistem Manajemen',
          href: '/layanan/sistem-manajemen'
        },
        {
          label: 'Sertifikasi Person',
          href: '/layanan/sertifikasi-person'
        },
        {
          label: 'Sertifikasi Berdasarkan SNI ISO/IEC 17065',
          href: '/layanan/sertifikasi-sni-iso-iec-17065'
        },
        {
          label: 'Sertifikasi Pembangunan Berkelanjutan',
          href: '/layanan/sertifikasi-pembangunan-berkelanjutan'
        },
      ]
    },
    {
      label: 'Direktori LPK',
      href: '/direktori',
      dropdown: [
        {
          label: 'Terakreditasi',
          href: '/direktori/terakreditasi'
        },
        {
          label: 'Akreditasi Dibekukan',
          href: '/direktori/akreditasi-dibekukan'
        },
        {
          label: 'Akreditasi Dicabut',
          href: '/direktori/akreditasi-dicabut'
        },
      ]
    },
    {
      label: 'Unduh',
      href: '/unduh',
      dropdown: [
        {
          label: 'Dokumen Akreditasi',
          href: '/unduh/dokumen-akreditasi'
        },
        {
          label: 'Materi Kegiatan',
          href: '/unduh/materi-kegiatan'
        },
        {
          label: 'Artikel Penilaian Kesesuaian',
          href: '/unduh/artikel-penilaian-kesesuaian'
        },
        {
          label: 'Dokumen Internasional',
          href: '/unduh/dokumen-internasional'
        },
      ]
    },
    {
      label: 'E-Training',
      href: 'http://127.0.0.1:8001',
      external: true,
    },
  ];

  const activeLang = (i18n.resolvedLanguage || i18n.language || 'id').startsWith('en') ? 'en' : 'id';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
        ? 'bg-white/95 backdrop-blur-xl shadow-2xl shadow-primary-500/10'
        : 'bg-gradient-to-b from-black/60 via-black/30 to-transparent backdrop-blur-md'
        }`}
    >

      {/* =====================================================
          TOP HEADER
          ===================================================== */}
      {!isScrolled && (
        <div className="hidden text-white md:block bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800">
          <div className="container">
            <div className="flex items-center justify-between py-2 text-xs">

              {/* Keterangan - hanya teks, tidak dapat diklik */}
              <div className="flex items-center">
                <span className="font-medium">
                  Akreditasi Memastikan Kompetensi dan Membangun Kepercayaan
                </span>
              </div>

              {/* FAQ + Hubungi Kami + Bahasa */}
              <div className="flex items-center space-x-5 lg:space-x-7">

                {/* FAQ */}
                <a
                  href="/faq"
                  className="font-medium text-white transition-none hover:text-white hover:underline underline-offset-4"
                >
                  FAQ
                </a>

                {/* Hubungi Kami */}
                <a
                  href="/kontak"
                  className="font-medium text-white transition-none hover:text-white hover:underline underline-offset-4"
                >
                  Hubungi Kami
                </a>

                {/* Language */}
                <div className="flex items-center gap-2 font-medium text-white">
                  <button
                    type="button"
                    onClick={() => i18n.changeLanguage('en')}
                    className={`transition-colors ${activeLang === 'en'
                      ? 'text-white underline underline-offset-4'
                      : 'text-white/70 hover:text-white'
                      }`}
                  >
                    EN
                  </button>

                  <span className="text-white/70">|</span>

                  <button
                    type="button"
                    onClick={() => i18n.changeLanguage('id')}
                    className={`transition-colors ${activeLang === 'id'
                      ? 'text-white underline underline-offset-4'
                      : 'text-white/70 hover:text-white'
                      }`}
                  >
                    ID
                  </button>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          MAIN NAVIGATION
          ===================================================== */}
      <div
        className={`${isScrolled
          ? 'py-2 md:py-3'
          : 'py-3 md:py-4'
          } transition-all duration-300`}
      >
        <div className="container">

          <div className="flex items-center gap-2">

            {/* =================================================
                LOGO
                ================================================= */}
            <a
              href="/"
              className="relative flex items-center flex-shrink-0 group"
            >
              <img
                src={logoUrl || logoKan}
                alt="Logo KAN"
                className="object-contain w-auto h-10 transition-transform duration-500 md:h-12 lg:h-14 group-hover:scale-105"
              />
            </a>

            {/* =================================================
                DESKTOP NAVIGATION
                ================================================= */}
            <nav className="hidden xl:flex items-center flex-nowrap gap-0.5 ml-auto">

              {navItems.map((item, index) => (
                <div
                  key={index}
                  className="relative flex-shrink-0 group"
                  onMouseEnter={() =>
                    item.dropdown && setActiveDropdown(index)
                  }
                  onMouseLeave={() =>
                    setActiveDropdown(null)
                  }
                >

                  <a
                    href={item.href}
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noopener noreferrer' : undefined}
                    className={`${isScrolled
                      ? 'text-gray-700 hover:text-primary-600'
                      : 'text-white/90 hover:text-white'
                      } px-2.5 lg:px-3.5 py-2.5 rounded-xl font-semibold transition-all relative overflow-hidden text-[11px] lg:text-sm group/item flex items-center gap-1 lg:gap-1.5 whitespace-nowrap`}
                  >

                    <span
                      className={`absolute inset-0 ${isScrolled
                        ? 'bg-primary-50'
                        : 'bg-white/10'
                        } scale-0 group-hover/item:scale-100 transition-transform duration-300 rounded-xl`}
                    ></span>

                    <span className="relative z-10 whitespace-nowrap">
                      {item.label}
                    </span>

                    {item.dropdown && (
                      <span
                        className={`relative z-10 text-xs transition-transform ${activeDropdown === index
                          ? 'rotate-180'
                          : ''
                          }`}
                      >
                        ▼
                      </span>
                    )}

                  </a>

                  {/* Dropdown */}
                  {item.dropdown &&
                    activeDropdown === index && (
                      <div className="absolute left-0 w-56 pt-0 overflow-hidden border border-gray-100 shadow-2xl top-full bg-white/95 backdrop-blur-xl rounded-2xl animate-fadeIn">

                        {item.dropdown.map(
                          (dropItem, dropIndex) => (
                            <a
                              key={dropIndex}
                              href={dropItem.href}
                              className="block px-6 py-3 text-sm font-medium text-gray-700 transition-all border-b hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 hover:text-primary-700 border-gray-50 last:border-0"
                            >
                              {dropItem.label}
                            </a>
                          )
                        )}

                      </div>
                    )}

                </div>
              ))}

              {/* =================================================
                  SEARCH DESKTOP
                  ================================================= */}
              <div className="relative flex items-center flex-shrink-0 ml-1">

                <form
                  onSubmit={handleSearchSubmit}
                  className={`flex items-center h-10 lg:h-11 w-40 lg:w-52 rounded-xl border backdrop-blur-xl shadow-lg ${isScrolled
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-white/10 border-white/20'
                    }`}
                >

                  <button
                    type="submit"
                    className={`ml-3 text-sm flex-shrink-0 ${isScrolled
                      ? 'text-gray-400 hover:text-primary-600'
                      : 'text-white/70 hover:text-white'
                      }`}
                    aria-label="Cari"
                  >
                    <FaSearch />
                  </button>

                  <input
                    type="text"
                    placeholder="Cari..."
                    value={searchQuery}
                    onChange={(e) =>
                      setSearchQuery(e.target.value)
                    }
                    className={`flex-1 min-w-0 px-3 bg-transparent outline-none text-xs lg:text-sm font-medium ${isScrolled
                      ? 'text-gray-800 placeholder-gray-400'
                      : 'text-white placeholder-white/60'
                      }`}
                    aria-label="Cari"
                  />

                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className={`mr-2 flex items-center justify-center w-6 h-6 rounded-md transition-all flex-shrink-0 ${isScrolled
                        ? 'text-gray-400 hover:text-gray-700 hover:bg-gray-200'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                      aria-label="Hapus pencarian"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  )}

                </form>

              </div>

            </nav>

            {/* =================================================
                MOBILE MENU TOGGLE
                ================================================= */}
            <button
              onClick={() =>
                setIsMobileMenuOpen(!isMobileMenuOpen)
              }
              className={`xl:hidden ml-auto ${isScrolled
                ? 'text-gray-800 bg-gray-50'
                : 'text-white bg-white/10'
                } p-2 md:p-3 rounded-xl transition-all hover:scale-110 backdrop-blur-xl border ${isScrolled
                  ? 'border-gray-200'
                  : 'border-white/20'
                }`}
              aria-label="Menu"
            >
              {isMobileMenuOpen ? (
                <FaTimes size={18} />
              ) : (
                <FaBars size={18} />
              )}
            </button>

          </div>

          {/* =================================================
              MOBILE MENU
              ================================================= */}
          {isMobileMenuOpen && (
            <div className="xl:hidden mt-4 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fadeIn max-h-[70vh] overflow-y-auto">

              <div className="p-3 space-y-1 md:p-4">

                {navItems.map((item, index) => (
                  <div key={index}>

                    <a
                      href={item.href}
                      className="flex items-center gap-2 md:gap-3 text-gray-700 hover:text-primary-600 hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 px-3 md:px-4 py-2.5 md:py-3 rounded-xl transition-all font-semibold text-sm md:text-base"
                      onClick={() =>
                        !item.dropdown &&
                        setIsMobileMenuOpen(false)
                      }
                    >
                      <span>{item.label}</span>
                    </a>

                    {item.dropdown && (
                      <div className="mt-1 ml-8 space-y-1 md:ml-10">

                        {item.dropdown.map(
                          (dropItem, dropIndex) => (
                            <a
                              key={dropIndex}
                              href={dropItem.href}
                              className="block text-gray-600 hover:text-primary-600 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm"
                              onClick={() =>
                                setIsMobileMenuOpen(false)
                              }
                            >
                              {dropItem.label}
                            </a>
                          )
                        )}

                      </div>
                    )}

                  </div>
                ))}

                {/* Mobile Language */}
                <div className="flex items-center gap-2 px-3 pt-3 mt-3 text-sm font-semibold text-gray-700 border-t border-gray-100 md:px-4">
                  <button
                    type="button"
                    onClick={() => i18n.changeLanguage('en')}
                    className={activeLang === 'en' ? 'text-primary-600 underline underline-offset-4' : 'text-gray-500 hover:text-primary-600'}
                  >
                    EN
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={() => i18n.changeLanguage('id')}
                    className={activeLang === 'id' ? 'text-primary-600 underline underline-offset-4' : 'text-gray-500 hover:text-primary-600'}
                  >
                    ID
                  </button>
                </div>

                {/* Mobile Search */}
                <div className="pt-3 mt-3 border-t border-gray-100">

                  <form onSubmit={handleSearchSubmit} className="relative">

                    <input
                      type="text"
                      placeholder="Cari..."
                      value={searchQuery}
                      onChange={(e) =>
                        setSearchQuery(e.target.value)
                      }
                      className="w-full px-4 py-3 pr-10 text-sm font-medium text-gray-800 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
                      aria-label="Cari"
                    />

                    <button
                      type="submit"
                      className="absolute text-gray-400 -translate-y-1/2 right-4 top-1/2 hover:text-primary-600"
                      aria-label="Cari"
                    >
                      <FaSearch />
                    </button>

                  </form>

                </div>

              </div>

            </div>
          )}

        </div>
      </div>

    </header>
  );
};

export default Header;