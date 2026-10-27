import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FaHome,
  FaNewspaper,
  FaUsers,
  FaCog,
  FaImages,
  FaSignOutAlt,
  FaChartBar,
  FaEdit,
  FaBuilding,
  FaFileAlt,
  FaQuestionCircle,
  FaShieldAlt,
  FaChevronDown,
  FaEnvelope,
  FaUserCog,
  FaLink,
  FaClipboardCheck,
  FaClipboardList,
} from 'react-icons/fa';
import { getMe, logout } from '../../services/api';
import kanLogo from '../../assets/kan.png';

const MENU_GROUPS = [
  {
    key: 'utama',
    label: 'Utama',
    items: [
      {
        path: '/admin/dashboard',
        icon: FaChartBar,
        label: 'Dashboard',
        roles: ['super_admin', 'admin', 'adminsosmed', 'sosmed_admin'],
      },
    ],
  },
  {
    key: 'konten',
    label: 'Konten',
    items: [
      {
        path: '/admin/news',
        icon: FaNewspaper,
        label: 'Berita & Pengumuman',
        roles: ['super_admin', 'admin', 'adminsosmed', 'sosmed_admin'],
      },
      {
        path: '/admin/content',
        icon: FaEdit,
        label: 'Konten Halaman',
        roles: ['super_admin', 'admin', 'adminsosmed', 'sosmed_admin'],
      },
      {
        path: '/admin/pages',
        icon: FaFileAlt,
        label: 'Kelola Halaman',
        roles: ['super_admin', 'admin'],
      },
      {
        path: '/admin/menus',
        icon: FaLink,
        label: 'Kelola Menu',
        roles: ['super_admin', 'admin'],
      },
      {
        path: '/admin/sliders',
        icon: FaImages,
        label: 'Sliders',
        roles: ['super_admin', 'admin', 'adminsosmed', 'sosmed_admin'],
      },
    ],
  },
  {
    key: 'media',
    label: 'Media & Mitra',
    items: [
      {
        path: '/admin/directory',
        icon: FaBuilding,
        label: 'Direktori LPK',
        roles: ['super_admin', 'admin'],
      },
      {
        path: '/admin/accreditation-steps',
        icon: FaClipboardCheck,
        label: 'Proses Akreditasi',
        roles: ['super_admin', 'admin'],
      },
      {
        path: '/admin/documents',
        icon: FaFileAlt,
        label: 'Unduh Dokumen',
        roles: ['super_admin'],
      },
      {
        path: '/admin/partners',
        icon: FaUsers,
        label: 'Partners',
        roles: ['super_admin', 'admin'],
      },
      {
        path: '/admin/faq',
        icon: FaQuestionCircle,
        label: 'FAQ',
        roles: ['super_admin', 'admin'],
      },
      {
        path: '/admin/surveys',
        icon: FaClipboardList,
        label: 'Kuesioner',
        roles: ['super_admin', 'admin'],
      },
      {
        path: '/admin/legal',
        icon: FaShieldAlt,
        label: 'Halaman Legal',
        roles: ['super_admin', 'admin'],
      },
      {
        path: '/admin/social-media',
        icon: FaUsers,
        label: 'Media Sosial',
        roles: ['super_admin', 'adminsosmed', 'sosmed_admin'],
      },
    ],
  },
  {
    key: 'sistem',
    label: 'Sistem',
    items: [
      {
        path: '/admin/settings',
        icon: FaCog,
        label: 'Settings',
        roles: ['super_admin'],
      },
      {
        path: '/admin/contact-submissions',
        icon: FaEnvelope,
        label: 'Pesan Masuk',
        roles: ['super_admin', 'admin'],
      },
      {
        path: '/admin/users',
        icon: FaUserCog,
        label: 'Kelola User',
        roles: ['super_admin', 'admin'],
      },
    ],
  },
];

// Cek apakah sebuah item menu sedang aktif berdasarkan URL
const isItemActive = (item, pathname, search) =>
  item.path === `${pathname}${search}` ||
  (!item.path.includes('?') && item.path === pathname);

