import { useState, useEffect } from 'react';
import {
  FaSave,
  FaImage,
  FaCog,
  FaCheckCircle,
  FaExclamationCircle,
  FaEnvelope,
  FaKey,
  FaUserTie,
  FaExternalLinkAlt,
  FaShieldAlt,
  FaEye,
  FaEyeSlash,
  FaTimesCircle,
  FaTrash,
} from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { setStoredSiteLogo } from '../../utils/siteLogo';

const groupLabels = {
  general: 'Umum',
  contact: 'Kontak',
  social: 'Media Sosial',
  seo: 'SEO',
  appearance: 'Tampilan',
  mail: 'Email Balasan',
};

const keyLabels = {
  // General
  site_name_id: 'Nama Website',
  site_logo: 'Logo Website',
  // Contact
  contact_address: 'Alamat',
  contact_phone: 'Telepon',
  contact_email: 'Email',
  whatsapp_number: 'Nomor WhatsApp',
  maps_embed: 'URL Embed Google Maps',
  social_facebook: 'Facebook',
  social_twitter: 'Twitter / X',
  social_instagram: 'Instagram',
  social_youtube: 'YouTube',
  // About
  vision_id: 'Visi',
  mission_id: 'Misi',
  history_id: 'Sejarah',
};

const mailFieldDefs = [
  { key: 'mail_username', label: 'Gmail Pengirim', placeholder: 'contoh@gmail.com', type: 'email' },
  { key: 'mail_password', label: 'App Password Gmail', placeholder: 'xxxx xxxx xxxx xxxx', type: 'password' },
  { key: 'mail_from_name', label: 'Nama Pengirim', placeholder: 'Komite Akreditasi Nasional', type: 'text' },
];

