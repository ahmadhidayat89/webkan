import { useEffect, useMemo, useState } from 'react';
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
import QuillEditor from '../../components/admin/QuillEditor';

const initialFormData = {
  question: '',
  answer: '',
  order: '',
  is_active: true,
  show_on_home: true,
};

const authHeaders = (extra = {}) => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  Accept: 'application/json',
  ...extra,
});

/* =========================
   Toggle Switch
========================= */
const ToggleSwitch = ({ checked, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={checked}
    className={`relative h-8 w-16 shrink-0 rounded-full border-2 transition-colors ${checked
        ? 'border-primary-700 bg-primary-600'
        : 'border-gray-300 bg-gray-300'
      }`}
  >
    <span
      className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-8' : 'translate-x-0'
        }`}
    />
  </button>
);

/* =========================
   Main Component
========================= */
const FAQManagement = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [saveMessage, setSaveMessage] = useState(null);

  /* =========================
     Fetch FAQ
  ========================= */
  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/v1/admin/faqs', {
        headers: authHeaders(),
      });

      const data = await response.json();

      if (data.success) {
        setFaqs(data.data || []);
      }
    } catch (err) {
      console.error('FAQManagement fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     Open Modal
  ========================= */
  const openModal = (faq = null) => {
    setSaveMessage(null);

    if (faq) {
      setEditingFaq(faq);

      setFormData({
        question: faq.question || '',
        answer: faq.answer || '',
        order:
          faq.order !== null && faq.order !== undefined
            ? String(faq.order)
            : '',
        is_active:
          faq.is_active === undefined ? true : Boolean(faq.is_active),
        show_on_home:
          faq.show_on_home === undefined
            ? true
            : Boolean(faq.show_on_home),
      });
    } else {
      setEditingFaq(null);

      setFormData({
        ...initialFormData,
        order: faqs.length + 1,
      });
    }

    setShowModal(true);
  };

  /* =========================
     Close Modal
  ========================= */
  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingFaq(null);
    setSaving(false);
    setSaveMessage(null);
    setFormData(initialFormData);
  };

  /* =========================
     Submit
  ========================= */
  const handleSubmit = async (event) => {
    event.preventDefault();

    const answerText = (formData.answer || '')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();

    if (!formData.question.trim() || !answerText) {
      setSaveMessage({
        type: 'error',
        text: 'Pertanyaan dan jawaban wajib diisi.',
      });

      return;
    }

    try {
      setSaving(true);
      setSaveMessage(null);

      const payload = {
        question: formData.question.trim(),
        answer: formData.answer,
        is_active: formData.is_active,
        show_on_home: formData.show_on_home,
      };

      if (formData.order !== '') {
        payload.order = Number(formData.order);
      }

      const url = editingFaq
        ? `/api/v1/admin/faqs/${editingFaq.id}`
        : '/api/v1/admin/faqs';

      const response = await fetch(url, {
        method: editingFaq ? 'PUT' : 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSaveMessage({
          type: 'success',
          text: 'FAQ berhasil disimpan.',
        });

        await fetchFaqs();

        setTimeout(() => {
          setShowModal(false);
          setEditingFaq(null);
          setFormData(initialFormData);
          setSaveMessage(null);
        }, 500);
      } else {
        setSaveMessage({
          type: 'error',
          text: data.message || 'Gagal menyimpan FAQ.',
        });
      }
    } catch (err) {
      console.error('FAQ save error:', err);

      setSaveMessage({
        type: 'error',
        text: 'Terjadi kesalahan saat menyimpan data.',
      });
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     Delete
  ========================= */
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Hapus FAQ ini? Tindakan ini tidak dapat dibatalkan.'
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(`delete-${id}`);

      const response = await fetch(`/api/v1/admin/faqs/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchFaqs();
      } else {
        alert(data.message || 'Gagal menghapus FAQ.');
      }
    } catch (err) {
      console.error('FAQ delete error:', err);
      alert('Gagal menghapus FAQ. Silakan coba lagi.');
    } finally {
      setActionLoading(null);
    }
  };

  /* =========================
     Toggle Active
  ========================= */
  const handleToggleActive = async (id) => {
    try {
      setActionLoading(`active-${id}`);

      const response = await fetch(
        `/api/v1/admin/faqs/${id}/toggle-active`,
        {
          method: 'POST',
          headers: authHeaders(),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchFaqs();
      } else {
        alert(data.message || 'Gagal mengubah status FAQ.');
      }
    } catch (err) {
      console.error('FAQ toggle active error:', err);
      alert('Gagal mengubah status FAQ.');
    } finally {
      setActionLoading(null);
    }
  };

  /* =========================
     Toggle Show On Home
  ========================= */
  const handleToggleShowOnHome = async (id) => {
    try {
      setActionLoading(`home-${id}`);

      const response = await fetch(
        `/api/v1/admin/faqs/${id}/toggle-show-home`,
        {
          method: 'POST',
          headers: authHeaders(),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchFaqs();
      } else {
        alert(data.message || 'Gagal mengubah tampilan FAQ.');
      }
    } catch (err) {
      console.error('FAQ toggle home error:', err);
      alert('Gagal mengubah tampilan FAQ.');
    } finally {
      setActionLoading(null);
    }
  };

  /* =========================
     Statistics
  ========================= */
  const activeCount = useMemo(
    () => faqs.filter((faq) => faq.is_active).length,
    [faqs]
  );

  const homeCount = useMemo(
    () => faqs.filter((faq) => faq.is_active && faq.show_on_home).length,
    [faqs]
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* =========================
            HEADER
        ========================= */}
        <div className="relative overflow-hidden text-white shadow-xl rounded-2xl bg-gradient-to-r from-primary-700 via-primary-800 to-primary-900 p-7">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute w-56 h-56 rounded-full -right-10 -top-10 bg-white/5 blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            {/* Title */}
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/15">
                <FaQuestionCircle className="text-xl text-white" />
              </div>

              <div>
                <h2 className="text-2xl font-black">Kelola FAQ</h2>

                <p className="mt-0.5 text-sm text-white/70">
                  Tambah, ubah, dan atur pertanyaan yang tampil di homepage
                </p>
              </div>
            </div>

            {/* Stats + Button */}
            <div className="flex items-center gap-3">
              <div className="hidden gap-2 sm:flex">
                <div className="rounded-xl border border-white/20 bg-white/15 px-4 py-2.5 text-center">
                  <div className="text-xl font-black">{activeCount}</div>
                  <div className="text-xs font-semibold text-white/70">
                    Aktif
                  </div>
                </div>

                <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-center">
                  <div className="text-xl font-black">{faqs.length}</div>
                  <div className="text-xs font-semibold text-white/70">
                    Total
                  </div>
                </div>

                <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-center">
                  <div className="text-xl font-black">{homeCount}</div>
                  <div className="text-xs font-semibold text-white/70">
                    Tampil Beranda
                  </div>
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

        {/* =========================
            FAQ LIST
        ========================= */}
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 rounded-full animate-spin border-primary-600 border-t-transparent" />
            </div>
          ) : faqs.length === 0 ? (
            <div className="py-16 text-center bg-white border border-gray-200 rounded-2xl">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-2xl">
                <FaQuestionCircle className="text-2xl text-gray-400" />
              </div>

              <p className="mb-1 font-semibold text-gray-500">
                Belum ada FAQ
              </p>

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
                className="p-5 transition-all bg-white border border-gray-200 shadow-sm rounded-2xl hover:shadow-md"
              >
                {/* TOP SECTION */}
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex rounded-lg bg-primary-50 px-2 py-1 text-xs font-bold text-primary-700">
                      #{index + 1}
                    </span>

                    <div>
                      <h3 className="text-base font-black text-gray-900">
                        {faq.question}
                      </h3>

                      <p className="mt-1 text-xs text-gray-400">
                        Order: {faq.order}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${faq.is_active
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border border-gray-200 bg-gray-100 text-gray-500'
                      }`}
                  >
                    {faq.is_active ? (
                      <FaCheckCircle />
                    ) : (
                      <FaExclamationCircle />
                    )}

                    {faq.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>

                {/* HOME STATUS */}
                <div className="mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${faq.show_on_home
                        ? 'border border-blue-200 bg-blue-50 text-blue-700'
                        : 'border border-slate-200 bg-slate-100 text-slate-500'
                      }`}
                  >
                    {faq.show_on_home ? <FaEye /> : <FaEyeSlash />}

                    {faq.show_on_home
                      ? 'Tampil di Beranda'
                      : 'Hanya Halaman FAQ'}
                  </span>
                </div>

                {/* ANSWER */}
                <div
                  className="mb-4 text-sm leading-relaxed text-gray-600 line-clamp-3"
                  dangerouslySetInnerHTML={{
                    __html: faq.answer || '',
                  }}
                />

                {/* ACTIONS */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => handleToggleShowOnHome(faq.id)}
                    disabled={actionLoading === `home-${faq.id}`}
                    className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${faq.show_on_home
                        ? 'text-blue-700 hover:bg-blue-50'
                        : 'text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    {faq.show_on_home ? <FaEyeSlash /> : <FaEye />}

                    {faq.show_on_home
                      ? 'Sembunyikan Beranda'
                      : 'Tampilkan Beranda'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleActive(faq.id)}
                    disabled={actionLoading === `active-${faq.id}`}
                    className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${faq.is_active
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
                    className="flex items-center gap-1 px-3 py-2 text-xs font-bold transition-all rounded-lg text-primary-600 hover:bg-primary-50"
                  >
                    <FaEdit />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(faq.id)}
                    disabled={actionLoading === `delete-${faq.id}`}
                    className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-red-500 transition-all rounded-lg hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
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

      {/* =========================
    MODAL
========================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between py-5 border-b border-gray-100 px-7">
              <div>
                <h3 className="text-lg font-black text-gray-900">
                  {editingFaq ? 'Edit FAQ' : 'Tambah FAQ Baru'}
                </h3>

                <p className="mt-0.5 text-xs text-gray-500">
                  {editingFaq
                    ? 'Perbarui pertanyaan dan jawaban'
                    : 'Isi data pertanyaan dan jawaban FAQ baru'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="p-2 text-gray-400 transition-colors rounded-xl hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="py-6 space-y-5 px-7"
            >
              {/* SAVE MESSAGE */}
              {saveMessage && (
                <div
                  className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${saveMessage.type === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-red-200 bg-red-50 text-red-700'
                    }`}
                >
                  {saveMessage.type === 'success' ? (
                    <FaCheckCircle />
                  ) : (
                    <FaExclamationCircle />
                  )}

                  {saveMessage.text}
                </div>
              )}

              {/* QUESTION */}
              <div>
                <label className="block mb-2 text-sm font-bold text-gray-800">
                  Pertanyaan <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={formData.question}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      question: event.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 text-sm font-medium transition-colors border border-gray-200 bg-gray-50 rounded-xl focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Contoh: Berapa lama proses akreditasi?"
                  required
                />
              </div>

              {/* ANSWER */}
              <div>
                <label className="block mb-2 text-sm font-bold text-gray-800">
                  Jawaban <span className="text-red-500">*</span>
                </label>

                <QuillEditor
                  key={editingFaq ? `edit-${editingFaq.id}` : 'new'}
                  value={formData.answer}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      answer: value,
                    }))
                  }
                  minHeight={180}
                  placeholder="Tuliskan jawaban FAQ secara jelas dan lengkap..."
                />
              </div>

              {/* SETTINGS */}
              <div className="space-y-3">

                {/* ORDER */}
                <div>
                  <label className="block mb-2 text-sm font-bold text-gray-800">
                    Urutan Tampil
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={formData.order}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        order: event.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 text-sm transition-colors border border-gray-200 rounded-xl bg-gray-50 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Otomatis"
                  />
                </div>

                {/* ACTIVE STATUS */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <div className="text-sm font-bold text-gray-800">
                      Status Aktif
                    </div>

                    <div className="text-xs text-gray-500">
                      Tampilkan FAQ di halaman publik
                    </div>
                  </div>

                  <ToggleSwitch
                    checked={formData.is_active}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        is_active: !prev.is_active,
                      }))
                    }
                  />
                </div>

                {/* SHOW ON HOME */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <div className="text-sm font-bold text-gray-800">
                      Tampil di Beranda
                    </div>

                    <div className="text-xs text-gray-500">
                      Tampilkan FAQ di homepage
                    </div>
                  </div>

                  <ToggleSwitch
                    checked={formData.show_on_home}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        show_on_home: !prev.show_on_home,
                      }))
                    }
                  />
                </div>
              </div>

              {/* FOOTER */}
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-bold text-sm hover:from-primary-700 hover:to-primary-800 transition-all shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? 'Menyimpan...'
                    : editingFaq
                      ? 'Simpan Perubahan'
                      : 'Tambah FAQ'}
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