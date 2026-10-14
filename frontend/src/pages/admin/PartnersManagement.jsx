import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaUsers, FaEye, FaEyeSlash, FaImage, FaCheckCircle, FaTimesCircle, FaGlobe } from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';

const PartnersManagement = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    is_active: true,
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/admin/partners', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setPartners(data.data);
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (partner = null) => {
    if (partner) {
      setEditingPartner(partner);
      setFormData({
        name: partner.name,
        url: partner.url || '',
        description: partner.description || '',
        is_active: partner.is_active,
      });
      if (partner.logo) {
        setLogoPreview(`/storage/${partner.logo}`);
      }
    } else {
      setEditingPartner(null);
      setFormData({
        name: '',
        url: '',
        description: '',
        is_active: true,
      });
      setLogoPreview(null);
    }
    setLogoFile(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPartner(null);
    setFormData({ name: '', url: '', description: '', is_active: true });
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      if (formData.url) formDataToSend.append('url', formData.url);
      if (formData.description) formDataToSend.append('description', formData.description);
      formDataToSend.append('is_active', formData.is_active ? '1' : '0');
      
      if (logoFile) {
        formDataToSend.append('logo', logoFile);
      }

      const url = editingPartner
        ? `/api/v1/admin/partners/${editingPartner.id}`
        : '/api/v1/admin/partners';

      if (editingPartner) {
        formDataToSend.append('_method', 'PUT');
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();
      if (data.success) {
        fetchPartners();
        handleCloseModal();
      } else {
        alert('Failed to save partner');
      }
    } catch (error) {
      console.error('Error saving partner:', error);
      alert('An error occurred');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this partner?')) return;

    try {
      const response = await fetch(`/api/v1/admin/partners/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        fetchPartners();
      }
    } catch (error) {
      console.error('Error deleting partner:', error);
    }
  };

  const handleToggleActive = async (id) => {
    try {
      const response = await fetch(`/api/v1/admin/partners/${id}/toggle-active`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        fetchPartners();
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const activeCount = partners.filter(p => p.is_active).length;

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header Banner */}
        <div className="relative bg-gradient-to-r from-primary-700 via-primary-800 to-primary-900 rounded-2xl p-7 text-white shadow-xl overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-56 h-56 bg-white/5 rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center">
                <FaUsers className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-black">Kelola Mitra</h2>
                <p className="text-white/70 text-sm mt-0.5">Manajemen organisasi mitra internasional KAN</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex gap-2">
                <div className="text-center px-4 py-2.5 bg-white/15 rounded-xl border border-white/20">
                  <div className="text-xl font-black">{activeCount}</div>
                  <div className="text-white/70 text-xs font-semibold">Aktif</div>
                </div>
                <div className="text-center px-4 py-2.5 bg-white/10 rounded-xl border border-white/20">
                  <div className="text-xl font-black">{partners.length}</div>
                  <div className="text-white/70 text-xs font-semibold">Total</div>
                </div>
              </div>
              <button
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-primary-700 rounded-xl font-bold text-sm hover:bg-white/90 transition-all shadow-md"
              >
                <FaPlus />
                Tambah Mitra
              </button>
            </div>
          </div>
        </div>

        {/* Partners Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {loading ? (
            <div className="col-span-full flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : partners.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FaUsers className="text-gray-400 text-2xl" />
              </div>
              <p className="text-gray-500 font-semibold mb-1">Belum ada mitra</p>
              <button onClick={() => handleOpenModal()} className="text-sm text-primary-600 font-bold hover:underline">
                Tambah mitra pertama
              </button>
            </div>
          ) : (
            partners.map((partner) => (
              <div
                key={partner.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all group"
              >
                {/* Logo Area */}
                <div className="relative h-36 bg-gray-50 flex items-center justify-center p-4 border-b border-gray-100">
                  {partner.logo ? (
                    <img
                      src={`/storage/${partner.logo}`}
                      alt={partner.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center">
                      <FaUsers className="text-gray-400 text-2xl" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      partner.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {partner.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5">
                  <h3 className="font-black text-gray-900 mb-1 text-sm">{partner.name}</h3>
                  {partner.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">{partner.description}</p>
                  )}
                  {partner.url && (
                    <a
                      href={partner.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-semibold mb-3"
                    >
                      <FaGlobe className="text-[10px]" />
                      Kunjungi Website
                    </a>
                  )}

                  {/* Actions */}
                  <div className="flex gap-1.5 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleToggleActive(partner.id)}
                      title={partner.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                        partner.is_active
                          ? 'text-amber-600 hover:bg-amber-50'
                          : 'text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {partner.is_active ? <FaEyeSlash /> : <FaEye />}
                      {partner.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button
                      onClick={() => handleOpenModal(partner)}
                      title="Edit"
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(partner.id)}
                      title="Hapus"
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="px-7 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-gray-900">
                  {editingPartner ? 'Edit Mitra' : 'Tambah Mitra Baru'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {editingPartner ? 'Perbarui informasi mitra' : 'Isi data mitra baru'}
                </p>
              </div>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Logo Mitra</label>
                {logoPreview ? (
                  <div className="relative inline-block rounded-xl overflow-hidden border border-gray-200 group">
                    <img src={logoPreview} alt="Preview" className="w-32 h-32 object-contain p-3 bg-gray-50" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                        className="p-2 bg-red-600 text-white rounded-lg"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all group">
                    <FaImage className="text-2xl text-gray-300 group-hover:text-primary-400 mb-1 transition-colors" />
                    <span className="text-xs text-gray-400 group-hover:text-primary-600 font-semibold">Upload Logo</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Nama Mitra <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-400 text-sm bg-gray-50 focus:bg-white transition-colors"
                  placeholder="Contoh: IAF, ILAC, APAC"
                  required
                />
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">URL Website</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-400 text-sm bg-gray-50 focus:bg-white transition-colors"
                  placeholder="https://example.com"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Deskripsi</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-400 text-sm bg-gray-50 focus:bg-white transition-colors resize-none"
                  placeholder="Deskripsi singkat organisasi mitra..."
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <div className="text-sm font-bold text-gray-800">Status Aktif</div>
                  <div className="text-xs text-gray-500">Tampilkan mitra di halaman publik</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.is_active}
                  aria-label="Status aktif"
                  onClick={() => setFormData({...formData, is_active: !formData.is_active})}
                  className={`relative inline-flex w-12 h-6 rounded-full border-0 p-0 transition-colors ${formData.is_active ? 'bg-primary-600' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.is_active ? 'translate-x-7' : 'translate-x-1'}`}></span>
                </button>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-bold text-sm hover:from-primary-700 hover:to-primary-800 transition-all shadow-md"
                >
                  {editingPartner ? 'Simpan Perubahan' : 'Tambah Mitra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default PartnersManagement;
