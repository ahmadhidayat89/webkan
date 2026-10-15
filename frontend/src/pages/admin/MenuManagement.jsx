import { useEffect, useState } from 'react';
import { FaEdit, FaPlus, FaTrash, FaLink } from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';

const blank = { parent_id: null, title_id: '', title_en: '', url: '/', order: 0, is_active: true };

const MenuManagement = () => {
  const [menus, setMenus] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const headers = {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  };

  const loadMenus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/admin/menus', { headers });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Gagal memuat menu.');
      setMenus(result.data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadMenus(); }, []);

  const saveMenu = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await fetch(
        editing ? `/api/v1/admin/menus/${editing.id}` : '/api/v1/admin/menus',
        { method: editing ? 'PUT' : 'POST', headers, body: JSON.stringify(form) },
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || Object.values(result.errors || {}).flat().join(' ') || 'Gagal menyimpan menu.');
      }
      setForm(blank);
      setEditing(null);
      await loadMenus();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (menu) => {
    setEditing(menu);
    setForm({
      parent_id: menu.parent_id,
      title_id: menu.title_id,
      title_en: menu.title_en || '',
      url: menu.url,
      order: menu.order,
      is_active: menu.is_active,
    });
  };

  const deleteMenu = async (menu) => {
    if (!window.confirm(`Hapus menu "${menu.title_id}"?`)) return;
    try {
      const response = await fetch(`/api/v1/admin/menus/${menu.id}`, { method: 'DELETE', headers });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Gagal menghapus menu.');
      await loadMenus();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-primary-700 via-primary-800 to-primary-900 rounded-2xl p-7 text-white shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
              <FaLink className="text-white text-xl" />
            </div>
            <div>
              <h2 className="text-2xl font-black">Kelola Menu</h2>
              <p className="text-white/70 text-sm mt-0.5">Atur tautan navigasi website. Buat halaman terlebih dahulu di Kelola Halaman, lalu tambahkan rutenya di sini.</p>
            </div>
          </div>
        </div>
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        <form onSubmit={saveMenu} className="grid gap-4 rounded-2xl border bg-white p-6 md:grid-cols-2">
          <h3 className="text-lg font-bold md:col-span-2">{editing ? 'Ubah Menu' : 'Tambah Menu'}</h3>
          <label className="space-y-1 text-sm font-semibold">
            <span>Nama menu (Indonesia)</span>
            <input required maxLength="255" value={form.title_id} onChange={(event) => setForm({ ...form, title_id: event.target.value })} className="w-full rounded-lg border px-3 py-2 font-normal" />
          </label>
          <label className="space-y-1 text-sm font-semibold">
            <span>Nama menu (English)</span>
            <input maxLength="255" value={form.title_en} onChange={(event) => setForm({ ...form, title_en: event.target.value })} className="w-full rounded-lg border px-3 py-2 font-normal" />
          </label>
          <label className="space-y-1 text-sm font-semibold">
            <span>Route / URL</span>
            <input required maxLength="2048" placeholder="/nama-halaman" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} className="w-full rounded-lg border px-3 py-2 font-mono font-normal" />
          </label>
          <label className="space-y-1 text-sm font-semibold">
            <span>Menu induk</span>
            <select value={form.parent_id || ''} onChange={(event) => setForm({ ...form, parent_id: event.target.value ? Number(event.target.value) : null })} className="w-full rounded-lg border px-3 py-2 font-normal">
              <option value="">Menu utama</option>
              {menus.filter((menu) => !menu.parent_id && menu.id !== editing?.id).map((menu) => <option key={menu.id} value={menu.id}>{menu.title_id}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm font-semibold">
            <span>Urutan</span>
            <input type="number" min="0" max="10000" value={form.order} onChange={(event) => setForm({ ...form, order: Number(event.target.value) })} className="w-full rounded-lg border px-3 py-2 font-normal" />
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} /> Tampilkan di website</label>
          <div className="flex gap-3 md:col-span-2">
            <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 font-semibold text-white disabled:opacity-50"><FaPlus />{saving ? 'Menyimpan...' : 'Simpan Menu'}</button>
            {editing && <button type="button" onClick={() => { setEditing(null); setForm(blank); }} className="rounded-lg border px-4 py-2 font-semibold">Batal</button>}
          </div>
        </form>
        <div className="overflow-x-auto rounded-2xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-5 py-4">Menu</th><th className="px-5 py-4">Route</th><th className="px-5 py-4">Status</th><th className="px-5 py-4 text-right">Aksi</th></tr></thead>
            <tbody className="divide-y">
              {loading && (
                <tr><td colSpan="4" className="p-8 text-center text-gray-500">Memuat menu...</td></tr>
              )}

              {!loading && menus.length === 0 && (
                <tr><td colSpan="4" className="p-8 text-center text-gray-500">Belum ada menu tambahan.</td></tr>
              )}

              {!loading && menus.map((menu) => (
                <tr key={menu.id}>
                  <td className="px-5 py-4 font-semibold">{menu.parent_id ? '↳ ' : ''}{menu.title_id}</td>
                  <td className="px-5 py-4 font-mono text-xs">{menu.url}</td>
                  <td className="px-5 py-4">{menu.is_active ? 'Aktif' : 'Nonaktif'}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button aria-label={`Ubah ${menu.title_id}`} onClick={() => startEdit(menu)} className="rounded-lg p-2 text-primary-700 hover:bg-primary-50"><FaEdit /></button>
                      <button aria-label={`Hapus ${menu.title_id}`} onClick={() => deleteMenu(menu)} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><FaTrash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default MenuManagement;