// Hanya group yang berisi halaman aktif yang terbuka, sisanya tertutup
const getInitialOpenGroups = (pathname, search) => {
  const result = {};

  MENU_GROUPS.forEach((group) => {
    result[group.key] = group.items.some((item) =>
      isItemActive(item, pathname, search)
    );
  });

  return result;
};

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [openGroups, setOpenGroups] = useState(() =>
    getInitialOpenGroups(location.pathname, location.search)
  );
  const [headerDropdown, setHeaderDropdown] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const normalizedRole = userRole === 'sosmed_admin' ? 'adminsosmed' : userRole;
  const visibleMenuGroups = MENU_GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(userRole)),
    }))
    .filter((group) => group.items.length > 0);
  const itemIsActive = (item) =>
    isItemActive(item, location.pathname, location.search);

  // Ambil informasi user yang sedang login
  useEffect(() => {
    getMe()
      .then((res) => {
        const user = res.data?.data;

        setUserName(user?.name || '');
        setUserRole(user?.role || null);
      })
      .catch((error) => {
        console.error('Unable to load the current admin user:', error);
      });
  }, []);

  // Tutup dropdown profile ketika klik di luar
  useEffect(() => {
    if (!headerDropdown) return;

    const closeDropdown = () => {
      setHeaderDropdown(false);
    };

    document.addEventListener('click', closeDropdown);

    return () => {
      document.removeEventListener('click', closeDropdown);
    };
  }, [headerDropdown]);

  // Saat pindah halaman, pastikan group yang berisi halaman aktif terbuka
  // (group lain tidak ditutup paksa)
  useEffect(() => {
    const activeGroup = MENU_GROUPS.find((group) =>
      group.items.some((item) =>
        isItemActive(item, location.pathname, location.search)
      )
    );

    if (activeGroup) {
      setOpenGroups((prev) =>
        prev[activeGroup.key]
          ? prev
          : { ...prev, [activeGroup.key]: true }
      );
    }
  }, [location.pathname, location.search]);

  const toggleGroup = (key) => {
    setOpenGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      void navigate('/admin/login');
    }
  };

  const currentLabel =
    MENU_GROUPS
      .flatMap((group) => group.items)
      .find((item) => itemIsActive(item))?.label ||
    'Dashboard';

  const roleDisplay = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    sosmed_admin: 'Sosmed Admin',
    adminsosmed: 'Admin Sosial Media',
  };

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 bg-gradient-to-b from-[#1e3a8a] via-[#1e40af] to-[#1e3a8a] text-white fixed h-screen z-40 shadow-2xl flex flex-col">

        {/* Logo */}
        <div className="flex items-center flex-shrink-0 gap-3 px-4 py-4 border-b border-white/10">

          <div className="flex items-center justify-center flex-shrink-0 overflow-hidden bg-white rounded-lg shadow-md w-9 h-9">
            <img
              src={kanLogo}
              alt="Logo KAN"
              className="object-contain w-full h-full p-1"
            />
          </div>

          <div className="min-w-0">
            <div className="text-sm font-black leading-tight">
              Admin Panel
            </div>

            <div className="text-[10px] text-white/50 truncate">
              Komite Akreditasi
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">

          {visibleMenuGroups.map((group) => {
            const isUtama = group.key === 'utama';

            return (
              <div key={group.key}>

                {/* Dashboard / Utama */}
                {isUtama ? (
                  <div>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = itemIsActive(item);

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${active
                              ? 'bg-white/20 text-white'
                              : 'text-white/80 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                          <Icon className="flex-shrink-0 text-sm" />

                          <span className="text-[11px] font-semibold flex-1">
                            {item.label}
                          </span>

                          {active && (
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    {/* Group Header */}
                    <button
                      onClick={() => toggleGroup(group.key)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all"
                    >
                      <span className="text-[9px] font-bold tracking-widest uppercase text-white/70 flex-1 text-left">
                        {group.label}
                      </span>

                      <FaChevronDown
                        className={`text-white/50 text-[9px] flex-shrink-0 transition-transform duration-200 ${openGroups[group.key]
                            ? 'rotate-180'
                            : ''
                          }`}
                      />
                    </button>

                    {/* Group Items */}
                    {openGroups[group.key] && (
                      <div className="pl-2 mt-0.5 space-y-0.5">
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const active = itemIsActive(item);

                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${active
                                  ? 'bg-white/20 text-white'
                                  : 'text-white/80 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                              <Icon className="flex-shrink-0 text-sm" />

                              <span className="text-[11px] font-medium flex-1 truncate">
                                {item.label}
                              </span>

                              {active && (
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                              )}
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
        <div className="flex-shrink-0 p-3 space-y-2 border-t border-white/10">

          {/* User Profile */}
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/10">
            <div className="flex items-center justify-center flex-shrink-0 text-xs font-bold text-white rounded-full w-7 h-7 bg-primary-600">
              {userName
                ? userName.charAt(0).toUpperCase()
                : 'A'}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold text-white truncate">
                {userName || 'Admin'}
              </div>

              <div className="text-[9px] text-white/40">
                {userRole
                  ? roleDisplay[normalizedRole] ?? roleDisplay[userRole] ?? userRole
                  : '...'}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">

            <Link
              to="/"
              target="_blank"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-all text-[10px] font-semibold"
            >
              <FaHome className="text-xs" />
              Lihat Web
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

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 min-w-0 ml-64">

        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">

          <div className="flex items-center justify-between px-6 py-4">

            <div>
              <h1 className="text-xl font-black text-gray-900">
                {currentLabel}
              </h1>

              <p className="text-xs text-gray-400 mt-0.5">
                Panel administrasi KAN
              </p>
            </div>

            {/* User Dropdown */}
            <div className="relative">

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setHeaderDropdown((prev) => !prev);
                }}
                className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
              >
                <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-xs font-bold text-white rounded-full bg-gradient-to-br from-primary-600 to-primary-700">
                  {userName
                    ? userName.charAt(0).toUpperCase()
                    : 'A'}
                </div>

                <div className="min-w-0 text-left">
                  <div className="text-xs font-bold text-gray-900 truncate max-w-[120px]">
                    {userName || 'Admin'}
                  </div>

                  <div className="text-[10px] text-gray-400">
                    {userRole
                      ? roleDisplay[normalizedRole] ?? roleDisplay[userRole] ?? userRole
                      : '...'}
                  </div>
                </div>

                <FaChevronDown
                  className={`text-gray-400 text-[9px] flex-shrink-0 transition-transform duration-200 ${headerDropdown ? 'rotate-180' : ''
                    }`}
                />
              </button>

              {/* Dropdown */}
              {headerDropdown && (
                <div className="absolute right-0 z-50 mt-2 overflow-hidden bg-white border border-gray-100 shadow-lg top-full w-44 rounded-xl">

                  <Link
                    to="/"
                    target="_blank"
                    onClick={() => setHeaderDropdown(false)}
                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FaHome className="text-xs text-gray-400" />
                    Lihat Website
                  </Link>

                  <div className="mx-3 border-t border-gray-100" />

                  <button
                    onClick={() => {
                      setHeaderDropdown(false);
                      void handleLogout();
                    }}
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

        {/* Page Content */}
        <main className="min-w-0 p-6 overflow-x-hidden">
          {children}
        </main>

      </div>
    </div>
  );
};

export default AdminLayout;
