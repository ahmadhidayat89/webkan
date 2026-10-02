import { useEffect, useState } from 'react';
import {
  FaFacebookF, FaTwitter, FaInstagram, FaYoutube,
  FaTiktok, FaLinkedinIn, FaSave, FaCheckCircle,
  FaExclamationCircle, FaShareAlt, FaExternalLinkAlt,
} from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';

const PLATFORMS = [
  {
    key: 'social_facebook',
    label: 'Facebook',
    icon: FaFacebookF,
    color: 'bg-blue-600',
    ring: 'focus:ring-blue-400',
    border: 'focus:border-blue-400',
    placeholder: 'https://facebook.com/namahalaman',
    prefix: 'facebook.com/',
  },
  {
    key: 'social_twitter',
    label: 'Twitter / X',
    icon: FaTwitter,
    color: 'bg-sky-500',
    ring: 'focus:ring-sky-400',
    border: 'focus:border-sky-400',
    placeholder: 'https://twitter.com/username',
    prefix: 'twitter.com/',
  },
  {
    key: 'social_instagram',
    label: 'Instagram',
    icon: FaInstagram,
    color: 'bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400',
    ring: 'focus:ring-pink-400',
    border: 'focus:border-pink-400',
    placeholder: 'https://instagram.com/username',
    prefix: 'instagram.com/',
  },
  {
    key: 'social_youtube',
    label: 'YouTube',
    icon: FaYoutube,
    color: 'bg-red-600',
    ring: 'focus:ring-red-400',
    border: 'focus:border-red-400',
    placeholder: 'https://youtube.com/@channel',
    prefix: 'youtube.com/',
  },
  {
    key: 'social_tiktok',
    label: 'TikTok',
    icon: FaTiktok,
    color: 'bg-gray-900',
    ring: 'focus:ring-gray-500',
    border: 'focus:border-gray-500',
    placeholder: 'https://tiktok.com/@username',
    prefix: 'tiktok.com/',
  },
  {
    key: 'social_linkedin',
    label: 'LinkedIn',
    icon: FaLinkedinIn,
    color: 'bg-blue-700',
    ring: 'focus:ring-blue-500',
    border: 'focus:border-blue-500',
    placeholder: 'https://linkedin.com/company/nama',
    prefix: 'linkedin.com/',
  },
];

const SosmedManagement = () => {
  const [values, setValues] = useState(
    Object.fromEntries(PLATFORMS.map(p => [p.key, '']))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  useEffect(() => {
    api.get('/admin/sosmed')
      .then(({ data }) => {
        if (data.success) setValues(prev => ({ ...prev, ...data.data }));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const settings = PLATFORMS.map(p => ({ key: p.key, value_id: values[p.key] || '' }));
      const { data } = await api.post('/admin/sosmed', { settings });
      if (data.success) {
        setSaveMsg({ type: 'success', text: 'Pengaturan sosmed berhasil disimpan!' });
      } else {
        setSaveMsg({ type: 'error', text: data.message || 'Gagal menyimpan' });
      }
    } catch {
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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-600 via-rose-500 to-orange-400 p-7 text-white shadow-xl">
          <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-20 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                <FaShareAlt className="text-xl text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black">Kelola Media Sosial</h2>
                <p className="mt-0.5 text-sm text-white/75">
                  Atur tautan akun media sosial yang tampil di website
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-white/20 bg-white/15 px-5 py-3 text-center">
                <div className="text-2xl font-black">{linkedCount}</div>
                <div className="text-xs font-semibold text-white/70">Terhubung</div>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-center">
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
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
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
                  <div className="mb-4 flex items-center justify-between">
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
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-orange-400 px-7 py-3 text-sm font-bold text-white shadow-md transition-all hover:from-pink-700 hover:to-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FaSave />
            {saving ? 'Menyimpan...' : 'Simpan Semua'}
          </button>
        </div>

      </div>
    </AdminLayout>
  );
};

export default SosmedManagement;
