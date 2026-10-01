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
import SearchResults from './pages/SearchResults';

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
        <Route path="/privacy" element={<LegalPage pageId="privacy" fallbackTitle="Kebijakan Privasi" />} />
        <Route path="/terms" element={<LegalPage pageId="terms" fallbackTitle="Syarat & Ketentuan" />} />

        {/* Berita */}
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

        <Route path="/proses-akreditasi" element={<DynamicPage />} />
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

        <Route
          path="/layanan/lembaga-inspeksi"
          element={<DynamicPage />}
        />

        <Route
          path="/layanan/lembaga-verifikasi-validasi-grk"
          element={<DynamicPage />}
        />

        <Route
          path="/layanan/penyelenggara-uji-profisiensi"
          element={<DynamicPage />}
        />

        <Route
          path="/layanan/produsen-bahan-acuan"
          element={<DynamicPage />}
        />

        <Route
          path="/layanan/sistem-manajemen"
          element={<DynamicPage />}
        />

        <Route
          path="/layanan/sertifikasi-person"
          element={<DynamicPage />}
        />

        <Route
          path="/layanan/sertifikasi-sni-iso-iec-17065"
          element={<DynamicPage />}
        />

        <Route
          path="/layanan/sertifikasi-pembangunan-berkelanjutan"
          element={<DynamicPage />}
        />

        {/* Dynamic service routes */}
        <Route path="/daftar-layanan/:cat" element={<DynamicPage />} />
        <Route path="/layanan/:cat/:slug" element={<DynamicPage />} />


        {/* =========================================================
            DIREKTORI LPK
        ========================================================= */}

        <Route
          path="/direktori"
          element={<Navigate to="/direktori/semua" replace />}
        />

        <Route path="/direktori/semua" element={<DirectoryPage />} />
        <Route
          path="/direktori/terakreditasi"
          element={<DirectoryPage />}
        />
        <Route
          path="/direktori/akreditasi-dibekukan"
          element={<DirectoryPage />}
        />
        <Route
          path="/direktori/akreditasi-dicabut"
          element={<DirectoryPage />}
        />


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
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/sliders"
          element={
            <ProtectedRoute>
              <SlidersManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/news"
          element={
            <ProtectedRoute>
              <NewsManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/partners"
          element={
            <ProtectedRoute>
              <PartnersManagement />
            </ProtectedRoute>
          }
        />

        <Route path="/admin/faq" 
        element={
          <ProtectedRoute>
            <FaqManagement />
          </ProtectedRoute>} />

        <Route
          path="/admin/pages"
          element={
            <ProtectedRoute>
              <PagesManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/content"
          element={
            <ProtectedRoute>
              <Suspense fallback={<div className="p-10 text-center text-gray-400">Memuat editor...</div>}>
                <ContentManagement />
              </Suspense>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/directory"
          element={
            <ProtectedRoute>
              <DirectoryManagement />
            </ProtectedRoute>
          }
        />

        {/* Documents Management */}
        <Route
          path="/admin/documents"
          element={
            <ProtectedRoute>
              <DocumentManagement />
            </ProtectedRoute>
          }
        />

         <Route
          path="/admin/legal"
          element={
            <ProtectedRoute>
              <LegalManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute>
              <SettingsManagement />
            </ProtectedRoute>
          }
        />

      </Routes>
    </Router>
  );
}

export default App;