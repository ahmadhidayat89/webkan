import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaHome, FaNewspaper, FaUsers, FaCog, FaImages, FaBars, FaTimes, FaSignOutAlt, FaChartBar, FaEdit, FaBuilding } from 'react-icons/fa';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/admin/dashboard', icon: FaChartBar, label: 'Dashboard' },
    { path: '/admin/news', icon: FaNewspaper, label: 'Berita & Pengumuman' },
    { path: '/admin/content', icon: FaEdit, label: 'Konten Halaman' },
    { path: '/admin/directory', icon: FaBuilding, label: 'Direktori LPK' },
    { path: '/admin/sliders', icon: FaImages, label: 'Sliders' },
    { path: '/admin/partners', icon: FaUsers, label: 'Partners' },
    { path: '/admin/settings', icon: FaCog, label: 'Settings' },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/admin/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      navigate('/admin/login');
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gradient-to-b from-primary-900 via-primary-800 to-primary-900 text-white transition-all duration-300 fixed h-screen z-40 shadow-2xl`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            {sidebarOpen ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-xl rounded-lg flex items-center justify-center font-black text-xl">
                  KAN
                </div>
                <div>
                  <div className="font-black text-lg">Admin Panel</div>
                  <div className="text-xs text-white/60">Komite Akreditasi</div>
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center font-black">
                K
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white/80 hover:text-white transition-colors ml-2"
            >
              {sidebarOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-180px)]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                  active
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className={`text-xl ${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
                {sidebarOpen && (
                  <span className="font-semibold">{item.label}</span>
                )}
                {active && sidebarOpen && (
                  <span className="ml-auto w-2 h-2 bg-accent-400 rounded-full animate-pulse"></span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-primary-900/50 backdrop-blur-xl">
          <Link
            to="/"
            target="_blank"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all mb-2 ${
              !sidebarOpen && 'justify-center'
            }`}
          >
            <FaHome className="text-xl" />
            {sidebarOpen && <span className="font-semibold">Lihat Website</span>}
          </Link>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-all ${
              !sidebarOpen && 'justify-center'
            }`}
          >
            <FaSignOutAlt className="text-xl" />
            {sidebarOpen && <span className="font-semibold">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`flex-1 ${
          sidebarOpen ? 'ml-64' : 'ml-20'
        } transition-all duration-300`}
      >
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-gray-900">
                {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">Manage your content and settings</p>
            </div>

            <div className="flex items-center gap-4">
              {/* User Info */}
              <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center text-white font-bold">
                  A
                </div>
                <div>
                  <div className="font-bold text-sm text-gray-900">Admin</div>
                  <div className="text-xs text-gray-500">Super Admin</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
