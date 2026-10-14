import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { FileText, PlusCircle, HelpCircle, Award, Users, ChevronLeft, Eye, Save } from 'lucide-react';
import TabDetail from './EditorTabs/TabDetail';
import TabModules from './EditorTabs/TabModules';
import TabGrading from './EditorTabs/TabGrading';
import TabCertificates from './EditorTabs/TabCertificates';
import TabStudents from './EditorTabs/TabStudents';

export default function CourseEditor({ course, categories, allStudents }) {
    const [activeTab, setActiveTab] = useState('detail');

    const tabs = [
        { id: 'detail', label: 'Detail Kursus', icon: FileText },
        { id: 'modules', label: 'Modul & Materi', icon: PlusCircle },
        { id: 'grading', label: 'Penilaian Kuis', icon: HelpCircle },
        { id: 'certificates', label: 'Sertifikat', icon: Award },
        { id: 'students', label: 'Peserta', icon: Users },
    ];

    return (
        <AuthenticatedLayout>
            <Head title={`Edit: ${course.title}`} />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <Link href={route('admin.courses.index')} className="text-sm font-medium text-navy-600 hover:underline flex items-center gap-1 mb-2">
                            <ChevronLeft className="w-4 h-4" /> Kembali ke Studio
                        </Link>
                        <div className="flex items-center gap-4">
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                                {course.title}
                            </h1>
                            <button form="course-detail-form" type="submit" className="btn-gold flex items-center gap-2 py-1.5 px-3 text-xs">
                                <Save className="w-4 h-4" /> Simpan Perubahan
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${course.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                                {course.status}
                            </span>
                            • {course.enrolled_students.length} Peserta Terdaftar
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Link href={route('course.player', course.id)} className="btn-secondary text-sm flex items-center gap-1.5">
                            <Eye className="w-4 h-4" /> Preview
                        </Link>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex overflow-x-auto scrollbar-hide gap-1 mb-6 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-shrink-0 flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                activeTab === tab.id
                                    ? 'bg-navy-50 text-navy-700 shadow-sm border border-navy-100'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-navy-600' : 'text-gray-400'}`} />
                            <span className="hidden sm:inline whitespace-nowrap">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[500px]">
                    <div className={activeTab === 'detail' ? 'block' : 'hidden'}>
                        <TabDetail course={course} categories={categories} />
                    </div>
                    
                    <div className={activeTab === 'modules' ? 'block' : 'hidden'}>
                        <TabModules courseId={course.id} modules={course.modules} />
                    </div>

                    <div className={activeTab === 'grading' ? 'block' : 'hidden'}>
                        <TabGrading courseId={course.id} modules={course.modules} />
                    </div>

                    <div className={activeTab === 'certificates' ? 'block' : 'hidden'}>
                        <TabCertificates courseId={course.id} enrolledStudents={course.enrolled_students} certificates={course.certificates} course={course} />
                    </div>

                    <div className={activeTab === 'students' ? 'block' : 'hidden'}>
                        <TabStudents course={course} allStudents={allStudents} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
