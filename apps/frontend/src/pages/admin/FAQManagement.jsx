import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaQuestionCircle,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaExclamationCircle,
  FaCommentDots,
  FaLightbulb,
} from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';
import { useConfirm } from '../../hooks/useConfirm';
import api from '../../services/api';

const initialFormData = {
  question: '',
  answer: '',
  order: '',
  is_active: true,
  show_on_home: true,
};

const ToggleSwitch = ({ checked, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={checked}
    className={`relative h-8 w-16 shrink-0 rounded-full border-2 transition-colors ${
      checked ? 'border-primary-700 bg-primary-600' : 'border-gray-300 bg-gray-300'
    }`}
  >
    <span
      className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
        checked ? 'translate-x-8' : 'translate-x-0'
      }`}
    />
  </button>
);

const FAQManagement = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const { confirm, ConfirmDialog } = useConfirm();

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/faqs');
      if (data.success) {
        setFaqs(data.data);
      }
    } catch (err) {
      console.error('FAQManagement fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (faq = null) => {
    if (faq) {
      setEditingFaq(faq);
      setFormData({
        question: faq.question || '',
        answer: faq.answer || '',
        order: Number.isInteger(faq.order) ? String(faq.order) : '',
        is_active: Boolean(faq.is_active),
        show_on_home: Boolean(faq.show_on_home),
      });
    } else {
      setEditingFaq(null);
      setFormData(initialFormData);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingFaq(null);
    setSaving(false);
    setFormData(initialFormData);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.question.trim() || !formData.answer.trim()) {
      return;
    }

    try {
      setSaving(true);
      const payload = {
        question: formData.question.trim(),
        answer: formData.answer.trim(),
        is_active: formData.is_active,
        show_on_home: formData.show_on_home,
      };

      if (formData.order !== '') {
        payload.order = Number(formData.order);
      }

      let url = '/admin/faqs';
      if (editingFaq) {
        url = `/admin/faqs/${editingFaq.id}`;
        payload._method = 'PUT';
      }

      const { data } = await api.post(url, payload);

      if (data.success) {
        toast.success('FAQ berhasil disimpan');
        await fetchFaqs();
        closeModal();
      } else {
        toast.error(data.message || 'Gagal menyimpan FAQ');
      }
    } catch (err) {
      console.error('FAQ save error:', err);
      toast.error('Terjadi kesalahan saat menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!(await confirm('Hapus FAQ ini? Tindakan ini tidak dapat dibatalkan.'))) return;

    try {
      const { data } = await api.delete(`/admin/faqs/${id}`);
      if (data.success) {
        toast.success('FAQ berhasil dihapus');
        fetchFaqs();
      }
    } catch (err) {
      console.error('FAQ delete error:', err);
      toast.error('Gagal menghapus FAQ. Silakan coba lagi.');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      const { data } = await api.post(`/admin/faqs/${id}/toggle-active`);
      if (data.success) {
        fetchFaqs();
      }
    } catch (err) {
      console.error('FAQ toggle error:', err);
    }
  };

  const handleToggleShowOnHome = async (id) => {
    try {
      const { data } = await api.post(`/admin/faqs/${id}/toggle-show-home`);
      if (data.success) {
        fetchFaqs();
      }
    } catch (err) {
      console.error('FAQ toggle error:', err);
    }
  };

  const activeCount = useMemo(() => faqs.filter((faq) => faq.is_active).length, [faqs]);
  const homeCount = useMemo(() => faqs.filter((faq) => faq.is_active && faq.show_on_home).length, [faqs]);

  return (
    <AdminLayout>
      <ConfirmDialog />
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-700 via-primary-800 to-primary-900 p-7 text-white shadow-xl">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/5 blur-3xl" />
          </div>
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                <FaQuestionCircle className="text-xl text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black">Kelola FAQ</h2>
                <p className="mt-0.5 text-sm text-white/70">
                  Tambah, ubah, dan atur pertanyaan yang tampil di homepage
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden gap-2 sm:flex">
                <div className="rounded-xl border border-white/20 bg-white/15 px-4 py-2.5 text-center">
                  <div className="text-xl font-black">{activeCount}</div>
                  <div className="text-xs font-semibold text-white/70">Aktif</div>
                </div>
                <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-center">
                  <div className="text-xl font-black">{faqs.length}</div>
                  <div className="text-xs font-semibold text-white/70">Total</div>
                </div>
                <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-center">
                  <div className="text-xl font-black">{homeCount}</div>
                  <div className="text-xs font-semibold text-white/70">Tampil Beranda</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openModal()}
                className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-primary-700 shadow-md transition-all hover:bg-white/90"
              >
                <FaPlus />
                Tambah FAQ
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
            </div>
          ) : faqs.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                <FaQuestionCircle className="text-2xl text-gray-400" />
              </div>
              <p className="mb-1 font-semibold text-gray-500">Belum ada FAQ</p>
              <button
                type="button"
                onClick={() => openModal()}
                className="text-sm font-bold text-primary-600 hover:underline"
              >
                Tambah FAQ pertama
              </button>
            </div>
          ) : (
            faqs.map((faq, index) => (
              <article
                key={faq.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex rounded-lg bg-primary-50 px-2 py-1 text-xs font-bold text-primary-700">
                      #{index + 1}
                    </span>
                    <div>
                      <h3 className="text-base font-black text-gray-900">{faq.question}</h3>
                      <p className="mt-1 text-xs text-gray-400">Order: {faq.order}</p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                      faq.is_active
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border border-gray-200 bg-gray-100 text-gray-500'
                    }`}
                  >
                    {faq.is_active ? <FaCheckCircle /> : <FaExclamationCircle />}
                    {faq.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>

                <div className="mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                      faq.show_on_home
                        ? 'border border-blue-200 bg-blue-50 text-blue-700'
                        : 'border border-slate-200 bg-slate-100 text-slate-500'
                    }`}
                  >
                    {faq.show_on_home ? 'Tampil di Beranda' : 'Hanya Halaman FAQ'}
                  </span>
                </div>

                <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-gray-600">{faq.answer}</p>

                <div className="flex gap-2 border-t border-gray-100 pt-3">
                  <button
                    type="button"
                    onClick={() => handleToggleShowOnHome(faq.id)}
                    className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                      faq.show_on_home
                        ? 'text-blue-700 hover:bg-blue-50'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {faq.show_on_home ? 'Sembunyikan Beranda' : 'Tampilkan Beranda'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleActive(faq.id)}
                    className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                      faq.is_active
                        ? 'text-amber-600 hover:bg-amber-50'
                        : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {faq.is_active ? <FaEyeSlash /> : <FaEye />}
                    {faq.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>

                  <button
                    type="button"
                    onClick={() => openModal(faq)}
                    className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold text-primary-600 transition-all hover:bg-primary-50"
                  >
                    <FaEdit />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(faq.id)}
                    className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold text-red-500 transition-all hover:bg-red-50"
                  >
                    <FaTrash />
                    Hapus
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* Header — amber/kuning, berbeda dari form lainnya */}
            <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 px-7 py-5">
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
              <div className="pointer-events-none absolute -bottom-4 left-16 h-16 w-16 rounded-full bg-white/10" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/25">
                    <FaQuestionCircle className="text-lg text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">
                      {editingFaq ? 'Edit FAQ' : 'Tambah FAQ Baru'}
                    </h3>
                    <p className="text-xs text-white/80">
                      {editingFaq ? 'Perbarui pertanyaan dan jawaban' : 'Buat pasangan pertanyaan & jawaban baru'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl p-2 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 px-7 py-6">

              {/* Pertanyaan — tampilan bubble chat */}
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-800">
                  <FaCommentDots className="text-amber-500" />
                  Pertanyaan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(event) => setFormData((prev) => ({ ...prev, question: event.target.value }))}
                  className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm font-medium transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="Contoh: Berapa lama proses akreditasi?"
                  required
                />
              </div>

              {/* Jawaban */}
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-blue-800">
                  <FaLightbulb className="text-blue-500" />
                  Jawaban <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.answer}
                  onChange={(event) => setFormData((prev) => ({ ...prev, answer: event.target.value }))}
                  rows={6}
                  className="w-full resize-y rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="Tuliskan jawaban FAQ secara jelas dan lengkap..."
                  required
                />
              </div>

              {/* Pengaturan */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-600 uppercase tracking-wide">Urutan Tampil</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.order}
                    onChange={(event) => setFormData((prev) => ({ ...prev, order: event.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm transition-colors focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
                    placeholder="Otomatis"
                  />
                </div>

                <div className="flex select-none items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5">
                  <div>
                    <div className="text-xs font-bold text-gray-700">Status Aktif</div>
                    <div className="text-[10px] text-gray-400">Tampil di website</div>
                  </div>
                  <ToggleSwitch
                    checked={formData.is_active}
                    onClick={() => setFormData((prev) => ({ ...prev, is_active: !prev.is_active }))}
                  />
                </div>

                <div className="flex select-none items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5">
                  <div>
                    <div className="text-xs font-bold text-gray-700">Di Beranda</div>
                    <div className="text-[10px] text-gray-400">Tampil di homepage</div>
                  </div>
                  <ToggleSwitch
                    checked={formData.show_on_home}
                    onClick={() => setFormData((prev) => ({ ...prev, show_on_home: !prev.show_on_home }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600 transition-all hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:from-amber-600 hover:to-yellow-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Menyimpan...' : editingFaq ? 'Simpan Perubahan' : 'Tambah FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default FAQManagement;
