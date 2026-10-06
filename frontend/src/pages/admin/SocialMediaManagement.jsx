import { useEffect, useState } from 'react';
import {
  FaFacebookF, FaTwitter, FaInstagram, FaYoutube,
  FaTiktok, FaLinkedinIn, FaSave, FaCheckCircle,
  FaExclamationCircle, FaUsers, FaExternalLinkAlt,
} from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';

const PLATFORMS = [
  {
    key: 'social_facebook',
    label: 'Facebook',
    icon: FaFacebookF,
    color: 'bg-blue-600',
    ring: 'focus:ring-blue-400',
    border: 'focus:border-blue-400',
    placeholder: 'https://facebook.com/namahalaman',
  },
  {
    key: 'social_twitter',
    label: 'Twitter / X',
    icon: FaTwitter,
    color: 'bg-sky-500',
    ring: 'focus:ring-sky-400',
    border: 'focus:border-sky-400',
    placeholder: 'https://twitter.com/username',
  },
  {
    key: 'social_instagram',
    label: 'Instagram',
    icon: FaInstagram,
    color: 'bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400',
    ring: 'focus:ring-pink-400',
    border: 'focus:border-pink-400',
    placeholder: 'https://instagram.com/username',
  },
  {
    key: 'social_youtube',
    label: 'YouTube',
    icon: FaYoutube,
    color: 'bg-red-600',
    ring: 'focus:ring-red-400',
    border: 'focus:border-red-400',
    placeholder: 'https://youtube.com/@channel',
  },
  {
    key: 'social_tiktok',
    label: 'TikTok',
    icon: FaTiktok,
    color: 'bg-gray-900',
    ring: 'focus:ring-gray-500',
    border: 'focus:border-gray-500',
    placeholder: 'https://tiktok.com/@username',
  },
  {
    key: 'social_linkedin',
    label: 'LinkedIn',
    icon: FaLinkedinIn,
    color: 'bg-blue-700',
    ring: 'focus:ring-blue-500',
    border: 'focus:border-blue-500',
    placeholder: 'https://linkedin.com/company/nama',
  },
];

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const SocialMediaManagement = () => {
  const [values, setValues] = useState(
    Object.fromEntries(PLATFORMS.map(p => [p.key, '']))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/v1/admin/social-settings', {
          headers: authHeaders(),
        });
        const data = await response.json();
        if (data.success) {
          // API mengembalikan array [{ key, value_id, value_en, ... }]
          const loaded = {};
          data.data.forEach(s => {
            loaded[s.key] = s.value_id || '';
          });
          setValues(prev => ({ ...prev, ...loaded }));
        }
      } catch (error) {
        console.error('Error fetching social settings:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      // Satu URL dipakai untuk bahasa Indonesia dan English
      const settings = PLATFORMS.map(p => ({
        key: p.key,
        value_id: values[p.key]?.trim() || null,
        value_en: values[p.key]?.trim() || null,
      }));

      const response = await fetch('/api/v1/admin/social-settings/bulk-update', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      const data = await response.json();

      if (data.success) {
        setSaveMsg({ type: 'success', text: 'Pengaturan media sosial berhasil disimpan!' });
      } else {
        setSaveMsg({ type: 'error', text: data.message || 'Gagal menyimpan pengaturan' });
      }
    } catch (error) {
      console.error('Error saving social settings:', error);
      setSaveMsg({ type: 'error', text: 'Terjadi kesalahan, coba lagi.' });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 4000);
    }
  };

  const linkedCount = PLATFORMS.filter(p => values[p.key]?.trim()).length;

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="relative overflow-hidden text-white shadow-xl rounded-2xl bg-gradient-to-r from-primary-700 via-primary-800 to-primary-900 p-7">
          <div className="absolute w-56 h-56 rounded-full pointer-events-none -right-10 -top-10 bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 w-32 h-32 rounded-full pointer-events-none left-20 bg-white/5 blur-2xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20">
                <FaUsers className="text-xl text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black">Kelola Media Sosial</h2>
                <p className="mt-0.5 text-sm text-white/75">
                  Atur tautan akun media sosial yang tampil di website
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-5 py-3 text-center border rounded-xl border-white/20 bg-white/15">
                <div className="text-2xl font-black">{linkedCount}</div>
                <div className="text-xs font-semibold text-white/70">Terhubung</div>
              </div>
              <div className="px-5 py-3 text-center border rounded-xl border-white/20 bg-white/10">
                <div className="text-2xl font-black">{PLATFORMS.length - linkedCount}</div>
                <div className="text-xs font-semibold text-white/70">Belum Diisi</div>
              </div>
            </div>
          </div>
        </div>

        {/* Save message */}
        {saveMsg && (
          <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${
            saveMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {saveMsg.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
            {saveMsg.text}
          </div>
        )}

        {/* Platform Cards */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 rounded-full animate-spin border-primary-600 border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {PLATFORMS.map(p => {
              const Icon = p.icon;
              const val = values[p.key] || '';
              const isLinked = val.trim().length > 0;

              return (
                <div
                  key={p.key}
                  className={`rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
                    isLinked ? 'border-gray-200' : 'border-dashed border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white text-sm ${p.color}`}>
                        <Icon />
                      </div>
                      <span className="font-bold text-gray-800">{p.label}</span>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      isLinked
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {isLinked ? 'Terhubung' : 'Kosong'}
                    </span>
                  </div>

                  <input
                    type="url"
                    value={val}
                    onChange={e => setValues(prev => ({ ...prev, [p.key]: e.target.value }))}
                    placeholder={p.placeholder}
                    className={`w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm transition-colors focus:bg-white focus:outline-none focus:ring-2 ${p.ring} ${p.border}`}
                  />

                  {isLinked && (
                    <a
                      href={val}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <FaExternalLinkAlt className="text-[10px]" />
                      Buka link
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 py-3 text-sm font-bold text-white transition-all shadow-md rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-7 hover:from-primary-700 hover:to-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FaSave />
            {saving ? 'Menyimpan...' : 'Simpan Semua'}
          </button>
        </div>

      </div>
    </AdminLayout>
  );
};

export default SocialMediaManagement;