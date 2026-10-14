import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaArrowUp,
  FaArrowDown,
  FaListOl,
} from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';
import { useConfirm } from '../../hooks/useConfirm';
import {
  getAdminAccreditationSteps,
  createAccreditationStep,
  updateAccreditationStep,
  deleteAccreditationStep,
  moveAccreditationStepUp,
  moveAccreditationStepDown,
} from '../../services/api';

const initialFormData = {
  icon: '',
  title: '',
  tag: '',
  description: '',
};

const AccreditationStepsManagement = () => {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const [saving, setSaving] = useState(false);
  const [movingId, setMovingId] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const { confirm, ConfirmDialog } = useConfirm();

  useEffect(() => {
    fetchSteps();
  }, []);

  const fetchSteps = async () => {
    try {
      setLoading(true);

      const { data } = await getAdminAccreditationSteps();

      if (data.success) {
        setSteps(data.data);
      }
    } catch (err) {
      console.error('AccreditationSteps fetch error:', err);
      toast.error('Gagal memuat data langkah');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (step = null) => {
    if (step) {
      setEditingStep(step);

      setFormData({
        icon: step.icon || '',
        title: step.title || '',
        tag: step.tag || '',
        description: step.description || '',
      });
    } else {
      setEditingStep(null);
      setFormData(initialFormData);
    }

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStep(null);
    setSaving(false);
    setFormData(initialFormData);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const { icon, title, tag, description } = formData;

    if (
      !icon.trim() ||
      !title.trim() ||
      !tag.trim() ||
      !description.trim()
    ) {
      return;
    }

    try {
      setSaving(true);

      const payload = {
        icon: icon.trim(),
        title: title.trim(),
        tag: tag.trim(),
        description: description.trim(),
      };

      let result;

      if (editingStep) {
        result = await updateAccreditationStep(editingStep.id, payload);
      } else {
        result = await createAccreditationStep(payload);
      }

      if (result.data.success) {
        toast.success(
          editingStep
            ? 'Langkah berhasil diperbarui'
            : 'Langkah berhasil ditambahkan'
        );

        await fetchSteps();
        closeModal();
      } else {
        toast.error(
          result.data.message || 'Gagal menyimpan langkah'
        );
      }
    } catch (err) {
      console.error('AccreditationStep save error:', err);
      toast.error('Terjadi kesalahan saat menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      !(await confirm(
        'Hapus langkah ini? Tindakan ini tidak dapat dibatalkan.'
      ))
    ) {
      return;
    }

    try {
      const { data } = await deleteAccreditationStep(id);

      if (data.success) {
        toast.success('Langkah berhasil dihapus');
        await fetchSteps();
      } else {
        toast.error(data.message || 'Gagal menghapus langkah');
      }
    } catch (err) {
      console.error('AccreditationStep delete error:', err);
      toast.error('Gagal menghapus langkah');
    }
  };

  const handleMove = async (id, direction) => {
    setMovingId(id);

    try {
      const fn =
        direction === 'up'
          ? moveAccreditationStepUp
          : moveAccreditationStepDown;

      const { data } = await fn(id);

      if (data.success) {
        await fetchSteps();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error('AccreditationStep move error:', err);
      toast.error('Gagal mengubah urutan');
    } finally {
      setMovingId(null);
    }
  };

  return (
    <AdminLayout>
      <ConfirmDialog />

      <div className="space-y-6">

        {/* Header */}
        <div className="relative overflow-hidden text-white shadow-xl rounded-2xl bg-gradient-to-r from-primary-700 via-primary-800 to-primary-900 p-7">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute w-56 h-56 rounded-full -right-10 -top-10 bg-white/5 blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/15">
                <FaListOl className="text-xl text-white" />
              </div>

              <div>
                <h2 className="text-2xl font-black">
                  Proses Akreditasi
                </h2>

                <p className="mt-0.5 text-sm text-white/70">
                  Kelola tahapan proses akreditasi yang tampil di halaman publik
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-white/20 bg-white/15 px-4 py-2.5 text-center">
                <div className="text-xl font-black">
                  {steps.length}
                </div>

                <div className="text-xs font-semibold text-white/70">
                  Total Langkah
                </div>
              </div>

              <button
                type="button"
                onClick={() => openModal()}
                className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-primary-700 shadow-md transition-all hover:bg-white/90"
              >
                <FaPlus />
                Tambah Langkah
              </button>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 rounded-full animate-spin border-primary-600 border-t-transparent" />
            </div>
          ) : steps.length === 0 ? (
            <div className="py-16 text-center bg-white border border-gray-200 rounded-2xl">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-2xl">
                <FaListOl className="text-2xl text-gray-400" />
              </div>

              <p className="mb-1 font-semibold text-gray-500">
                Belum ada langkah
              </p>

              <button
                type="button"
                onClick={() => openModal()}
                className="text-sm font-bold text-primary-600 hover:underline"
              >
                Tambah langkah pertama
              </button>
            </div>
          ) : (
            steps.map((step, index) => (
              <article
                key={step.id}
                className="flex items-start gap-4 p-5 transition-all bg-white border border-gray-200 shadow-sm rounded-2xl hover:shadow-md"
              >
                {/* Nomor urut */}
                <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 text-sm font-black text-blue-700 rounded-xl bg-blue-50">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 text-xl rounded-xl bg-gray-50">
                  {step.icon}
                </div>

                {/* Konten */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-sm font-black text-gray-900">
                      {step.title}
                    </h3>

                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                      {step.tag}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed text-gray-500 line-clamp-2">
                    {step.description}
                  </p>
                </div>

                {/* Tombol aksi */}
                <div className="flex items-center flex-shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => handleMove(step.id, 'up')}
                    disabled={
                      index === 0 || movingId === step.id
                    }
                    className="flex items-center justify-center w-8 h-8 text-xs transition-all rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Naikan urutan"
                  >
                    <FaArrowUp />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMove(step.id, 'down')}
                    disabled={
                      index === steps.length - 1 ||
                      movingId === step.id
                    }
                    className="flex items-center justify-center w-8 h-8 text-xs transition-all rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Turunkan urutan"
                  >
                    <FaArrowDown />
                  </button>

                  <button
                    type="button"
                    onClick={() => openModal(step)}
                    className="flex items-center gap-1 px-3 py-2 text-xs font-bold transition-all rounded-lg text-primary-600 hover:bg-primary-50"
                  >
                    <FaEdit />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(step.id)}
                    className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-red-500 transition-all rounded-lg hover:bg-red-50"
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

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm">

          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8 shadow-2xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between py-5 border-b border-gray-100 px-7">
              <div>
                <h3 className="text-lg font-black text-gray-900">
                  {editingStep
                    ? 'Edit Langkah'
                    : 'Tambah Langkah Baru'}
                </h3>

                <p className="text-xs text-gray-500 mt-0.5">
                  {editingStep
                    ? 'Perbarui informasi langkah akreditasi'
                    : 'Isi detail langkah baru'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="p-2 text-gray-400 transition-colors hover:bg-gray-100 rounded-xl"
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

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="py-6 space-y-5 px-7"
            >

              {/* Icon */}
              <div>
                {/* FIX: label dihubungkan ke input lewat htmlFor + id */}
                <label
                  htmlFor="step-icon"
                  className="block mb-2 text-sm font-bold text-gray-800"
                >
                  Icon (Emoji)
                  <span className="text-red-500"> *</span>
                </label>

                <input
                  id="step-icon"
                  type="text"
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      icon: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 text-sm transition-colors border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 bg-gray-50 focus:bg-white"
                  placeholder="Contoh: 📝"
                  maxLength={20}
                  required
                />
              </div>

              {/* Judul */}
              <div>
                <label
                  htmlFor="step-title"
                  className="block mb-2 text-sm font-bold text-gray-800"
                >
                  Judul Langkah
                  <span className="text-red-500"> *</span>
                </label>

                <input
                  id="step-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 text-sm transition-colors border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 bg-gray-50 focus:bg-white"
                  placeholder="Contoh: Permohonan Akreditasi"
                  required
                />
              </div>

              {/* Tag */}
              <div>
                <label
                  htmlFor="step-tag"
                  className="block mb-2 text-sm font-bold text-gray-800"
                >
                  Tag / Label
                  <span className="text-red-500"> *</span>
                </label>

                <input
                  id="step-tag"
                  type="text"
                  value={formData.tag}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      tag: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 text-sm transition-colors border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 bg-gray-50 focus:bg-white"
                  placeholder="Contoh: Via Portal KAN"
                  maxLength={100}
                  required
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label
                  htmlFor="step-description"
                  className="block mb-2 text-sm font-bold text-gray-800"
                >
                  Deskripsi
                  <span className="text-red-500"> *</span>
                </label>

                <textarea
                  id="step-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={5}
                  className="w-full px-4 py-3 text-sm transition-colors border border-gray-200 resize-y rounded-xl focus:ring-2 focus:ring-primary-500 bg-gray-50 focus:bg-white"
                  placeholder="Tuliskan penjelasan langkah ini secara lengkap..."
                  required
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all"
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
                    : editingStep
                    ? 'Simpan Perubahan'
                    : 'Tambah Langkah'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AccreditationStepsManagement;
