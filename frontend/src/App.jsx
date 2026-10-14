import SocialMediaManagement from './pages/admin/SocialMediaManagement';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Contact from './pages/Contact';
import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
import FaqManagement from './pages/admin/FaqManagement';
import DynamicPage from './pages/DynamicPage';
import DirectoryPage from './pages/DirectoryPage';
import DocumentPage from './pages/DocumentPage';

import AdminLogin from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import NewsManagement from './pages/admin/NewsManagement';
import PartnersManagement from './pages/admin/PartnersManagement';
import PagesManagement from './pages/admin/PagesManagement';
import SettingsManagement from './pages/admin/SettingsManagement';
import SlidersManagement from './pages/admin/SlidersManagement';
const ContentManagement = lazy(() => import('./pages/admin/ContentManagement'));
import DirectoryManagement from './pages/admin/DirectoryManagement';
import DocumentManagement from './pages/admin/DocumentManagement';
import AutoPageTranslator from './components/AutoPageTranslator';

import ProtectedRoute from './components/admin/ProtectedRoute';
import LegalManagement from './pages/admin/LegalManagement';
import LegalPage from './pages/LegalPage';
import FAQPage from './pages/FAQPage';
import SearchResults from './pages/SearchResults';
import UserManagement from './pages/admin/UserManagement';
import ContactInbox from './pages/admin/ContactInbox';
import MenuManagement from './pages/admin/MenuManagement';
import AccreditationStepsManagement from './pages/admin/AccreditationStepsManagement';

import SurveyManagement from './pages/admin/SurveyManagement';
import PublicSurvey from './pages/PublicSurvey';

// Proses Akreditasi
import ProsesAkreditasi from './pages/ProsesAkreditasi';

import CustomPage from './pages/CustomPage';

import './App.css';

