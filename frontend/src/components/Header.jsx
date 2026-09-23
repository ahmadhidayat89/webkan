import { useState, useEffect } from 'react';
import { FaSearch, FaBars, FaTimes, FaFacebookF, FaTwitter, FaInstagram, FaYoutube, FaPhone, FaEnvelope } from 'react-icons/fa';

const Header = () => {
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
      .catch(() => {});
  }, []);

  const navItems = [
    {
      label: 'Beranda',
      href: '/',
    },
    {
      label: 'Tentang KAN',
      href: '/tentang-kan',
      dropdown: [
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
      href: '/layanan',
      dropdown: [
        { label: 'Laboratorium', href: '/layanan/laboratorium' },
        { label: 'Lembaga Inspeksi', href: '/layanan/lembaga-inspeksi' },
        { label: 'Lembaga Verifikasi dan/atau Validasi Gas Rumah Kaca', href: '/layanan/lembaga-verifikasi-validasi-grk' },
        { label: 'Penyelenggara Uji Profisiensi', href: '/layanan/penyelenggara-uji-profisiensi' },
        { label: 'Produsen Bahan Acuan', href: '/layanan/produsen-bahan-acuan' },
        { label: 'Sistem Manajemen', href: '/layanan/sistem-manajemen' },
        { label: 'Sertifikasi Person', href: '/layanan/sertifikasi-person' },
        { label: 'Sertifikasi Berdasarkan SNI ISO/IEC 17065', href: '/layanan/sertifikasi-sni-iso-iec-17065' },
        { label: 'Sertifikasi Pembangunan Berkelanjutan', href: '/layanan/sertifikasi-pembangunan-berkelanjutan' },
      ]
    },
    {
      label: 'Direktori LPK',
      href: '/direktori',
      dropdown: [
        { label: 'Terakreditasi', href: '/direktori/terakreditasi' },
        { label: 'Akreditasi Dibekukan', href: '/direktori/akreditasi-dibekukan' },
        { label: 'Akreditasi Dicabut', href: '/direktori/akreditasi-dicabut' },
      ]
    },
    {
      label: 'Unduh',
      href: '/unduh',
      dropdown: [
        { label: 'Dokumen Akreditasi', href: '/unduh/dokumen-akreditasi' },
        { label: 'Materi Kegiatan', href: '/unduh/materi-kegiatan' },
        { label: 'Artikel Penilaian Kesesuaian', href: '/unduh/artikel-penilaian-kesesuaian' },
        { label: 'Dokumen Internasional', href: '/unduh/dokumen-internasional' },
      ]
    },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-xl shadow-2xl shadow-primary-500/10' 
          : 'bg-gradient-to-b from-black/60 via-black/30 to-transparent backdrop-blur-md'
      }`}
    >
      {/* Premium Top Bar - Hidden on mobile */}
      {!isScrolled && (
        <div className="hidden md:block bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 text-white">
          <div className="container">
            <div className="flex justify-between items-center py-2 text-xs">
              {/* Contact Info */}
              <div className="flex items-center space-x-4 lg:space-x-6">
                <a href="tel:081388636959" className="flex items-center gap-1.5 hover:text-accent-300 transition-colors group">
                  <FaPhone className="text-[10px] group-hover:animate-pulse" />
                  <span className="font-medium hidden sm:inline">081388636959</span>
                  <span className="font-medium sm:hidden">0813...</span>
                </a>
                <a href="mailto:laboratorium@bsn.go.id" className="flex items-center gap-1.5 hover:text-accent-300 transition-colors group">
                  <FaEnvelope className="text-[10px] group-hover:animate-pulse" />
                  <span className="font-medium hidden lg:inline">laboratorium@bsn.go.id</span>
                  <span className="font-medium lg:hidden">Email</span>
                </a>
              </div>
              
              {/* Social Media */}
              <div className="flex items-center space-x-3 lg:space-x-4">
                <span className="text-[10px] opacity-80 hidden lg:inline">Follow us:</span>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" 
                   className="hover:text-accent-300 transition-all hover:scale-110">
                  <FaFacebookF size={11} />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" 
                   className="hover:text-accent-300 transition-all hover:scale-110">
                  <FaTwitter size={11} />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" 
                   className="hover:text-accent-300 transition-all hover:scale-110">
                  <FaInstagram size={11} />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" 
                   className="hover:text-accent-300 transition-all hover:scale-110">
                  <FaYoutube size={11} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation - Responsive */}
      <div className={`${isScrolled ? 'py-2 md:py-3' : 'py-3 md:py-4'} transition-all duration-300`}>
        <div className="container">
          <div className="flex items-center justify-between">
            {/* Premium Logo - Responsive */}
            <a href="/" className="flex items-center space-x-2 md:space-x-3 group relative">
              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
                
                {/* Logo Box */}
                <div className={`relative flex items-center justify-center text-white font-black transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 rounded-xl overflow-hidden w-14 h-14 md:w-16 lg:w-20 md:h-16 lg:h-20 text-base md:text-lg lg:text-xl ${
                  logoUrl
                    ? 'bg-transparent'
                    : isScrolled
                      ? 'bg-gradient-to-br from-primary-600 to-primary-800 shadow-lg shadow-primary-500/50'
                      : 'bg-white/10 backdrop-blur-xl border border-white/20'
                }`}>
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo KAN" className="w-full h-full object-contain" />
                  ) : (
                    <span className="relative z-10">KAN</span>
                  )}
                </div>
              </div>
              
            </a>

            {/* Premium Desktop Navigation - Hidden on mobile/tablet */}
            <nav className="hidden xl:flex items-center space-x-1">
              {navItems.map((item, index) => (
                <div 
                  key={index}
                  className="relative group"
                  onMouseEnter={() => item.dropdown && setActiveDropdown(index)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <a
                    href={item.href}
                    className={`${
                      isScrolled 
                        ? 'text-gray-700 hover:text-primary-600' 
                        : 'text-white/90 hover:text-white'
                    } px-3 lg:px-4 py-2.5 rounded-xl font-semibold transition-all relative overflow-hidden text-xs lg:text-sm group/item flex items-center gap-1.5 lg:gap-2`}
                  >
                    {/* Hover Background */}
                    <span className={`absolute inset-0 ${
                      isScrolled ? 'bg-primary-50' : 'bg-white/10'
                    } scale-0 group-hover/item:scale-100 transition-transform duration-300 rounded-xl`}></span>
                    
                    {/* Text */}
                    <span className="relative z-10">{item.label}</span>
                    
                    {/* Dropdown Arrow */}
                    {item.dropdown && (
                      <span className={`relative z-10 text-xs transition-transform ${activeDropdown === index ? 'rotate-180' : ''}`}>▼</span>
                    )}
                  </a>

                  {/* Premium Dropdown - NO GAP FIX */}
                  {item.dropdown && activeDropdown === index && (
                    <div className="absolute top-full left-0 pt-0 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fadeIn">
                      {item.dropdown.map((dropItem, dropIndex) => (
                        <a
                          key={dropIndex}
                          href={dropItem.href}
                          className="block px-6 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 hover:text-primary-700 transition-all font-medium text-sm border-b border-gray-50 last:border-0"
                        >
                          {dropItem.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Premium Right Actions - Responsive */}
            <div className="flex items-center space-x-2 md:space-x-3">
              {/* Premium Search - Hidden on small screens */}
              <div className="hidden lg:block relative group">
                <input
                  type="text"
                  placeholder="Cari..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${
                    isScrolled
                      ? 'bg-gray-50 text-gray-800 placeholder-gray-500 border-gray-200'
                      : 'bg-white/10 text-white placeholder-white/60 border-white/20'
                  } px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl pr-10 w-36 lg:w-44 focus:w-52 lg:focus:w-64 transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-primary-400 border backdrop-blur-xl text-xs lg:text-sm font-medium shadow-lg`}
                />
                <FaSearch className={`${
                  isScrolled ? 'text-gray-400 group-hover:text-primary-600' : 'text-white/60 group-hover:text-white'
                } absolute right-3 lg:right-3.5 top-1/2 transform -translate-y-1/2 text-xs transition-colors`} />
              </div>

              {/* Contact Button - Desktop Only */}
              <a
                href="/kontak"
                className={`hidden 2xl:flex items-center gap-2 px-4 lg:px-5 py-2 lg:py-2.5 rounded-xl font-bold text-xs lg:text-sm transition-all duration-300 hover:scale-105 shadow-lg ${
                  isScrolled
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:shadow-primary-500/50'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-xl'
                }`}
              >
                <span className="hidden lg:inline">Hubungi Kami</span>
                <span className="lg:hidden">Kontak</span>
                <span>→</span>
              </a>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`xl:hidden ${
                  isScrolled ? 'text-gray-800 bg-gray-50' : 'text-white bg-white/10'
                } p-2 md:p-3 rounded-xl transition-all hover:scale-110 backdrop-blur-xl border ${
                  isScrolled ? 'border-gray-200' : 'border-white/20'
                }`}
              >
                {isMobileMenuOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
              </button>
            </div>
          </div>

          {/* Premium Mobile Menu - Responsive */}
          {isMobileMenuOpen && (
            <div className="xl:hidden mt-4 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fadeIn max-h-[70vh] overflow-y-auto">
              <div className="p-3 md:p-4 space-y-1">
                {navItems.map((item, index) => (
                  <div key={index}>
                    <a
                      href={item.href}
                      className="flex items-center gap-2 md:gap-3 text-gray-700 hover:text-primary-600 hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 px-3 md:px-4 py-2.5 md:py-3 rounded-xl transition-all font-semibold text-sm md:text-base"
                      onClick={() => !item.dropdown && setIsMobileMenuOpen(false)}
                    >
                      <span>{item.label}</span>
                    </a>
                    {item.dropdown && (
                      <div className="ml-8 md:ml-10 mt-1 space-y-1">
                        {item.dropdown.map((dropItem, dropIndex) => (
                          <a
                            key={dropIndex}
                            href={dropItem.href}
                            className="block text-gray-600 hover:text-primary-600 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {dropItem.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Mobile Search */}
                <div className="pt-3 mt-3 border-t border-gray-100">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Cari..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-50 text-gray-800 px-4 py-3 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 font-medium text-sm"
                    />
                    <FaSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
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
