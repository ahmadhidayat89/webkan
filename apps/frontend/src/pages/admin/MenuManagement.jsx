import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaArrowUp, FaArrowDown, FaToggleOn, FaToggleOff, FaBars } from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';
import { slugify } from '../../utils/slug';
import {
  getAdminMenus,
  createMenu,
  updateMenu,
  deleteMenu,
  toggleMenuActive,
  reorderMenu,
} from '../../services/api';
import { useConfirm } from '../../hooks/useConfirm';

export default function MenuManagement() {
  const { confirm, ConfirmDialog } = useConfirm();
  const [parents, setParents]               = useState([]);
  const [selectedParent, setSelectedParent] = useState(null);
  const [loading, setLoading]               = useState(true);
  const [modal, setModal]                   = useState(null); // null | { mode:'add'|'edit', level:'parent'|'child', item?:object }
  const [form, setForm]                     = useState({ title_id: '', url: '', is_active: true });
  const [saving, setSaving]                 = useState(false);
  const [error, setError]                   = useState('');

  const loadMenus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminMenus();
      const data = res.data.data;
      setParents(data);
      if (selectedParent) {
        const updated = data.find((p) => p.id === selectedParent.id);
        setSelectedParent(updated || null);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedParent]);

  useEffect(() => { loadMenus(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Buka modal ─────────────────────────────────────────────────────────────
  const openAddModal = (level) => {
    setForm({ title_id: '', url: '', is_active: true });
    setError('');
    setModal({ mode: 'add', level });
  };

  const openEditModal = (level, item) => {
    setError('');
    setForm({ title_id: item.title_id, url: item.url || '', is_active: item.is_active });
    setModal({ mode: 'edit', level, item });
  };

  // ─── Submit form ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (modal.mode === 'add') {
        await createMenu({
          ...form,
          parent_id: modal.level === 'child' ? selectedParent.id : null,
        });
      } else {
        await updateMenu(modal.item.id, form);
      }
      setModal(null);
      await loadMenus();
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Aksi per item ────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!(await confirm('Hapus menu ini? Item dropdown di dalamnya juga akan ikut terhapus.'))) return;
    try {
      await deleteMenu(id);
      if (selectedParent?.id === id) setSelectedParent(null);
      await loadMenus();
      toast.success('Menu berhasil dihapus');
    } catch {
      setError('Gagal menghapus menu. Silakan coba lagi.');
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleMenuActive(id);
      await loadMenus();
    } catch {
      setError('Gagal mengubah status menu.');
    }
  };

  const handleReorder = async (id, direction) => {
    try {
      await reorderMenu(id, direction);
      await loadMenus();
    } catch {
      setError('Gagal mengubah urutan menu.');
    }
  };

  // ─── Auto-generate URL dari title saat field URL masih kosong ────────────────
  const handleTitleChange = (value) => {
    setForm((prev) => ({
      ...prev,
      title_id: value,
      url: prev.url === '' || prev.url === '/' + slugify(prev.title_id)
        ? '/' + slugify(value)
        : prev.url,
    }));
  };

  const children = selectedParent
    ? (parents.find((p) => p.id === selectedParent.id)?.children ?? [])
    : [];

  return (
    <AdminLayout>
      <ConfirmDialog />
      <div className="p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-900">Kelola Menu</h1>
          <p className="text-gray-500 text-sm mt-1">Atur struktur navbar dan halaman yang ditautkan</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-20 text-gray-400">Memuat...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ─── Panel Kiri: Item Utama ──────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                  <FaBars className="text-primary-500" /> Item Navbar Utama
                </h2>
                <button
                  onClick={() => openAddModal('parent')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition"
                >
                  <FaPlus /> Tambah
                </button>
              </div>
              <ul className="divide-y divide-gray-50">
                {parents.map((item) => (
                  <li
                    key={item.id}
                    onClick={() => setSelectedParent(item)}
                    className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition ${
                      selectedParent?.id === item.id
                        ? 'bg-primary-50 border-l-4 border-primary-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm truncate ${!item.is_active ? 'opacity-40 line-through' : ''}`}>
                        {item.title_id}
                      </p>
                      <p className="text-xs text-gray-400 font-mono truncate">{item.url}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => handleReorder(item.id, 'up')} className="p-1 text-gray-400 hover:text-gray-700"><FaArrowUp size={11} /></button>
                      <button onClick={() => handleReorder(item.id, 'down')} className="p-1 text-gray-400 hover:text-gray-700"><FaArrowDown size={11} /></button>
                      <button onClick={() => handleToggle(item.id)} className={`p-1 ${item.is_active ? 'text-green-500' : 'text-gray-300'}`}>
                        {item.is_active ? <FaToggleOn size={16} /> : <FaToggleOff size={16} />}
                      </button>
                      <button onClick={() => openEditModal('parent', item)} className="p-1 text-blue-400 hover:text-blue-600"><FaEdit size={13} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1 text-red-400 hover:text-red-600"><FaTrash size={12} /></button>
                    </div>
                  </li>
                ))}
                {parents.length === 0 && (
                  <li className="px-5 py-8 text-center text-gray-400 text-sm">Belum ada item menu</li>
                )}
              </ul>
            </div>

            {/* ─── Panel Kanan: Dropdown Children ──────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h2 className="font-bold text-gray-800">
                  {selectedParent ? (
                    <span>Dropdown — <span className="text-primary-600">{selectedParent.title_id}</span></span>
                  ) : (
                    <span className="text-gray-400">Pilih item di kiri</span>
                  )}
                </h2>
                {selectedParent && (
                  <button
                    onClick={() => openAddModal('child')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition"
                  >
                    <FaPlus /> Tambah Dropdown
                  </button>
                )}
              </div>
              {!selectedParent ? (
                <div className="px-5 py-12 text-center text-gray-400 text-sm">
                  Klik item navbar utama untuk melihat dropdown-nya
                </div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {children.map((child) => (
                    <li key={child.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${!child.is_active ? 'opacity-40 line-through' : ''}`}>
                          {child.title_id}
                        </p>
                        <p className="text-xs text-gray-400 font-mono truncate">{child.url}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => handleReorder(child.id, 'up')} className="p-1 text-gray-400 hover:text-gray-700"><FaArrowUp size={11} /></button>
                        <button onClick={() => handleReorder(child.id, 'down')} className="p-1 text-gray-400 hover:text-gray-700"><FaArrowDown size={11} /></button>
                        <button onClick={() => handleToggle(child.id)} className={`p-1 ${child.is_active ? 'text-green-500' : 'text-gray-300'}`}>
                          {child.is_active ? <FaToggleOn size={16} /> : <FaToggleOff size={16} />}
                        </button>
                        <button onClick={() => openEditModal('child', child)} className="p-1 text-blue-400 hover:text-blue-600"><FaEdit size={13} /></button>
                        <button onClick={() => handleDelete(child.id)} className="p-1 text-red-400 hover:text-red-600"><FaTrash size={12} /></button>
                      </div>
                    </li>
                  ))}
                  {children.length === 0 && (
                    <li className="px-5 py-8 text-center text-gray-400 text-sm">Belum ada dropdown</li>
                  )}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── Modal Form ─────────────────────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-900">
                {modal.mode === 'add'
                  ? `Tambah ${modal.level === 'parent' ? 'Item Utama' : 'Dropdown'}`
                  : 'Edit Menu'}
              </h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Judul Menu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title_id}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Teks yang tampil di navbar"
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.url}
                  onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                  placeholder="/nama-halaman"
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-400/50"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Contoh: <span className="font-mono">/sejarah-kan</span> atau <span className="font-mono">/layanan/laboratorium</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                  className="w-4 h-4 text-primary-600"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">Aktif (tampil di navbar)</label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-5 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 text-sm bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-60 transition"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
