import { useEffect, useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaUserCog } from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';

const emptyForm = { name: '', email: '', role: 'admin', password: '' };
const roleLabels = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  adminsosmed: 'Admin Sosial Media',
  sosmed_admin: 'Admin Sosial Media',
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingUser, setEditingUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    currentUser = null;
  }
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const headers = {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/admin/users', { headers });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Gagal memuat pengguna.');
      setUsers(result.data.data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openForm = (user = null) => {
    setEditingUser(user);
    setShowForm(true);
    setForm(user
      ? { name: user.name, email: user.email, role: user.role, password: '' }
      : emptyForm);
    setError('');
  };

  const saveUser = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      const response = await fetch(
        editingUser ? `/api/v1/admin/users/${editingUser.id}` : '/api/v1/admin/users',
        {
          method: editingUser ? 'PUT' : 'POST',
          headers,
          body: JSON.stringify(payload),
        },
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || Object.values(result.errors || {}).flat().join(' ') || 'Gagal menyimpan pengguna.');
      }
      setEditingUser(null);
      setShowForm(false);
      setForm(emptyForm);
      await loadUsers();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Hapus akun ${user.name}?`)) return;
    setError('');
    try {
      const response = await fetch(`/api/v1/admin/users/${user.id}`, {
        method: 'DELETE',
        headers,
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Gagal menghapus pengguna.');
      await loadUsers();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Kelola User</h2>
            <p className="mt-1 text-gray-600">Buat akun admin dan atur peran akses panel.</p>
          </div>
          <button onClick={() => openForm()} className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 font-bold text-white">
            <FaPlus /> Tambah User
          </button>
        </div>

        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {showForm && (
          <form onSubmit={saveUser} className="grid gap-4 rounded-2xl border bg-white p-6 md:grid-cols-2">
            <h3 className="text-lg font-bold md:col-span-2">{editingUser ? 'Ubah User' : 'Tambah User'}</h3>
            <label className="space-y-1 text-sm font-semibold">Nama
              <input required maxLength="255" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-lg border px-3 py-2 font-normal" />
            </label>
            <label className="space-y-1 text-sm font-semibold">Email
              <input required type="email" maxLength="255" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-lg border px-3 py-2 font-normal" />
            </label>
            <label className="space-y-1 text-sm font-semibold">Peran
              <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="w-full rounded-lg border px-3 py-2 font-normal">
                <option value="admin">Admin</option>
                <option value="adminsosmed">Admin Sosial Media</option>
                {isSuperAdmin && <option value="super_admin">Super Admin</option>}
              </select>
            </label>
            <label className="space-y-1 text-sm font-semibold">{editingUser ? 'Password baru (opsional)' : 'Password'}
              <input required={!editingUser} type="password" minLength="8" maxLength="128" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="w-full rounded-lg border px-3 py-2 font-normal" />
            </label>
            <div className="flex gap-3 md:col-span-2">
              <button disabled={saving} className="rounded-lg bg-primary-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
              <button type="button" onClick={() => { setEditingUser(null); setShowForm(false); setError(''); }} className="rounded-lg border px-4 py-2 font-semibold">Batal</button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto rounded-2xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-5 py-4">Nama</th><th className="px-5 py-4">Email</th><th className="px-5 py-4">Peran</th><th className="px-5 py-4 text-right">Aksi</th></tr></thead>
            <tbody className="divide-y">
              {loading ? <tr><td colSpan="4" className="p-8 text-center text-gray-500">Memuat user...</td></tr>
                : users.length === 0 ? <tr><td colSpan="4" className="p-8 text-center text-gray-500">Belum ada user.</td></tr>
                  : users.map((user) => {
                    const protectedSuperAdmin = user.role === 'super_admin' && !isSuperAdmin;
                    const isCurrentUser = Number(user.id) === Number(currentUser?.id);
                    return <tr key={user.id}>
                      <td className="px-5 py-4 font-semibold">{user.name}{isCurrentUser && <span className="ml-2 text-xs text-gray-400">(Anda)</span>}</td>
                      <td className="px-5 py-4">{user.email}</td>
                      <td className="px-5 py-4">{roleLabels[user.role] || user.role}</td>
                      <td className="px-5 py-4">
                        {!protectedSuperAdmin && <div className="flex justify-end gap-2">
                          <button aria-label={`Ubah ${user.name}`} onClick={() => openForm(user)} className="rounded-lg p-2 text-primary-700 hover:bg-primary-50"><FaEdit /></button>
                          {!isCurrentUser && <button aria-label={`Hapus ${user.name}`} onClick={() => deleteUser(user)} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><FaTrash /></button>}
                        </div>}
                      </td>
                    </tr>;
                  })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500"><FaUserCog /> Password minimal 8 karakter. Perubahan role atau password akan mencabut sesi login lama.</div>
      </div>
    </AdminLayout>
  );
};

export default UserManagement;
