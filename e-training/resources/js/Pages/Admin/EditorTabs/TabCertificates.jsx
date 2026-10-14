import { router, useForm } from '@inertiajs/react';
import { Award, Download, FileCheck, Upload, Image, Pen, Eye, Pencil } from 'lucide-react';
import { useState, useRef } from 'react';

const BULAN = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

// "2026-10-09" -> "9 Oktober 2026"
const formatTanggal = (value) => {
    if (!value) return '';
    const d = new Date(value + 'T00:00:00');
    return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
};

// "Yang diselesaikan pada tanggal 5 Oktober 2026 ..." -> "2026-10-05"
const bacaTanggalDariTeks = (teks) => {
    const m = (teks || '').match(/(\d{1,2}) (\S+) (\d{4})/);
    if (!m) return '';
    const bulan = BULAN.findIndex(b => b.toLowerCase() === m[2].toLowerCase());
    if (bulan < 0) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${m[3]}-${pad(bulan + 1)}-${pad(Number(m[1]))}`;
};

const KALIMAT_TANGGAL = 'Yang diselesaikan pada tanggal';

export default function TabCertificates({ courseId, enrolledStudents, certificates, course }) {
    // Modal edit data sertifikat
    const [modalStudent, setModalStudent] = useState(null);
    const [generatingId, setGeneratingId] = useState(null);

    const certForm = useForm({
        user_id: '',
        recipient_name: '',
        status: 'lulus',
        event_text: '',
        signer_name: '',
        signer_title: '',
    });

    // Terbitkan / Regenerate cepat (otomatis, tanpa modal)
    const generateCertificate = (userId) => {
        setGeneratingId(userId);
        router.post(route('admin.certificates.generate', courseId), {
            user_id: userId,
        }, {
            preserveScroll: true,
            onFinish: () => setGeneratingId(null),
        });
    };

    // Tanggal selesai (hanya untuk membantu mengisi event_text)
    const [eventDate, setEventDate] = useState('');

    // Ganti hanya bagian tanggal; teks setelahnya (tempat, JP) tidak ikut berubah.
    const applyDate = (value) => {
        if (!value) return;
        const awal = `${KALIMAT_TANGGAL} ${formatTanggal(value)}`;
        const current = certForm.data.event_text || '';
        const re = new RegExp(`^${KALIMAT_TANGGAL} \\d{1,2} \\S+ \\d{4}`);

        certForm.setData(
            'event_text',
            re.test(current) ? current.replace(re, awal) : awal + (current ? ' ' + current : '')
        );
    };

    // Template upload
    const templateRef = useRef(null);
    const [templatePreview, setTemplatePreview] = useState(
        course.certificate_template_url || null
    );

    // Signature upload
    const signatureRef = useRef(null);
    const [signaturePreview, setSignaturePreview] = useState(
        course.certificate_signature_url || null
    );

    const hasCertificate = (userId) => {
        return certificates.find(c => c.user_id === userId);
    };

    const openModal = (student) => {
        const cert = hasCertificate(student.user_id);

        // Tanggal default: tanggal selesai peserta, atau hari ini kalau belum tercatat
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const tanggalHariIni = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        const defaultDate = student.completed_at || tanggalHariIni;

        certForm.clearErrors();
        certForm.setData({
            user_id: student.user_id,
            recipient_name: cert?.recipient_name || student.name,
            status: cert?.status || 'lulus',
            // Sudah pernah diisi -> pakai yang tersimpan. Belum -> isi dari tanggal default.
            event_text: cert?.event_text
                || `${KALIMAT_TANGGAL} ${formatTanggal(defaultDate)}`,
            signer_name: cert?.signer_name || '',
            signer_title: cert?.signer_title || '',
        });
        setEventDate(bacaTanggalDariTeks(cert?.event_text) || defaultDate);
        setModalStudent(student);
    };

    const closeModal = () => {
        setModalStudent(null);
    };

    const submitCertificate = (e) => {
        e.preventDefault();
        certForm.post(route('admin.certificates.generate', courseId), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
        });
    };

    const handleTemplateUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setTemplatePreview(URL.createObjectURL(file));
        const form = new FormData();
        form.append('template', file);
        router.post(route('admin.certificates.template', courseId), form, {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const handleSignatureUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSignaturePreview(URL.createObjectURL(file));
        const form = new FormData();
        form.append('signature', file);
        router.post(route('admin.certificates.signature', courseId), form, {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Hero Banner */}
            <div className="flex flex-col items-center gap-6 p-6 text-white bg-gradient-to-r from-navy-900 to-navy-800 rounded-2xl sm:flex-row">
                <div className="flex items-center justify-center flex-shrink-0 w-16 h-16 rounded-full bg-white/10">
                    <Award className="w-8 h-8 text-gold-400" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                    <h3 className="mb-1 text-xl font-bold">Penerbitan Sertifikat</h3>
                    <p className="text-sm text-navy-200">
                        Generate sertifikat PDF dengan QR Code verifikasi otomatis. Upload template gambar kustom dan tanda tangan di bawah ini.
                    </p>
                </div>
                <a
                    href={route('admin.certificates.preview.template', courseId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 border border-white/30 text-white font-semibold rounded-xl text-sm transition-all"
                >
                    <Eye className="w-4 h-4" />
                    Preview Template
                </a>
            </div>

            {/* Template & Tanda Tangan Upload */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Template Background */}
                <div className="p-5 card">
                    <div className="flex items-center gap-2 mb-4">
                        <Image className="w-4 h-4 text-navy-600" />
                        <h4 className="text-sm font-bold text-gray-800">Template Background Sertifikat</h4>
                    </div>
                    {templatePreview ? (
                        <div className="relative mb-4 overflow-hidden border border-gray-200 rounded-xl aspect-video bg-gray-50">
                            <img src={templatePreview} alt="Template" className="object-cover w-full h-full" />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center mb-4 border-2 border-gray-200 border-dashed rounded-xl aspect-video bg-gray-50">
                            <div className="text-center">
                                <Image className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                <p className="text-xs text-gray-400">Belum ada template</p>
                            </div>
                        </div>
                    )}
                    <input
                        ref={templateRef}
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        className="hidden"
                        onChange={handleTemplateUpload}
                    />
                    <button
                        onClick={() => templateRef.current?.click()}
                        className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-semibold transition-all border bg-navy-50 hover:bg-navy-100 border-navy-200 text-navy-700 rounded-xl"
                    >
                        <Upload className="w-4 h-4" />
                        {templatePreview ? 'Ganti Template' : 'Upload Template (JPG/PNG)'}
                    </button>
                    <p className="text-[10px] text-gray-400 mt-2 text-center">Ukuran A4 Landscape disarankan. Max 5MB.</p>
                </div>

                {/* Tanda Tangan */}
                <div className="p-5 card">
                    <div className="flex items-center gap-2 mb-4">
                        <Pen className="w-4 h-4 text-navy-600" />
                        <h4 className="text-sm font-bold text-gray-800">Gambar Tanda Tangan</h4>
                    </div>
                    {signaturePreview ? (
                        <div className="relative flex items-center justify-center mb-4 overflow-hidden border border-gray-200 rounded-xl aspect-video bg-gray-50">
                            <img src={signaturePreview} alt="Tanda Tangan" className="object-contain max-w-full max-h-full p-4" />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center mb-4 border-2 border-gray-200 border-dashed rounded-xl aspect-video bg-gray-50">
                            <div className="text-center">
                                <Pen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                <p className="text-xs text-gray-400">Belum ada tanda tangan</p>
                            </div>
                        </div>
                    )}
                    <input
                        ref={signatureRef}
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        className="hidden"
                        onChange={handleSignatureUpload}
                    />
                    <button
                        onClick={() => signatureRef.current?.click()}
                        className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-semibold transition-all border bg-navy-50 hover:bg-navy-100 border-navy-200 text-navy-700 rounded-xl"
                    >
                        <Upload className="w-4 h-4" />
                        {signaturePreview ? 'Ganti Tanda Tangan' : 'Upload Tanda Tangan (PNG Transparan)'}
                    </button>
                    <p className="text-[10px] text-gray-400 mt-2 text-center">PNG transparan latar putih. Max 2MB.</p>
                </div>
            </div>

            {/* Tabel Peserta */}
            <div className="overflow-hidden card">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="font-medium text-gray-600 border-b border-gray-200 bg-gray-50">
                            <tr>
                                <th className="px-6 py-4">Nama Peserta</th>
                                <th className="px-6 py-4">Status & Progress</th>
                                <th className="px-6 py-4">No. Sertifikat</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {enrolledStudents.map(student => {
                                const cert = hasCertificate(student.user_id);
                                return (
                                    <tr key={student.id} className="transition-colors hover:bg-gray-50/50">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-900">{student.name}</p>
                                            <p className="text-xs text-gray-500">{student.organization || 'Personal'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 w-24 h-2 overflow-hidden bg-gray-100 rounded-full">
                                                    <div
                                                        className={`h-full ${student.progress_percent === 100 ? 'bg-green-500' : 'bg-gold-400'}`}
                                                        style={{ width: `${student.progress_percent}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs font-bold text-gray-700">{student.progress_percent}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {cert ? (
                                                <div className="inline-flex flex-col">
                                                    <span className="px-2 py-1 font-mono text-xs font-bold rounded text-navy-600 bg-navy-50">
                                                        {cert.certificate_number}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 mt-1">Diterbitkan: {cert.issued_at}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs italic text-gray-400">- Belum Diterbitkan -</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {cert ? (
                                                <div className="flex justify-end gap-2">
                                                    <a
                                                        href={route('admin.certificates.preview', cert.id)}
                                                        className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" /> Preview
                                                    </a>
                                                    <a
                                                        href={route('admin.certificates.download', cert.id)}
                                                        className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                                                        target="_blank"
                                                    >
                                                        <Download className="w-3.5 h-3.5" /> Unduh PDF
                                                    </a>
                                                    <button
                                                        onClick={() => openModal(student)}
                                                        className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                                                        title="Edit data sertifikat"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => generateCertificate(student.user_id)}
                                                        disabled={generatingId === student.user_id}
                                                        className="btn-gold text-xs px-3 py-1.5"
                                                        title="Generate ulang dengan data tersimpan"
                                                    >
                                                        {generatingId === student.user_id ? 'Menerbitkan...' : 'Regenerate'}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => openModal(student)}
                                                        className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                                                        title="Isi data sertifikat dulu"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => generateCertificate(student.user_id)}
                                                        disabled={generatingId === student.user_id}
                                                        className="btn-gold text-xs px-4 py-1.5 flex items-center gap-1.5"
                                                    >
                                                        <FileCheck className="w-3.5 h-3.5" />
                                                        {generatingId === student.user_id ? 'Menerbitkan...' : 'Terbitkan Sertifikat'}
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}

                            {enrolledStudents.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-sm text-center text-gray-500">
                                        Belum ada peserta yang terdaftar di pelatihan ini.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Edit Data Sertifikat */}
            {modalStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <form
                        onSubmit={submitCertificate}
                        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4"
                    >
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Data Sertifikat</h3>
                            <p className="text-xs text-gray-500">
                                Peserta: {modalStudent.name}
                            </p>
                        </div>

                        {/* Nama di sertifikat */}
                        <div>
                            <label className="block mb-1 text-xs font-semibold text-gray-700">
                                Nama di Sertifikat
                            </label>
                            <input
                                type="text"
                                value={certForm.data.recipient_name}
                                onChange={e => certForm.setData('recipient_name', e.target.value)}
                                maxLength={150}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl"
                            />
                            {certForm.errors.recipient_name && (
                                <p className="mt-1 text-xs text-red-600">{certForm.errors.recipient_name}</p>
                            )}
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block mb-1 text-xs font-semibold text-gray-700">
                                Keterangan di Bawah Nama
                            </label>
                            <select
                                value={certForm.data.status}
                                onChange={e => certForm.setData('status', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl"
                            >
                                <option value="lulus">telah lulus</option>
                                <option value="hadir">telah hadir</option>
                            </select>
                            {certForm.errors.status && (
                                <p className="mt-1 text-xs text-red-600">{certForm.errors.status}</p>
                            )}
                        </div>

                        {/* Tanggal selesai + keterangan */}
                        <div>
                            <label className="block mb-1 text-xs font-semibold text-gray-700">
                                Tanggal Selesai Pelatihan
                            </label>
                            <div className="mb-3">
                                <input
                                    type="date"
                                    value={eventDate}
                                    onChange={e => {
                                        setEventDate(e.target.value);
                                        applyDate(e.target.value);
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl"
                                />
                            </div>

                            <label className="block mb-1 text-xs font-semibold text-gray-700">
                                Keterangan di Sertifikat
                            </label>
                            <textarea
                                value={certForm.data.event_text}
                                onChange={e => certForm.setData('event_text', e.target.value)}
                                rows={3}
                                maxLength={500}
                                placeholder="Pilih tanggal di atas, lalu tambahkan: secara luring di Surabaya dengan 40 JP"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl"
                            />
                            <p className="text-[10px] text-gray-400 mt-1">
                                Kalimat tanggal terisi otomatis dan masih bisa diedit. Tambahkan tempat dan JP setelahnya.
                            </p>
                            {certForm.errors.event_text && (
                                <p className="mt-1 text-xs text-red-600">{certForm.errors.event_text}</p>
                            )}
                        </div>

                        {/* Penandatangan */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <label className="block mb-1 text-xs font-semibold text-gray-700">
                                    Nama Penandatangan
                                </label>
                                <input
                                    type="text"
                                    value={certForm.data.signer_name}
                                    onChange={e => certForm.setData('signer_name', e.target.value)}
                                    maxLength={100}
                                    placeholder="Kosongkan = default"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl"
                                />
                                {certForm.errors.signer_name && (
                                    <p className="mt-1 text-xs text-red-600">{certForm.errors.signer_name}</p>
                                )}
                            </div>
                            <div>
                                <label className="block mb-1 text-xs font-semibold text-gray-700">
                                    Jabatan
                                </label>
                                <input
                                    type="text"
                                    value={certForm.data.signer_title}
                                    onChange={e => certForm.setData('signer_title', e.target.value)}
                                    maxLength={100}
                                    placeholder="Kosongkan = default"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl"
                                />
                                {certForm.errors.signer_title && (
                                    <p className="mt-1 text-xs text-red-600">{certForm.errors.signer_title}</p>
                                )}
                            </div>
                        </div>

                        {certForm.errors.user_id && (
                            <p className="text-xs text-red-600">{certForm.errors.user_id}</p>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={certForm.processing}
                                className="px-4 py-2 text-sm btn-secondary"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={certForm.processing}
                                className="px-5 py-2 text-sm btn-gold"
                            >
                                {certForm.processing ? 'Menerbitkan...' : 'Simpan & Terbitkan'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}