import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const LANGUAGE_STORAGE_KEY = 'kan_language';

const getInitialLanguage = () => {
  if (typeof window === 'undefined') return 'id';
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === 'en' || stored === 'id' ? stored : 'id';
};

const resources = {
  id: {
    translation: {
      // Navigation
      'nav.home': 'Beranda',
      'nav.about': 'Tentang KAN',
      'nav.accreditation': 'Akreditasi',
      'nav.services': 'Layanan',
      'nav.directory': 'Direktori LPK',
      'nav.download': 'Unduh',
      'nav.contact': 'Kontak',
      
      // Homepage
      'home.welcome': 'Selamat Datang di',
      'home.subtitle': 'Lembaga Akreditasi Nasional Terpercaya',
      'home.latest_news': 'Berita Terbaru',
      'home.view_all': 'Lihat Semua',
      'home.read_more': 'Baca Selengkapnya',
      'home.quick_links': 'Akses Cepat',
      'home.partners': 'Kemitraan dan Kerjasama',
      
      // Footer
      'footer.about': 'Tentang Kami',
      'footer.contact': 'Hubungi Kami',
      'footer.social': 'Ikuti Kami',
      'footer.copyright': '© 2024 Komite Akreditasi Nasional. Hak Cipta Dilindungi.',
      
      // Common
      'common.search': 'Cari...',
      'common.loading': 'Memuat...',
      'common.error': 'Terjadi kesalahan',
    }
  },
  en: {
    translation: {
      // Navigation
      'nav.home': 'Home',
      'nav.about': 'About KAN',
      'nav.accreditation': 'Accreditation',
      'nav.services': 'Services',
      'nav.directory': 'Directory',
      'nav.download': 'Download',
      'nav.contact': 'Contact',
      
      // Homepage
      'home.welcome': 'Welcome to',
      'home.subtitle': 'Trusted National Accreditation Body',
      'home.latest_news': 'Latest News',
      'home.view_all': 'View All',
      'home.read_more': 'Read More',
      'home.quick_links': 'Quick Links',
      'home.partners': 'Partnership and Cooperation',
      
      // Footer
      'footer.about': 'About Us',
      'footer.contact': 'Contact Us',
      'footer.social': 'Follow Us',
      'footer.copyright': '© 2024 National Accreditation Committee. All Rights Reserved.',
      
      // Common
      'common.search': 'Search...',
      'common.loading': 'Loading...',
      'common.error': 'An error occurred',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'id',
    interpolation: {
      escapeValue: false
    }
  });

i18n.on('languageChanged', (lng) => {
  if (typeof window === 'undefined') return;
  if (lng === 'id' || lng === 'en') {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
  }
});

export default i18n;
