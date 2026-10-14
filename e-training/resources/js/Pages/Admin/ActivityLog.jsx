import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    Activity, UserPlus, Award, HelpCircle,
    CheckCircle2, XCircle, ChevronLeft, ChevronRight,
    Filter, Clock, Search, X,
} from 'lucide-react';

// ─── Config per tipe ─────────────────────────────────────────────────────────
const TYPE_CONFIG = {
    enrollment: {
        icon: UserPlus,
        label: 'Pendaftaran',
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
    },
    certificate: {
        icon: Award,
        label: 'Sertifikat',
        bg: 'bg-gold-50',
        text: 'text-gold-600',
        border: 'border-gold-200',
        dot: 'bg-gold-500',
    },
    quiz: {
        icon: HelpCircle,
        label: 'Kuis',
        bg: 'bg-purple-50',
        text: 'text-purple-600',
        border: 'border-purple-200',
        dot: 'bg-purple-500',
    },
};

const FILTERS = [
    { key: 'all',         label: 'Semua',        icon: Activity  },
    { key: 'enrollment',  label: 'Pendaftaran',   icon: UserPlus  },
    { key: 'certificate', label: 'Sertifikat',    icon: Award     },
    { key: 'quiz',        label: 'Kuis',          icon: HelpCircle},
];

// ─── Activity Row ─────────────────────────────────────────────────────────────
function ActivityRow({ item, index }) {
    const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.enrollment;
    const Icon = cfg.icon;

    return (
        <div
            className={`flex items-start gap-4 p-4 rounded-xl border transition-all hover:shadow-sm animate-fade-in ${cfg.border} ${cfg.bg}/30`}
            style={{ animationDelay: `${index * 30}ms` }}
        >
            {/* Avatar + icon */}
            <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy-400 to-navy-600 flex items-center justify-center text-white text-sm font-bold">
                    {item.user_initial}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white ${cfg.bg}`}>
                    <Icon className={`w-2.5 h-2.5 ${cfg.text}`} />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">
                    <span className="font-semibold">{item.user_name}</span>{' '}
                    <span className="text-gray-600">{item.text}</span>
                </p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                    </span>
                    {item.type === 'quiz' && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full
                            ${item.passed ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                            {item.passed
                                ? <CheckCircle2 className="w-3 h-3" />
                                : <XCircle className="w-3 h-3" />}
                            {item.passed ? 'Lulus' : 'Belum Lulus'} · Skor {item.score}
                        </span>
                    )}
                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                        <Clock className="w-3 h-3" /> {item.time_full}
                    </span>
                </div>
            </div>

            {/* Relative time */}
            <span className="text-[11px] text-gray-400 whitespace-nowrap flex-shrink-0 hidden sm:block">
                {item.time}
            </span>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ActivityLog({ activities = [], total = 0, perPage = 30, currentPage = 1, activeType = 'all' }) {
    const totalPages = Math.ceil(total / perPage);

    const goTo = (params) => {
        router.get(route('admin.activity-log'), params, { preserveState: true, preserveScroll: true });
    };

    const setFilter = (type) => goTo({ type, page: 1 });
    const setPage   = (page) => goTo({ type: activeType, page });

    return (
        <AuthenticatedLayout>
            <Head title="Log Aktivitas — Admin" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-9 h-9 rounded-xl bg-navy-50 flex items-center justify-center">
                            <Activity className="w-5 h-5 text-navy-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Log Aktivitas</h1>
                    </div>
                    <p className="text-sm text-gray-500 ml-12">
                        Pantau semua aktivitas peserta — pendaftaran, penyelesaian kuis, dan sertifikat.
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {FILTERS.map(f => {
                        const Icon = f.icon;
                        const isActive = activeType === f.key;
                        return (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all
                                    ${isActive
                                        ? 'bg-navy-600 text-white border-navy-600 shadow-sm'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {f.label}
                            </button>
                        );
                    })}
                    <span className="ml-auto flex items-center text-sm text-gray-400 self-center">
                        {total} aktivitas total
                    </span>
                </div>

                {/* List */}
                {activities.length > 0 ? (
                    <div className="space-y-2.5 mb-6">
                        {activities.map((item, i) => (
                            <ActivityRow key={item.id} item={item} index={i} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
                        <Activity className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm font-semibold text-gray-500">Belum ada aktivitas</p>
                        <p className="text-xs text-gray-400 mt-1">Aktivitas akan muncul saat peserta mulai berinteraksi</p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                        <p className="text-sm text-gray-500">
                            Hal. {currentPage} dari {totalPages} · {total} aktivitas
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(currentPage - 1)}
                                disabled={currentPage <= 1}
                                className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" /> Sebelumnya
                            </button>
                            <button
                                onClick={() => setPage(currentPage + 1)}
                                disabled={currentPage >= totalPages}
                                className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Berikutnya <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
