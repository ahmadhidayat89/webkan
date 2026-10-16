import { useState, useEffect } from 'react';
import {
  FaPlus, FaEdit, FaTrash, FaEye, FaSearch,
  FaCheckCircle, FaTimesCircle, FaNewspaper, FaBullhorn, FaClock,
} from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';
import NewsFormModal from '../../components/admin/NewsFormModal';

const NewsManagement = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [selectedNews, setSelectedNews] = useState([]);

  useEffect(() => {
    void fetchNews();
  }, [filterCategory, filterStatus]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterCategory !== 'all') params.append('category', filterCategory);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/v1/admin/news?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setNews(data.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this news?')) return;

    try {
      const response = await fetch(`/api/v1/admin/news/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        void fetchNews();
      }
    } catch (error) {
      console.error('Error deleting news:', error);
    }
  };

  const handleTogglePublish = async (id) => {
    try {
      const response = await fetch(`/api/v1/admin/news/${id}/toggle-publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        void fetchNews();
      }
    } catch (error) {
      console.error('Error toggling publish:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedNews.length} selected news?`)) return;

    try {
      const response = await fetch('/api/v1/admin/news/bulk-delete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedNews }),
      });
      const data = await response.json();
      if (data.success) {
        setSelectedNews([]);
        void fetchNews();
      }
    } catch (error) {
      console.error('Error bulk deleting:', error);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedNews(news.map(item => item.id));
    } else {
      setSelectedNews([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedNews.includes(id)) {
      setSelectedNews(selectedNews.filter(item => item !== id));
    } else {
      setSelectedNews([...selectedNews, id]);
    }
  };

  const totalNews = news.length;
  const published = news.filter(n => n.published_at).length;
  const drafts = news.filter(n => !n.published_at).length;

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header Banner */}
        <div className="relative overflow-hidden text-white shadow-xl bg-gradient-to-r from-primary-700 via-primary-800 to-primary-900 rounded-2xl p-7">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute w-56 h-56 rounded-full -top-10 -right-10 bg-white/5 blur-3xl"></div>
            <div className="absolute bottom-0 w-40 h-40 rounded-full left-1/3 bg-primary-400/10 blur-3xl"></div>
          </div>
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-white/15 rounded-xl">
                <FaNewspaper className="text-xl text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black">Kelola Berita</h2>
                <p className="text-white/70 text-sm mt-0.5">Manajemen berita dan pengumuman website KAN</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden gap-2 sm:flex">
                <div className="text-center px-4 py-2.5 bg-white/15 rounded-xl border border-white/20">
                  <div className="text-xl font-black">{published}</div>
                  <div className="text-xs font-semibold text-white/70">Tayang</div>
                </div>
                <div className="text-center px-4 py-2.5 bg-white/15 rounded-xl border border-white/20">
                  <div className="text-xl font-black">{drafts}</div>
                  <div className="text-xs font-semibold text-white/70">Draft</div>
                </div>
                <div className="text-center px-4 py-2.5 bg-white/10 rounded-xl border border-white/20">
                  <div className="text-xl font-black">{totalNews}</div>
                  <div className="text-xs font-semibold text-white/70">Total</div>
                </div>
              </div>
              <button
                onClick={() => { setEditingNews(null); setShowModal(true); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-primary-700 rounded-xl font-bold text-sm hover:bg-white/90 transition-all shadow-md"
              >
                <FaPlus />
                Tambah Berita
              </button>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="p-5 bg-white border border-gray-200 shadow-sm rounded-2xl">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <FaSearch className="absolute text-sm text-gray-400 -translate-y-1/2 left-4 top-1/2" />
              <input
                type="text"
                placeholder="Cari berita..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchNews()}
                className="w-full py-3 pr-4 text-sm transition-colors border border-gray-200 pl-11 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-400 bg-gray-50 focus:bg-white"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 text-sm transition-colors border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 bg-gray-50 focus:bg-white"
            >
              <option value="all">Semua Kategori</option>
              <option value="news">Berita</option>
              <option value="announcement">Pengumuman</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 text-sm transition-colors border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 bg-gray-50 focus:bg-white"
            >
              <option value="all">Semua Status</option>
              <option value="published">Dipublikasikan</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedNews.length > 0 && (
          <div className="flex items-center justify-between p-4 border bg-primary-50 border-primary-200 rounded-xl">
            <span className="text-sm font-bold text-primary-800">
              {selectedNews.length} item dipilih
            </span>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white transition-all bg-red-600 rounded-lg hover:bg-red-700"
            >
              <FaTrash />
              Hapus Terpilih
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="w-10 px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedNews.length === news.length && news.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-gray-500 uppercase">Berita</th>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-gray-500 uppercase">Kategori</th>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-gray-500 uppercase">Tanggal</th>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider text-right text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading && (
                  <tr>
                    <td colSpan="6" className="py-16 text-center">
                      <div className="w-8 h-8 mx-auto border-4 rounded-full border-primary-600 border-t-transparent animate-spin"></div>
                    </td>
                  </tr>
                )}
                {!loading && news.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-20 text-center">
                      <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-2xl">
                        <FaNewspaper className="text-2xl text-gray-400" />
                      </div>
                      <p className="mb-1 font-semibold text-gray-500">Belum ada berita</p>
                      <button
                        onClick={() => { setEditingNews(null); setShowModal(true); }}
                        className="text-sm font-bold text-primary-600 hover:underline"
                      >
                        Buat berita pertama
                      </button>
                    </td>
                  </tr>
                )}
                {!loading && news.length > 0 &&
                  news.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedNews.includes(item.id)}
                          onChange={() => handleSelectOne(item.id)}
                          className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          {item.image ? (
                            <img
                              src={`/storage/${item.image}`}
                              alt={item.title_id}
                              className="flex-shrink-0 object-cover w-14 h-14 rounded-xl"
                            />
                          ) : (
                            <div className="flex items-center justify-center flex-shrink-0 bg-gray-100 w-14 h-14 rounded-xl">
                              <FaNewspaper className="text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-gray-900 line-clamp-1">{item.title_id}</div>
                            <div className="text-xs text-gray-400 line-clamp-1 mt-0.5">{item.excerpt_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${item.category === 'news'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-rose-100 text-rose-700'
                          }`}>
                          {item.category === 'news' ? <FaNewspaper className="text-[10px]" /> : <FaBullhorn className="text-[10px]" />}
                          {item.category === 'news' ? 'Berita' : 'Pengumuman'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {item.published_at ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                            <FaCheckCircle />
                            Tayang
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                            <FaClock />
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleTogglePublish(item.id)}
                            title={item.published_at ? 'Cabut Tayang' : 'Tayangkan'}
                            className={`p-2 rounded-lg transition-all text-sm ${item.published_at
                                ? 'text-amber-500 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                          >
                            {item.published_at ? <FaTimesCircle /> : <FaEye />}
                          </button>
                          <button
                            onClick={() => { setEditingNews(item); setShowModal(true); }}
                            title="Edit"
                            className="p-2 text-sm transition-all rounded-lg text-primary-600 hover:bg-primary-50"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            title="Hapus"
                            className="p-2 text-sm text-red-500 transition-all rounded-lg hover:bg-red-50"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* News Form Modal */}
      <NewsFormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingNews(null);
        }}
        news={editingNews}
        onSaved={fetchNews}
      />
    </AdminLayout>
  );
};

export default NewsManagement;
