import { useState, useEffect } from 'react';
import { FaSave, FaImage, FaCog, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';

const groupLabels = {
  general: 'Umum',
  contact: 'Kontak',
  social: 'Media Sosial',
  seo: 'SEO',
  appearance: 'Tampilan',
  about: 'Tentang KAN',
};

const keyLabels = {
  site_name_id: 'Nama Website',
  site_logo: 'Logo Website',
  vision_id: 'Visi',
  mission_id: 'Misi',
  history_id: 'Sejarah',
  contact_address: 'Alamat',
  contact_phone: 'Telepon',
  contact_email: 'Email',
  contact_inbox_email: 'Email penerima pesan masuk',
  social_facebook: 'Facebook',
  social_twitter: 'Twitter / X',
  social_instagram: 'Instagram',
  social_youtube: 'YouTube',
};

const SettingsManagement = ({ socialOnly = false }) => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [activeGroup, setActiveGroup] = useState(socialOnly ? 'social' : 'general');
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    if (socialOnly) {
      setGroups(['social']);
      setActiveGroup('social');
    } else {
      fetchGroups();
    }
    fetchSettings();
  }, [socialOnly]);

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/v1/admin/settings/groups', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (data.success) {
        setGroups(data.data);
        if (data.data.length > 0) {
          setActiveGroup(data.data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(socialOnly ? '/api/v1/admin/social-settings' : '/api/v1/admin/settings', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, field, value) => {
    setSettings(settings.map(s =>
      s.key === key ? { ...s, [field]: value } : s
    ));
  };

  const handleImageUpload = async (key, file) => {
    try {
      const formData = new FormData();
      formData.append('key', key);
      formData.append('image', file);
      formData.append('group', activeGroup);

      const response = await fetch('/api/v1/admin/settings/upload-image', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        fetchSettings();
        setSaveMsg({ type: 'success', text: 'Gambar berhasil diupload!' });
      } else {
        setSaveMsg({ type: 'error', text: 'Gagal mengupload gambar' });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setSaveMsg({ type: 'error', text: 'Terjadi kesalahan saat upload' });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveMsg(null);
      const settingsToUpdate = settings
        .filter(s => s.group === activeGroup)
        .map(s => ({
          key: s.key,
          value_id: s.value_id,
          value_en: s.value_en || null,
        }));

      const response = await fetch(
        socialOnly ? '/api/v1/admin/social-settings/bulk-update' : '/api/v1/admin/settings/bulk-update',
        {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: settingsToUpdate }),
        },
      );

      const data = await response.json();
      if (data.success) {
        setSaveMsg({ type: 'success', text: 'Pengaturan berhasil disimpan!' });
        fetchSettings();
      } else {
        setSaveMsg({ type: 'error', text: 'Gagal menyimpan pengaturan' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMsg({ type: 'error', text: 'Terjadi kesalahan, coba lagi' });
    } finally {
      setSaving(false);
    }
  };

  const filteredSettings = settings.filter(s => s.group === activeGroup);

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
                <FaCog className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-black">{socialOnly ? 'Media Sosial' : 'Pengaturan Website'}</h2>
                <p className="text-white/70 text-sm mt-0.5">{socialOnly ? 'Kelola tautan media sosial KAN' : 'Konfigurasi tampilan dan informasi website KAN'}</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-primary-700 rounded-xl font-bold text-sm hover:bg-white/90 transition-all shadow-md disabled:opacity-60"
            >
              <FaSave />
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>

        <div className="flex gap-6 items-start">
          {/* Groups Sidebar */}
          <div className="w-56 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
            <div className="px-4 py-4 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Grup Pengaturan</p>
            </div>
            <div className="p-2">
              {groups.map((group) => (
                <button
                  key={group}
                  onClick={() => { setActiveGroup(group); setSaveMsg(null); }}
                  className={`w-full text-left px-4 py-3 rounded-xl font-semibold text-sm transition-all mb-1 ${
                    activeGroup === group
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {groupLabels[group] || group.charAt(0).toUpperCase() + group.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Settings Form */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Form Header */}
              <div className="px-7 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-gray-900">
                    {groupLabels[activeGroup] || activeGroup}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {filteredSettings.length} pengaturan tersedia
                  </p>
                </div>
              </div>

              <div className="p-7">
                {/* Save Message */}
                {saveMsg && (
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold mb-6 ${
                    saveMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {saveMsg.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
                    {saveMsg.text}
                  </div>
                )}

                {loading ? (
                  <div className="flex justify-center py-16">
                    <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : filteredSettings.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <FaCog className="text-4xl text-gray-300 mx-auto mb-3" />
                    <p className="font-semibold">Tidak ada pengaturan di grup ini</p>
                  </div>
                ) : (
                  <div className="space-y-7">
                    {filteredSettings.map((setting) => (
                      <div key={setting.key} className="border-b border-gray-100 pb-7 last:border-0 last:pb-0">
                        <label className="block text-sm font-bold text-gray-800 mb-3">
                          {keyLabels[setting.key] || setting.key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </label>

                        {setting.type === 'image' ? (
                          <div className="space-y-3">
                            {setting.value_id && (
                              <img
                                src={`/storage/${setting.value_id}`}
                                alt={setting.key}
                                className="max-w-xs h-28 object-contain border border-gray-200 rounded-xl p-2 bg-gray-50"
                              />
                            )}
                            <label className="flex items-center gap-3 px-4 py-3 w-fit border border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all group">
                              <FaImage className="text-gray-300 group-hover:text-primary-400 transition-colors" />
                              <span className="text-sm text-gray-500 font-semibold group-hover:text-primary-600">
                                {setting.value_id ? 'Ganti Gambar' : 'Upload Gambar'}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) handleImageUpload(setting.key, file);
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>
                        ) : setting.type === 'textarea' ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <div className="text-xs text-gray-400 font-semibold mb-1.5">🇮🇩 Indonesia</div>
                              <textarea
                                value={setting.value_id || ''}
                                onChange={(e) => handleChange(setting.key, 'value_id', e.target.value)}
                                rows="4"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 text-sm bg-gray-50 focus:bg-white transition-colors resize-none"
                              />
                            </div>
                            <div>
                              <div className="text-xs text-gray-400 font-semibold mb-1.5">🇬🇧 English</div>
                              <textarea
                                value={setting.value_en || ''}
                                onChange={(e) => handleChange(setting.key, 'value_en', e.target.value)}
                                rows="4"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 text-sm bg-gray-50 focus:bg-white transition-colors resize-none"
                              />
                            </div>
                          </div>
                        ) : setting.type === 'boolean' ? (
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 w-64">
                            <span className="text-sm font-semibold text-gray-700">
                              {setting.value_id === '1' || setting.value_id === 'true' ? 'Diaktifkan' : 'Dinonaktifkan'}
                            </span>
                            <div
                              onClick={() => handleChange(setting.key, 'value_id',
                                (setting.value_id === '1' || setting.value_id === 'true') ? '0' : '1'
                              )}
                              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                                (setting.value_id === '1' || setting.value_id === 'true') ? 'bg-primary-600' : 'bg-gray-300'
                              }`}
                            >
                              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                (setting.value_id === '1' || setting.value_id === 'true') ? 'translate-x-6' : 'translate-x-1'
                              }`}></span>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <div className="text-xs text-gray-400 font-semibold mb-1.5">🇮🇩 Indonesia</div>
                              <input
                                    type={setting.key.endsWith('_email') ? 'email' : 'text'}
                                value={setting.value_id || ''}
                                onChange={(e) => handleChange(setting.key, 'value_id', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 text-sm bg-gray-50 focus:bg-white transition-colors"
                              />
                            </div>
                            <div>
                              <div className="text-xs text-gray-400 font-semibold mb-1.5">🇬🇧 English</div>
                              <input
                                type="text"
                                value={setting.value_en || ''}
                                onChange={(e) => handleChange(setting.key, 'value_en', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 text-sm bg-gray-50 focus:bg-white transition-colors"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SettingsManagement;
