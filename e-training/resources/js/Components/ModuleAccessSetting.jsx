import { useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { Lock, Users, X, Search } from 'lucide-react';

export default function ModuleAccessSetting({ module }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2 text-sm">
                    {module.is_restricted
                        ? <Lock className="w-4 h-4 text-amber-600" />
                        : <Users className="w-4 h-4 text-gray-400" />}
                    <span className="font-semibold text-gray-800">Akses modul:</span>
                    <span className={module.is_restricted ? 'text-amber-700 font-medium' : 'text-gray-600'}>
                        {module.is_restricted ? 'Hanya peserta tertentu' : 'Semua peserta kursus'}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="px-4 py-2 text-xs font-bold text-white rounded-lg bg-navy-600 hover:bg-navy-700"
                >
                    Atur Akses
                </button>
            </div>
            {open && <ModuleAccessModal module={module} onClose={() => setOpen(false)} />}
        </>
    );
}

function ModuleAccessModal({ module, onClose }) {
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [participants, setParticipants] = useState([]);
    const [restricted, setRestricted] = useState(false);
    const [selected, setSelected] = useState([]);
    const [search, setSearch] = useState('');
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch(route('admin.modules.access.show', module.id), {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
        })
            .then((r) => {
                if (!r.ok) throw new Error('Gagal memuat data akses modul.');
                return r.json();
            })
            .then((d) => {
                setRestricted(d.is_restricted);
                setParticipants(d.participants);
                setSelected(d.participants.filter((p) => p.allowed).map((p) => p.id));
            })
            .catch((e) => setLoadError(e.message))
            .finally(() => setLoading(false));
    }, [module.id]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return participants.filter(
            (p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
        );
    }, [participants, search]);

    const toggle = (id) =>
        setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    const selectAllFiltered = () =>
        setSelected((prev) => Array.from(new Set([...prev, ...filtered.map((p) => p.id)])));

    const clearAll = () => setSelected([]);

    const save = (e) => {
        e.preventDefault();
        router.put(
            route('admin.modules.access.update', module.id),
            { is_restricted: restricted, user_ids: selected },
            {
                preserveScroll: true,
                onStart: () => { setSaving(true); setErrors({}); },
                onSuccess: () => onClose(),
                onError: setErrors,
                onFinish: () => setSaving(false),
            }
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="flex flex-col w-full max-w-xl max-h-[90vh] bg-white rounded-2xl shadow-xl">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">Akses Modul: {module.title}</h3>
                    <button onClick={onClose} aria-label="Tutup" className="p-1 text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={save} className="flex flex-col flex-1 min-h-0">
                    <div className="p-4 space-y-4 overflow-y-auto">
                        {loading && <p className="text-xs text-center text-gray-400">Memuat...</p>}
                        {loadError && <p className="text-xs text-center text-red-500">{loadError}</p>}

                        {!loading && !loadError && (
                            <>
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={restricted}
                                        onChange={(e) => setRestricted(e.target.checked)}
                                        className="mt-1 rounded border-gray-300 text-navy-600"
                                    />
                                    <span>
                                        <span className="block text-sm font-semibold text-gray-800">Batasi akses modul ini</span>
                                        <span className="block text-xs text-gray-500">
                                            Jika aktif, hanya peserta yang dicentang yang bisa melihat dan membuka modul ini.
                                            Peserta lain tidak melihat modulnya sama sekali. Admin dan pengajar tetap bisa membukanya.
                                        </span>
                                    </span>
                                </label>

                                {restricted && (
                                    <div>
                                        <div className="relative mb-2">
                                            <Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                                            <input
                                                type="text"
                                                placeholder="Cari nama/email..."
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                className="w-full py-2 text-xs border-gray-200 rounded-lg pl-9 bg-gray-50"
                                            />
                                        </div>
                                        <div className="flex gap-3 mb-2 text-xs">
                                            <button type="button" onClick={selectAllFiltered} className="font-medium text-navy-600 hover:underline">Pilih semua hasil</button>
                                            <button type="button" onClick={clearAll} className="font-medium text-gray-500 hover:underline">Kosongkan</button>
                                        </div>
                                        <div className="overflow-y-auto border border-gray-100 divide-y divide-gray-50 rounded-lg max-h-64">
                                            {filtered.map((p) => (
                                                <label key={p.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50">
                                                    <input
                                                        type="checkbox"
                                                        checked={selected.includes(p.id)}
                                                        onChange={() => toggle(p.id)}
                                                    />
                                                    <span className="flex-1 min-w-0">
                                                        <span className="block text-sm font-medium text-gray-900 truncate">{p.name}</span>
                                                        <span className="block text-xs text-gray-500 truncate">{p.email}</span>
                                                    </span>
                                                </label>
                                            ))}
                                            {filtered.length === 0 && (
                                                <p className="p-4 text-xs text-center text-gray-400">Tidak ada peserta.</p>
                                            )}
                                        </div>
                                        <p className="mt-1 text-xs text-gray-400">{selected.length} peserta diizinkan</p>
                                        {selected.length === 0 && (
                                            <p className="mt-1 text-xs text-amber-600">
                                                Belum ada peserta yang dipilih. Kalau disimpan begini, tidak ada peserta yang bisa melihat modul ini.
                                            </p>
                                        )}
                                    </div>
                                )}
                                {errors.user_ids && <p className="text-xs text-red-500">{errors.user_ids}</p>}
                            </>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 p-4 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="text-sm btn-secondary">Batal</button>
                        <button type="submit" disabled={saving || loading || Boolean(loadError)} className="text-sm btn-gold disabled:opacity-40">
                            {saving ? 'Menyimpan...' : 'Simpan Akses'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
