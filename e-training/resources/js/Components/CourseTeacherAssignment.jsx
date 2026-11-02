import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Check, CheckCircle2, ChevronDown, Search, ShieldCheck, Users, X } from 'lucide-react';

function TeacherRow({ teacher, selected, onToggle }) {
    const initials = teacher.name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
    return <label className={`flex min-w-0 cursor-pointer items-center gap-3 p-4 transition-colors focus-within:ring-2 focus-within:ring-inset focus-within:ring-navy-400 ${selected ? 'bg-navy-50/70' : 'bg-white hover:bg-gray-50'}`}>
        <input type="checkbox" checked={selected} onChange={event => onToggle(teacher.id, event.target.checked)} className="h-4 w-4 shrink-0 rounded border-gray-300 text-navy-600 focus:ring-navy-500" />
        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-50 text-xs font-bold text-navy-600">{initials}</span>
        <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-gray-800" title={teacher.name}>{teacher.name}</span>
            <span className="block truncate text-xs text-gray-500" title={teacher.email || teacher.username}>{teacher.email || teacher.username}</span>
        </span>
    </label>;
}

function TeacherPicker({ teachers, selectedIds, onToggle, disabled }) {
    const [search, setSearch] = useState('');
    const [selectedOnly, setSelectedOnly] = useState(false);
    const query = search.trim().toLocaleLowerCase('id');
    const visibleTeachers = teachers.filter(teacher => {
        if (selectedOnly && !selectedIds.has(teacher.id)) return false;
        return [teacher.name, teacher.email, teacher.username].some(value => value?.toLocaleLowerCase('id').includes(query));
    });

    return <>
        <div className="space-y-3 bg-gray-50/70 px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input type="search" aria-label="Cari pengajar berdasarkan nama, email, atau username" placeholder="Cari nama, email, atau username..." value={search} onChange={event => setSearch(event.target.value)} className="w-full rounded-lg border-gray-200 bg-white py-2.5 pl-9 text-sm focus:border-navy-400 focus:ring-navy-400" />
                </div>
                <div className="inline-flex shrink-0 gap-1 rounded-lg border border-gray-200 bg-white p-1">
                    <button type="button" aria-pressed={!selectedOnly} onClick={() => setSelectedOnly(false)} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${selectedOnly ? 'text-gray-500 hover:bg-gray-50' : 'bg-navy-50 text-navy-700'}`}>Semua ({teachers.length})</button>
                    <button type="button" aria-pressed={selectedOnly} onClick={() => setSelectedOnly(true)} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${selectedOnly ? 'bg-navy-50 text-navy-700' : 'text-gray-500 hover:bg-gray-50'}`}>Terpilih ({selectedIds.size})</button>
                </div>
            </div>
            <p aria-live="polite" className="text-xs text-gray-500">{visibleTeachers.length} pengajar ditampilkan. Centang untuk memberikan akses.</p>
        </div>
        <fieldset disabled={disabled} className="max-h-72 overflow-y-auto overscroll-contain border-y border-gray-100">
            <legend className="sr-only">Pilih pengajar yang dapat mengakses kursus</legend>
            <div className="grid grid-cols-1 gap-px bg-gray-100 sm:grid-cols-2">
                {visibleTeachers.map(teacher => <TeacherRow key={teacher.id} teacher={teacher} selected={selectedIds.has(teacher.id)} onToggle={onToggle} />)}
            </div>
            {!visibleTeachers.length && <div className="bg-white px-5 py-10 text-center">
                <Users className="mx-auto mb-3 h-7 w-7 text-gray-300" />
                <p className="text-sm font-medium text-gray-700">Tidak ada pengajar untuk ditampilkan.</p>
                <p className="mt-1 text-xs text-gray-500">{teachers.length ? 'Coba kata pencarian lain atau ubah filter.' : 'Buat akun dengan role Pengajar melalui Kelola User terlebih dahulu.'}</p>
            </div>}
        </fieldset>
    </>;
}

function SelectedSummary({ teachers }) {
    return <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {teachers.slice(0, 4).map(teacher => <span key={teacher.id} title={teacher.name} className="inline-flex max-w-40 items-center gap-1 rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-700">
            <Check className="h-3 w-3 shrink-0 text-green-600" /><span className="truncate">{teacher.name}</span>
        </span>)}
        {teachers.length > 4 && <span className="text-xs text-gray-500">+{teachers.length - 4} lainnya</span>}
        {!teachers.length && <span className="text-xs text-gray-400">Belum ada pengajar yang diberi akses.</span>}
    </div>;
}

