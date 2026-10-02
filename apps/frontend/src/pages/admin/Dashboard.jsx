import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaNewspaper,
  FaUsers,
  FaImages,
  FaEdit,
  FaEye,
  FaCheckCircle,
  FaClock,
  FaArrowRight,
  FaShareAlt,
  FaEnvelope,
} from "react-icons/fa";
import AdminLayout from "../../components/admin/AdminLayout";
import api, { getMe } from "../../services/api";
import { resolveMediaUrl } from "../../utils/mediaUrl";

const Dashboard = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState("");
  const [stats, setStats] = useState({
    totalNews: 0,
    publishedNews: 0,
    draftNews: 0,
    totalPartners: 0,
    unreadContacts: 0,
  });
  const [recentNews, setRecentNews] = useState([]);
  const [recentContacts, setRecentContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    getMe()
      .then((res) => {
        const user = res.data?.data;
        setUserRole(user?.role || "admin");
        setUserName(user?.name || "");
      })
      .catch(() => {});
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [newsRes, partnersRes, contactsRes] = await Promise.allSettled([
        api.get("/admin/news?per_page=100"),
        api.get("/admin/partners"),
        api.get("/admin/contacts?per_page=5"),
      ]);

      if (newsRes.status === "fulfilled" && newsRes.value.data.success) {
        const all = newsRes.value.data.data.data || [];
        setRecentNews(all.slice(0, 5));
        setStats((prev) => ({
          ...prev,
          totalNews: newsRes.value.data.data.total || all.length,
          publishedNews: all.filter((n) => n.published_at).length,
          draftNews: all.filter((n) => !n.published_at).length,
        }));
      }

      if (
        partnersRes.status === "fulfilled" &&
        partnersRes.value.data.success
      ) {
        setStats((prev) => ({
          ...prev,
          totalPartners: partnersRes.value.data.data.length,
        }));
      }

      if (
        contactsRes.status === "fulfilled" &&
        contactsRes.value.data.success
      ) {
        const cData = contactsRes.value.data;
        setStats((prev) => ({ ...prev, unreadContacts: cData.unread ?? 0 }));
        setRecentContacts(cData.data?.data || []);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const allStatCards = [
    {
      label: "Total Berita",
      value: stats.totalNews,
      icon: FaNewspaper,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      link: "/admin/news",
      roles: ["super_admin", "admin", "sosmed_admin"],
    },
    {
      label: "Dipublikasikan",
      value: stats.publishedNews,
      icon: FaCheckCircle,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      link: "/admin/news",
      roles: ["super_admin", "admin", "sosmed_admin"],
    },
    {
      label: "Draft",
      value: stats.draftNews,
      icon: FaClock,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      link: "/admin/news",
      roles: ["super_admin", "admin", "sosmed_admin"],
    },
    {
      label: "Partners",
      value: stats.totalPartners,
      icon: FaUsers,
      iconBg: "bg-violet-100",
      iconColor: "text-violet-600",
      link: "/admin/partners",
      roles: ["super_admin", "admin"],
    },
    {
      label: "Pesan Belum Dibaca",
      value: stats.unreadContacts,
      icon: FaEnvelope,
      iconBg: "bg-rose-100",
      iconColor: "text-rose-600",
      link: "/admin/contacts",
      roles: ["super_admin", "admin"],
    },
  ];

  const allQuickActions = [
    {
      label: "Tambah Berita",
      desc: "Buat artikel berita baru",
      icon: FaNewspaper,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      link: "/admin/news",
      roles: ["super_admin", "admin", "sosmed_admin"],
    },
    {
      label: "Kelola Konten",
      desc: "Edit isi halaman website",
      icon: FaEdit,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
      link: "/admin/content",
      roles: ["super_admin", "admin", "sosmed_admin"],
    },
    {
      label: "Kelola Slider",
      desc: "Atur banner halaman utama",
      icon: FaImages,
      iconBg: "bg-cyan-100",
      iconColor: "text-cyan-600",
      link: "/admin/sliders",
      roles: ["super_admin", "admin", "sosmed_admin"],
    },
    {
      label: "Kelola Partners",
      desc: "Tambah & edit mitra KAN",
      icon: FaUsers,
      iconBg: "bg-violet-100",
      iconColor: "text-violet-600",
      link: "/admin/partners",
      roles: ["super_admin", "admin"],
    },
    {
      label: "Media Sosial",
      desc: "Perbarui link media sosial",
      icon: FaShareAlt,
      iconBg: "bg-pink-100",
      iconColor: "text-pink-600",
      link: "/admin/sosmed",
      roles: ["super_admin", "sosmed_admin"],
    },
    {
      label: "Pesan Masuk",
      desc: "Lihat pesan dari pengunjung",
      icon: FaEnvelope,
      iconBg: "bg-rose-100",
      iconColor: "text-rose-600",
      link: "/admin/contacts",
      roles: ["super_admin", "admin"],
    },
  ];

  const statCards = userRole
    ? allStatCards.filter((c) => c.roles.includes(userRole))
    : [];
  const quickActions = userRole
    ? allQuickActions.filter((a) => a.roles.includes(userRole))
    : [];

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="relative rounded-2xl px-6 py-5 text-white overflow-hidden bg-gradient-to-r from-primary-800 to-primary-600">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
          </div>
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-white/55 text-xs font-medium mb-0.5">
                {today}
              </p>
              <h2 className="text-xl font-black">
                Selamat Datang{userName ? `, ${userName}` : ""}
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate("/admin/news")}
                className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold border border-white/20 transition-all flex items-center gap-1.5"
              >
                <FaNewspaper className="text-[10px]" /> Buat Berita
              </button>
              <button
                onClick={() => window.open("/", "_blank")}
                className="px-4 py-2 bg-white text-primary-700 rounded-xl text-xs font-bold transition-all hover:bg-white/90 flex items-center gap-1.5"
              >
                <FaEye className="text-[10px]" /> Lihat Web
              </button>
            </div>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        {statCards.length > 0 && (
          <div
            className={`grid gap-4 grid-cols-2 ${statCards.length >= 4 ? "lg:grid-cols-4" : "sm:grid-cols-3"}`}
          >
            {statCards.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <button
                  key={i}
                  onClick={() => navigate(stat.link)}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all text-left group"
                >
                  <div
                    className={`w-9 h-9 rounded-xl ${stat.iconBg} ${stat.iconColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="text-sm" />
                  </div>
                  <div className="text-2xl font-black text-gray-900 mb-0.5">
                    {loading ? (
                      <span className="text-gray-200">—</span>
                    ) : (
                      stat.value
                    )}
                  </div>
                  <div className="text-xs text-gray-500 font-semibold">
                    {stat.label}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Bottom: Berita Terbaru + Pesan Masuk + Aksi Cepat ── */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
          {/* Berita Terbaru — 2/5 */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-gray-900">
                  Berita Terbaru
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  5 berita terakhir yang ditambahkan
                </p>
              </div>
              <button
                onClick={() => navigate("/admin/news")}
                className="text-xs text-primary-600 font-bold hover:text-primary-700 flex items-center gap-1 transition-colors"
              >
                Lihat Semua <FaArrowRight className="text-[10px]" />
              </button>
            </div>

            {loading ? (
              <div className="p-10 flex justify-center">
                <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : recentNews.length === 0 ? (
              <div className="p-10 text-center">
                <FaNewspaper className="text-gray-300 text-3xl mx-auto mb-3" />
                <p className="text-sm text-gray-400 font-medium">
                  Belum ada berita
                </p>
                <button
                  onClick={() => navigate("/admin/news")}
                  className="mt-2 text-xs text-primary-600 font-bold hover:underline"
                >
                  Buat berita pertama
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentNews.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate("/admin/news")}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    {item.image ? (
                      <img
                        src={resolveMediaUrl(item.image)}
                        alt={item.title}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <FaNewspaper className="text-gray-300 text-sm" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            item.published_at
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {item.published_at ? "Tayang" : "Draft"}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(item.created_at).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pesan Masuk — 2/5 */}
          {["super_admin", "admin"].includes(userRole) && (
            <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-gray-900">
                    Pesan Masuk
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    5 pesan terbaru
                  </p>
                </div>
                <button
                  onClick={() => navigate("/admin/contacts")}
                  className="text-xs text-primary-600 font-bold hover:text-primary-700 flex items-center gap-1 transition-colors"
                >
                  Lihat Semua <FaArrowRight className="text-[10px]" />
                </button>
              </div>

              {loading ? (
                <div className="p-10 flex justify-center">
                  <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : recentContacts.length === 0 ? (
                <div className="p-10 text-center">
                  <FaEnvelope className="text-gray-300 text-3xl mx-auto mb-3" />
                  <p className="text-sm text-gray-400 font-medium">
                    Belum ada pesan
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {recentContacts.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => navigate("/admin/contacts")}
                      className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5 ${item.is_read ? "bg-gray-100 text-gray-400" : "bg-rose-100 text-rose-600"}`}
                      >
                        {item.name ? item.name.charAt(0).toUpperCase() : "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-gray-800 truncate">
                            {item.name || "Anonim"}
                          </p>
                          {!item.is_read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 truncate mt-0.5">
                          {item.message}
                        </p>
                        <p className="text-[10px] text-gray-300 mt-0.5">
                          {new Date(item.created_at).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Aksi Cepat — 1/5 */}
          <div className="xl:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h3 className="text-sm font-black text-gray-900">Aksi Cepat</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Pintasan ke menu utama
              </p>
            </div>
            <div className="p-3 space-y-1">
              {quickActions.map((action, i) => {
                const Icon = action.icon;
                return (
                  <button
                    key={i}
                    onClick={() => navigate(action.link)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-all group text-left"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl ${action.iconBg} ${action.iconColor} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className="text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-gray-900 truncate">
                        {action.label}
                      </div>
                    </div>
                    <FaArrowRight className="text-gray-300 group-hover:text-primary-400 transition-all text-[10px] flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
