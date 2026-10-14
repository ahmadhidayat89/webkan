import { useEffect, useState } from 'react';
import {
  FaSave,
  FaShieldAlt,
  FaCheckCircle,
  FaExclamationCircle,
  FaClock,
} from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';
import QuillEditor from '../../components/admin/QuillEditor';

const TABS = [
  { id: 'privacy', label: 'Kebijakan Privasi' },
  { id: 'terms', label: 'Syarat & Ketentuan' },
];

const parseApiJson = (rawText) => {
  if (!rawText) return null;
  try {
    return JSON.parse(rawText);
  } catch {
    const start = rawText.indexOf('{');
    const end = rawText.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(rawText.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
};

const EMPTY_P_TAIL = /<p>(?:<br\s*\/?>)?<\/p>$/i;

const trimEmptyTail = (html) => {
  let result = html.trimEnd();
  if (!EMPTY_P_TAIL.test(result)) return html;

  while (EMPTY_P_TAIL.test(result)) {
    result = result.replace(EMPTY_P_TAIL, '').trimEnd();
  }
  return result;
};

const hasMeaningfulContent = (html) => {
  if (!html) return false;
  return (
    html.replace(/<[^<>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0
  );
};

const LegalManagement = () => {
  const [pageId, setPageId] = useState('privacy');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  useEffect(() => {
    const load = async () => {
      const tab = TABS.find((t) => t.id === pageId);
      setLoading(true);
      setSaveMsg(null);
      try {
        const res = await fetch(`/api/v1/admin/page-contents/${pageId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            Accept: 'application/json',
          },
        });
        const data = parseApiJson(await res.text());
        const c = data?.data; // null kalau belum pernah diisi
        setTitle(c?.title || tab.label);
        setContent(c?.content_id || '');
        setUpdatedAt(c?.updated_at || null);
      } catch (e) {
        console.error(e);
        setTitle(tab.label);
        setContent('');
        setUpdatedAt(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [pageId]);

  const canSave =
    title.trim().length > 0 && hasMeaningfulContent(content) && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    try {
      setSaving(true);
      setSaveMsg(null);

      const res = await fetch('/api/v1/admin/page-contents', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page_id: pageId,
          title: title.trim(),
          content_id: content,
        }),
      });
      const data = parseApiJson(await res.text());

      if (res.ok && data?.success) {
        setSaveMsg({ type: 'success', text: 'Konten berhasil disimpan!' });
        setUpdatedAt(data.data?.updated_at || new Date().toISOString());
      } else {
        const firstError = data?.errors
          ? Object.values(data.errors).flat()?.[0]
          : null;
        setSaveMsg({
          type: 'error',
          text:
            firstError ||
            data?.message ||
            `Gagal menyimpan (HTTP ${res.status})`,
        });
      }
    } catch (e) {
      setSaveMsg({ type: 'error', text: 'Terjadi kesalahan, coba lagi' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden text-white shadow-xl bg-gradient-to-r from-primary-700 via-primary-800 to-primary-900 rounded-2xl p-7">
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-white/15 rounded-xl">
              <FaShieldAlt className="text-xl text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black">Kelola Halaman Legal</h2>
              <p className="text-white/70 text-sm mt-0.5">
                Isi Kebijakan Privasi dan Syarat & Ketentuan website
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setPageId(t.id)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                pageId === t.id
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Editor */}
        <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">
          <div className="py-5 border-b border-gray-100 px-7 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-xl font-black text-gray-900">
              {TABS.find((t) => t.id === pageId)?.label}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
              <span className="font-mono">/{pageId}</span>
              {updatedAt && (
                <span className="flex items-center gap-1">
                  <FaClock />
                  {new Date(updatedAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 rounded-full border-primary-600 border-t-transparent animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-6 p-7">
              {saveMsg && (
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold ${
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
              )}

              <div>
                <label htmlFor="legal-title" className="block mb-2 text-sm font-bold text-gray-800">
                  Judul Halaman <span className="text-red-500">*</span>
                </label>
                <input
                  id="legal-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full max-w-lg px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                />
              </div>

              <div>
                <p id="legal-content-label" className="block mb-2 text-sm font-bold text-gray-800">
                  Isi Halaman <span className="text-red-500">*</span>
                </p>
                <QuillEditor
                  key={pageId}
                  value={content}
                  onChange={setContent}
                  minHeight={380}
                  withHeading
                  transformOutput={trimEmptyTail}
                  placeholder="Tulis isi halaman di sini..."
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Tips: pakai tombol H2 / H3 di toolbar untuk sub-judul
                  (misalnya "1. Penerimaan Syarat"), dan P untuk kembali ke
                  paragraf biasa.
                </p>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!canSave}
                  className="flex items-center gap-2 py-3 font-bold text-white transition-all shadow-md px-7 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaSave />
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default LegalManagement;