export default function CourseTeacherAssignment({ course, teachers }) {
    const { data, setData, patch, defaults, clearErrors, processing, errors, recentlySuccessful } = useForm({ teacher_ids: course.teacher_ids || [] });
    const [savedTeacherIds, setSavedTeacherIds] = useState(course.teacher_ids || []);
    const savedIds = new Set(savedTeacherIds.map(String));
    const currentIds = new Set(data.teacher_ids.map(String));
    const isDirty = currentIds.size !== savedIds.size || [...currentIds].some(id => !savedIds.has(id));
    const [expanded, setExpanded] = useState(false);
    const selectedIds = new Set(data.teacher_ids);
    const selectedTeachers = teachers.filter(teacher => selectedIds.has(teacher.id));

    const cancel = () => {
        setData('teacher_ids', [...savedTeacherIds]);
        clearErrors();
        setExpanded(false);
    };

    const submit = (event) => {
        event.preventDefault();
        patch(route('admin.courses.teachers', course.id), {
            preserveScroll: true,
            onSuccess: (page) => {
                const confirmedIds = [...page.props.course.teacher_ids];
                setSavedTeacherIds(confirmedIds);
                setData('teacher_ids', confirmedIds);
                defaults('teacher_ids', confirmedIds);
                setExpanded(false);
            },
        });
    };

    const toggleTeacher = (id, selected) => {
        setData('teacher_ids', selected ? [...data.teacher_ids, id] : data.teacher_ids.filter(value => value !== id));
    };

    const toggleExpanded = () => {
        if (expanded) cancel();
        else setExpanded(true);
    };

    return <section aria-label="Akses pengajar kursus" className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-600"><ShieldCheck className="h-5 w-5" /></span>
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold text-gray-900">Akses Pengajar</h2>
                        <span className="rounded-full bg-navy-50 px-2 py-0.5 text-xs font-semibold text-navy-700">{selectedTeachers.length} pengajar</span>
                        {expanded && isDirty && <span className="text-xs font-medium text-amber-600">Belum disimpan</span>}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Tentukan siapa yang dapat mengajar di kursus ini.</p>
                    {!expanded && <SelectedSummary teachers={selectedTeachers} />}
                </div>
            </div>
            <button type="button" disabled={processing} aria-expanded={expanded} aria-controls="course-teacher-picker" onClick={toggleExpanded} className="btn-secondary shrink-0 justify-center text-sm">
                {expanded ? <X className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                {expanded ? 'Batal' : 'Kelola Pengajar'}
                {!expanded && <ChevronDown className="h-3.5 w-3.5" />}
            </button>
        </div>
        {recentlySuccessful && !expanded && <output className="flex items-center gap-2 border-t border-green-100 bg-green-50 px-5 py-3 text-sm text-green-700"><CheckCircle2 className="h-4 w-4" />Akses pengajar berhasil disimpan.</output>}
        {expanded && <form id="course-teacher-picker" onSubmit={submit} className="border-t border-gray-100">
            <TeacherPicker teachers={teachers} selectedIds={selectedIds} onToggle={toggleTeacher} disabled={processing} />
            <div className="space-y-3 px-5 py-4">
                <p className="text-xs leading-relaxed text-gray-500">Pengajar dapat mengelola modul, materi, kuis, dan penilaian serta melihat detail kursus, peserta, dan sertifikat. Perubahan detail, kode referral, pengelolaan peserta, serta penerbitan dan pengaturan sertifikat hanya dapat dilakukan admin.</p>
                {Object.entries(errors).map(([field, message]) => <p key={field} role="alert" className="text-sm text-red-600">{message}</p>)}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm font-medium text-gray-600">{selectedTeachers.length} pengajar dipilih</span>
                    <div className="flex gap-2">
                        <button type="button" disabled={processing} onClick={cancel} className="btn-secondary text-sm">Batal</button>
                        <button type="submit" disabled={processing || !isDirty} className="btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-50">{processing ? 'Menyimpan...' : 'Simpan Akses Pengajar'}</button>
                    </div>
                </div>
            </div>
        </form>}
    </section>;
}
