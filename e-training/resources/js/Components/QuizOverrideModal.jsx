import { useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { X, Search } from 'lucide-react';

const fmt = (iso) =>
    new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' });

export default function QuizOverrideModal({ quizzes, initialUserId = null, onClose }) {
    const [quizId, setQuizId] = useState(quizzes[0]?.id ?? '');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [selected, setSelected] = useState(initialUserId ? [initialUserId] : []);
    const [search, setSearch] = useState('');
    const [extra, setExtra] = useState(1);
    const [openUntil, setOpenUntil] = useState('');
    const [reason, setReason] = useState('');
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const load = (id) => {
        setLoading(true);
        setLoadError('');
        fetch(route('admin.quizzes.overrides.index', id), {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
        })
            .then((r) => {
                if (!r.ok) throw new Error('Gagal memuat data peserta.');
                return r.json();
            })
            .then(setData)
            .catch((e) => setLoadError(e.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        setSelected(initialUserId ? [initialUserId] : []);
        if (quizId) load(quizId);
    }, [quizId]);

    const participants = useMemo(() => {
        const q = search.toLowerCase();
        return (data?.participants ?? []).filter(
            (p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
        );
    }, [data, search]);

    const toggle = (id) =>
        setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    const submit = (e) => {
        e.preventDefault();
        if (selected.length === 0) return;
        router.post(
            route('admin.quizzes.overrides.store', quizId),
            { user_ids: selected, extra_attempts: Number(extra), open_until: openUntil || null, reason },
            {
                preserveScroll: true,
                onStart: () => { setSaving(true); setErrors({}); },
                onSuccess: () => { setSelected([]); setReason(''); load(quizId); },
                onError: setErrors,
                onFinish: () => setSaving(false),
            }
        );
    };

    const revoke = (p) => {
        if (!confirm(`Cabut keringanan ${p.name}?`)) return;
        router.delete(route('admin.quizzes.overrides.destroy', [quizId, p.override.id]), {
            preserveScroll: true,
            onSuccess: () => load(quizId),
            onError: (errs) => alert(Object.values(errs).join('\n') || 'Gagal mencabut keringanan.'),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="flex flex-col w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-xl">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">Beri Keringanan Kuis</h3>
                    <button onClick={onClose} aria-label="Tutup" className="p-1 text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={submit} className="flex flex-col flex-1 min-h-0">
                    <div className="p-4 space-y-4 overflow-y-auto">
                        <div>
                            <label htmlFor="ov-quiz" className="block mb-1 text-xs font-medium text-gray-600">Kuis</label>
                            <select
                                id="ov-quiz"
                                value={quizId}
                                onChange={(e) => setQuizId(e.target.value)}
                                className="w-full text-sm border-gray-200 rounded-lg bg-gray-50"
                            >
                                {quizzes.map((q) => (
                                    <option key={q.id} value={q.id}>{q.module_title} / {q.title}</option>
                                ))}
                            </select>
                            {data && (
                                <p className="mt-1 text-xs text-gray-400">
                                    Batas percobaan umum: {data.max_attempts || 'tanpa batas'}
                                </p>
                            )}
                        </div>

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
                            <div className="overflow-y-auto border border-gray-100 divide-y divide-gray-50 rounded-lg max-h-56">
                                {loading && <p className="p-4 text-xs text-center text-gray-400">Memuat...</p>}
                                {loadError && <p className="p-4 text-xs text-center text-red-500">{loadError}</p>}
                                {!loading && participants.map((p) => (
                                    <div key={p.id} className="flex items-center gap-3 px-3 py-2">
                                        <input
                                            type="checkbox"
                                            checked={selected.includes(p.id)}
                                            onChange={() => toggle(p.id)}
                                            aria-label={`Pilih ${p.name}`}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-gray-900 truncate">{p.name}</div>
                                            <div className="text-xs text-gray-500 truncate">{p.email}</div>
                                            <div className="text-[11px] text-gray-400">
                                                Percobaan terpakai: {p.attempts_used}
                                                {p.override && (
                                                    <span className="ml-2 text-green-700">
                                                        +{p.override.extra_attempts}
                                                        {p.override.open_until && `, sampai ${fmt(p.override.open_until)}`}
                                                    </span>
                                                )}
                                            </div>
                                            {p.override?.reason && (
                                                <div className="text-[11px] text-gray-500 italic truncate" title={p.override.reason}>
                                                    Alasan: {p.override.reason}
                                                </div>
                                            )}
                                        </div>
                                        {p.override && (
                                            <button
                                                type="button"
                                                onClick={() => revoke(p)}
                                                className="text-xs text-red-500 hover:text-red-700"
                                            >
                                                Cabut
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {!loading && !loadError && participants.length === 0 && (
                                    <p className="p-4 text-xs text-center text-gray-400">Tidak ada peserta.</p>
                                )}
                            </div>
                            <p className="mt-1 text-xs text-gray-400">{selected.length} peserta dipilih</p>
                            {errors.user_ids && <p className="mt-1 text-xs text-red-500">{errors.user_ids}</p>}
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="ov-extra" className="block mb-1 text-xs font-medium text-gray-600">Tambah percobaan</label>
                                <input
                                    id="ov-extra"
                                    type="number" min="0" max="10"
                                    value={extra}
                                    onChange={(e) => setExtra(e.target.value)}
                                    className="w-full text-sm border-gray-200 rounded-lg bg-gray-50"
                                />
                                {errors.extra_attempts && <p className="mt-1 text-xs text-red-500">{errors.extra_attempts}</p>}
                            </div>
                            <div>
                                <label htmlFor="ov-until" className="block mb-1 text-xs font-medium text-gray-600">Tenggat baru (opsional)</label>
                                <input
                                    id="ov-until"
                                    type="datetime-local"
                                    value={openUntil}
                                    onChange={(e) => setOpenUntil(e.target.value)}
                                    className="w-full text-sm border-gray-200 rounded-lg bg-gray-50"
                                />
                                {errors.open_until && <p className="mt-1 text-xs text-red-500">{errors.open_until}</p>}
                            </div>
                        </div>
                        <p className="text-xs text-gray-400">
                            Isi tenggat baru kalau kuis atau modul sudah ditutup. Percobaan ditambahkan ke keringanan sebelumnya; tenggat dikosongkan berarti tenggat lama tetap dipakai.
                        </p>

                        <div>
                            <label htmlFor="ov-reason" className="block mb-1 text-xs font-medium text-gray-600">Alasan (opsional)</label>
                            <textarea
                                id="ov-reason"
                                rows="2"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full text-sm border-gray-200 rounded-lg bg-gray-50"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 p-4 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="text-sm btn-secondary">Tutup</button>
                        <button type="submit" disabled={saving || selected.length === 0} className="text-sm btn-gold disabled:opacity-40">
                            {saving ? 'Menyimpan...' : 'Simpan Keringanan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
