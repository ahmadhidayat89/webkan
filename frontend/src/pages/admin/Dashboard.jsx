import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaNewspaper, FaUsers, FaImages, FaEdit, FaEye,
  FaBullhorn, FaCheckCircle, FaClock, FaArrowRight,
  FaLayerGroup, FaTachometerAlt,
} from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalNews: 0,
    publishedNews: 0,
    draftNews: 0,
    totalAnnouncements: 0,
    totalPartners: 0,
    totalSliders: 0,
    totalContent: 0,
  });
  const [recentNews, setRecentNews] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [newsRes, partnersRes, slidersRes, contentRes] = await Promise.allSettled([
        fetch('/api/v1/admin/news?per_page=100', { headers }),
        fetch('/api/v1/admin/partners', { headers }),
        fetch('/api/v1/admin/sliders', { headers }),
        fetch('/api/v1/admin/page-contents', { headers }),
      ]);

      if (newsRes.status === 'fulfilled') {
        const data = await newsRes.value.json();
        if (data.success) {
          const all = data.data.data || [];
          const published = all.filter(n => n.published_at);
          const drafts = all.filter(n => !n.published_at);
          const announcements = all.filter(n => n.category === 'announcement');
          setRecentNews(all.slice(0, 6));
          setStats(prev => ({
            ...prev,
            totalNews: data.data.total || all.length,
            publishedNews: published.length,
            draftNews: drafts.length,
            totalAnnouncements: announcements.length,
          }));
        }
      }

      if (partnersRes.status === 'fulfilled') {
        const data = await partnersRes.value.json();
        if (data.success) {
          setStats(prev => ({ ...prev, totalPartners: data.data.length }));
        }
      }

      if (slidersRes.status === 'fulfilled') {
        const data = await slidersRes.value.json();
        if (data.success) {
          setStats(prev => ({ ...prev, totalSliders: data.data.length }));
        }
      }

      if (contentRes.status === 'fulfilled') {
        const data = await contentRes.value.json();
        if (data.success) {
          const list = data.data.data || data.data || [];
          setStats(prev => ({ ...prev, totalContent: list.length }));
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Total Berita',
      value: stats.totalNews,
      icon: FaNewspaper,
      gradient: 'from-blue-500 to-blue-700',
      light: 'bg-blue-50',
      text: 'text-blue-600',
      link: '/admin/news',
      desc: 'Semua berita',
    },
    {
      label: 'Dipublikasikan',
      value: stats.publishedNews,
      icon: FaCheckCircle,
      gradient: 'from-emerald-500 to-emerald-700',
      light: 'bg-emerald-50',
      text: 'text-emerald-600',
      link: '/admin/news',
      desc: 'Berita aktif',
    },
    {
      label: 'Draft',
      value: stats.draftNews,
      icon: FaClock,
      gradient: 'from-amber-500 to-amber-700',
      light: 'bg-amber-50',
      text: 'text-amber-600',
      link: '/admin/news',
      desc: 'Belum dipublikasikan',
    },
    {
      label: 'Pengumuman',
      value: stats.totalAnnouncements,
      icon: FaBullhorn,
      gradient: 'from-rose-500 to-rose-700',
      light: 'bg-rose-50',
      text: 'text-rose-600',
      link: '/admin/news',
      desc: 'Total pengumuman',
    },
    {
      label: 'Partners',
      value: stats.totalPartners,
      icon: FaUsers,
      gradient: 'from-violet-500 to-violet-700',
      light: 'bg-violet-50',
      text: 'text-violet-600',
      link: '/admin/partners',
      desc: 'Mitra terdaftar',
    },
    {
      label: 'Sliders',
      value: stats.totalSliders,
      icon: FaImages,
      gradient: 'from-cyan-500 to-cyan-700',
      light: 'bg-cyan-50',
      text: 'text-cyan-600',
      link: '/admin/sliders',
      desc: 'Banner halaman utama',
    },
    {
      label: 'Konten Halaman',
      value: stats.totalContent,
      icon: FaLayerGroup,
      gradient: 'from-primary-500 to-primary-700',
      light: 'bg-primary-50',
      text: 'text-primary-600',
      link: '/admin/content',
      desc: 'Halaman terisi konten',
    },
  ];

  const quickActions = [
    {
      label: 'Tambah Berita',
      desc: 'Buat artikel berita baru',
      icon: FaNewspaper,
      gradient: 'from-blue-500 to-blue-700',
      link: '/admin/news',
    },
    {
      label: 'Kelola Konten',
      desc: 'Edit isi halaman website',
      icon: FaEdit,
      gradient: 'from-primary-500 to-primary-700',
      link: '/admin/content',
    },
    {
      label: 'Kelola Slider',
      desc: 'Atur banner halaman utama',
      icon: FaImages,
      gradient: 'from-cyan-500 to-cyan-700',
      link: '/admin/sliders',
    },
    {
      label: 'Kelola Partners',
      desc: 'Tambah & edit mitra KAN',
      icon: FaUsers,
      gradient: 'from-violet-500 to-violet-700',
      link: '/admin/partners',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Welcome Banner */}
        <div className="relative bg-gradient-to-r from-primary-700 via-primary-800 to-primary-900 rounded-2xl p-8 text-white shadow-xl overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-primary-400/10 rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                  <FaTachometerAlt className="text-white text-lg" />
                </div>
                <span className="text-white/70 text-sm font-semibold uppercase tracking-wider">Admin Panel KAN</span>
              </div>
              <h2 className="text-3xl font-black mb-1">Selamat Datang, Admin</h2>
              <p className="text-white/70">{today}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/admin/news')}
                className="px-5 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl font-bold text-sm transition-all border border-white/20 flex items-center gap-2"
              >
                <FaNewspaper className="text-xs" />
                Buat Berita
              </button>
              <button
                onClick={() => window.open('/', '_blank')}
                className="px-5 py-2.5 bg-white text-primary-700 rounded-xl font-bold text-sm transition-all hover:bg-white/90 flex items-center gap-2"
              >
                <FaEye className="text-xs" />
                Lihat Website
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {statCards.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <button
                key={i}
                onClick={() => navigate(stat.link)}
                className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all text-left"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform shadow-md`}>
                  <Icon className="text-base" />
                </div>
                <div className="text-2xl font-black text-gray-900 mb-0.5">
                  {loading ? <span className="text-gray-300">—</span> : stat.value}
                </div>
                <div className="text-xs font-bold text-gray-700 mb-0.5">{stat.label}</div>
                <div className="text-xs text-gray-400">{stat.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Quick Actions + Recent News side-by-side */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Quick Actions */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-full">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-base font-black text-gray-900">Aksi Cepat</h3>
                <p className="text-xs text-gray-500 mt-0.5">Pintasan ke menu utama</p>
              </div>
              <div className="p-4 space-y-2">
                {quickActions.map((action, i) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => navigate(action.link)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-all group text-left border border-transparent hover:border-gray-200"
                    >
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center text-white flex-shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                        <Icon className="text-base" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-gray-900">{action.label}</div>
                        <div className="text-xs text-gray-500 truncate">{action.desc}</div>
                      </div>
                      <FaArrowRight className="text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all text-xs flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent News */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-full">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-gray-900">Berita Terbaru</h3>
                  <p className="text-xs text-gray-500 mt-0.5">6 berita terakhir yang dibuat</p>
                </div>
                <button
                  onClick={() => navigate('/admin/news')}
                  className="text-xs text-primary-600 font-bold hover:text-primary-700 flex items-center gap-1 transition-colors"
                >
                  Lihat Semua <FaArrowRight className="text-xs" />
                </button>
              </div>

              {loading ? (
                <div className="p-12 text-center">
                  <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : recentNews.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FaNewspaper className="text-gray-400 text-2xl" />
                  </div>
                  <p className="text-gray-500 font-semibold">Belum ada berita</p>
                  <button
                    onClick={() => navigate('/admin/news')}
                    className="mt-3 text-sm text-primary-600 font-bold hover:underline"
                  >
                    Buat berita pertama
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {recentNews.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className="flex w-full items-center gap-4 border-0 bg-transparent px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                      onClick={() => navigate('/admin/news')}
                    >
                      {item.image ? (
                        <img
                          src={`/storage/${item.image}`}
                          alt={item.title}
                          className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <FaNewspaper className="text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            item.category === 'announcement'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {item.category === 'announcement' ? 'Pengumuman' : 'Berita'}
                          </span>
                          <span className={`text-xs font-semibold flex items-center gap-1 ${
                            item.published_at ? 'text-emerald-600' : 'text-amber-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                              item.published_at ? 'bg-emerald-500' : 'bg-amber-400'
                            }`}></span>
                            {item.published_at ? 'Dipublikasikan' : 'Draft'}
                          </span>
                        </div>
                        <p className="font-bold text-sm text-gray-900 truncate">{item.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(item.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default Dashboard;
