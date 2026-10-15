import { Head, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Shield, Search, Calendar, Activity, MapPin, Hash, User, Filter } from 'lucide-react';
import { useState } from 'react';

const METHOD_BADGE_COLORS = {
    POST: 'bg-green-100 text-green-700',
    PUT: 'bg-blue-100 text-blue-700',
    PATCH: 'bg-blue-100 text-blue-700',
    DELETE: 'bg-red-100 text-red-700',
};

const getPageLinkClass = (link) => {
    if (link.active) return 'bg-navy-600 text-white';
    if (link.url) return 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200';
    return 'text-gray-400 cursor-not-allowed';
};

export default function Index({ auth, logs, filters }) {
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [role, setRole] = useState(filters.role || '');

    const handleFilter = (e) => {
        e.preventDefault();
        router.get(route('admin.audit-logs.index'), {
            start_date: startDate,
            end_date: endDate,
            role: role
        }, { preserveState: true });
    };

    const clearFilter = () => {
        setStartDate('');
        setEndDate('');
        setRole('');
        router.get(route('admin.audit-logs.index'));
    };

    const formatEventName = (event) => {
        if (event.startsWith('admin_')) {
            const parts = event.split('_');
            const method = parts[1].toUpperCase();
            const resource = parts.slice(2).join(' / ');
            return (
                <span className="inline-flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${METHOD_BADGE_COLORS[method] || 'bg-gray-100 text-gray-700'}`}>
                        {method}
                    </span>
                    <span className="text-gray-700 font-medium capitalize">{resource}</span>
                </span>
            );
        }
        
        const badgeColors = {
            login: 'bg-green-50 text-green-700 border-green-200',
            logout: 'bg-gray-50 text-gray-700 border-gray-200',
            failed_login: 'bg-red-50 text-red-700 border-red-200',
            password_reset: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        };

        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${badgeColors[event] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                {event.replace('_', ' ').toUpperCase()}
            </span>
        );
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Log Aktivitas (Audit Trail)</h2>}
        >
            <Head title="Log Aktivitas" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header & Filters */}
                    <div className="mb-6 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center text-navy-600">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900">Riwayat Sistem</h1>
                                <p className="text-sm text-gray-500">Pantau aktivitas login dan aksi administratif.</p>
                            </div>
                        </div>

                        <form onSubmit={handleFilter} className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                                <Filter className="w-4 h-4 text-gray-400" />
                                <select 
                                    value={role} 
                                    onChange={(e) => setRole(e.target.value)}
                                    className="bg-transparent border-none p-0 text-sm focus:ring-0 text-gray-700 w-28"
                                >
                                    <option value="">Semua Peran</option>
                                    <option value="admin">Admin</option>
                                    <option value="peserta">Peserta</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-transparent border-none p-0 text-sm focus:ring-0 text-gray-700"
                                    placeholder="Start Date"
                                />
                            </div>
                            <span className="text-gray-400 self-center hidden sm:block">-</span>
                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-transparent border-none p-0 text-sm focus:ring-0 text-gray-700"
                                    placeholder="End Date"
                                />
                            </div>
                            <button type="submit" className="btn-primary py-2 px-4 rounded-lg text-sm">
                                <Search className="w-4 h-4 mr-2 inline" /> Filter
                            </button>
                            {(startDate || endDate || role) && (
                                <button type="button" onClick={clearFilter} className="px-4 py-2 text-sm text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors">
                                    Reset
                                </button>
                            )}
                        </form>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-600">
                                <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Waktu</th>
                                        <th className="px-6 py-4">Pengguna</th>
                                        <th className="px-6 py-4">Aktivitas</th>
                                        <th className="px-6 py-4">IP & Session</th>
                                        <th className="px-6 py-4">Detail Tambahan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {logs.data.length > 0 ? logs.data.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-gray-900 font-medium">
                                                    {new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {new Date(log.created_at).toLocaleTimeString('id-ID')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {log.user ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${log.user.role === 'admin' ? 'bg-gradient-to-br from-gold-500 to-gold-700' : 'bg-gradient-to-br from-navy-500 to-navy-700'}`}>
                                                            {log.user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <p className="text-gray-900 font-medium text-sm">{log.user.name}</p>
                                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${log.user.role === 'admin' ? 'bg-gold-100 text-gold-700' : 'bg-navy-50 text-navy-600'}`}>
                                                                    {log.user.role === 'admin' ? 'Admin' : 'Peserta'}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-500">{log.user.email}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-gray-400">
                                                        <User className="w-4 h-4" />
                                                        <span className="italic">Guest / Tidak Diketahui</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {formatEventName(log.event)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1.5 text-xs">
                                                    <div className="flex items-center gap-1.5 text-gray-700">
                                                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                        {log.ip_address || '-'}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-gray-500" title={log.session_id}>
                                                        <Hash className="w-3.5 h-3.5 text-gray-400" />
                                                        {log.session_id ? log.session_id.substring(0, 8) + '...' : '-'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 max-w-xs">
                                                <div className="text-xs text-gray-500 truncate" title={log.user_agent}>
                                                    {log.user_agent}
                                                </div>
                                                {log.details && (
                                                    <div className="mt-1.5 p-2 bg-gray-50 rounded border border-gray-100 text-[10px] font-mono text-gray-600 overflow-x-auto max-h-20">
                                                        {JSON.stringify(log.details)}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                                Tidak ada log aktivitas yang ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {logs.links && logs.links.length > 3 && (
                            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-wrap gap-1">
                                {logs.links.map((link) => (
                                    <Link
                                        key={link.url ?? link.label}
                                        href={link.url || '#'}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${getPageLinkClass(link)}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        preserveState
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
