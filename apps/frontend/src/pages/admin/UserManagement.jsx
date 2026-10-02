import { useEffect, useState } from 'react';
import {
  FaPlus, FaEdit, FaTrash, FaUsers,
  FaCheckCircle, FaExclamationCircle, FaLock,
  FaUserShield,
} from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';
import api, { getMe } from '../../services/api';

const ROLE_LABELS = {
  super_admin:  { label: 'Super Admin',  color: 'bg-purple-100 text-purple-700 border-purple-200' },
  admin:        { label: 'Admin',         color: 'bg-blue-100 text-blue-700 border-blue-200' },
  sosmed_admin: { label: 'Sosmed Admin',  color: 'bg-pink-100 text-pink-700 border-pink-200' },
};

const INITIAL_FORM = { name: '', email: '', password: '', role: 'admin' };

const UserManagement = () => {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [myRole, setMyRole]       = useState(null);
  const [myId, setMyId]           = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(INITIAL_FORM);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(null);
  const [msg, setMsg]             = useState(null);

  const allowedRoles = myRole === 'super_admin'
    ? ['super_admin', 'admin', 'sosmed_admin']
    : ['admin', 'sosmed_admin'];

  useEffect(() => {
    getMe().then(res => {
      setMyRole(res.data?.data?.role);
      setMyId(res.data?.data?.id);
    });
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users');
      if (data.success) setUsers(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ ...INITIAL_FORM, role: allowedRoles[0] ?? 'admin' });
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditing(null); };

  const handleSave = async () => {
    setSaving(true);
    const isEdit = Boolean(editing);
    const url    = isEdit ? `/admin/users/${editing.id}` : '/admin/users';
    const method = isEdit ? 'PUT' : 'POST';

    const body = { ...form };
    if (isEdit && !body.password) delete body.password;

    try {
      const { data } = await (method === 'PUT' ? api.put(url, body) : api.post(url, body));
      if (data.success) {
        flash('success', isEdit ? 'User berhasil diperbarui.' : 'User berhasil dibuat.');
        closeModal();
        fetchUsers();
      } else {
        const firstErr = data.errors
          ? Object.values(data.errors)[0]?.[0]
          : data.message;
        flash('error', firstErr || 'Gagal menyimpan.');
      }
    } catch {
      flash('error', 'Terjadi kesalahan, coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      const { data } = await api.delete(`/admin/users/${id}`);
      if (data.success) {
        flash('success', 'User berhasil dihapus.');
        setUsers(prev => prev.filter(u => u.id !== id));
      } else {
        flash('error', data.message || 'Gagal menghapus.');
      }
    } catch {
      flash('error', 'Terjadi kesalahan, coba lagi.');
    } finally {
      setDeleting(null);
    }
  };

  const canModify = (user) => {
    if (user.id === myId) return false;
    if (myRole === 'admin' && user.role === 'super_admin') return false;
    return true;
  };

  const totalByRole = (role) => users.filter(u => u.role === role).length;

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 p-7 text-white shadow-xl">
          <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                <FaUserShield className="text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-black">Kelola User</h2>
                <p className="mt-0.5 text-sm text-white/75">Manajemen akun admin dan hak akses</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {myRole === 'super_admin' && (
                <div className="rounded-xl border border-white/20 bg-white/15 px-4 py-2 text-center">
                  <div className="text-xl font-black">{totalByRole('super_admin')}</div>
                  <div className="text-xs text-white/70">Super Admin</div>
                </div>
              )}
              <div className="rounded-xl border border-white/20 bg-white/15 px-4 py-2 text-center">
                <div className="text-xl font-black">{totalByRole('admin')}</div>
                <div className="text-xs text-white/70">Admin</div>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/15 px-4 py-2 text-center">
                <div className="text-xl font-black">{totalByRole('sosmed_admin')}</div>
                <div className="text-xs text-white/70">Sosmed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Flash message */}
        {msg && (
          <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold border ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {msg.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
            {msg.text}
          </div>
        )}

        {/* Table card */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h3 className="font-bold text-gray-800">Daftar User ({users.length})</h3>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 transition-colors"
            >
              <FaPlus /> Tambah User
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center text-gray-400">Belum ada user.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-bold uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-3">Nama</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Dibuat</th>
                    <th className="px-6 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map(user => {
                    const roleInfo   = ROLE_LABELS[user.role] ?? { label: user.role, color: 'bg-gray-100 text-gray-600 border-gray-200' };
                    const modifiable = canModify(user);
                    return (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-gray-800">{user.name}</span>
                            {user.id === myId && (
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Anda</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block rounded-full border px-3 py-0.5 text-xs font-bold ${roleInfo.color}`}>
                            {roleInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(user.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {modifiable ? (
                              <>
                                <button
                                  onClick={() => openEdit(user)}
                                  className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-100 transition-colors"
                                >
                                  <FaEdit /> Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(user.id)}
                                  disabled={deleting === user.id}
                                  className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                                >
                                  <FaTrash /> {deleting === user.id ? '...' : 'Hapus'}
                                </button>
                              </>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-gray-300">
                                <FaLock /> Terkunci
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-black text-gray-800">
                {editing ? 'Edit User' : 'Tambah User Baru'}
              </h3>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-600">Nama</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Nama lengkap"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-600">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="email@domain.com"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-600">
                  Password{' '}
                  {editing && <span className="font-normal text-gray-400">(kosongkan jika tidak diubah)</span>}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder={editing ? '••••••••' : 'Min. 8 karakter'}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-600">Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {allowedRoles.map(r => (
                    <option key={r} value={r}>{ROLE_LABELS[r]?.label ?? r}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                onClick={closeModal}
                className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white hover:bg-indigo-700 transition-colors disabled:opacity-60"
              >
                {saving ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Buat User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default UserManagement;
