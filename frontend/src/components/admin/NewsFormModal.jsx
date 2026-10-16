import { useState, useEffect } from 'react';
import { FaTimes, FaImage, FaTrash } from 'react-icons/fa';

const NewsFormModal = ({ isOpen, onClose, news, onSaved }) => {
  const [formData, setFormData] = useState({
    title: '',
    title_en: '',
    excerpt: '',
    excerpt_en: '',
    content: '',
    content_en: '',
    category: 'news',
    published_at: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (news) {
      setFormData({
        title: news.title_id || news.title || '',
        title_en: news.title_en || '',
        excerpt: news.excerpt_id || news.excerpt || '',
        excerpt_en: news.excerpt_en || '',
        content: news.content_id || news.content || '',
        content_en: news.content_en || '',
        category: news.category || 'news',
        published_at: news.published_at ? news.published_at.split('T')[0] : '',
        meta_title: news.meta_title || '',
        meta_description: news.meta_description || '',
        meta_keywords: news.meta_keywords || '',
      });
      if (news.image) {
        setImagePreview(`/storage/${news.image}`);
      }
    } else {
      resetForm();
    }
  }, [news]);

  const resetForm = () => {
    setFormData({
      title: '',
      title_en: '',
      excerpt: '',
      excerpt_en: '',
      content: '',
      content_en: '',
      category: 'news',
      published_at: '',
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
    });
    setImageFile(null);
    setImagePreview(null);
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2048000) { // 2MB
        setErrors(prev => ({ ...prev, image: 'Ukuran gambar harus kurang dari 2MB' }));
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setErrors(prev => ({ ...prev, image: null }));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);

      if (!token) {
        alert('Sesi Anda telah berakhir. Silakan login ulang.');
        window.location.href = '/admin/login';
        return;
      }

      const formDataToSend = new FormData();
      
      // Append all text fields
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Append image if exists
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      const url = news 
        ? `/api/v1/admin/news/${news.id}`
        : '/api/v1/admin/news';
      
      if (news) {
        formDataToSend.append('_method', 'PUT');
      }

      console.log('Submitting to:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formDataToSend,
      });

      console.log('Response status:', response.status);

      // Handle 401 - session expired
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        alert('Sesi Anda telah berakhir. Silakan login ulang.');
        window.location.href = '/admin/login';
        return;
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 1000));
        alert(`Server error (${response.status}): Server tidak mengembalikan JSON.\nCek browser console (F12) dan backend log.`);
        return;
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        onSaved();
        onClose();
        resetForm();
      } else if (data.errors) {
        setErrors(data.errors);
      } else {
        alert(`Gagal menyimpan: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving news:', error);
      alert(`Terjadi kesalahan: ${error.message}\n\nCek browser console (F12) untuk detail.`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Label tombol simpan: sedang menyimpan, mode edit, atau mode tambah
  let submitLabel = 'Simpan';
  if (loading) {
    submitLabel = 'Menyimpan...';
  } else if (news) {
    submitLabel = 'Perbarui';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/50">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto my-8">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-white border-b border-gray-200">
          <div>
            <h3 className="text-2xl font-black text-gray-900">
              {news ? 'Edit Berita' : 'Tambah Berita'}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {news
                ? 'Lengkapi formulir di bawah ini untuk memperbarui berita'
                : 'Lengkapi formulir di bawah ini untuk menambahkan berita'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="p-2 transition-colors rounded-lg hover:bg-gray-100"
          >
            <FaTimes className="text-xl text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Category (grup radio, bukan satu kontrol, jadi memakai <p> + radiogroup) */}
          <div>
            <p id="news_category_label" className="block mb-2 text-sm font-bold text-gray-700">
              Kategori *
            </p>
            <div className="flex gap-4" role="radiogroup" aria-labelledby="news_category_label">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value="news"
                  checked={formData.category === 'news'}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="font-semibold">Berita</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value="announcement"
                  checked={formData.category === 'announcement'}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="font-semibold">Pengumuman</span>
              </label>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <p className="block mb-2 text-sm font-bold text-gray-700">
              Gambar Utama
            </p>
            <div className="space-y-3">
              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="object-cover w-full h-48 max-w-md border-2 border-gray-200 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    aria-label="Hapus gambar"
                    className="absolute p-2 text-white transition-colors bg-red-600 rounded-lg top-2 right-2 hover:bg-red-700"
                  >
                    <FaTrash />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 transition-colors border-2 border-gray-300 border-dashed cursor-pointer rounded-xl hover:bg-gray-50">
                  <FaImage className="mb-2 text-4xl text-gray-400" />
                  <span className="text-sm font-semibold text-gray-600">Klik untuk mengunggah gambar</span>
                  <span className="mt-1 text-xs text-gray-500">Maks. 2MB (JPG, PNG, WEBP)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
              {errors.image && (
                <p className="text-sm text-red-600">{errors.image}</p>
              )}
            </div>
          </div>

          {/* Title - Indonesian */}
          <div>
            <label htmlFor="news_title" className="block mb-2 text-sm font-bold text-gray-700">
              Judul (Bahasa Indonesia) *
            </label>
            <input
              id="news_title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Masukkan judul berita dalam Bahasa Indonesia"
              required
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Title - English */}
          <div>
            <label htmlFor="news_title_en" className="block mb-2 text-sm font-bold text-gray-700">
              Judul (Bahasa Inggris)
            </label>
            <input
              id="news_title_en"
              type="text"
              name="title_en"
              value={formData.title_en}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Masukkan judul berita dalam Bahasa Inggris"
            />
          </div>

          {/* Excerpt - Indonesian */}
          <div>
            <label htmlFor="news_excerpt" className="block mb-2 text-sm font-bold text-gray-700">
              Ringkasan (Bahasa Indonesia)
            </label>
            <textarea
              id="news_excerpt"
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Ringkasan singkat berita"
            />
          </div>

          {/* Excerpt - English */}
          <div>
            <label htmlFor="news_excerpt_en" className="block mb-2 text-sm font-bold text-gray-700">
              Ringkasan (Bahasa Inggris)
            </label>
            <textarea
              id="news_excerpt_en"
              name="excerpt_en"
              value={formData.excerpt_en}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Ringkasan singkat dalam Bahasa Inggris"
            />
          </div>

          {/* Content - Indonesian */}
          <div>
            <label htmlFor="news_content" className="block mb-2 text-sm font-bold text-gray-700">
              Konten (Bahasa Indonesia) *
            </label>
            <textarea
              id="news_content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows="10"
              className="w-full px-4 py-3 font-mono text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Isi lengkap berita dalam Bahasa Indonesia"
              required
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content}</p>
            )}
          </div>

          {/* Content - English */}
          <div>
            <label htmlFor="news_content_en" className="block mb-2 text-sm font-bold text-gray-700">
              Konten (Bahasa Inggris)
            </label>
            <textarea
              id="news_content_en"
              name="content_en"
              value={formData.content_en}
              onChange={handleChange}
              rows="10"
              className="w-full px-4 py-3 font-mono text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Isi lengkap berita dalam Bahasa Inggris"
            />
          </div>

          {/* Published Date */}
          <div>
            <label htmlFor="news_published_at" className="block mb-2 text-sm font-bold text-gray-700">
              Tanggal Publikasi
            </label>
            <input
              id="news_published_at"
              type="date"
              name="published_at"
              value={formData.published_at}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">Kosongkan untuk menyimpan sebagai draft</p>
          </div>

          {/* SEO Section */}
          <div className="pt-6 border-t">
            <h4 className="mb-4 text-lg font-black text-gray-900">Pengaturan SEO</h4>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="news_meta_title" className="block mb-2 text-sm font-bold text-gray-700">
                  Meta Title
                </label>
                <input
                  id="news_meta_title"
                  type="text"
                  name="meta_title"
                  value={formData.meta_title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Judul SEO untuk mesin pencari"
                />
              </div>

              <div>
                <label htmlFor="news_meta_description" className="block mb-2 text-sm font-bold text-gray-700">
                  Meta Description
                </label>
                <textarea
                  id="news_meta_description"
                  name="meta_description"
                  value={formData.meta_description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Deskripsi SEO"
                />
              </div>

              <div>
                <label htmlFor="news_meta_keywords" className="block mb-2 text-sm font-bold text-gray-700">
                  Meta Keywords
                </label>
                <input
                  id="news_meta_keywords"
                  type="text"
                  name="meta_keywords"
                  value={formData.meta_keywords}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 flex justify-end gap-3 px-6 py-4 -mx-6 -mb-6 bg-white border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 font-bold text-gray-700 transition-all border-2 border-gray-300 rounded-xl hover:bg-gray-50"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 font-bold text-white transition-all shadow-lg bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl hover:scale-105 hover:shadow-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewsFormModal;
