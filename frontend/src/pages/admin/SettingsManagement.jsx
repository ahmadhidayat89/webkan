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

const groupLabels = {
  general: 'Umum',
  contact: 'Kontak',
  seo: 'SEO',
  appearance: 'Tampilan',
  about: 'Tentang KAN',
  mail: 'Email Balasan',
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
};

const mailFieldDefs = [
  {
    key: 'mail_username',
    label: 'Gmail Pengirim',
    placeholder: 'contoh@gmail.com',
    type: 'email',
  },
  {
    key: 'mail_password',
    label: 'App Password Gmail',
    placeholder: 'xxxx xxxx xxxx xxxx',
    type: 'password',
  },
  {
    key: 'mail_from_name',
    label: 'Nama Pengirim',
    placeholder: 'Komite Akreditasi Nasional',
    type: 'text',
  },
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

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/v1/admin/settings/groups', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        const fetchedGroups = data.data || [];

        // Hapus social dari daftar grup
        const filteredGroups = fetchedGroups.filter(
          (group) => group !== 'social'
        );

        // Tambahkan mail kalau belum ada
        const nextGroups = filteredGroups.includes('mail')
          ? filteredGroups
          : [...filteredGroups, 'mail'];

        setGroups(nextGroups);

        if (!nextGroups.includes(activeGroup)) {
          setActiveGroup(nextGroups[0] || 'general');
        }
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/v1/admin/settings', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        // Social tidak ditampilkan di halaman Settings
        const filteredData = (data.data || []).filter(
          (setting) => setting.group !== 'social'
        );

        setSettings(filteredData);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMailSettings = async () => {
    try {
      const response = await fetch('/api/v1/admin/settings?group=mail', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setMailSettings({
          mail_username:
            data.data.find((item) => item.key === 'mail_username')?.value_id ||
            '',
          mail_password:
            data.data.find((item) => item.key === 'mail_password')?.value_id ||
            '',
          mail_from_name:
            data.data.find((item) => item.key === 'mail_from_name')?.value_id ||
            '',
        });
      }
    } catch (error) {
      console.error('Error fetching mail settings:', error);
    }
  };

  const handleChange = (key, field, value) => {
    setSettings(
      settings.map((setting) =>
        setting.key === key
          ? { ...setting, [field]: value }
          : setting
      )
    );
  };

  const handleImageUpload = async (key, file) => {
    try {
      const formData = new FormData();
      formData.append('key', key);
      formData.append('image', file);
      formData.append('group', activeGroup);

      const response = await fetch('/api/v1/admin/settings/upload-image', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        await fetchSettings();

        setSaveMsg({
          type: 'success',
          text: 'Gambar berhasil diupload!',
        });
      } else {
        setSaveMsg({
          type: 'error',
          text: 'Gagal mengupload gambar',
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);

      setSaveMsg({
        type: 'error',
        text: 'Terjadi kesalahan saat upload',
      });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveMsg(null);

      const settingsToUpdate = settings
        .filter((setting) => setting.group === activeGroup)
        .map((setting) => ({
          key: setting.key,
          value_id: setting.value_id,
          value_en: setting.value_en || null,
        }));

      const response = await fetch(
        '/api/v1/admin/settings/bulk-update',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            settings: settingsToUpdate,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setSaveMsg({
          type: 'success',
          text: 'Pengaturan berhasil disimpan!',
        });

        await fetchSettings();
      } else {
        setSaveMsg({
          type: 'error',
          text: 'Gagal menyimpan pengaturan',
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);

      setSaveMsg({
        type: 'error',
        text: 'Terjadi kesalahan, coba lagi',
      });
    } finally {
      setSaving(false);
    }
  };

  const saveMailSettings = async () => {
    setMailSaving(true);
    setMailMsg(null);

    try {
      const payload = Object.entries(mailSettings).map(
        ([key, value_id]) => ({
          key,
          value_id,
        })
      );

      const response = await fetch(
        '/api/v1/admin/settings/bulk-update',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            settings: payload,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setMailMsg({
          type: 'success',
          text: 'Pengaturan email berhasil disimpan.',
        });
      } else {
        setMailMsg({
          type: 'error',
          text: 'Gagal menyimpan pengaturan.',
        });
      }
    } catch (error) {
      console.error('Error saving mail settings:', error);

      setMailMsg({
        type: 'error',
        text: 'Gagal menyimpan pengaturan.',
      });
    } finally {
      setMailSaving(false);

      setTimeout(() => {
        setMailMsg(null);
      }, 3000);
    }
  };

  const resetMailSettings = async () => {
    setMailSaving(true);
    setMailMsg(null);

    const empty = {
      mail_username: '',
      mail_password: '',
      mail_from_name: '',
    };

    try {
      const payload = Object.entries(empty).map(
        ([key, value_id]) => ({
          key,
          value_id,
        })
      );

      const response = await fetch(
        '/api/v1/admin/settings/bulk-update',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            settings: payload,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setMailSettings(empty);
        setConfirmReset(false);

        setMailMsg({
          type: 'success',
          text: 'Pengaturan email berhasil dikosongkan.',
        });
      } else {
        setMailMsg({
          type: 'error',
          text: 'Gagal mengosongkan pengaturan.',
        });
      }
    } catch (error) {
      console.error('Error resetting mail settings:', error);

      setMailMsg({
        type: 'error',
        text: 'Gagal mengosongkan pengaturan.',
      });
    } finally {
      setMailSaving(false);

      setTimeout(() => {
        setMailMsg(null);
      }, 3000);
    }
  };

  const filteredSettings = settings.filter(
    (setting) =>
      setting.group === activeGroup &&
      activeGroup !== 'mail'
  );

  const renderSaveMessage = () => {
    if (!saveMsg) return null;

    return (
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold mb-6 ${
          saveMsg.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}
      >
        {saveMsg.type === 'success' ? (
          <FaCheckCircle />
        ) : (
          <FaExclamationCircle />
        )}

        {saveMsg.text}
      </div>
    );
  };

  const renderSettingInput = (setting) => {
    if (setting.type === 'image') {
      return (
        <div className="space-y-3">
          {setting.value_id && (
            <img
              src={`/storage/${setting.value_id}`}
              alt={setting.key}
              className="object-contain max-w-xs p-2 border border-gray-200 h-28 rounded-xl bg-gray-50"
            />
          )}

          <label className="flex items-center gap-3 px-4 py-3 transition-all border border-gray-300 border-dashed cursor-pointer w-fit rounded-xl hover:border-primary-400 hover:bg-primary-50 group">
            <FaImage className="text-gray-300 transition-colors group-hover:text-primary-400" />

            <span className="text-sm font-semibold text-gray-500 group-hover:text-primary-600">
              {setting.value_id
                ? 'Ganti Gambar'
                : 'Upload Gambar'}
            </span>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];

                if (file) {
                  handleImageUpload(setting.key, file);
                }
              }}
              className="hidden"
            />
          </label>
        </div>
      );
    }

    if (setting.type === 'textarea') {
      return (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <div className="text-xs text-gray-400 font-semibold mb-1.5">
              🇮🇩 Indonesia
            </div>

            <textarea
              value={setting.value_id || ''}
              onChange={(e) =>
                handleChange(
                  setting.key,
                  'value_id',
                  e.target.value
                )
              }
              rows="4"
              className="w-full px-4 py-3 text-sm transition-colors border border-gray-200 resize-none rounded-xl focus:ring-2 focus:ring-primary-500 bg-gray-50 focus:bg-white"
            />
          </div>

          <div>
            <div className="text-xs text-gray-400 font-semibold mb-1.5">
              🇬🇧 English
            </div>

            <textarea
              value={setting.value_en || ''}
              onChange={(e) =>
                handleChange(
                  setting.key,
                  'value_en',
                  e.target.value
                )
              }
              rows="4"
              className="w-full px-4 py-3 text-sm transition-colors border border-gray-200 resize-none rounded-xl focus:ring-2 focus:ring-primary-500 bg-gray-50 focus:bg-white"
            />
          </div>
        </div>
      );
    }

    if (setting.type === 'boolean') {
      const isEnabled =
        setting.value_id === '1' ||
        setting.value_id === 'true';

      return (
        <div className="flex items-center justify-between w-64 p-4 border border-gray-200 bg-gray-50 rounded-xl">
          <span className="text-sm font-semibold text-gray-700">
            {isEnabled
              ? 'Diaktifkan'
              : 'Dinonaktifkan'}
          </span>

          <div
            onClick={() =>
              handleChange(
                setting.key,
                'value_id',
                isEnabled ? '0' : '1'
              )
            }
            className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
              isEnabled
                ? 'bg-primary-600'
                : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                isEnabled
                  ? 'translate-x-6'
                  : 'translate-x-1'
              }`}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <div className="text-xs text-gray-400 font-semibold mb-1.5">
            🇮🇩 Indonesia
          </div>

          <input
            type={
              setting.key.endsWith('_email')
                ? 'email'
                : 'text'
            }
            value={setting.value_id || ''}
            onChange={(e) =>
              handleChange(
                setting.key,
                'value_id',
                e.target.value
              )
            }
            className="w-full px-4 py-3 text-sm transition-colors border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 bg-gray-50 focus:bg-white"
          />
        </div>

        <div>
          <div className="text-xs text-gray-400 font-semibold mb-1.5">
            🇬🇧 English
          </div>

          <input
            type="text"
            value={setting.value_en || ''}
            onChange={(e) =>
              handleChange(
                setting.key,
                'value_en',
                e.target.value
              )
            }
            className="w-full px-4 py-3 text-sm transition-colors border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 bg-gray-50 focus:bg-white"
          />
        </div>
      </div>
    );
  };

  const renderGeneralSettingsSection = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 rounded-full border-primary-600 border-t-transparent animate-spin" />
        </div>
      );
    }

    if (filteredSettings.length === 0) {
      return (
        <div className="py-16 text-center text-gray-500">
          <FaCog className="mx-auto mb-3 text-4xl text-gray-300" />

          <p className="font-semibold">
            Tidak ada pengaturan di grup ini
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-7">
        {filteredSettings.map((setting) => (
          <div
            key={setting.key}
            className="border-b border-gray-100 pb-7 last:border-0 last:pb-0"
          >
            <label className="block mb-3 text-sm font-bold text-gray-800">
              {keyLabels[setting.key] ||
                setting.key
                  .split('_')
                  .map(
                    (word) =>
                      word.charAt(0).toUpperCase() +
                      word.slice(1)
                  )
                  .join(' ')}
            </label>

            {renderSettingInput(setting)}
          </div>
        ))}
      </div>
    );
  };

  const renderMailSettingsSection = () => (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      {/* Form Email */}
      <div className="p-6 border shadow-sm xl:col-span-2 rounded-2xl border-slate-200 bg-gradient-to-b from-white to-slate-50">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary-100 text-primary-700 shrink-0">
            <FaEnvelope />
          </div>

          <div>
            <h4 className="text-lg font-black text-slate-900">
              Konfigurasi Akun Pengirim
            </h4>

            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Gunakan akun Gmail khusus pengirim dan{' '}
              <span className="font-semibold">
                App Password
              </span>
              , bukan password utama akun.
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

        <div className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-2">
          {mailFieldDefs.map(
            ({ key, label, placeholder, type }) => {
              const iconMap = {
                mail_username: FaEnvelope,
                mail_password: FaKey,
                mail_from_name: FaUserTie,
              };

              const Icon = iconMap[key] || FaCog;

              return (
                <div
                  key={key}
                  className={
                    key === 'mail_from_name'
                      ? 'md:col-span-2'
                      : ''
                  }
                >
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    <Icon className="text-slate-400 text-[11px]" />
                    {label}
                  </label>

                  {key === 'mail_password' ? (
                    <div className="relative">
                      <input
                        type={
                          showPassword
                            ? 'text'
                            : 'password'
                        }
                        value={mailSettings[key]}
                        onChange={(e) =>
                          setMailSettings((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        placeholder={placeholder}
                        className="w-full px-4 py-2.5 pr-11 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white font-mono tracking-widest"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            (value) => !value
                          )
                        }
                        className="absolute transition -translate-y-1/2 right-3 top-1/2 text-slate-400 hover:text-slate-700"
                        title={
                          showPassword
                            ? 'Sembunyikan'
                            : 'Tampilkan'
                        }
                      >
                        {showPassword ? (
                          <FaEyeSlash />
                        ) : (
                          <FaEye />
                        )}
                      </button>
                    </div>
                  ) : (
                    <input
                      type={type}
                      value={mailSettings[key]}
                      onChange={(e) =>
                        setMailSettings((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                      placeholder={placeholder}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    />
                  )}
                </div>
              );
            }
          )}
        </div>

        <div className="flex flex-col flex-wrap gap-3 mt-5 sm:flex-row sm:items-center">
          <button
            onClick={saveMailSettings}
            disabled={mailSaving}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
          >
            <FaSave />

            {mailSaving
              ? 'Menyimpan...'
              : 'Simpan Pengaturan Email'}
          </button>

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              disabled={
                mailSaving ||
                (!mailSettings.mail_username &&
                  !mailSettings.mail_password &&
                  !mailSettings.mail_from_name)
              }
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-red-300 text-red-600 text-sm font-bold rounded-xl hover:bg-red-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FaTrash className="text-xs" />
              Reset / Kosongkan Email
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl">
              <FaTimesCircle className="text-red-500 shrink-0" />

              <span className="text-sm font-semibold text-red-700">
                Yakin ingin mengosongkan semua pengaturan
                email?
              </span>

              <button
                type="button"
                onClick={resetMailSettings}
                disabled={mailSaving}
                className="px-3 py-1 text-xs font-bold text-white transition bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Ya, Kosongkan
              </button>

              <button
                type="button"
                onClick={() =>
                  setConfirmReset(false)
                }
                className="px-3 py-1 text-xs font-bold text-gray-600 transition border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Batal
              </button>
            </div>
          )}

          {mailMsg && (
            <div
              className={`inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl ${
                mailMsg.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-100'
                  : 'bg-red-50 text-red-600 border border-red-100'
              }`}
            >
              {mailMsg.type === 'success' ? (
                <FaCheckCircle className="shrink-0" />
              ) : (
                <FaExclamationCircle className="shrink-0" />
              )}

              {mailMsg.text}
            </div>
          )}
        </div>
      </div>

      {/* Panduan */}
      <div className="p-5 border shadow-sm rounded-2xl border-amber-200 bg-amber-50 h-fit">
        <div className="flex items-center gap-2 mb-3 text-amber-800">
          <FaShieldAlt />

          <p className="text-sm font-bold">
            Panduan App Password
          </p>
        </div>

        <ol className="space-y-2 text-sm text-amber-800">
          <li>
            <span className="font-semibold">1.</span>{' '}
            Login ke akun Google yang ingin digunakan.
          </li>

          <li>
            <span className="font-semibold">2.</span>{' '}
            Buka{' '}
            <strong>
              myaccount.google.com/apppasswords
            </strong>
            .
          </li>

          <li>
            <span className="font-semibold">3.</span>{' '}
            Beri nama, contoh: <strong>KAN Admin</strong>,
            lalu klik <strong>Buat</strong>.
          </li>

          <li>
            <span className="font-semibold">4.</span>{' '}
            Salin 16 karakter, kemudian tempel ke kolom
            App Password.
          </li>
        </ol>

        <div className="px-3 py-2 mt-4 text-xs border rounded-xl bg-amber-100/70 border-amber-200 text-amber-900">
          Pastikan fitur{' '}
          <strong>2-Step Verification</strong> sudah
          aktif di akun Google tersebut.
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="relative overflow-hidden text-white shadow-xl bg-gradient-to-r from-primary-700 via-primary-800 to-primary-900 rounded-2xl p-7">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute w-56 h-56 rounded-full -top-10 -right-10 bg-white/5 blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-white/15 rounded-xl">
                <FaCog className="text-xl text-white" />
              </div>

              <div>
                <h2 className="text-2xl font-black">
                  Pengaturan Website
                </h2>

                <p className="text-white/70 text-sm mt-0.5">
                  Konfigurasi tampilan dan informasi
                  website KAN
                </p>
              </div>
            </div>

            <button
              onClick={
                isMailGroup
                  ? saveMailSettings
                  : handleSave
              }
              disabled={
                isMailGroup
                  ? mailSaving
                  : saving
              }
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-primary-700 rounded-xl font-bold text-sm hover:bg-white/90 transition-all shadow-md disabled:opacity-60"
            >
              <FaSave />

              {isMailGroup
                ? mailSaving
                  ? 'Menyimpan...'
                  : 'Simpan Pengaturan Email'
                : saving
                  ? 'Menyimpan...'
                  : 'Simpan Perubahan'}
            </button>
          </div>
        </div>

        <div className="flex items-start gap-6">
          {/* Groups Sidebar */}
          <div className="sticky flex-shrink-0 w-56 overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl top-6">
            <div className="px-4 py-4 border-b border-gray-100">
              <p className="text-xs font-bold tracking-wider text-gray-500 uppercase">
                Grup Pengaturan
              </p>
            </div>

            <div className="p-2">
              {groups.map((group) => (
                <button
                  key={group}
                  onClick={() => {
                    setActiveGroup(group);
                    setSaveMsg(null);
                    setMailMsg(null);
                    setConfirmReset(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl font-semibold text-sm transition-all mb-1 ${
                    activeGroup === group
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {groupLabels[group] ||
                    group.charAt(0).toUpperCase() +
                      group.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Settings Form */}
          <div className="flex-1 min-w-0">
            <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">
              {/* Form Header */}
              <div className="flex items-center justify-between py-5 border-b border-gray-100 px-7 bg-gradient-to-r from-gray-50 to-white">
                <div>
                  <h3 className="text-base font-black text-gray-900">
                    {groupLabels[activeGroup] ||
                      activeGroup}
                  </h3>

                  <p className="text-xs text-gray-500 mt-0.5">
                    {isMailGroup
                      ? '3 pengaturan tersedia'
                      : `${filteredSettings.length} pengaturan tersedia`}
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