const SettingsManagement = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [activeGroup, setActiveGroup] = useState('general');
  const [groups, setGroups] = useState([]);

  const [mailSettings, setMailSettings] = useState({
    mail_username: '',
    mail_password: '',
    mail_from_name: '',
  });
  const [mailSaving, setMailSaving] = useState(false);
  const [mailMsg, setMailMsg] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const isMailGroup = activeGroup === 'mail';

  useEffect(() => {
    fetchGroups();
    fetchSettings();
    fetchMailSettings();
  }, []);

  const fetchMailSettings = async () => {
    try {
      const { data } = await api.get('/admin/settings?group=mail');

      if (data.success && Array.isArray(data.data)) {
        setMailSettings({
          mail_username: data.data.find(x => x.key === 'mail_username')?.value_id || '',
          mail_password: data.data.find(x => x.key === 'mail_password')?.value_id || '',
          mail_from_name: data.data.find(x => x.key === 'mail_from_name')?.value_id || '',
        });
      }
    } catch {}
  };

  const saveMailSettings = async () => {
    setMailSaving(true);
    setMailMsg(null);

    try {
      const payload = Object.entries(mailSettings).map(([key, value_id]) => ({ key, value_id }));
      const { data } = await api.post('/admin/settings/bulk-update', { settings: payload });

      if (data.success) {
        setMailMsg({ type: 'success', text: 'Pengaturan email berhasil disimpan.' });
      } else {
        setMailMsg({ type: 'error', text: 'Gagal menyimpan pengaturan.' });
      }
    } catch {
      setMailMsg({ type: 'error', text: 'Gagal menyimpan pengaturan.' });
    } finally {
      setMailSaving(false);
      setTimeout(() => setMailMsg(null), 3000);
    }
  };

  const resetMailSettings = async () => {
    setMailSaving(true);
    setMailMsg(null);
    const empty = { mail_username: '', mail_password: '', mail_from_name: '' };
    try {
      const payload = Object.entries(empty).map(([key, value_id]) => ({ key, value_id }));
      const { data } = await api.post('/admin/settings/bulk-update', { settings: payload });
      if (data.success) {
        setMailSettings(empty);
        setConfirmReset(false);
        setMailMsg({ type: 'success', text: 'Pengaturan email berhasil dikosongkan.' });
      } else {
        setMailMsg({ type: 'error', text: 'Gagal mengosongkan pengaturan.' });
      }
    } catch {
      setMailMsg({ type: 'error', text: 'Gagal mengosongkan pengaturan.' });
    } finally {
      setMailSaving(false);
      setTimeout(() => setMailMsg(null), 3000);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await api.get('/admin/settings/groups');
      const data = response.data;

      if (data.success) {
        const fetchedGroups = data.data || [];
        const nextGroups = fetchedGroups.includes('mail')
          ? fetchedGroups
          : [...fetchedGroups, 'mail'];

        setGroups(nextGroups);

        if (!nextGroups.includes(activeGroup)) {
          setActiveGroup(nextGroups[0] || 'general');
        }
      }
    } catch (err) {
      console.error('SettingsManagement error:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/settings');
      const data = response.data;

      if (data.success) {
        setSettings(data.data);
      }
    } catch (err) {
      console.error('SettingsManagement error:', err);
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

      const response = await api.post('/admin/settings/upload-image', formData);
      const data = response.data;

      if (data.success) {
        if (key === 'site_logo') {
          setStoredSiteLogo(data.data?.url || resolveMediaUrl(data.data?.path));
        }
        fetchSettings();
        setSaveMsg({ type: 'success', text: 'Gambar berhasil diupload!' });
      } else {
        setSaveMsg({ type: 'error', text: 'Gagal mengupload gambar' });
      }
    } catch (err) {
      console.error('Settings upload error:', err);
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

      const response = await api.post('/admin/settings/bulk-update', { settings: settingsToUpdate });
      const data = response.data;

      if (data.success) {
        setSaveMsg({ type: 'success', text: 'Pengaturan berhasil disimpan!' });
        fetchSettings();
      } else {
        setSaveMsg({ type: 'error', text: 'Gagal menyimpan pengaturan' });
      }
    } catch (err) {
      console.error('Settings save error:', err);
      setSaveMsg({ type: 'error', text: 'Terjadi kesalahan, coba lagi' });
    } finally {
      setSaving(false);
    }
  };

  const filteredSettings = settings.filter(s => s.group === activeGroup && activeGroup !== 'mail');
  const primarySaveAction = isMailGroup ? saveMailSettings : handleSave;
  const primarySaving = isMailGroup ? mailSaving : saving;
  const primarySaveLabel = isMailGroup
    ? (mailSaving ? 'Menyimpan...' : 'Simpan Pengaturan Email')
    : (saving ? 'Menyimpan...' : 'Simpan Perubahan');

  const renderSaveMessage = () => {
    if (!saveMsg) return null;

    return (
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold mb-6 ${
        saveMsg.type === 'success'
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : 'bg-red-50 text-red-700 border border-red-200'
      }`}>
        {saveMsg.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
        {saveMsg.text}
      </div>
    );
  };

  const renderSettingInput = (setting) => {
    if (setting.key === 'maps_embed') {
      return (
        <div>
          <textarea
            value={setting.value_id || ''}
            onChange={(e) => handleChange(setting.key, 'value_id', e.target.value)}
            rows="3"
            placeholder="Tempel URL embed Google Maps di sini..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 text-sm bg-gray-50 focus:bg-white transition-colors resize-none font-mono"
          />
          <p className="text-xs text-gray-400 mt-2">
            Buka Google Maps - cari lokasi - klik <strong>Bagikan</strong> - <strong>Sematkan peta</strong> - salin nilai atribut <code className="bg-gray-100 px-1 rounded">src="..."</code> dari kode iframe, lalu tempel di sini.
          </p>
        </div>
      );
    }

    if (setting.type === 'image') {
      return (
        <div className="space-y-3">
          {setting.value_id && (
            <img
              src={resolveMediaUrl(setting.value_id)}
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
      );
    }

    if (setting.type === 'textarea') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-gray-400 font-semibold mb-1.5">ID Indonesia</div>
            <textarea
              value={setting.value_id || ''}
              onChange={(e) => handleChange(setting.key, 'value_id', e.target.value)}
              rows="4"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 text-sm bg-gray-50 focus:bg-white transition-colors resize-none"
            />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-semibold mb-1.5">GB English</div>
            <textarea
              value={setting.value_en || ''}
              onChange={(e) => handleChange(setting.key, 'value_en', e.target.value)}
              rows="4"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 text-sm bg-gray-50 focus:bg-white transition-colors resize-none"
            />
          </div>
        </div>
      );
    }

    if (setting.type === 'boolean') {
      return (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 w-64">
          <span className="text-sm font-semibold text-gray-700">
            {setting.value_id === '1' || setting.value_id === 'true' ? 'Diaktifkan' : 'Dinonaktifkan'}
          </span>
          <div
            onClick={() => handleChange(
              setting.key,
              'value_id',
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
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-gray-400 font-semibold mb-1.5">ID Indonesia</div>
          <input
            type="text"
            value={setting.value_id || ''}
            onChange={(e) => handleChange(setting.key, 'value_id', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 text-sm bg-gray-50 focus:bg-white transition-colors"
          />
        </div>
        <div>
          <div className="text-xs text-gray-400 font-semibold mb-1.5">GB English</div>
          <input
            type="text"
            value={setting.value_en || ''}
            onChange={(e) => handleChange(setting.key, 'value_en', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 text-sm bg-gray-50 focus:bg-white transition-colors"
          />
        </div>
      </div>
    );
  };

  const renderGeneralSettingsSection = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    if (filteredSettings.length === 0) {
      return (
        <div className="text-center py-16 text-gray-500">
          <FaCog className="text-4xl text-gray-300 mx-auto mb-3" />
          <p className="font-semibold">Tidak ada pengaturan di grup ini</p>
        </div>
      );
    }

    return (
      <div className="space-y-7">
        {filteredSettings.map((setting) => (
          <div key={setting.key} className="border-b border-gray-100 pb-7 last:border-0 last:pb-0">
            <label className="block text-sm font-bold text-gray-800 mb-3">
              {keyLabels[setting.key] || setting.key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </label>

            {renderSettingInput(setting)}
          </div>
        ))}
      </div>
    );
  };

  const renderMailSettingsSection = () => (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
            <FaEnvelope />
          </div>
          <div>
            <h4 className="text-lg font-black text-slate-900">Konfigurasi Akun Pengirim</h4>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Gunakan akun Gmail khusus pengirim dan <span className="font-semibold">App Password</span>, bukan password utama akun.
            </p>
            <a
              href="https://myaccount.google.com/apppasswords"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 text-sm font-semibold text-primary-700 hover:text-primary-800"
            >
              Buka halaman App Password Gmail
              <FaExternalLinkAlt className="text-xs" />
            </a>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {mailFieldDefs.map(({ key, label, placeholder, type }) => {
            const iconMap = {
              mail_username: FaEnvelope,
              mail_password: FaKey,
              mail_from_name: FaUserTie,
            };
            const Icon = iconMap[key] || FaCog;

            return (
              <div key={key} className={key === 'mail_from_name' ? 'md:col-span-2' : ''}>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  <Icon className="text-slate-400 text-[11px]" />
                  {label}
                </label>
                {key === 'mail_password' ? (
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={mailSettings[key]}
                      onChange={e => setMailSettings(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full px-4 py-2.5 pr-11 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white font-mono tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                      title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                ) : (
                  <input
                    type={type}
                    value={mailSettings[key]}
                    onChange={e => setMailSettings(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
          <button
            onClick={saveMailSettings}
            disabled={mailSaving}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
          >
            <FaSave />
            {mailSaving ? 'Menyimpan...' : 'Simpan Pengaturan Email'}
          </button>

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              disabled={mailSaving || (!mailSettings.mail_username && !mailSettings.mail_password && !mailSettings.mail_from_name)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-red-300 text-red-600 text-sm font-bold rounded-xl hover:bg-red-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FaTrash className="text-xs" />
              Reset / Kosongkan Email
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl">
              <FaTimesCircle className="text-red-500 shrink-0" />
              <span className="text-sm text-red-700 font-semibold">Yakin ingin mengosongkan semua pengaturan email?</span>
              <button
                type="button"
                onClick={resetMailSettings}
                disabled={mailSaving}
                className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                Ya, Kosongkan
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-3 py-1 border border-gray-300 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-100 transition"
              >
                Batal
              </button>
            </div>
          )}

          {mailMsg && (
            <div className={`inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl ${mailMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
              {mailMsg.type === 'success' ? <FaCheckCircle className="shrink-0" /> : <FaExclamationCircle className="shrink-0" />}
              {mailMsg.text}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm h-fit">
        <div className="flex items-center gap-2 text-amber-800 mb-3">
          <FaShieldAlt />
          <p className="font-bold text-sm">Panduan App Password</p>
        </div>

        <ol className="space-y-2 text-sm text-amber-800">
          <li><span className="font-semibold">1.</span> Login ke akun Google yang ingin digunakan.</li>
          <li><span className="font-semibold">2.</span> Buka <strong>myaccount.google.com/apppasswords</strong>.</li>
          <li><span className="font-semibold">3.</span> Beri nama (contoh: \"KAN Admin\"), lalu klik <strong>Buat</strong>.</li>
          <li><span className="font-semibold">4.</span> Salin 16 karakter, kemudian tempel ke kolom App Password.</li>
        </ol>

        <div className="mt-4 rounded-xl bg-amber-100/70 border border-amber-200 px-3 py-2 text-xs text-amber-900">
          Pastikan fitur <strong>2-Step Verification</strong> sudah aktif di akun Google tersebut.
        </div>
      </div>
    </div>
  );

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
                <h2 className="text-2xl font-black">Pengaturan Website</h2>
                <p className="text-white/70 text-sm mt-0.5">Konfigurasi tampilan dan informasi website KAN</p>
              </div>
            </div>
            <button
              onClick={primarySaveAction}
              disabled={primarySaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-primary-700 rounded-xl font-bold text-sm hover:bg-white/90 transition-all shadow-md disabled:opacity-60"
            >
              <FaSave />
              {primarySaveLabel}
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
                    {isMailGroup ? '3 pengaturan tersedia' : `${filteredSettings.length} pengaturan tersedia`}
                  </p>
                </div>
              </div>

              <div className="p-7">
                {isMailGroup ? (
                  renderMailSettingsSection()
                ) : (
                  <>
                    {renderSaveMessage()}
                    {renderGeneralSettingsSection()}
                  </>
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
