import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Users, Copy, RefreshCw, UserPlus, Search, Trash2 } from 'lucide-react';

export default function TabStudents({ course, allStudents }) {
    const [referralCode, setReferralCode] = useState(course.referral_code || '');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');

    const generateNewReferral = () => {
        if (confirm('Ubah kode referral? Kode lama tidak akan bisa digunakan lagi.')) {
            router.post(route('admin.courses.referral.regenerate', course.id), {}, {
                preserveScroll: true,
                onSuccess: (page) => setReferralCode(page.props.course.referral_code)
            });
        }
    };

    const copyReferral = async () => {
        try {
            await navigator.clipboard.writeText(referralCode);
            alert('Kode referral dicopy: ' + referralCode);
        } catch (error) {
            console.error('Gagal menyalin kode referral:', error);
            alert('Gagal menyalin kode referral. Salin secara manual: ' + referralCode);
        }
    };

    const enrollStudent = (e) => {
        e.preventDefault();
        if (!selectedUserId) return;
        router.post(route('admin.courses.enroll', course.id), {
            user_id: selectedUserId
        }, {
            preserveScroll: true,
            onSuccess: () => setSelectedUserId('')
        });
    };

    const unenrollStudent = (userId, name) => {
        if (confirm(`Keluarkan ${name} dari pelatihan ini?`)) {
            router.delete(route('admin.courses.unenroll', [course.id, userId]), {
                preserveScroll: true
            });
        }
    };

    const filteredEnrolled = course.enrolled_students.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col lg:flex-row gap-6 animate-fade-in">
            {/* Left Side: Referral & Add Student */}
            <div className="w-full lg:w-1/3 space-y-6">
                {/* Referral Card */}
                <div className="bg-gradient-to-br from-navy-800 to-navy-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Users className="w-24 h-24" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-lg font-bold mb-1">Kode Referral Pelatihan</h3>
                        <p className="text-xs text-navy-200 mb-4">Bagikan kode ini ke peserta agar mereka bisa bergabung mandiri.</p>

                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 font-mono text-xl tracking-widest text-gold-400 font-bold text-center">
                                {referralCode}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={copyReferral} className="flex-1 bg-white/10 hover:bg-white/20 transition-colors py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                                <Copy className="w-4 h-4" /> Copy
                            </button>
                            <button onClick={generateNewReferral} className="flex-1 bg-white/10 hover:bg-white/20 transition-colors py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                                <RefreshCw className="w-4 h-4" /> Reset Kode
                            </button>
                        </div>
                    </div>
                </div>

                {/* Add Student Card */}
                <div className="card p-5">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                        <UserPlus className="w-4 h-4 text-navy-600" /> Daftarkan Manual
                    </h3>
                    <form onSubmit={enrollStudent} className="space-y-4">
                        <div>
                            <label htmlFor="enroll-student" className="block text-xs font-medium text-gray-600 mb-1">Pilih Peserta</label>
                            <select
                                id="enroll-student"
                                value={selectedUserId}
                                onChange={e => setSelectedUserId(e.target.value)}
                                className="w-full text-sm border-gray-200 rounded-lg bg-gray-50 focus:border-navy-500"
                            >
                                <option value="">-- Pilih dari database --</option>
                                {allStudents.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                                ))}
                            </select>
                        </div>
                        <button type="submit" disabled={!selectedUserId} className="w-full btn-gold justify-center">
                            Daftarkan ke Pelatihan
                        </button>
                    </form>
                </div>
            </div>

            {/* Right Side: Enrolled Students Table */}
            <div className="w-full lg:w-2/3">
                <div className="card h-full flex flex-col">
                    <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <h3 className="font-bold text-gray-900">Peserta Terdaftar <span className="text-gray-400 font-normal">({course.enrolled_students.length})</span></h3>

                        <div className="relative w-full sm:w-64">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                aria-label="Cari peserta berdasarkan nama atau email"
                                placeholder="Cari nama/email..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full text-xs pl-9 py-2 border-gray-200 rounded-lg bg-gray-50"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Peserta</th>
                                    <th className="px-4 py-3 font-medium">Progress</th>
                                    <th className="px-4 py-3 font-medium text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredEnrolled.map(student => (
                                    <tr key={student.id} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-gray-900">{student.name}</div>
                                            <div className="text-xs text-gray-500">{student.email}</div>
                                            <div className="text-[10px] text-gray-400 mt-0.5">Masuk: {student.enrolled_at}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full w-20">
                                                    <div
                                                        className={`h-full rounded-full ${student.progress_percent === 100 ? 'bg-green-500' : 'bg-gold-400'}`}
                                                        style={{ width: `${student.progress_percent}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs font-bold text-gray-700">{student.progress_percent}%</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => unenrollStudent(student.user_id, student.name)}
                                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Keluarkan dari pelatihan"
                                                aria-label={`Keluarkan ${student.name} dari pelatihan`}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {filteredEnrolled.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="px-4 py-8 text-center text-gray-500 text-sm">
                                            Belum ada peserta yang terdaftar atau cocok dengan pencarian.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
