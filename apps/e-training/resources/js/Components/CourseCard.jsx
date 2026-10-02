import { Link } from '@inertiajs/react';
import { BookOpen, Users, Clock, Star, CheckCircle2, ArrowRight, Award } from 'lucide-react';

const categoryColors = {
    'Laboratorium': 'bg-blue-50 text-blue-700 border-blue-200',
    'Lembaga Sertifikasi': 'bg-purple-50 text-purple-700 border-purple-200',
    'Lembaga Inspeksi': 'bg-amber-50 text-amber-700 border-amber-200',
    'Umum': 'bg-green-50 text-green-700 border-green-200',
};

const levelColors = {
    'Pemula': 'text-green-600',
    'Menengah': 'text-yellow-600',
    'Lanjutan': 'text-red-600',
};

const thumbnailGradients = [
    'from-navy-600 via-navy-500 to-blue-500',
    'from-purple-600 via-purple-500 to-indigo-500',
    'from-emerald-600 via-emerald-500 to-teal-500',
    'from-gold-600 via-gold-500 to-amber-400',
    'from-rose-600 via-rose-500 to-pink-400',
    'from-cyan-600 via-cyan-500 to-sky-400',
];

export default function CourseCard({ course, role = 'pelajar', index = 0 }) {
    const gradient = thumbnailGradients[index % thumbnailGradients.length];
    const isCompleted = course.progress === 100;
    const isEnrolled = course.progress > 0;

    return (
        <div className="card card-hover group overflow-hidden animate-fade-in-up" style={{ animationDelay: `${index * 80}ms` }}>
            {/* Thumbnail */}
            <div className={`relative h-40 bg-gradient-to-br ${gradient} overflow-hidden`}>
                {course.thumbnail ? (
                    <img 
                        src={course.thumbnail} 
                        alt={course.title} 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <>
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-4 right-4 w-24 h-24 border-2 border-white/30 rounded-full" />
                            <div className="absolute bottom-4 left-4 w-16 h-16 border-2 border-white/20 rounded-lg rotate-12" />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <BookOpen className="w-12 h-12 text-white/40" />
                        </div>
                    </>
                )}

                {/* Category Badge */}
                <div className="absolute top-3 left-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border backdrop-blur-sm ${categoryColors[course.category_name] || 'bg-gray-50 text-gray-700'}`}>
                        {course.category_name}
                    </span>
                </div>

                {/* Completed Badge */}
                {isCompleted && (
                    <div className="absolute top-3 right-3">
                        <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-0.5 rounded-full text-[10px] font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            Selesai
                        </div>
                    </div>
                )}

                {/* Featured Badge */}
                {course.is_featured && !isCompleted && (
                    <div className="absolute top-3 right-3">
                        <div className="flex items-center gap-1 bg-gold-500 text-white px-2 py-0.5 rounded-full text-[10px] font-semibold">
                            <Star className="w-3 h-3" />
                            Unggulan
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[11px] font-medium ${levelColors[course.level] || 'text-gray-500'}`}>
                        {course.level}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="text-[11px] text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {course.duration}
                    </span>
                </div>

                <h3 className="text-sm font-semibold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-navy-600 transition-colors leading-snug">
                    {course.title}
                </h3>

                <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                    {course.short_description || course.description}
                </p>

                {/* Instructor */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-navy-400 to-navy-600 flex items-center justify-center text-white text-[10px] font-bold">
                        {course.instructor_name ? course.instructor_name.charAt(0) : '?'}
                    </div>
                    <span className="text-xs text-gray-600">{course.instructor_name}</span>
                </div>

                {/* Progress bar or Stats */}
                {role === 'pelajar' && isEnrolled && (
                    <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-medium text-gray-600">Progres</span>
                            <span className="text-[11px] font-bold text-navy-600">{course.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                    isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-navy-500 to-navy-400'
                                }`}
                                style={{ width: `${course.progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] text-gray-500 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {course.enrolled_students || 0} pelajar
                        </span>
                        <span className="text-[11px] text-gray-500 flex items-center gap-1">
                            <Star className="w-3 h-3 text-gold-500" />
                            {course.rating || 0}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {course.certificate_id && (
                            <a
                                href={route('student.certificates.download', course.certificate_id)}
                                className="flex items-center gap-1 text-[11px] font-semibold text-gold-600 hover:text-gold-700 transition-colors mr-2"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Award className="w-3 h-3" />
                                Sertifikat
                            </a>
                        )}
                        <Link
                            href={route('course.player', course.id)}
                            className="flex items-center gap-1 text-[11px] font-semibold text-navy-600 hover:text-navy-800 transition-colors group/btn"
                        >
                            {isEnrolled ? 'Lanjutkan' : 'Mulai'}
                            <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
