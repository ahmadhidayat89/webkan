import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FaHome, FaNewspaper, FaUsers, FaCog, FaImages,
  FaSignOutAlt, FaChartBar, FaEdit, FaBuilding,
  FaEnvelope, FaQuestionCircle, FaSitemap, FaShareAlt,
  FaUserShield, FaChevronDown, FaClipboardList,
} from 'react-icons/fa';
import { getMe, logout } from '../../services/api';
import { getStoredSiteLogo, setStoredSiteLogo, SITE_LOGO_UPDATED_EVENT } from '../../utils/siteLogo';

const MENU_GROUPS = [
  {
    key: 'utama',
    label: 'Utama',
    items: [
      { path: '/admin/dashboard', icon: FaChartBar, label: 'Dashboard', roles: null },
    ],
  },
  {
    key: 'konten',
    label: 'Konten',
    items: [
      { path: '/admin/news',    icon: FaNewspaper, label: 'Berita & Pengumuman', roles: ['super_admin', 'admin', 'sosmed_admin'] },
      { path: '/admin/content', icon: FaEdit,      label: 'Konten Halaman',      roles: ['super_admin', 'admin', 'sosmed_admin'] },
      { path: '/admin/menu',    icon: FaSitemap,   label: 'Kelola Menu',         roles: ['super_admin', 'admin'] },
      { path: '/admin/sliders', icon: FaImages,    label: 'Sliders',             roles: ['super_admin', 'admin', 'sosmed_admin'] },
    ],
  },
  {
    key: 'media',
    label: 'Media & Mitra',
    items: [
      { path: '/admin/directory', icon: FaBuilding,       label: 'Direktori LPK', roles: ['super_admin', 'admin'] },
      { path: '/admin/partners',  icon: FaUsers,          label: 'Partners',      roles: ['super_admin', 'admin'] },
      { path: '/admin/faqs',                icon: FaQuestionCircle, label: 'FAQ',                roles: ['super_admin', 'admin'] },
      { path: '/admin/accreditation-steps', icon: FaClipboardList,  label: 'Proses Akreditasi',  roles: ['super_admin', 'admin'] },
      { path: '/admin/sosmed',    icon: FaShareAlt,       label: 'Media Sosial',  roles: ['super_admin', 'sosmed_admin'] },
    ],
  },
  {
    key: 'sistem',
    label: 'Sistem',
    items: [
      { path: '/admin/contacts', icon: FaEnvelope,   label: 'Pesan Masuk', roles: ['super_admin', 'admin'] },
      { path: '/admin/users',    icon: FaUserShield, label: 'Kelola User', roles: ['super_admin', 'admin'] },
      { path: '/admin/settings', icon: FaCog,        label: 'Settings',    roles: ['super_admin'] },
    ],
  },
];

const ROLE_DISPLAY = {
  super_admin:  'Super Admin',
  admin:        'Admin',
  sosmed_admin: 'Sosmed Admin',
};

