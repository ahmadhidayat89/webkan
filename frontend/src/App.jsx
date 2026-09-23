import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Contact from './pages/Contact';
import NewsDetail from './pages/NewsDetail';
import DynamicPage from './pages/DynamicPage';
import DirectoryPage from './pages/DirectoryPage';
import AdminLogin from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import NewsManagement from './pages/admin/NewsManagement';
import PartnersManagement from './pages/admin/PartnersManagement';
import PagesManagement from './pages/admin/PagesManagement';
import SettingsManagement from './pages/admin/SettingsManagement';
import SlidersManagement from './pages/admin/SlidersManagement';
import ContentManagement from './pages/admin/ContentManagement';
import DirectoryManagement from './pages/admin/DirectoryManagement';
import ProtectedRoute from './components/admin/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/tentang-kan" element={<About />} />
        <Route path="/layanan" element={<Services />} />
        <Route path="/kontak" element={<Contact />} />
        <Route path="/berita/:slug" element={<NewsDetail />} />
        
        {/* Tentang KAN Submenus - Dynamic Pages */}
        <Route path="/sejarah-fungsi" element={<DynamicPage />} />
        <Route path="/struktur-organisasi" element={<DynamicPage />} />
        <Route path="/ketidakberpihakan" element={<DynamicPage />} />
        <Route path="/pengakuan-internasional" element={<DynamicPage />} />
        <Route path="/anggota-kan" element={<DynamicPage />} />
        <Route path="/maklumat-layanan" element={<DynamicPage />} />
        <Route path="/standar-layanan" element={<DynamicPage />} />
        
        {/* Proses Akreditasi Submenus - Dynamic Pages */}
        <Route path="/proses-akreditasi" element={<DynamicPage />} />
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

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/sliders" element={<ProtectedRoute><SlidersManagement /></ProtectedRoute>} />
        <Route path="/admin/news" element={<ProtectedRoute><NewsManagement /></ProtectedRoute>} />
        <Route path="/admin/partners" element={<ProtectedRoute><PartnersManagement /></ProtectedRoute>} />
        <Route path="/admin/pages" element={<ProtectedRoute><PagesManagement /></ProtectedRoute>} />
        <Route path="/admin/content" element={<ProtectedRoute><ContentManagement /></ProtectedRoute>} />
        <Route path="/admin/directory" element={<ProtectedRoute><DirectoryManagement /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute><SettingsManagement /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
