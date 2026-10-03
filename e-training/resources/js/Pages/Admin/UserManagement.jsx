import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    UserPlus, Trash2, Search, Mail, Building2, Phone,
    X, CheckCircle2, AlertCircle, Users, Eye, EyeOff,
    Calendar, Pencil, Shield, GraduationCap, AtSign,
} from 'lucide-react';

const ROLE_CONFIG = {
    admin:   { label: 'Admin',   icon: Shield,        bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
    pelajar: { label: 'Pelajar', icon: GraduationCap, bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
};

function RoleBadge({ role }) {
    const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.pelajar;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

// ─── Modal Tambah / Edit User ─────────────────────────────────────────────────
function UserFormModal({ isOpen, onClose, editUser = null }) {
    const isEdit = !!editUser;
    const { data, setData, post, patch, processing, errors, reset } = useForm({
        name:                  editUser?.name         ?? '',
        username:              editUser?.username      ?? '',
        email:                 editUser?.email         ?? '',
        role:                  editUser?.role          ?? 'pelajar',
        organization:          editUser?.organization  ?? '',
        phone:                 editUser?.phone         ?? '',
        password:              '',
        password_confirmation: '',
    });
    const [showPass, setShowPass] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEdit) {
            patch(route('admin.users.update', editUser.id), { onSuccess: () => { reset(); onClose(); } });
        } else {
            post(route('admin.users.store'), { onSuccess: () => { reset(); onClose(); } });
        }
    };

    const field = (label, key, props = {}) => (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {label} {!props.optional && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                {props.icon && <props.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />}
                <input
                    {...props}
                    value={data[key]}
                    onChange={e => setData(key, e.target.value)}
                    className={`w-full text-sm border rounded-xl py-3 focus:ring-navy-500 focus:border-navy-500 transition-colors
                        ${props.icon ? 'pl-10 pr-4' : 'px-4'}
                        ${errors[key] ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                />
            </div>
            {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-navy-50 flex items-center justify-center">
                            {isEdit ? <Pencil className="w-5 h-5 text-navy-600" /> : <UserPlus className="w-5 h-5 text-navy-600" />}
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">{isEdit ? 'Edit User' : 'Tambah User Baru'}</h2>
                            <p className="text-xs text-gray-500">{isEdit ? `Edit profil ${editUser.name}` : 'Isi data akun user'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    {/* Role Selector */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Role <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-2 gap-3">
                            {Object.entries(ROLE_CONFIG).map(([value, cfg]) => (
                                <label key={value} className={`flex items-center gap-2.5 p-3 border-2 rounded-xl cursor-pointer transition-all
                                    ${data.role === value ? 'border-navy-500 bg-navy-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <input type="radio" name="role" value={value} checked={data.role === value}
                                        onChange={() => setData('role', value)} className="sr-only" />
                                    <cfg.icon className={`w-4 h-4 ${data.role === value ? 'text-navy-600' : 'text-gray-400'}`} />
                                    <span className={`text-sm font-semibold ${data.role === value ? 'text-navy-700' : 'text-gray-500'}`}>
                                        {cfg.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                        {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
                    </div>

                    {/* Nama + Username */}
                    {field('Nama Lengkap', 'name', { type: 'text', placeholder: 'contoh: Budi Santoso' })}
                    {field('Username', 'username', { type: 'text', placeholder: 'contoh: budi.santoso', icon: AtSign })}

                    {/* Email */}
                    {field('Email', 'email', { type: 'email', placeholder: 'user@instansi.com', icon: Mail })}

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Password {!isEdit && <span className="text-red-500">*</span>}
                            {isEdit && <span className="text-xs font-normal text-gray-400 ml-1">(kosongkan jika tidak diubah)</span>}
                        </label>
                        <div className="relative">
                            <input
                                type={showPass ? 'text' : 'password'}
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                                placeholder="Min. 8 karakter"
                                className={`w-full pr-10 px-4 text-sm border rounded-xl py-3 ${errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                            />
                            <button type="button" onClick={() => setShowPass(!showPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Konfirmasi Password</label>
                        <input type={showPass ? 'text' : 'password'} value={data.password_confirmation}
                            onChange={e => setData('password_confirmation', e.target.value)}
                            placeholder="Ulangi password"
                            className="w-full px-4 text-sm border border-gray-200 rounded-xl bg-gray-50 py-3" />
                    </div>

                    {/* Instansi + Telepon */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {field('Instansi / Organisasi', 'organization', { type: 'text', placeholder: 'PT / Lembaga', icon: Building2, optional: true })}
                        {field('No. Telepon', 'phone', { type: 'tel', placeholder: '08xxxxxxxxxx', icon: Phone, optional: true })}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                            Batal
                        </button>
                        <button type="submit" disabled={processing}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-navy-600 hover:bg-navy-700 disabled:opacity-60 rounded-xl text-sm font-semibold text-white shadow-sm">
                            {processing
                                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : isEdit ? <Pencil className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                            {processing ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Konfirmasi Hapus ─────────────────────────────────────────────────────────
function DeleteConfirmModal({ user, onConfirm, onCancel }) {
    if (!user) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in p-6">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-base font-bold text-gray-900 text-center mb-1">Hapus Akun User?</h3>
                <p className="text-sm text-gray-500 text-center mb-6">
                    Akun <strong>{user.name}</strong> ({user.username}) akan dihapus permanen.
                </p>
                <div className="flex gap-3">
                    <button onClick={onCancel}
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                        Batal
                    </button>
                    <button onClick={onConfirm}
                        className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-xl text-sm font-semibold text-white">
                        Ya, Hapus
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function UserManagement({ users = [], flash = {} }) {
    const [showAddModal, setShowAddModal]   = useState(false);
    const [editTarget, setEditTarget]       = useState(null);
    const [deleteTarget, setDeleteTarget]   = useState(null);
    const [search, setSearch]               = useState('');
    const [filterRole, setFilterRole]       = useState('all');

    const filtered = users.filter(u => {
        const q = search.toLowerCase();
        const matchSearch = u.name.toLowerCase().includes(q)
            || (u.username || '').toLowerCase().includes(q)
            || (u.organization || '').toLowerCase().includes(q);
        const matchRole = filterRole === 'all' || u.role === filterRole;
        return matchSearch && matchRole;
    });

    const handleDelete = () => {
        if (!deleteTarget) return;
        router.delete(route('admin.users.destroy', deleteTarget.id), {
            onSuccess: () => setDeleteTarget(null),
        });
    };

    const countByRole = (role) => users.filter(u => u.role === role).length;

    return (
        <AuthenticatedLayout>
            <Head title="Kelola User — Admin" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">

                {/* Flash */}
                {flash.success && (
                    <div className="flex items-center gap-3 px-4 py-3 mb-6 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-500" /> {flash.success}
                    </div>
                )}
                {flash.error && (
                    <div className="flex items-center gap-3 px-4 py-3 mb-6 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" /> {flash.error}
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Kelola User</h1>
                        <p className="text-sm text-gray-500 mt-1">Kelola semua akun admin dan pelajar di platform E-Training KAN</p>
                    </div>
                    <button onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-navy-600 hover:bg-navy-700 rounded-xl text-sm font-semibold text-white transition-all shadow-sm w-fit">
                        <UserPlus className="w-4 h-4" /> Tambah User
                    </button>
                </div>

                {/* Search */}
                <div className="relative mb-3">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Cari nama, username, atau instansi..."
                        className="w-full pl-10 pr-4 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:border-navy-500 focus:ring-navy-500" />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Filter Stat Cards */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                        { role: 'all',    label: 'Semua',   count: users.length,         icon: Users,        color: 'text-gray-600',   bg: 'bg-gray-50'   },
                        { role: 'admin',  label: 'Admin',   count: countByRole('admin'),  icon: Shield,       color: 'text-purple-600', bg: 'bg-purple-50' },
                        { role: 'pelajar',label: 'Pelajar', count: countByRole('pelajar'),icon: GraduationCap,color: 'text-blue-600',   bg: 'bg-blue-50'   },
                    ].map(({ role, label, count, icon: Icon, color, bg }) => (
                        <button key={role} onClick={() => setFilterRole(role)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left
                                ${filterRole === role ? 'border-navy-500 bg-navy-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bg}`}>
                                <Icon className={`w-4 h-4 ${color}`} />
                            </div>
                            <div>
                                <p className="text-base font-bold text-gray-900">{count}</p>
                                <p className="text-xs text-gray-500">{label}</p>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Table */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    {filtered.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">User</th>
                                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Username</th>
                                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Role</th>
                                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Instansi</th>
                                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Terdaftar</th>
                                        <th className="px-6 py-4" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filtered.map((user) => {
                                        const cfg = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.pelajar;
                                        return (
                                            <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0
                                                            ${user.role === 'admin' ? 'bg-gradient-to-br from-purple-400 to-purple-600' : 'bg-gradient-to-br from-navy-400 to-navy-600'}`}>
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                                                            <p className="text-xs text-gray-400">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1 text-sm text-gray-600 font-mono">
                                                        <AtSign className="w-3 h-3 text-gray-400" />
                                                        {user.username || <span className="text-gray-300 font-sans">—</span>}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <RoleBadge role={user.role} />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-500">{user.organization || '—'}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                        <Calendar className="w-3.5 h-3.5" /> {user.created_at}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button onClick={() => setEditTarget(user)}
                                                            className="p-2 text-gray-400 hover:text-navy-600 hover:bg-navy-50 rounded-lg transition-colors"
                                                            title="Edit user">
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => setDeleteTarget(user)}
                                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Hapus user">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-16 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                <Users className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-1">
                                {search || filterRole !== 'all' ? 'Tidak ditemukan' : 'Belum ada user'}
                            </h3>
                            <p className="text-xs text-gray-400 mb-5">
                                {search || filterRole !== 'all' ? 'Coba ubah filter atau kata kunci' : 'Tambahkan user pertama'}
                            </p>
                            {!search && filterRole === 'all' && (
                                <button onClick={() => setShowAddModal(true)}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy-600 hover:bg-navy-700 rounded-xl text-sm font-semibold text-white">
                                    <UserPlus className="w-4 h-4" /> Tambah User Pertama
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <UserFormModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
            <UserFormModal isOpen={!!editTarget} onClose={() => setEditTarget(null)} editUser={editTarget} key={editTarget?.id ?? 'edit'} />
            <DeleteConfirmModal user={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
        </AuthenticatedLayout>
    );
}
