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
