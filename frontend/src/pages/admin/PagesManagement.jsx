import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
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
        alert('Page saved successfully!');
      } else {
        // Show validation errors if present
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join('\n');
          alert(`Validation errors:\n${errorMessages}`);
        } else {
          alert(`Failed to save page: ${data.message || 'Unknown error'}`);
        }
        console.error('Server error:', data);
      }
    } catch (error) {
      console.error('Detailed error:', error);
      alert(`An error occurred: ${error.message}\n\nCheck browser console (F12) for details.`);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this page?')) return;

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Pages Management</h2>
            <p className="text-gray-600 mt-1">Manage static pages</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-bold hover:scale-105 transition-all shadow-lg"
          >
            <FaPlus />
            <span>Add Page</span>
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="relative max-w-md">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search pages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchPages()}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Title</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Slug</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Created</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </td>
                  </tr>
                ) : pages.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      No pages found. Create your first page!
                    </td>
                  </tr>
                ) : (
                  pages.map((page) => (
                    <tr key={page.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{page.title_id}</div>
                        {page.title_en && (
                          <div className="text-sm text-gray-500 mt-1">{page.title_en}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <code className="px-2 py-1 bg-gray-100 rounded text-sm">{page.slug}</code>
                      </td>
                      <td className="px-6 py-4">
                        {page.is_published ? (
                          <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                            <FaCheckCircle />
                            <span>Published</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-gray-500 font-semibold">
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
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title={page.is_published ? 'Unpublish' : 'Publish'}
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => handleOpenModal(page)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(page.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <h3 className="text-2xl font-black text-gray-900">
                {editingPage ? 'Edit Page' : 'Add Page'}
              </h3>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Title (Indonesian) *</label>
                <input
                  type="text"
                  value={formData.title_id}
                  onChange={(e) => setFormData({ ...formData, title_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Title (English)</label>
                <input
                  type="text"
                  value={formData.title_en}
                  onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Content (Indonesian) *</label>
                <textarea
                  value={formData.content_id}
                  onChange={(e) => setFormData({ ...formData, content_id: e.target.value })}
                  rows="10"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Content (English)</label>
                <textarea
                  value={formData.content_en}
                  onChange={(e) => setFormData({ ...formData, content_en: e.target.value })}
                  rows="10"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="font-semibold text-gray-700">Published</span>
                </label>
              </div>

              <div className="border-t pt-6">
                <h4 className="text-lg font-black text-gray-900 mb-4">SEO Settings</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Meta Title (Indonesian)</label>
                    <input
                      type="text"
                      value={formData.meta_title_id}
                      onChange={(e) => setFormData({ ...formData, meta_title_id: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Meta Title (English)</label>
                    <input
                      type="text"
                      value={formData.meta_title_en}
                      onChange={(e) => setFormData({ ...formData, meta_title_en: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Meta Description (Indonesian)</label>
                    <textarea
                      value={formData.meta_description_id}
                      onChange={(e) => setFormData({ ...formData, meta_description_id: e.target.value })}
                      rows="3"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Meta Description (English)</label>
                    <textarea
                      value={formData.meta_description_en}
                      onChange={(e) => setFormData({ ...formData, meta_description_en: e.target.value })}
                      rows="3"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-6 -mb-6 px-6 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-bold hover:scale-105 transition-all"
                >
                  {editingPage ? 'Update' : 'Create'}
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