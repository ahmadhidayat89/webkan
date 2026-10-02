import { useState, useEffect } from 'react';
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube, FaTiktok, FaLinkedinIn, FaPhone, FaEnvelope, FaMapMarkerAlt, FaArrowUp } from 'react-icons/fa';
import { getStoredSiteLogo, setStoredSiteLogo, SITE_LOGO_UPDATED_EVENT } from '../utils/siteLogo';

const SOCIAL_PLATFORMS = [
  { key: 'social_facebook',  icon: FaFacebook,   label: 'Facebook',  hover: 'hover:bg-blue-600' },
  { key: 'social_twitter',   icon: FaTwitter,    label: 'Twitter',   hover: 'hover:bg-sky-500' },
  { key: 'social_instagram', icon: FaInstagram,  label: 'Instagram', hover: 'hover:bg-pink-600' },
  { key: 'social_youtube',   icon: FaYoutube,    label: 'YouTube',   hover: 'hover:bg-red-600' },
  { key: 'social_tiktok',    icon: FaTiktok,     label: 'TikTok',    hover: 'hover:bg-gray-900' },
  { key: 'social_linkedin',  icon: FaLinkedinIn, label: 'LinkedIn',  hover: 'hover:bg-blue-700' },
];

const Footer = () => {
  const [logoUrl, setLogoUrl] = useState(() => getStoredSiteLogo());
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [socialLinks, setSocialLinks] = useState({});

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    fetch('/api/v1/settings?group=general')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data?.site_logo) {
          setLogoUrl(data.data.site_logo);
          setStoredSiteLogo(data.data.site_logo);
        }
      })
      .catch(() => {});

    fetch('/api/v1/settings?group=social')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          setSocialLinks(prev => ({ ...prev, ...data.data }));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleLogoUpdated = (event) => {
      setLogoUrl(event.detail || null);
    };

    window.addEventListener(SITE_LOGO_UPDATED_EVENT, handleLogoUpdated);
    return () => window.removeEventListener(SITE_LOGO_UPDATED_EVENT, handleLogoUpdated);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-500 rounded-full blur-3xl"></div>
      </div>

      {/* Main Footer */}
      <div className="container relative z-10 py-12 md:py-16 lg:py-20 px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* About Column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className={`w-16 h-16 md:w-20 md:h-20 rounded-xl flex items-center justify-center text-white font-black text-xl md:text-2xl shadow-lg overflow-hidden flex-shrink-0 ${
                logoUrl ? 'bg-transparent' : 'bg-gradient-to-br from-primary-600 to-primary-700'
              }`}>
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo KAN" className="w-full h-full object-contain" />
                ) : (
                  'KAN'
                )}
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Lembaga akreditasi nasional yang terpercaya dan diakui secara internasional untuk mendukung daya saing nasional.
            </p>
            
            {/* Social Media — hanya tampil jika diisi */}
            <div className="grid grid-cols-3 gap-2" style={{ width: 'fit-content' }}>
              {SOCIAL_PLATFORMS.filter(p => socialLinks[p.key]?.trim()).map(p => {
                const Icon = p.icon;
                return (
                  <a
                    key={p.key}
                    href={socialLinks[p.key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={p.label}
                    className={`group w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center transition-all duration-300 ${p.hover}`}
                  >
                    <Icon size={16} className="group-hover:scale-110 transition-transform" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg md:text-xl font-black mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary-600 rounded-full"></span>
              Tautan Cepat
            </h3>
            <ul className="space-y-3">
              {[
                { label: 'Tentang KAN', href: '/tentang-kan' },
                { label: 'Proses Akreditasi', href: '/proses-akreditasi' },
                { label: 'Layanan', href: '/layanan' },
                { label: 'Direktori LPK', href: '/direktori' },
                { label: 'Berita & Pengumuman', href: '/berita' }
              ].map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href} 
                    className="group text-gray-400 hover:text-white transition-all flex items-center gap-2 text-sm md:text-base"
                  >
                    <span className="w-0 group-hover:w-2 h-0.5 bg-primary-600 transition-all rounded-full"></span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg md:text-xl font-black mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary-600 rounded-full"></span>
              Kontak
            </h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3 group">
                <FaMapMarkerAlt className="text-primary-500 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-gray-400 group-hover:text-white transition-colors">
                  Jl. Kuningan Barat Raya, No. 01A<br />
                  Jakarta Selatan 12710
                </span>
              </li>
              <li className="flex items-center gap-3 group">
                <FaPhone className="text-primary-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <a href="tel:081388636959" className="text-gray-400 hover:text-white transition-colors">
                  081388636959
                </a>
              </li>
              <li className="flex items-center gap-3 group">
                <FaEnvelope className="text-primary-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <a href="mailto:laboratorium@bsn.go.id" className="text-gray-400 hover:text-white transition-colors break-all">
                  laboratorium@bsn.go.id
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg md:text-xl font-black mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary-600 rounded-full"></span>
              Newsletter
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Dapatkan update terbaru tentang akreditasi dan regulasi
            </p>
            <form className="space-y-3">
              <input
                type="email"
                placeholder="Email Anda"
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:outline-none focus:border-primary-600 focus:bg-white/20 transition-all text-sm placeholder-gray-500"
              />
              <button
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-lg font-bold text-sm transition-all hover:scale-105 shadow-lg hover:shadow-primary-500/50"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container py-6 px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <p className="text-center md:text-left">
              {`© ${new Date().getFullYear()} KAN - Komite Akreditasi Nasional. All rights reserved.`}
            </p>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              <a href="/privacy" className="hover:text-white transition-colors">
                Kebijakan Privasi
              </a>
              <a href="/terms" className="hover:text-white transition-colors">
                Syarat & Ketentuan
              </a>
              <a href="/sitemap" className="hover:text-white transition-colors">
                Sitemap
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className={`fixed bottom-8 right-8 z-50 w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-all duration-300 hover:shadow-primary-500/50 group
          ${showScrollTop ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      >
        <FaArrowUp className="group-hover:-translate-y-1 transition-transform" />
      </button>
    </footer>
  );
};

export default Footer;
