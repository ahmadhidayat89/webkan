import { useEffect, useId, useState } from 'react';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaUsers,
  FaCheckCircle,
  FaExclamationCircle,
  FaLock,
  FaUserShield,
} from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';

const emptyForm = {
  name: '',
  email: '',
  role: 'admin',
  password: '',
};

const ROLE_LABELS = {
  super_admin: {
    label: 'Super Admin',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  admin: {
    label: 'Admin',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  adminsosmed: {
    label: 'Admin Sosial Media',
    color: 'bg-pink-100 text-pink-700 border-pink-200',
  },
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState(emptyForm);
  const [editingUser, setEditingUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [msg, setMsg] = useState(null);

  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const roleId = useId();

  let currentUser = null;

  try {
    currentUser = JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    currentUser = null;
  }

  const myRole = currentUser?.role || null;
  const myId = currentUser?.id || null;

  const isSuperAdmin = myRole === 'super_admin';

  const allowedRoles = isSuperAdmin
    ? ['super_admin', 'admin', 'adminsosmed']
    : ['admin', 'adminsosmed'];

  const headers = {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/v1/admin/users', {
        headers,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Gagal memuat pengguna.'
        );
      }

      setUsers(result.data.data);
    } catch (error) {
      showMessage('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMsg({ type, text });

    setTimeout(() => {
      setMsg(null);
    }, 4000);
  };

  const openAdd = () => {
    setEditingUser(null);

    setForm({
      ...emptyForm,
      role: allowedRoles[0] || 'admin',
    });

    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);

    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'admin',
    });

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setForm(emptyForm);
  };

  const saveUser = async (event) => {
    event.preventDefault();

    setSaving(true);
    setMsg(null);

    const isEdit = Boolean(editingUser);

    const url = isEdit
      ? `/api/v1/admin/users/${editingUser.id}`
      : '/api/v1/admin/users';

    const method = isEdit ? 'PUT' : 'POST';

    const payload = {
      ...form,
    };

    if (isEdit && !payload.password) {
      delete payload.password;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const firstError = result.errors
          ? Object.values(result.errors).flat()[0]
          : result.message;

        throw new Error(
          firstError || 'Gagal menyimpan pengguna.'
        );
      }

      showMessage(
        'success',
        isEdit
          ? 'User berhasil diperbarui.'
          : 'User berhasil dibuat.'
      );

      closeModal();
      await loadUsers();
    } catch (error) {
      showMessage(
        'error',
        error.message || 'Terjadi kesalahan, coba lagi.'
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Hapus akun ${user.name}?`)) {
      return;
    }

    setDeleting(user.id);
    setMsg(null);

    try {
      const response = await fetch(
        `/api/v1/admin/users/${user.id}`,
        {
          method: 'DELETE',
          headers,
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Gagal menghapus pengguna.'
        );
      }

      showMessage('success', 'User berhasil dihapus.');

      setUsers((prev) =>
        prev.filter((item) => item.id !== user.id)
      );
    } catch (error) {
      showMessage(
        'error',
        error.message || 'Terjadi kesalahan, coba lagi.'
      );
    } finally {
      setDeleting(null);
    }
  };

  const canModify = (user) => {
    if (Number(user.id) === Number(myId)) {
      return false;
    }

    if (
      myRole !== 'super_admin' &&
      user.role === 'super_admin'
    ) {
      return false;
    }

    return true;
  };

  const totalByRole = (role) => {
    return users.filter((user) => user.role === role).length;
  };

  // Label tombol submit di modal (menggantikan nested ternary)
  let submitLabel = editingUser ? 'Simpan Perubahan' : 'Buat User';
  if (saving) submitLabel = 'Menyimpan...';

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
                <FaUserShield className="text-xl text-white" />
              </div>

              <div>
                <h2 className="text-2xl font-black">
                  Kelola User
                </h2>

                <p className="mt-0.5 text-sm text-white/70">
                  Manajemen akun admin dan hak akses
                </p>
              </div>
            </div>

            {/* Stats + Button */}
            <div className="flex items-center gap-3">

              {isSuperAdmin && (
                <div className="hidden text-center px-4 py-2.5 bg-white/15 rounded-xl border border-white/20 sm:block">
                  <div className="text-xl font-black">
                    {totalByRole('super_admin')}
                  </div>

                  <div className="text-xs font-semibold text-white/70">
                    Super Admin
                  </div>
                </div>
              )}

              <div className="hidden text-center px-4 py-2.5 bg-white/15 rounded-xl border border-white/20 sm:block">
                <div className="text-xl font-black">
                  {totalByRole('admin')}
                </div>

                <div className="text-xs font-semibold text-white/70">
                  Admin
                </div>
              </div>

              <div className="hidden text-center px-4 py-2.5 bg-white/15 rounded-xl border border-white/20 sm:block">
                <div className="text-xl font-black">
                  {totalByRole('adminsosmed')}
                </div>

                <div className="text-xs font-semibold text-white/70">
                  Sosmed
                </div>
              </div>

              <button
                type="button"
                onClick={openAdd}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold shadow-md transition-all bg-white rounded-xl text-primary-700 hover:bg-white/90"
              >
                <FaPlus />
                Tambah User
              </button>

            </div>
          </div>
        </div>

        {/* =========================
            FLASH MESSAGE
        ========================= */}
        {msg && (
          <div
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${
              msg.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {msg.type === 'success' ? (
              <FaCheckCircle />
            ) : (
              <FaExclamationCircle />
            )}

            {msg.text}
          </div>
        )}

        {/* =========================
            TABLE
        ========================= */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl">

          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">

            <h3 className="font-bold text-gray-800">
              Daftar User ({users.length})
            </h3>

          </div>

          {loading && (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 rounded-full border-primary-600 border-t-transparent animate-spin" />
            </div>
          )}

          {!loading && users.length === 0 && (
            <div className="py-16 text-center text-gray-400">
              <FaUsers className="mx-auto mb-3 text-3xl text-gray-300" />
              <p>Belum ada user.</p>
            </div>
          )}

          {!loading && users.length > 0 && (
            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead className="text-xs font-bold text-left text-gray-500 uppercase border-b border-gray-100 bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">
                      Nama
                    </th>

                    <th className="px-6 py-3">
                      Email
                    </th>

                    <th className="px-6 py-3">
                      Role
                    </th>

                    <th className="px-6 py-3">
                      Dibuat
                    </th>

                    <th className="px-6 py-3 text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50">

                  {users.map((user) => {
                    const roleInfo =
                      ROLE_LABELS[user.role] || {
                        label: user.role,
                        color:
                          'bg-gray-100 text-gray-600 border-gray-200',
                      };

                    const modifiable = canModify(user);

                    const isCurrentUser =
                      Number(user.id) === Number(myId);

                    return (
                      <tr
                        key={user.id}
                        className="transition-colors hover:bg-gray-50"
                      >

                        {/* Nama */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">

                            <div className="flex items-center justify-center font-bold rounded-full text-primary-700 bg-primary-100 h-9 w-9 shrink-0">
                              {user.name
                                ?.charAt(0)
                                .toUpperCase()}
                            </div>

                            <span className="font-semibold text-gray-800">
                              {user.name}
                            </span>

                            {isCurrentUser && (
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                                Anda
                              </span>
                            )}

                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-6 py-4 text-gray-600">
                          {user.email}
                        </td>

                        {/* Role */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block rounded-full border px-3 py-0.5 text-xs font-bold ${roleInfo.color}`}
                          >
                            {roleInfo.label}
                          </span>
                        </td>

                        {/* Dibuat */}
                        <td className="px-6 py-4 text-gray-500">
                          {user.created_at
                            ? new Date(
                                user.created_at
                              ).toLocaleDateString(
                                'id-ID',
                                {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                }
                              )
                            : '-'}
                        </td>

                        {/* Aksi */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">

                            {modifiable ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEdit(user)
                                  }
                                  className="flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary-600 transition-colors hover:bg-primary-100"
                                >
                                  <FaEdit />
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteUser(user)
                                  }
                                  disabled={
                                    deleting === user.id
                                  }
                                  className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                                >
                                  <FaTrash />

                                  {deleting === user.id
                                    ? '...'
                                    : 'Hapus'}
                                </button>
                              </>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-gray-300">
                                <FaLock />
                                Terkunci
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

      {/* =========================
          MODAL
      ========================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">

          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white shadow-2xl rounded-2xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between py-5 border-b border-gray-100 px-7">

              <div>
                <h3 className="text-lg font-black text-gray-900">
                  {editingUser
                    ? 'Edit User'
                    : 'Tambah User Baru'}
                </h3>

                <p className="mt-0.5 text-xs text-gray-500">
                  {editingUser
                    ? 'Perbarui detail user'
                    : 'Isi detail user baru'}
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

            {/* Form */}
            <form onSubmit={saveUser}>

              <div className="py-6 space-y-5 px-7">

                {/* Nama */}
                <div>
                  <label htmlFor={nameId} className="block mb-2 text-sm font-bold text-gray-800">
                    Nama <span className="text-red-500">*</span>
                  </label>
                  
                  <input
                    id={nameId}
                    type="text"
                    required
                    maxLength="255"
                    value={form.name}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Nama lengkap"
                    className="w-full px-4 py-3 text-sm transition-colors border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-400"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor={emailId} className="block mb-2 text-sm font-bold text-gray-800">
                    Email <span className="text-red-500">*</span>
                  </label>
                  
                  <input
                    id={emailId}
                    type="email"
                    required
                    maxLength="255"
                    value={form.email}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                    placeholder="email@domain.com"
                    className="w-full px-4 py-3 text-sm transition-colors border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-400"
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor={passwordId} className="block mb-2 text-sm font-bold text-gray-800">

                    Password

                    {editingUser && (
                      <span className="ml-1 font-normal text-gray-400">
                        (kosongkan jika tidak diubah)
                      </span>
                    )}

                    {!editingUser && (
                      <span className="text-red-500"> *</span>
                    )}

                  </label>

                  <input
                    id={passwordId}
                    type="password"
                    required={!editingUser}
                    minLength="8"
                    maxLength="128"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        password: event.target.value,
                      }))
                    }
                    placeholder={
                      editingUser
                        ? '••••••••'
                        : 'Min. 8 karakter'
                    }
                    className="w-full px-4 py-3 text-sm transition-colors border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-400"
                  />
                </div>

                {/* Role */}
                <div>
                  <label htmlFor={roleId} className="block mb-2 text-sm font-bold text-gray-800">
                    Role <span className="text-red-500">*</span>
                  </label>
                  
                  <select
                    id={roleId}
                    value={form.role}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        role: event.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 text-sm transition-colors border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-400"
                  >
                    {allowedRoles.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]?.label || role}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 py-4 border-t border-gray-100 px-7">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  aria-label="Tutup"
                  className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-bold text-sm hover:from-primary-700 hover:to-primary-800 transition-all shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitLabel}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </AdminLayout>
  );
};

export default UserManagement;
