import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaGripVertical, FaImage, FaImages } from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';

const SlidersManagement = () => {
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSlider, setEditingSlider] = useState(null);
  const [formData, setFormData] = useState({
    title_id: '',
    title_en: '',
    subtitle_id: '',
    subtitle_en: '',
    link: '',
    order: 0,
    is_active: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [removeImage, setRemoveImage] = useState(false);

  useEffect(() => {
    void fetchSliders();
  }, []);

  const fetchSliders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/admin/sliders', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (data.success) {
        setSliders(data.data);
      }
    } catch (error) {
      console.error('Error fetching sliders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (slider = null) => {
    if (slider) {
      setEditingSlider(slider);
      setFormData({
        title_id: slider.title_id || '',
        title_en: slider.title_en || '',
        subtitle_id: slider.subtitle_id || '',
        subtitle_en: slider.subtitle_en || '',
        link: slider.link || '',
        order: slider.order,
        is_active: slider.is_active,
      });
      if (slider.image) {
        setImagePreview(`/storage/${slider.image}`);
      }
    } else {
      setEditingSlider(null);
      setFormData({
        title_id: '',
        title_en: '',
        subtitle_id: '',
        subtitle_en: '',
        link: '',
        order: 0,
        is_active: true,
      });
      setImagePreview(null);
    }
    setImageFile(null);
    setRemoveImage(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSlider(null);
    setErrors({});
    setSubmitError('');
    setRemoveImage(false);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2048000) {
        alert('Image size must be less than 2MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitError('');

    try {
      const formDataToSend = new FormData();

      // Append text fields (skip empty strings except order)
      Object.keys(formData).forEach(key => {
        if (key === 'is_active') {
          // Convert boolean to "1"/"0" — Laravel boolean validation doesn't accept "true"/"false"
          formDataToSend.append(key, formData[key] ? '1' : '0');
        } else if (key === 'order') {
          formDataToSend.append(key, formData[key]);
        } else if (formData[key] !== null && formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });

      if (imageFile) {
        formDataToSend.append('image', imageFile);
      } else if (removeImage) {
        formDataToSend.append('remove_image', '1');
      }

      const url = editingSlider
        ? `/api/v1/admin/sliders/${editingSlider.id}`
        : '/api/v1/admin/sliders';

      if (editingSlider) {
        formDataToSend.append('_method', 'PUT');
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formDataToSend,
      });

      const data = await response.json();
      if (data.success) {
        setRemoveImage(false);
        void fetchSliders();
        handleCloseModal();
      } else if (data.errors) {
        setErrors(data.errors);
      } else {
        setSubmitError(data.message || 'Terjadi kesalahan. Coba lagi.');
      }
    } catch (error) {
      console.error('Error saving slider:', error);
      setSubmitError('Gagal menghubungi server. Periksa koneksi Anda.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this slider?')) return;

    try {
      const response = await fetch(`/api/v1/admin/sliders/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (data.success) {
        void fetchSliders();
      }
    } catch (error) {
      console.error('Error deleting slider:', error);
    }
  };

  const activeCount = sliders.filter(s => s.is_active).length;

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
                <FaImages className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-black">Kelola Slider</h2>
                <p className="text-white/70 text-sm mt-0.5">Atur banner hero slider halaman utama website KAN</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex gap-2">
                <div className="text-center px-4 py-2.5 bg-white/15 rounded-xl border border-white/20">
                  <div className="text-xl font-black">{activeCount}</div>
                  <div className="text-white/70 text-xs font-semibold">Aktif</div>
                </div>
                <div className="text-center px-4 py-2.5 bg-white/10 rounded-xl border border-white/20">
                  <div className="text-xl font-black">{sliders.length}</div>
                  <div className="text-white/70 text-xs font-semibold">Total</div>
                </div>
              </div>
              <button
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-primary-700 rounded-xl font-bold text-sm hover:bg-white/90 transition-all shadow-md"
              >
                <FaPlus />
                Tambah Slider
              </button>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-full flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : sliders.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FaImages className="text-gray-400 text-2xl" />
              </div>
              <p className="text-gray-500 font-semibold mb-1">Belum ada slider</p>
              <button onClick={() => handleOpenModal()} className="text-sm text-primary-600 font-bold hover:underline">
                Buat slider pertama
              </button>
            </div>
          ) : (
            sliders.map((slider) => (
              <div
                key={slider.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all group"
              >
                {/* Image */}
                <div className="relative h-44 bg-gray-100">
                  {slider.image ? (
                    <img
                      src={`/storage/${slider.image}`}
                      alt={slider.title_id}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaImage className="text-5xl text-gray-300" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      slider.is_active ? 'bg-emerald-500 text-white' : 'bg-gray-500 text-white'
                    }`}>
                      {slider.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 bg-black/60 text-white rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-sm">
                      <FaGripVertical className="text-[10px]" />
                      {slider.order}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-black text-gray-900 text-sm line-clamp-1 mb-1">
                    {slider.title_id || <span className="text-gray-400 italic">Tanpa judul</span>}
                  </h3>
                  {slider.subtitle_id && (
                    <p className="text-xs text-gray-500 line-clamp-2">{slider.subtitle_id}</p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-1.5 pt-4 border-t border-gray-100 mt-4">
                    <button
                      onClick={() => handleOpenModal(slider)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-all text-xs font-bold"
                    >
                      <FaEdit /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(slider.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-all text-xs font-bold"
                    >
                      <FaTrash /> Hapus
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8 shadow-2xl">
            {/* Modal Header */}
            <div className="px-7 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-gray-900">
                  {editingSlider ? 'Edit Slider' : 'Tambah Slider Baru'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {editingSlider ? 'Perbarui informasi slider' : 'Isi detail slider baru'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                aria-label="Tutup"
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">
              {submitError && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {submitError}
                </div>
              )}

              {/* Image Upload */}
              <div>
                <p className="block text-sm font-bold text-gray-800 mb-2">Gambar Banner <span className="text-red-500">*</span></p>
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 group w-full">
                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreview(null); setRemoveImage(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm"
                      >
                        <FaTrash /> Hapus Gambar
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all group">
                    <FaImage className="text-3xl text-gray-300 group-hover:text-primary-400 mb-2 transition-colors" />
                    <span className="text-sm text-gray-500 font-semibold group-hover:text-primary-600">Klik untuk upload gambar</span>
                    <span className="text-xs text-gray-400 mt-1">JPG, PNG — Disarankan 1920×600px</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" required={!editingSlider} />
                  </label>
                )}
              </div>

              {/* Titles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="slider_title_id" className="block text-sm font-bold text-gray-800 mb-2">Judul (Indonesia) <span className="text-red-500">*</span></label>
                  <input
                    id="slider_title_id"
                    type="text"
                    value={formData.title_id}
                    onChange={(e) => setFormData({...formData, title_id: e.target.value})}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 text-sm bg-gray-50 focus:bg-white transition-colors ${errors.title_id ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                    required
                  />
                  {errors.title_id && <p className="text-red-500 text-xs mt-1">{errors.title_id[0]}</p>}
                </div>
                <div>
                  <label htmlFor="slider_title_en" className="block text-sm font-bold text-gray-800 mb-2">Judul (Inggris)</label>
                  <input
                    id="slider_title_en"
                    type="text"
                    value={formData.title_en}
                    onChange={(e) => setFormData({...formData, title_en: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 text-sm bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Subtitles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="slider_subtitle_id" className="block text-sm font-bold text-gray-800 mb-2">Subjudul (Indonesia)</label>
                  <textarea
                    id="slider_subtitle_id"
                    value={formData.subtitle_id}
                    onChange={(e) => setFormData({...formData, subtitle_id: e.target.value})}
                    rows="2"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 text-sm bg-gray-50 focus:bg-white transition-colors resize-none"
                  />
                </div>
                <div>
                  <label htmlFor="slider_subtitle_en" className="block text-sm font-bold text-gray-800 mb-2">Subjudul (Inggris)</label>
                  <textarea
                    id="slider_subtitle_en"
                    value={formData.subtitle_en}
                    onChange={(e) => setFormData({...formData, subtitle_en: e.target.value})}
                    rows="2"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 text-sm bg-gray-50 focus:bg-white transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Link + Order + Active */}
              <div>
                <label htmlFor="slider_link" className="block text-sm font-bold text-gray-800 mb-2">URL Tautan <span className="text-gray-400 font-normal">(Opsional)</span></label>
                <input
                  id="slider_link"
                  type="text"
                  value={formData.link}
                  onChange={(e) => setFormData({...formData, link: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 text-sm bg-gray-50 focus:bg-white transition-colors"
                  placeholder="/proses-akreditasi atau https://example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <label htmlFor="slider_order" className="block text-sm font-bold text-gray-800 mb-2">Urutan Tampil</label>
                  <input
                    id="slider_order"
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({...formData, order: Number.parseInt(e.target.value, 10)})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 text-sm bg-gray-50 focus:bg-white transition-colors"
                    min="0"
                  />
                </div>
                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-sm font-bold text-gray-700">{formData.is_active ? 'Aktif' : 'Nonaktif'}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.is_active}
                    aria-label="Status slider aktif"
                    onClick={() => setFormData({...formData, is_active: !formData.is_active})}
                    className={`relative inline-flex w-11 h-6 rounded-full border-0 p-0 transition-colors ${formData.is_active ? 'bg-primary-600' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-1'}`}></span>
                  </button>
                </div>
              </div>

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
                  {editingSlider ? 'Simpan Perubahan' : 'Buat Slider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default SlidersManagement;
