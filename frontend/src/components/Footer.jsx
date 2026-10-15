import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaYoutube,
  FaTiktok,
  FaLinkedinIn,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaArrowUp
} from 'react-icons/fa';
import logoKan from '../assets/kan.png';
import { Link } from 'react-router-dom';
import useContactSettings, {
  phoneLink,
  mapsLink,
  gmailLink,
} from '../hooks/useContactSettings';

const SOCIAL_PLATFORMS = [
  { key: 'social_facebook',  icon: FaFacebook,   label: 'Facebook',  hover: 'hover:bg-blue-600' },
  { key: 'social_twitter',   icon: FaTwitter,    label: 'Twitter',   hover: 'hover:bg-sky-500' },
  { key: 'social_instagram', icon: FaInstagram,  label: 'Instagram', hover: 'hover:bg-pink-600' },
  { key: 'social_youtube',   icon: FaYoutube,    label: 'YouTube',   hover: 'hover:bg-red-600' },
  { key: 'social_tiktok',    icon: FaTiktok,     label: 'TikTok',    hover: 'hover:bg-gray-900' },
  { key: 'social_linkedin',  icon: FaLinkedinIn, label: 'LinkedIn',  hover: 'hover:bg-blue-700' },
];

// Kotak abu-abu yang tampil selama data kontak dimuat
const ContactSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="w-11/12 h-4 rounded bg-white/10"></div>
    <div className="w-2/3 h-4 rounded bg-white/10"></div>
    <div className="w-3/4 h-4 rounded bg-white/10"></div>
  </div>
);

const Footer = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || i18n.language || 'id').startsWith('en')
    ? 'en'
    : 'id';

  const [logoUrl, setLogoUrl] = useState(null);
  const [socialLinks, setSocialLinks] = useState({});
  const contact = useContactSettings(lang);

  const { loaded, address, emails, phones } = contact;
  const rowCount = Math.max(emails.length, phones.length);

  useEffect(() => {
    fetch('/api/v1/settings?group=general')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data?.site_logo) {
          setLogoUrl(data.data.site_logo);
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

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <footer className="relative overflow-hidden text-white bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 rounded-full w-96 h-96 bg-primary-500 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 rounded-full w-96 h-96 bg-accent-500 blur-3xl"></div>
      </div>

      {/* Main Footer */}
      <div className="container relative z-10 px-4 py-12 sm:px-6 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">

          {/* About Column */}
          <div className="md:col-span-2 lg:col-span-1">

            <div className="flex items-center mb-6">
              <img
                src={logoUrl || logoKan}
                alt="Logo KAN"
                className="object-contain w-auto h-12 md:h-14"
              />
            </div>

            <p className="max-w-md mb-6 text-sm leading-relaxed text-gray-400">
              Lembaga akreditasi nasional yang terpercaya dan diakui secara
              internasional untuk mendukung daya saing nasional.
            </p>

            {/* Social Media — hanya tampil jika URL diisi di admin */}
            <div className="grid grid-cols-3 gap-2 w-fit">
              {SOCIAL_PLATFORMS.filter(p => socialLinks[p.key]?.trim()).map(p => {
                const Icon = p.icon;
                return (
                  <a
                    key={p.key}
                    href={socialLinks[p.key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={p.label}
                    className={`relative flex items-center justify-center w-10 h-10 transition-all duration-300 rounded-lg group bg-white/10 backdrop-blur-sm ${p.hover}`}
                  >
                    <Icon
                      size={18}
                      className="transition-transform group-hover:scale-110"
                    />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="flex items-center gap-2 mb-6 text-lg font-black md:text-xl">
              <span className="w-1 h-6 rounded-full bg-primary-600"></span>{' '}
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
                    className="flex items-center gap-2 text-sm text-gray-400 transition-all group hover:text-white md:text-base"
                  >
                    <span className="w-0 h-0.5 group-hover:w-2 bg-primary-600 transition-all rounded-full"></span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="flex items-center gap-2 mb-6 text-lg font-black md:text-xl">
              <span className="w-1 h-6 rounded-full bg-primary-600"></span>{' '}
              Kontak
            </h3>

            {!loaded ? (
              <ContactSkeleton />
            ) : (
              <ul className="space-y-4 text-sm">
                {/* Alamat -> Google Maps */}
                {address && (
                  <li>
                    <a
                      href={mapsLink(address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 group"
                    >
                      <FaMapMarkerAlt className="flex-shrink-0 mt-1 transition-transform text-primary-500 group-hover:scale-110" />
                      <span className="text-gray-400 whitespace-pre-line transition-colors group-hover:text-white">
                        {address}
                      </span>
                    </a>
                  </li>
                )}

                {/* Email & telepon: dipasangkan berurutan */}
                {Array.from({ length: rowCount }).map((_, i) => {
                  const mail = emails[i];
                  const tel = phones[i];
                  const label = mail?.label || tel?.label;
                  const phone = tel ? phoneLink(tel.value) : null;

                  return (
                    <li key={i}>
                      {label && (
                        <span className="block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                          {label}
                        </span>
                      )}

                      <ul className="space-y-2">
                        {/* Email -> Gmail */}
                        {mail && (
                          <li>
                            <a
                              href={gmailLink(mail.value)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 group"
                            >
                              <FaEnvelope className="flex-shrink-0 transition-transform text-primary-500 group-hover:scale-110" />
                              <span className="text-gray-400 break-all transition-colors group-hover:text-white">
                                {mail.value}
                              </span>
                            </a>
                          </li>
                        )}

                        {/* Telepon -> WhatsApp (nomor HP) / aplikasi telepon (nomor kantor) */}
                        {tel && (
                          <li>
                            <a
                              href={phone.href}
                              target={phone.isWa ? '_blank' : undefined}
                              rel={phone.isWa ? 'noopener noreferrer' : undefined}
                              className="flex items-center gap-3 group"
                            >
                              <FaPhone className="flex-shrink-0 transition-transform text-primary-500 group-hover:scale-110" />
                              <span className="text-gray-400 transition-colors group-hover:text-white">
                                {tel.value}
                              </span>
                            </a>
                          </li>
                        )}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Motto */}
          <div className="lg:pr-4 lg:text-right">
            <p className="text-xl font-black leading-snug md:text-2xl">
              Akreditasi Memastikan Kompetensi dan Membangun Kepercayaan
            </p>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container px-4 py-6 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-gray-400 md:flex-row">

            <p className="text-center md:text-left">
              {`© ${new Date().getFullYear()} KAN - Komite Akreditasi Nasional. All rights reserved.`}
            </p>

            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              <Link to="/privacy" className="transition-colors hover:text-white">
                Kebijakan Privasi
              </Link>

              <Link to="/terms" className="transition-colors hover:text-white">
                Syarat & Ketentuan
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className="fixed z-50 flex items-center justify-center w-12 h-12 text-white transition-all duration-300 rounded-full shadow-2xl bottom-8 right-8 md:w-14 md:h-14 bg-gradient-to-br from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 hover:scale-110 hover:shadow-primary-500/50 group"
        aria-label="Scroll to top"
      >
        <FaArrowUp className="transition-transform group-hover:-translate-y-1" />
      </button>

    </footer>
  );
};

export default Footer;
