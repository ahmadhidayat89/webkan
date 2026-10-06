import { router, useForm } from '@inertiajs/react';
import { Award, Download, FileCheck, CheckCircle2, Upload, Image, Pen, Eye } from 'lucide-react';
import { useState, useRef } from 'react';

export default function TabCertificates({ courseId, enrolledStudents, certificates, course }) {
    const [generatingId, setGeneratingId] = useState(null);

    // Template upload form
    const { post: postTemplate, processing: uploadingTemplate } = useForm({});
    const templateRef = useRef(null);
    const [templatePreview, setTemplatePreview] = useState(
        course.certificate_template_url || null
    );

    // Signature upload form
    const { post: postSig, processing: uploadingSig } = useForm({});
    const signatureRef = useRef(null);
    const [signaturePreview, setSignaturePreview] = useState(
        course.certificate_signature_url || null
    );

    const generateCertificate = (userId) => {
        setGeneratingId(userId);
        router.post(route('admin.certificates.generate', courseId), {
            user_id: userId
        }, {
            preserveScroll: true,
            onFinish: () => setGeneratingId(null)
        });
    };

    const hasCertificate = (userId) => {
        return certificates.find(c => c.user_id === userId);
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
            <div className="bg-gradient-to-r from-navy-900 to-navy-800 text-white p-6 rounded-2xl flex flex-col sm:flex-row items-center gap-6">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Award className="w-8 h-8 text-gold-400" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-xl font-bold mb-1">Penerbitan Sertifikat</h3>
                    <p className="text-navy-200 text-sm">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Template Background */}
                <div className="card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Image className="w-4 h-4 text-navy-600" />
                        <h4 className="font-bold text-gray-800 text-sm">Template Background Sertifikat</h4>
                    </div>
                    {templatePreview ? (
                        <div className="relative rounded-xl overflow-hidden border border-gray-200 mb-4 aspect-video bg-gray-50">
                            <img src={templatePreview} alt="Template" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="rounded-xl border-2 border-dashed border-gray-200 mb-4 aspect-video flex items-center justify-center bg-gray-50">
                            <div className="text-center">
                                <Image className="w-8 h-8 text-gray-300 mx-auto mb-2" />
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
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-navy-50 hover:bg-navy-100 border border-navy-200 text-navy-700 rounded-xl text-sm font-semibold transition-all"
                    >
                        <Upload className="w-4 h-4" />
                        {templatePreview ? 'Ganti Template' : 'Upload Template (JPG/PNG)'}
                    </button>
                    <p className="text-[10px] text-gray-400 mt-2 text-center">Ukuran A4 Landscape disarankan. Max 5MB.</p>
                </div>

                {/* Tanda Tangan */}
                <div className="card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Pen className="w-4 h-4 text-navy-600" />
                        <h4 className="font-bold text-gray-800 text-sm">Gambar Tanda Tangan</h4>
                    </div>
                    {signaturePreview ? (
                        <div className="relative rounded-xl overflow-hidden border border-gray-200 mb-4 aspect-video bg-gray-50 flex items-center justify-center">
                            <img src={signaturePreview} alt="Tanda Tangan" className="max-h-full max-w-full object-contain p-4" />
                        </div>
                    ) : (
                        <div className="rounded-xl border-2 border-dashed border-gray-200 mb-4 aspect-video flex items-center justify-center bg-gray-50">
                            <div className="text-center">
                                <Pen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
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
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-navy-50 hover:bg-navy-100 border border-navy-200 text-navy-700 rounded-xl text-sm font-semibold transition-all"
                    >
                        <Upload className="w-4 h-4" />
                        {signaturePreview ? 'Ganti Tanda Tangan' : 'Upload Tanda Tangan (PNG Transparan)'}
                    </button>
                    <p className="text-[10px] text-gray-400 mt-2 text-center">PNG transparan latar putih. Max 2MB.</p>
                </div>
            </div>

            {/* Tabel Peserta */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
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
                                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-900">{student.name}</p>
                                            <p className="text-xs text-gray-500">{student.organization || 'Personal'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden w-24">
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
                                                    <span className="text-xs font-mono font-bold text-navy-600 bg-navy-50 px-2 py-1 rounded">
                                                        {cert.certificate_number}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 mt-1">Diterbitkan: {cert.issued_at}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">- Belum Diterbitkan -</span>
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
                                                        onClick={() => generateCertificate(student.user_id)}
                                                        disabled={generatingId === student.user_id}
                                                        className="btn-gold text-xs px-3 py-1.5"
                                                        title="Generate Ulang"
                                                    >
                                                        {generatingId === student.user_id ? 'Menerbitkan...' : 'Regenerate'}
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => generateCertificate(student.user_id)}
                                                    disabled={generatingId === student.user_id}
                                                    className="btn-gold text-xs px-4 py-1.5 flex items-center gap-1.5 ml-auto"
                                                >
                                                    <FileCheck className="w-3.5 h-3.5" />
                                                    {generatingId === student.user_id ? 'Menerbitkan...' : 'Terbitkan Sertifikat'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}

                            {enrolledStudents.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500 text-sm">
                                        Belum ada peserta yang terdaftar di pelatihan ini.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
