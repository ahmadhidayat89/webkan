import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaCheckCircle, FaTimesCircle, FaFileAlt } from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';

const PagesManagement = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [formData, setFormData] = useState({
    title_id: '',
    title_en: '',
    slug: '',
    content_id: '',
    content_en: '',
    meta_title_id: '',
    meta_title_en: '',
    meta_description_id: '',
    meta_description_en: '',
    is_published: true,
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/v1/admin/pages?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (data.success) {
        setPages(data.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (page = null) => {
    if (page) {
      setEditingPage(page);
      setFormData({
        title_id: page.title_id || '',
        title_en: page.title_en || '',
        slug: page.slug || '',
        content_id: page.content_id || '',
        content_en: page.content_en || '',
        meta_title_id: page.meta_title_id || '',
        meta_title_en: page.meta_title_en || '',
        meta_description_id: page.meta_description_id || '',
        meta_description_en: page.meta_description_en || '',
        is_published: page.is_published !== undefined ? page.is_published : true,
      });
    } else {
      setEditingPage(null);
      setFormData({
        title_id: '',
        title_en: '',
        slug: '',
        content_id: '',
        content_en: '',
        meta_title_id: '',
        meta_title_en: '',
        meta_description_id: '',
        meta_description_en: '',
        is_published: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPage(null);
    setFormData({
      title_id: '',
      title_en: '',
      slug: '',
      content_id: '',
      content_en: '',
      meta_title_id: '',
      meta_title_en: '',
      meta_description_id: '',
      meta_description_en: '',
      is_published: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingPage
        ? `/api/v1/admin/pages/${editingPage.id}`
        : '/api/v1/admin/pages';

      console.log('Submitting to:', url);
      console.log('Form data:', formData);

      const response = await fetch(url, {
        method: editingPage ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('Response status:', response.status);

      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response received:', text.substring(0, 500));
        alert(`Backend error: Server returned HTML instead of JSON.\n\nStatus: ${response.status}\n\nPossible causes:\n- Backend not running\n- Wrong API endpoint\n- CORS or routing issue\n\nCheck backend logs.`);
        return;
      }

      const data = await response.json();
      console.log('Response:', data);

      if (response.ok && data.success) {
        fetchPages();
        handleCloseModal();
        alert('Halaman berhasil disimpan!');
      } else {
        // Show validation errors if present
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join('\n');
          alert(`Terdapat kesalahan validasi:\n${errorMessages}`);
        } else {
          alert(`Gagal menyimpan halaman: ${data.message || 'Terjadi kesalahan yang tidak diketahui'}`);
        }
        console.error('Server error:', data);
      }
    } catch (error) {
      console.error('Detailed error:', error);
      alert(`Terjadi kesalahan: ${error.message}\n\nPeriksa browser console (F12) untuk detail.`);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus halaman ini?')) return;

    try {
      const response = await fetch(`/api/v1/admin/pages/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (data.success) {
        fetchPages();
      }
    } catch (error) {
      console.error('Error deleting page:', error);
    }
  };

  const handleTogglePublish = async (id) => {
    try {
      const response = await fetch(`/api/v1/admin/pages/${id}/toggle-publish`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (data.success) {
        fetchPages();
      }
    } catch (error) {
      console.error('Error toggling publish:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        {/* Header Banner */}
        <div className="relative bg-gradient-to-r from-primary-700 via-primary-800 to-primary-900 rounded-2xl p-7 text-white shadow-xl overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-56 h-56 bg-white/5 rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center">
                <FaFileAlt className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-black">Kelola Halaman</h2>
                <p className="text-white/70 text-sm mt-0.5">Buat halaman website dan tentukan route/URL-nya.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex gap-2">
                <div className="text-center px-4 py-2.5 bg-white/15 rounded-xl border border-white/20">
                  <div className="text-xl font-black">{pages.filter((p) => p.is_published).length}</div>
                  <div className="text-white/70 text-xs font-semibold">Publish</div>
                </div>
                <div className="text-center px-4 py-2.5 bg-white/10 rounded-xl border border-white/20">
                  <div className="text-xl font-black">{pages.filter((p) => !p.is_published).length}</div>
                  <div className="text-white/70 text-xs font-semibold">Draft</div>
                </div>
                <div className="text-center px-4 py-2.5 bg-white/10 rounded-xl border border-white/20">
                  <div className="text-xl font-black">{pages.length}</div>
                  <div className="text-white/70 text-xs font-semibold">Total</div>
                </div>
              </div>
              <button
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-primary-700 rounded-xl font-bold text-sm hover:bg-white/90 transition-all shadow-md"
              >
                <FaPlus />
                Tambah Halaman
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
          <div className="relative max-w-md">
            <FaSearch className="absolute text-gray-400 -translate-y-1/2 left-4 top-1/2" />
            <input
              type="text"
              placeholder="Cari halaman..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchPages()}
              className="w-full py-3 pl-12 pr-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-left text-gray-700 uppercase">Judul</th>
                  <th className="px-6 py-4 text-xs font-bold text-left text-gray-700 uppercase">Slug</th>
                  <th className="px-6 py-4 text-xs font-bold text-left text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-left text-gray-700 uppercase">Dibuat</th>
                  <th className="px-6 py-4 text-xs font-bold text-right text-gray-700 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="w-8 h-8 mx-auto border-4 rounded-full border-primary-600 border-t-transparent animate-spin"></div>
                    </td>
                  </tr>
                ) : pages.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      Belum ada halaman. Buat halaman pertama Anda!
                    </td>
                  </tr>
                ) : (
                  pages.map((page) => (
                    <tr key={page.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{page.title_id}</div>
                        {page.title_en && (
                          <div className="mt-1 text-sm text-gray-500">{page.title_en}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <a href={`/${page.slug}`} target="_blank" rel="noreferrer" className="px-2 py-1 text-sm bg-gray-100 rounded text-primary-700 hover:underline">/{page.slug}</a>
                      </td>
                      <td className="px-6 py-4">
                        {page.is_published ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-green-600">
                            <FaCheckCircle />
                            <span>Dipublikasikan</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-gray-500">
                            <FaTimesCircle />
                            <span>Draft</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(page.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleTogglePublish(page.id)}
                            className="p-2 text-blue-600 transition-all rounded-lg hover:bg-blue-50"
                            title={page.is_published ? 'Cabut Publikasi' : 'Publikasikan'}
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => handleOpenModal(page)}
                            className="p-2 transition-all rounded-lg text-primary-600 hover:bg-primary-50"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(page.id)}
                            className="p-2 text-red-600 transition-all rounded-lg hover:bg-red-50"
                            title="Hapus"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-white border-b border-gray-200">
              <h3 className="text-2xl font-black text-gray-900">
                {editingPage ? 'Edit Halaman' : 'Tambah Halaman'}
              </h3>
              <button onClick={handleCloseModal} className="p-2 rounded-lg hover:bg-gray-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label htmlFor="page-title-id" className="block mb-2 text-sm font-bold text-gray-700">Judul (Bahasa Indonesia) <span className="text-red-500">*</span></label>
                <input
                  id="page-title-id"
                  type="text"
                  value={formData.title_id}
                  onChange={(e) => setFormData({ ...formData, title_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="page-title-en" className="block mb-2 text-sm font-bold text-gray-700">Judul (Bahasa Inggris)</label>
                <input
                  id="page-title-en"
                  type="text"
                  value={formData.title_en}
                  onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="page-slug" className="block mb-2 text-sm font-bold text-gray-700">Route / URL <span className="text-red-500">*</span></label>
                <div className="flex items-center px-4 border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-primary-500">
                  <span className="text-gray-400">/</span>
                  <input
                    id="page-slug"
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="halaman-baru"
                    pattern="[A-Za-z0-9_-]+"
                    className="w-full px-2 py-3 border-0 focus:ring-0"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Gunakan huruf, angka, tanda hubung, atau garis bawah. Contoh: /layanan-baru</p>
              </div>

              <div>
                <label htmlFor="page-content-id" className="block mb-2 text-sm font-bold text-gray-700">Konten (Bahasa Indonesia) <span className="text-red-500">*</span></label>
                <textarea
                  id="page-content-id"
                  value={formData.content_id}
                  onChange={(e) => setFormData({ ...formData, content_id: e.target.value })}
                  rows="10"
                  className="w-full px-4 py-3 font-mono text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="page-content-en" className="block mb-2 text-sm font-bold text-gray-700">Konten (Bahasa Inggris)</label>
                <textarea
                  id="page-content-en"
                  value={formData.content_en}
                  onChange={(e) => setFormData({ ...formData, content_en: e.target.value })}
                  rows="10"
                  className="w-full px-4 py-3 font-mono text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span className="font-semibold text-gray-700">Dipublikasikan</span>
                </label>
              </div>

              <div className="pt-6 border-t">
                <h4 className="mb-4 text-lg font-black text-gray-900">Pengaturan SEO</h4>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="page-meta-title-id" className="block mb-2 text-sm font-bold text-gray-700">Meta Title (Bahasa Indonesia)</label>
                    <input
                      id="page-meta-title-id"
                      type="text"
                      value={formData.meta_title_id}
                      onChange={(e) => setFormData({ ...formData, meta_title_id: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="page-meta-title-en" className="block mb-2 text-sm font-bold text-gray-700">Meta Title (Bahasa Inggris)</label>
                    <input
                      id="page-meta-title-en"
                      type="text"
                      value={formData.meta_title_en}
                      onChange={(e) => setFormData({ ...formData, meta_title_en: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="page-meta-description-id" className="block mb-2 text-sm font-bold text-gray-700">Meta Description (Bahasa Indonesia)</label>
                    <textarea
                      id="page-meta-description-id"
                      value={formData.meta_description_id}
                      onChange={(e) => setFormData({ ...formData, meta_description_id: e.target.value })}
                      rows="3"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="page-meta-description-en" className="block mb-2 text-sm font-bold text-gray-700">Meta Description (Bahasa Inggris)</label>
                    <textarea
                      id="page-meta-description-en"
                      value={formData.meta_description_en}
                      onChange={(e) => setFormData({ ...formData, meta_description_en: e.target.value })}
                      rows="3"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 flex justify-end gap-3 px-6 py-4 -mx-6 -mb-6 bg-white border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 font-bold border-2 border-gray-300 rounded-xl hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 font-bold text-white transition-all bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl hover:scale-105"
                >
                  {editingPage ? 'Perbarui' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default PagesManagement;
