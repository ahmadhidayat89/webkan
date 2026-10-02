import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import ProsesAkreditasi from './pages/ProsesAkreditasi';
import Contact from './pages/Contact';
import FAQPage from './pages/FAQ';
import NewsDetail from './pages/NewsDetail';
import NewsList from './pages/NewsList';
import DynamicPage from './pages/DynamicPage';
import DirectoryPage from './pages/DirectoryPage';
import AdminLogin from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import NewsManagement from './pages/admin/NewsManagement';
import PartnersManagement from './pages/admin/PartnersManagement';
import FAQManagement from './pages/admin/FAQManagement';
import AccreditationStepsManagement from './pages/admin/AccreditationStepsManagement';
import SettingsManagement from './pages/admin/SettingsManagement';
import SlidersManagement from './pages/admin/SlidersManagement';
import ContentManagement from './pages/admin/ContentManagement';
import DirectoryManagement from './pages/admin/DirectoryManagement';
import ContactManagement from './pages/admin/ContactManagement';
import MenuManagement from './pages/admin/MenuManagement';
import SosmedManagement from './pages/admin/SosmedManagement';
import UserManagement from './pages/admin/UserManagement';
import SearchResults from './pages/SearchResults';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/admin/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { borderRadius: '12px', fontWeight: 600, fontSize: '14px' },
          success: { style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' } },
          error:   { style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' } },
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/tentang-kan" element={<About />} />
        <Route path="/layanan" element={<Services />} />
        <Route path="/kontak" element={<Contact />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/berita" element={<NewsList />} />
        <Route path="/berita/:slug" element={<NewsDetail />} />
        <Route path="/cari" element={<SearchResults />} />
        
        {/* Tentang KAN Submenus - Dynamic Pages */}
        <Route path="/sejarah-fungsi" element={<DynamicPage />} />
        <Route path="/struktur-organisasi" element={<DynamicPage />} />
        <Route path="/ketidakberpihakan" element={<DynamicPage />} />
        <Route path="/pengakuan-internasional" element={<DynamicPage />} />
        <Route path="/anggota-kan" element={<DynamicPage />} />
        <Route path="/maklumat-layanan" element={<DynamicPage />} />
        <Route path="/standar-layanan" element={<DynamicPage />} />
        
        {/* Proses Akreditasi Submenus - Dynamic Pages */}
        <Route path="/proses-akreditasi" element={<ProsesAkreditasi />} />
        <Route path="/tarif-akreditasi" element={<DynamicPage />} />
        <Route path="/penanganan-komplain" element={<DynamicPage />} />
        <Route path="/penanganan-banding" element={<DynamicPage />} />
        <Route path="/survey-kepuasan-pelanggan" element={<DynamicPage />} />

        {/* Layanan Akreditasi Submenus - Dynamic Pages */}
        <Route path="/layanan/laboratorium" element={<DynamicPage />} />
        <Route path="/layanan/lembaga-inspeksi" element={<DynamicPage />} />
        <Route path="/layanan/lembaga-verifikasi-validasi-grk" element={<DynamicPage />} />
        <Route path="/layanan/penyelenggara-uji-profisiensi" element={<DynamicPage />} />
        <Route path="/layanan/produsen-bahan-acuan" element={<DynamicPage />} />
        <Route path="/layanan/sistem-manajemen" element={<DynamicPage />} />
        <Route path="/layanan/sertifikasi-person" element={<DynamicPage />} />
        <Route path="/layanan/sertifikasi-sni-iso-iec-17065" element={<DynamicPage />} />
        <Route path="/layanan/sertifikasi-pembangunan-berkelanjutan" element={<DynamicPage />} />

        {/* Direktori LPK Submenus */}
        <Route path="/direktori" element={<Navigate to="/direktori/semua" replace />} />
        <Route path="/direktori/semua" element={<DirectoryPage />} />
        <Route path="/direktori/terakreditasi" element={<DirectoryPage />} />
        <Route path="/direktori/akreditasi-dibekukan" element={<DirectoryPage />} />
        <Route path="/direktori/akreditasi-dicabut" element={<DirectoryPage />} />

        {/* Unduh Submenus */}
        <Route path="/unduh" element={<Navigate to="/unduh/dokumen-akreditasi" replace />} />
        <Route path="/unduh/dokumen-akreditasi" element={<DynamicPage />} />
        <Route path="/unduh/materi-kegiatan" element={<DynamicPage />} />
        <Route path="/unduh/artikel-penilaian-kesesuaian" element={<DynamicPage />} />
        <Route path="/unduh/dokumen-internasional" element={<DynamicPage />} />

        {/* Dynamic pages (admin-created) */}
        <Route path="/:slug" element={<DynamicPage />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/sliders" element={<ProtectedRoute roles={['super_admin', 'admin', 'sosmed_admin']}><SlidersManagement /></ProtectedRoute>} />
        <Route path="/admin/news" element={<ProtectedRoute roles={['super_admin', 'admin', 'sosmed_admin']}><NewsManagement /></ProtectedRoute>} />
        <Route path="/admin/partners" element={<ProtectedRoute roles={['super_admin', 'admin']}><PartnersManagement /></ProtectedRoute>} />
        <Route path="/admin/faqs" element={<ProtectedRoute roles={['super_admin', 'admin']}><FAQManagement /></ProtectedRoute>} />
        <Route path="/admin/accreditation-steps" element={<ProtectedRoute roles={['super_admin', 'admin']}><AccreditationStepsManagement /></ProtectedRoute>} />
        <Route path="/admin/content" element={<ProtectedRoute roles={['super_admin', 'admin', 'sosmed_admin']}><ContentManagement /></ProtectedRoute>} />
        <Route path="/admin/directory" element={<ProtectedRoute roles={['super_admin', 'admin']}><DirectoryManagement /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute roles={['super_admin']}><SettingsManagement /></ProtectedRoute>} />
        <Route path="/admin/contacts" element={<ProtectedRoute roles={['super_admin', 'admin']}><ContactManagement /></ProtectedRoute>} />
        <Route path="/admin/menu" element={<ProtectedRoute roles={['super_admin', 'admin']}><MenuManagement /></ProtectedRoute>} />
        <Route path="/admin/sosmed" element={<ProtectedRoute roles={['super_admin', 'sosmed_admin']}><SosmedManagement /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['super_admin', 'admin']}><UserManagement /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
