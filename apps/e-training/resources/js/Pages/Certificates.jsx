import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Award, Download, FileText, Calendar, Search, ExternalLink } from 'lucide-react';
import { useState } from 'react';

export default function Certificates({ certificates = [] }) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCertificates = certificates.filter(cert => 
        cert.course_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.certificate_number.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AuthenticatedLayout>
            <Head title="Sertifikat Saya" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gold-100 rounded-xl flex items-center justify-center text-gold-600">
                                        <Award className="w-6 h-6" />
                                    </div>
                                    Sertifikat Saya
                                </h1>
                                <p className="text-gray-500 mt-1">Daftar sertifikat kompetensi yang telah Anda peroleh.</p>
                            </div>

                            {/* Search Bar */}
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari sertifikat..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-navy-500 focus:border-navy-500 transition-all shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {filteredCertificates.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredCertificates.map((cert) => (
                                <div 
                                    key={cert.id} 
                                    className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                                >
                                    {/* Card Header/Decorative */}
                                    <div className="h-24 bg-gradient-to-br from-navy-600 to-navy-800 relative">
                                        <div className="absolute inset-0 opacity-10">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400 rounded-full blur-2xl" />
                                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400 rounded-full blur-2xl" />
                                        </div>
                                        <div className="absolute -bottom-6 left-6">
                                            <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-navy-600 border border-gray-50">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Content */}
                                    <div className="p-6 pt-10">
                                        <div className="mb-4">
                                            <p className="text-[10px] font-bold text-gold-600 uppercase tracking-widest mb-1">
                                                {cert.certificate_number}
                                            </p>
                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-navy-600 transition-colors line-clamp-2">
                                                {cert.course_title}
                                            </h3>
                                        </div>

                                        <div className="space-y-2 mb-6">
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>Diterbitkan: {cert.issued_at}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Award className="w-3.5 h-3.5" />
                                                <span>{cert.instructor_name}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {cert.file_url ? (
                                                <>
                                                    <a
                                                        href={route('student.certificates.download', cert.id)}
                                                        className="flex-1 flex items-center justify-center gap-2 bg-navy-600 hover:bg-navy-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-navy-100"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        Unduh PDF
                                                    </a>
                                                    <a
                                                        href={cert.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-500 border border-gray-200 rounded-xl transition-all"
                                                        title="Lihat Sertifikat"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                </>
                                            ) : (
                                                <div className="w-full py-2.5 text-center text-xs text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                    File belum tersedia
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm max-w-2xl mx-auto">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Award className="w-10 h-10 text-gray-200" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {searchQuery ? 'Sertifikat tidak ditemukan' : 'Belum Ada Sertifikat'}
                            </h3>
                            <p className="text-gray-500 text-sm max-w-sm mx-auto mb-8">
                                {searchQuery 
                                    ? `Tidak ada hasil untuk pencarian "${searchQuery}". Coba kata kunci lain.`
                                    : 'Sertifikat akan muncul di sini setelah Anda menyelesaikan pelatihan dan dikonfirmasi oleh instruktur.'}
                            </p>
                            {!searchQuery && (
                                <a 
                                    href={route('courses.list')} 
                                    className="inline-flex items-center gap-2 bg-navy-600 hover:bg-navy-700 text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-xl shadow-navy-100"
                                >
                                    Cari Pelatihan
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