function App() {
  return (
    <Router>
      <AutoPageTranslator />

      <Routes>

        {/* =========================================================
            PUBLIC ROUTES
        ========================================================= */}

        <Route path="/" element={<Home />} />
        <Route path="/tentang-kan" element={<About />} />
        <Route path="/layanan" element={<Services />} />
        <Route path="/kontak" element={<Contact />} />

        <Route
          path="/privacy"
          element={
            <LegalPage
              pageId="privacy"
              fallbackTitle="Kebijakan Privasi"
            />
          }
        />

        <Route
          path="/terms"
          element={
            <LegalPage
              pageId="terms"
              fallbackTitle="Syarat & Ketentuan"
            />
          }
        />


        {/* =========================================================
            BERITA
        ========================================================= */}

        <Route path="/berita" element={<News />} />
        <Route path="/berita/:slug" element={<NewsDetail />} />


        {/* =========================================================
            TENTANG KAN
        ========================================================= */}

        <Route path="/sejarah-fungsi" element={<DynamicPage />} />
        <Route path="/struktur-organisasi" element={<DynamicPage />} />
        <Route path="/ketidakberpihakan" element={<DynamicPage />} />
        <Route path="/pengakuan-internasional" element={<DynamicPage />} />
        <Route path="/anggota-kan" element={<DynamicPage />} />
        <Route path="/maklumat-layanan" element={<DynamicPage />} />
        <Route path="/standar-layanan" element={<DynamicPage />} />


        {/* =========================================================
            PROSES AKREDITASI
        ========================================================= */}

        {/* Khusus Proses Akreditasi menggunakan halaman dedicated */}
        <Route path="/proses-akreditasi" element={<ProsesAkreditasi />} />

        <Route path="/tarif-akreditasi" element={<DynamicPage />} />
        <Route path="/penanganan-komplain" element={<DynamicPage />} />
        <Route path="/penanganan-banding" element={<DynamicPage />} />
        <Route path="/survey-kepuasan-pelanggan" element={<DynamicPage />} />
        <Route path="/survey-kepuasan-pelanggan/:year" element={<DynamicPage />} />
        <Route path="/hasil-survei" element={<DynamicPage />} />


        {/* =========================================================
            LAYANAN AKREDITASI
        ========================================================= */}

        <Route path="/layanan-akreditasi" element={<DynamicPage />} />
        <Route path="/layanan/laboratorium" element={<DynamicPage />} />
        <Route path="/layanan/laboratorium/:slug" element={<DynamicPage />} />
        <Route path="/daftar-laboratorium" element={<DynamicPage />} />
        <Route path="/layanan/lembaga-inspeksi" element={<DynamicPage />} />
        <Route path="/layanan/lembaga-verifikasi-validasi-grk" element={<DynamicPage />} />
        <Route path="/layanan/penyelenggara-uji-profisiensi" element={<DynamicPage />} />
        <Route path="/layanan/produsen-bahan-acuan" element={<DynamicPage />} />
        <Route path="/layanan/sistem-manajemen" element={<DynamicPage />} />
        <Route path="/layanan/sertifikasi-person" element={<DynamicPage />} />
        <Route path="/layanan/sertifikasi-sni-iso-iec-17065" element={<DynamicPage />} />
        <Route path="/layanan/sertifikasi-pembangunan-berkelanjutan" element={<DynamicPage />} />

        {/* Dynamic service routes */}
        <Route path="/daftar-layanan/:cat" element={<DynamicPage />} />
        <Route path="/layanan/:cat/:slug" element={<DynamicPage />} />


        {/* =========================================================
            DIREKTORI LPK  (tab "Semua" dihapus)
        ========================================================= */}

        <Route
          path="/direktori"
          element={<Navigate to="/direktori/terakreditasi" replace />}
        />

        <Route path="/direktori" element={<Navigate to="/direktori/semua" replace />} />
        <Route path="/direktori/semua" element={<DirectoryPage />} />
        <Route path="/direktori/terakreditasi" element={<DirectoryPage />} />
        <Route path="/direktori/akreditasi-dibekukan" element={<DirectoryPage />} />
        <Route path="/direktori/akreditasi-dicabut" element={<DirectoryPage />} />

        {/* =========================================================
            UNDUH / DOCUMENTS
        ========================================================= */}

        <Route path="/unduh/*" element={<DocumentPage />} />
        <Route path="/cari" element={<SearchResults />} />


        {/* =========================================================
            ADMIN ROUTES
        ========================================================= */}

        <Route path="/admin/login" element={<AdminLogin />} />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute roles={['super_admin', 'admin', 'adminsosmed', 'sosmed_admin']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/sliders"
          element={
            <ProtectedRoute roles={['super_admin', 'admin', 'adminsosmed', 'sosmed_admin']}>
              <SlidersManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/news"
          element={
            <ProtectedRoute roles={['super_admin', 'admin', 'adminsosmed', 'sosmed_admin']}>
              <NewsManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/partners"
          element={
            <ProtectedRoute roles={['super_admin', 'admin']}>
              <PartnersManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/faq"
          element={
            <ProtectedRoute roles={['super_admin', 'admin']}>
              <FaqManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/pages"
          element={
            <ProtectedRoute roles={['super_admin', 'admin']}>
              <PagesManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/content"
          element={
            <ProtectedRoute roles={['super_admin', 'admin', 'adminsosmed', 'sosmed_admin']}>
              <Suspense
                fallback={
                  <div className="p-10 text-center text-gray-400">
                    Memuat editor...
                  </div>
                }
              >
                <ContentManagement />
              </Suspense>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/directory"
          element={
            <ProtectedRoute roles={['super_admin', 'admin']}>
              <DirectoryManagement />
            </ProtectedRoute>
          }
        />

        {/* Documents Management */}
        <Route
          path="/admin/documents"
          element={
            <ProtectedRoute roles={['super_admin']}>
              <DocumentManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/legal"
          element={
            <ProtectedRoute roles={['super_admin', 'admin']}>
              <LegalManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute roles={['super_admin']}>
              <SettingsManagement />
            </ProtectedRoute>
          }
        />

        <Route path="/admin/social-media" element={<SocialMediaManagement />} />

        <Route
          path="/admin/menus"
          element={
            <ProtectedRoute roles={['super_admin', 'admin']}>
              <MenuManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={['super_admin', 'admin']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/contact-submissions"
          element={
            <ProtectedRoute roles={['super_admin', 'admin']}>
              <ContactInbox />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/accreditation-steps"
          element={
            <ProtectedRoute roles={['super_admin', 'admin']}>
              <AccreditationStepsManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/surveys"
          element={
            <ProtectedRoute roles={['super_admin', 'admin']}>
              <SurveyManagement />
            </ProtectedRoute>
          }
        />

        {/* =========================================================
            FAQ
        ========================================================= */}

        <Route path="/faq" element={<FAQPage />} />


        {/* =========================================================
            CUSTOM PAGE
        ========================================================= */}

        <Route path="/survei/:code" element={<PublicSurvey />} />
        
        <Route path="/:slug" element={<CustomPage />} />

      </Routes>
    </Router>
  );
}

export default App;