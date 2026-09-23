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
        setErrors(prev => ({ ...prev, image: 'Image size must be less than 2MB' }));
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
      if (!contentType || !contentType.includes('application/json')) {
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
      } else {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          alert(`Gagal menyimpan: ${data.message || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error saving news:', error);
      alert(`Terjadi kesalahan: ${error.message}\n\nCek browser console (F12) untuk detail.`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto my-8">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <div>
            <h3 className="text-2xl font-black text-gray-900">
              {news ? 'Edit News' : 'Add News'}
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              Fill in the form below to {news ? 'update' : 'create'} news
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaTimes className="text-xl text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Category */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Category *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value="news"
                  checked={formData.category === 'news'}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="font-semibold">News</span>
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
                <span className="font-semibold">Announcement</span>
              </label>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Featured Image
            </label>
            <div className="space-y-3">
              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-w-md h-48 object-cover rounded-xl border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <FaTrash />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <FaImage className="text-4xl text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600 font-semibold">Click to upload image</span>
                  <span className="text-xs text-gray-500 mt-1">Max 2MB (JPG, PNG, WEBP)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
              {errors.image && (
                <p className="text-red-600 text-sm">{errors.image}</p>
              )}
            </div>
          </div>

          {/* Title - Indonesian */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Title (Indonesian) *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter news title in Indonesian"
              required
            />
            {errors.title && (
              <p className="text-red-600 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Title - English */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Title (English)
            </label>
            <input
              type="text"
              name="title_en"
              value={formData.title_en}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter news title in English"
            />
          </div>

          {/* Excerpt - Indonesian */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Excerpt (Indonesian)
            </label>
            <textarea
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Short summary of the news"
            />
          </div>

          {/* Excerpt - English */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Excerpt (English)
            </label>
            <textarea
              name="excerpt_en"
              value={formData.excerpt_en}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Short summary in English"
            />
          </div>

          {/* Content - Indonesian */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Content (Indonesian) *
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows="10"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
              placeholder="Full content in Indonesian"
              required
            />
            {errors.content && (
              <p className="text-red-600 text-sm mt-1">{errors.content}</p>
            )}
          </div>

          {/* Content - English */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Content (English)
            </label>
            <textarea
              name="content_en"
              value={formData.content_en}
              onChange={handleChange}
              rows="10"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
              placeholder="Full content in English"
            />
          </div>

          {/* Published Date */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Publish Date
            </label>
            <input
              type="date"
              name="published_at"
              value={formData.published_at}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty to save as draft</p>
          </div>

          {/* SEO Section */}
          <div className="border-t pt-6">
            <h4 className="text-lg font-black text-gray-900 mb-4">SEO Settings</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Meta Title
                </label>
                <input
                  type="text"
                  name="meta_title"
                  value={formData.meta_title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="SEO title for search engines"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Meta Description
                </label>
                <textarea
                  name="meta_description"
                  value={formData.meta_description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="SEO description"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Meta Keywords
                </label>
                <input
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
          <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-6 -mb-6 px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-bold hover:scale-105 transition-all shadow-lg hover:shadow-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (news ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewsFormModal;