const AdminLayout = ({ children }) => {
  const [userRole, setUserRole]     = useState(null);
  const [userName, setUserName]     = useState('');
  const [logoUrl,  setLogoUrl]      = useState(() => getStoredSiteLogo());
  const [openGroups,     setOpenGroups]     = useState({});
  const [headerDropdown, setHeaderDropdown] = useState(false);
  const [loggingOut,     setLoggingOut]     = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();

  const filterItems = (items) =>
    items.filter(item => item.roles === null || (userRole && item.roles.includes(userRole)));

  const visibleGroups = MENU_GROUPS.map(group => ({
    ...group,
    items: filterItems(group.items),
  })).filter(group => group.items.length > 0);

  // Tutup header dropdown saat klik di luar
  useEffect(() => {
    if (!headerDropdown) return;
    const close = () => setHeaderDropdown(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [headerDropdown]);

  // Auto-open group yang berisi halaman aktif
  useEffect(() => {
    const updates = {};
    visibleGroups.forEach(group => {
      if (group.items.some(item => item.path === location.pathname)) {
        updates[group.key] = true;
      }
    });
    if (Object.keys(updates).length > 0) {
      setOpenGroups(prev => ({ ...prev, ...updates }));
    }
  }, [location.pathname, userRole]);

  useEffect(() => {
    getMe()
      .then(res => {
        const user = res.data?.data;
        setUserRole(user?.role || 'admin');
        setUserName(user?.name || '');
      })
      .catch(() => {});

    fetch('/api/v1/settings?group=general')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data?.site_logo) {
          setLogoUrl(data.data.site_logo);
          setStoredSiteLogo(data.data.site_logo);
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

  const toggleGroup = (key) =>
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try { await logout(); } catch {}
    finally {
      localStorage.removeItem('user');
      navigate('/admin/login');
    }
  };

  const currentLabel = MENU_GROUPS
    .flatMap(g => g.items)
    .find(item => item.path === location.pathname)?.label || 'Dashboard';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Sidebar ── */}
      <aside className="w-64 bg-gradient-to-b from-[#1e3a8a] via-[#1e40af] to-[#1e3a8a] text-white fixed h-screen z-40 shadow-2xl flex flex-col">

        {/* Logo */}
        <div className="px-4 py-4 border-b border-white/10 flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center overflow-hidden shadow-md flex-shrink-0">
            {logoUrl
              ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-0.5" />
              : <span className="font-black text-primary-700 text-xs">KAN</span>
            }
          </div>
          <div className="min-w-0">
            <div className="font-black text-sm leading-tight">Admin Panel</div>
            <div className="text-[10px] text-white/50 truncate">Komite Akreditasi</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {visibleGroups.map(group => {
            const isUtama = group.key === 'utama';
            return (
              <div key={group.key}>
                {isUtama ? (
                  // Dashboard — tanpa accordion
                  group.items.map(item => {
                    const Icon = item.icon;
                    const active = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${
                          active
                            ? 'bg-white/20 text-white'
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Icon className="text-sm flex-shrink-0" />
                        <span className="text-[11px] font-semibold flex-1">{item.label}</span>
                        {active && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />}
                      </Link>
                    );
                  })
                ) : (
                  <>
                    {/* Accordion header */}
                    <button
                      onClick={() => toggleGroup(group.key)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all"
                    >
                      <span className="text-[9px] font-bold tracking-widest uppercase text-white/70 flex-1 text-left">
                        {group.label}
                      </span>
                      <FaChevronDown
                        className={`text-white/50 text-[9px] flex-shrink-0 transition-transform duration-200 ${
                          openGroups[group.key] ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Accordion items */}
                    {openGroups[group.key] && (
                      <div className="pl-2 mt-0.5 space-y-0.5">
                        {group.items.map(item => {
                          const Icon = item.icon;
                          const active = location.pathname === item.path;
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${
                                active
                                  ? 'bg-white/20 text-white'
                                  : 'text-white/80 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              <Icon className="text-sm flex-shrink-0" />
                              <span className="text-[11px] font-medium flex-1 truncate">{item.label}</span>
                              {active && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </nav>

        {/* Profile + Actions */}
        <div className="border-t border-white/10 p-3 flex-shrink-0 space-y-2">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/10">
            <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {userName ? userName.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold text-white truncate">{userName || 'Admin'}</div>
              <div className="text-[9px] text-white/40">{userRole ? (ROLE_DISPLAY[userRole] ?? userRole) : '...'}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to="/"
              target="_blank"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-all text-[10px] font-semibold"
            >
              <FaHome className="text-xs" /> Lihat Web
            </Link>
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-white/60 hover:bg-red-500/20 hover:text-red-300 transition-all text-[10px] font-semibold"
            >
              <FaSignOutAlt className="text-xs" />
              {loggingOut ? 'Keluar...' : 'Logout'}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 ml-64">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-gray-900">{currentLabel}</h1>
              <p className="text-xs text-gray-400 mt-0.5">Panel administrasi KAN</p>
            </div>
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setHeaderDropdown(prev => !prev); }}
                className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {userName ? userName.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="min-w-0 text-left">
                  <div className="text-xs font-bold text-gray-900 truncate max-w-[120px]">{userName || 'Admin'}</div>
                  <div className="text-[10px] text-gray-400">{userRole ? (ROLE_DISPLAY[userRole] ?? userRole) : '...'}</div>
                </div>
                <FaChevronDown className={`text-gray-400 text-[9px] flex-shrink-0 transition-transform duration-200 ${headerDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown menu */}
              {headerDropdown && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                  <Link
                    to="/"
                    target="_blank"
                    onClick={() => setHeaderDropdown(false)}
                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FaHome className="text-gray-400 text-xs" /> Lihat Website
                  </Link>
                  <div className="mx-3 border-t border-gray-100" />
                  <button
                    onClick={() => { setHeaderDropdown(false); handleLogout(); }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <FaSignOutAlt className="text-xs" />
                    {loggingOut ? 'Keluar...' : 'Logout'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
