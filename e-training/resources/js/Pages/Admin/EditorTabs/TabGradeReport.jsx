import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, CheckSquare, Download, FileSpreadsheet, Search } from 'lucide-react';
import { csvCell, getAttemptStatus } from './quizReport.mjs';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

async function fetchCourseGradeReport(courseId, signal) {
    const response = await fetch(route('admin.grading.report', courseId), {
        signal,
        headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
        throw new Error('Gagal memuat laporan nilai kursus. Silakan coba lagi.');
    }
    return response.json();
}

function splitNameParts(fullName) {
    const parts = String(fullName ?? '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
        return { firstName: '', surname: '' };
    }
    return {
        firstName: parts[0],
        surname: parts.at(-1),
    };
}

function getInitials(fullName) {
    const { firstName, surname } = splitNameParts(fullName);
    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = surname && surname !== firstName ? surname.charAt(0).toUpperCase() : '';
    return (firstInitial + lastInitial) || 'P';
}

function formatScore(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return '-';
    }
    return Number(value).toLocaleString('id-ID', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function attemptRank(attempt) {
    const status = getAttemptStatus(attempt);
    if (status === 'passed' || status === 'failed') {
        return 3;
    }
    if (status === 'pending') {
        return 2;
    }
    return 1;
}

function isBetterAttempt(candidate, current) {
    if (!current) {
        return true;
    }
    const candidateRank = attemptRank(candidate);
    const currentRank = attemptRank(current);
    if (candidateRank !== currentRank) {
        return candidateRank > currentRank;
    }
    return Number(candidate.score ?? -1) > Number(current.score ?? -1);
}

function selectBestAttemptsMap(attempts) {
    const map = new Map();
    for (const attempt of attempts) {
        const key = `${attempt.user_id}:${attempt.quiz_id}`;
        if (isBetterAttempt(attempt, map.get(key))) {
            map.set(key, attempt);
        }
    }
    return map;
}

function collectParticipants(enrolledStudents, attempts) {
    const map = new Map();
    for (const student of enrolledStudents) {
        map.set(student.user_id, {
            userId: student.user_id,
            name: student.name,
            email: student.email,
        });
    }
    for (const attempt of attempts) {
        if (!map.has(attempt.user_id) && attempt.user_name) {
            map.set(attempt.user_id, {
                userId: attempt.user_id,
                name: attempt.user_name,
                email: attempt.user_email ?? '',
            });
        }
    }
    return Array.from(map.values());
}

function buildQuizCell(attempt) {
    if (!attempt) {
        return { attemptId: null, score: null, state: 'missing' };
    }
    const status = getAttemptStatus(attempt);
    if (status === 'pending') {
        return { attemptId: attempt.id, score: null, state: 'pending' };
    }
    if (status === 'in_progress') {
        return { attemptId: attempt.id, score: null, state: 'in_progress' };
    }
    return {
        attemptId: attempt.id,
        score: Number(attempt.score ?? 0),
        state: 'graded',
    };
}

function buildParticipantRows(enrolledStudents, attempts, quizzes) {
    const bestMap = selectBestAttemptsMap(attempts);
    const participants = collectParticipants(enrolledStudents, attempts);

    return participants.map((participant) => {
        const { firstName, surname } = splitNameParts(participant.name);
        const cellsByQuiz = {};
        let totalScore = 0;
        let gradedCount = 0;

        for (const quiz of quizzes) {
            const best = bestMap.get(`${participant.userId}:${quiz.id}`);
            const cell = buildQuizCell(best);
            cellsByQuiz[quiz.id] = cell;
            if (cell.state === 'graded' && cell.score !== null) {
                totalScore += cell.score;
                gradedCount += 1;
            }
        }

        return {
            userId: participant.userId,
            name: participant.name,
            firstName,
            surname,
            email: participant.email,
            cellsByQuiz,
            totalScore: gradedCount > 0 ? totalScore : null,
        };
    });
}

function matchesLetter(word, letter) {
    if (letter === 'ALL') {
        return true;
    }
    return String(word ?? '').toLocaleUpperCase('id-ID').startsWith(letter);
}

function compareNullableNumbers(first, second, direction) {
    if (first === null && second === null) {
        return 0;
    }
    if (first === null) {
        return 1;
    }
    if (second === null) {
        return -1;
    }
    return direction === 'asc' ? first - second : second - first;
}

function sortParticipantRows(rows, sortConfig) {
    const sorted = [...rows];
    const { key, direction } = sortConfig;
    const factor = direction === 'asc' ? 1 : -1;

    sorted.sort((left, right) => {
        if (key === 'firstName' || key === 'surname' || key === 'email') {
            return String(left[key] ?? '').localeCompare(String(right[key] ?? ''), 'id-ID') * factor;
        }
        if (key === 'total') {
            return compareNullableNumbers(left.totalScore, right.totalScore, direction);
        }
        if (key.startsWith('quiz:')) {
            const quizId = key.slice(5);
            return compareNullableNumbers(
                left.cellsByQuiz[quizId]?.score ?? null,
                right.cellsByQuiz[quizId]?.score ?? null,
                direction
            );
        }
        return 0;
    });

    return sorted;
}

function calculateAverages(rows, quizzes) {
    const quizAverages = {};
    for (const quiz of quizzes) {
        const gradedScores = rows
            .map((row) => row.cellsByQuiz[quiz.id]?.score)
            .filter((score) => score !== null && score !== undefined);
        quizAverages[quiz.id] = gradedScores.length > 0
            ? gradedScores.reduce((sum, val) => sum + val, 0) / gradedScores.length
            : null;
    }

    const validTotals = rows
        .map((row) => row.totalScore)
        .filter((total) => total !== null && total !== undefined);
    const overallTotalAverage = validTotals.length > 0
        ? validTotals.reduce((sum, val) => sum + val, 0) / validTotals.length
        : null;

    return { quizAverages, overallTotalAverage };
}

function formatCellExportValue(cell) {
    if (!cell || cell.state === 'missing') {
        return '-';
    }
    if (cell.state === 'pending') {
        return 'Menunggu koreksi';
    }
    if (cell.state === 'in_progress') {
        return 'Sedang dikerjakan';
    }
    return formatScore(cell.score);
}

function createGradeReportCsv(quizzes, rows, averages) {
    const header = [
        'Nama Peserta',
        'Alamat Email',
        ...quizzes.map((quiz) => quiz.lessonTitle),
        'Total Kursus',
    ];
    const bodyRows = rows.map((row) => [
        row.name,
        row.email,
        ...quizzes.map((quiz) => formatCellExportValue(row.cellsByQuiz[quiz.id])),
        formatScore(row.totalScore),
    ]);
    const footerRow = [
        'Rata-rata keseluruhan',
        '',
        ...quizzes.map((quiz) => formatScore(averages.quizAverages[quiz.id])),
        formatScore(averages.overallTotalAverage),
    ];

    return '\uFEFF' + [header, ...bodyRows, footerRow]
        .map((row) => row.map(csvCell).join(','))
        .join('\r\n');
}

function AlphabetFilterRow({ label, selected, onSelect }) {
    return (
        <div className="flex flex-wrap items-center gap-1 text-xs">
            <span className="mr-2 min-w-[96px] font-semibold text-gray-700">{label} :</span>
            <button
                type="button"
                onClick={() => onSelect('ALL')}
                className={`rounded px-2 py-0.5 font-semibold transition-colors ${
                    selected === 'ALL'
                        ? 'bg-navy-600 text-white'
                        : 'text-navy-700 hover:bg-navy-50'
                }`}
            >
                Semua
            </button>
            {ALPHABET.map((letter) => (
                <button
                    key={letter}
                    type="button"
                    onClick={() => onSelect(letter)}
                    className={`h-6 w-6 rounded text-center font-medium transition-colors ${
                        selected === letter
                            ? 'bg-navy-600 font-bold text-white'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-navy-700'
                    }`}
                >
                    {letter}
                </button>
            ))}
        </div>
    );
}

function SortIcon({ active, direction }) {
    if (!active) {
        return <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />;
    }
    return direction === 'asc'
        ? <ArrowUp className="h-3.5 w-3.5 text-navy-600" />
        : <ArrowDown className="h-3.5 w-3.5 text-navy-600" />;
}

function QuizScoreCell({ cell, quiz, participantName, onInspect }) {
    let displayValue = '-';
    let textClass = 'text-gray-400';

    if (cell?.state === 'graded') {
        displayValue = formatScore(cell.score);
        textClass = 'font-semibold text-gray-800';
    } else if (cell?.state === 'pending') {
        displayValue = 'Koreksi';
        textClass = 'font-medium text-amber-600';
    } else if (cell?.state === 'in_progress') {
        displayValue = 'Proses';
        textClass = 'font-medium text-navy-600';
    }

    return (
        <div className="inline-flex items-center justify-end gap-2">
            <span className={textClass}>{displayValue}</span>
            <button
                type="button"
                onClick={() => onInspect(quiz.id, cell?.attemptId ?? null)}
                title={`Tinjau pengerjaan ${participantName} pada ${quiz.lessonTitle}`}
                aria-label={`Tinjau pengerjaan ${participantName} pada ${quiz.lessonTitle}`}
                className="rounded p-1 text-gray-400 transition-colors hover:bg-navy-50 hover:text-navy-600"
            >
                <Search className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}

export default function TabGradeReport({ course, modules, enrolledStudents = [], isActive = false, onInspectAttempt }) {
    const quizzes = useMemo(
        () => modules.flatMap((module) =>
            module.lessons
                .filter((lesson) => lesson.type === 'quiz' && lesson.quiz)
                .map((lesson) => ({
                    ...lesson.quiz,
                    lessonTitle: lesson.title,
                    moduleTitle: module.title,
                }))
        ),
        [modules]
    );

    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [reloadCount, setReloadCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [firstInitial, setFirstInitial] = useState('ALL');
    const [surnameInitial, setSurnameInitial] = useState('ALL');
    const [sortConfig, setSortConfig] = useState({ key: 'firstName', direction: 'asc' });

    useEffect(() => {
        if (!isActive) {
            return undefined;
        }
        const controller = new AbortController();
        setLoading(true);
        setLoadError(null);

        fetchCourseGradeReport(course.id, controller.signal)
            .then((data) => setAttempts(data))
            .catch((error) => {
                if (error.name !== 'AbortError') {
                    setLoadError(error.message);
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [course.id, isActive, reloadCount]);

    const allRows = useMemo(
        () => buildParticipantRows(enrolledStudents, attempts, quizzes),
        [enrolledStudents, attempts, quizzes]
    );

    const filteredRows = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLocaleLowerCase('id-ID');
        const matched = allRows.filter((row) => {
            const matchesSearch = !normalizedSearch
                || `${row.name} ${row.email}`.toLocaleLowerCase('id-ID').includes(normalizedSearch);
            return matchesSearch
                && matchesLetter(row.firstName, firstInitial)
                && matchesLetter(row.surname, surnameInitial);
        });
        return sortParticipantRows(matched, sortConfig);
    }, [allRows, searchQuery, firstInitial, surnameInitial, sortConfig]);

    const averages = useMemo(
        () => calculateAverages(filteredRows, quizzes),
        [filteredRows, quizzes]
    );

    function toggleSort(key) {
        setSortConfig((current) => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
        }));
    }

    function exportCsv() {
        const csvContent = createGradeReportCsv(quizzes, filteredRows, averages);
        const url = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `laporan-nilai-${course.slug || course.id}.csv`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header & Filter Card */}
            <section className="card space-y-5 p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Laporan Nilai (Grader Report)</h2>
                        <p className="mt-1 text-sm font-semibold text-navy-700">
                            Semua peserta: {filteredRows.length}/{allRows.length}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative w-full sm:w-64">
                            <Search className=" absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                aria-label="Cari peserta berdasarkan nama atau email"
                                placeholder="Cari nama atau email..."
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                className="w-full rounded-lg border-gray-200 bg-gray-50 py-2 pl-9 text-xs focus:border-navy-500 focus:ring-navy-500"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={exportCsv}
                            disabled={loading || Boolean(loadError) || filteredRows.length === 0}
                            className="btn-gold inline-flex items-center justify-center gap-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Download className="h-4 w-4" /> Ekspor CSV
                        </button>
                    </div>
                </div>

                <div className="space-y-2 border-t border-gray-100 pt-4">
                    <AlphabetFilterRow label="Nama depan" selected={firstInitial} onSelect={setFirstInitial} />
                    <AlphabetFilterRow label="Nama belakang" selected={surnameInitial} onSelect={setSurnameInitial} />
                </div>
            </section>

            {loadError && (
                <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <span>{loadError}</span>
                    <button
                        type="button"
                        onClick={() => setReloadCount((val) => val + 1)}
                        className="shrink-0 font-semibold underline"
                    >
                        Muat ulang
                    </button>
                </div>
            )}

            {loading && (
                <output className="card block p-12 text-center text-sm text-gray-500">
                    Memuat laporan nilai peserta...
                </output>
            )}

            {!loading && !loadError && (
                <section className="card overflow-hidden" aria-label="Tabel laporan nilai peserta">
                    <div className="overflow-x-auto">
                        <table className="w-full whitespace-nowrap border-collapse text-left text-xs">
                            <thead>
                                {/* Course Category Header Row */}
                                <tr className="border-b border-gray-200 bg-gray-50/60">
                                    <th scope="col" colSpan={2} className="border-r border-gray-200 px-4 py-2.5 text-xs font-medium text-gray-500">
                                        Peserta Pelatihan
                                    </th>
                                    <th
                                        scope="col"
                                        colSpan={quizzes.length + 1}
                                        className="px-4 py-2.5 text-xs font-bold text-navy-800"
                                    >
                                        <span className="inline-flex items-center gap-1.5">
                                            <FileSpreadsheet className="h-4 w-4 text-navy-600" />
                                            {course.title}
                                        </span>
                                    </th>
                                </tr>

                                {/* Column Headers Row */}
                                <tr className="border-b border-gray-200 bg-gray-50 text-gray-600">
                                    <th scope="col" className="border-r border-gray-200 px-4 py-3.5 font-semibold">
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => toggleSort('surname')}
                                                className="inline-flex items-center gap-1 text-navy-700 hover:underline"
                                            >
                                                Nama Belakang
                                                <SortIcon active={sortConfig.key === 'surname'} direction={sortConfig.direction} />
                                            </button>
                                            <span className="text-gray-300">/</span>
                                            <button
                                                type="button"
                                                onClick={() => toggleSort('firstName')}
                                                className="inline-flex items-center gap-1 text-navy-700 hover:underline"
                                            >
                                                Nama Depan
                                                <SortIcon active={sortConfig.key === 'firstName'} direction={sortConfig.direction} />
                                            </button>
                                        </div>
                                    </th>

                                    <th scope="col" className="border-r border-gray-200 px-4 py-3.5 font-semibold">
                                        <button
                                            type="button"
                                            onClick={() => toggleSort('email')}
                                            className="inline-flex items-center gap-1 text-navy-700 hover:underline"
                                        >
                                            Email address
                                            <SortIcon active={sortConfig.key === 'email'} direction={sortConfig.direction} />
                                        </button>
                                    </th>

                                    {quizzes.map((quiz) => {
                                        const sortKey = `quiz:${quiz.id}`;
                                        return (
                                            <th
                                                key={quiz.id}
                                                scope="col"
                                                className="border-r border-gray-200 px-4 py-3.5 text-right font-semibold"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => toggleSort(sortKey)}
                                                    title={`${quiz.moduleTitle} - ${quiz.lessonTitle}`}
                                                    className="ml-auto inline-flex items-center gap-1.5 text-navy-700 hover:underline"
                                                >
                                                    <CheckSquare className="h-3.5 w-3.5 text-orange-500" />
                                                    <span className="uppercase">{quiz.lessonTitle}</span>
                                                    <SortIcon active={sortConfig.key === sortKey} direction={sortConfig.direction} />
                                                </button>
                                            </th>
                                        );
                                    })}

                                    <th scope="col" className="px-4 py-3.5 text-right font-bold text-gray-800">
                                        <button
                                            type="button"
                                            onClick={() => toggleSort('total')}
                                            className="ml-auto inline-flex items-center gap-1.5 text-navy-800 hover:underline"
                                        >
                                            <span className="text-sm font-serif">∑</span>
                                            <span>Course total</span>
                                            <SortIcon active={sortConfig.key === 'total'} direction={sortConfig.direction} />
                                        </button>
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200 bg-white">
                                {filteredRows.map((row) => (
                                    <tr key={row.userId} className="hover:bg-gray-50/80 transition-colors">
                                        <th scope="row" className="border-r border-gray-100 px-4 py-3 font-normal">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-100 text-xs font-bold text-navy-700">
                                                        {getInitials(row.name)}
                                                    </div>
                                                    <span className="font-semibold text-gold-600 hover:text-gold-700">
                                                        {row.name}
                                                    </span>
                                                </div>
                                                <FileSpreadsheet className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden="true" />
                                            </div>
                                        </th>

                                        <td className="border-r border-gray-100 px-4 py-3 text-gray-600">
                                            {row.email}
                                        </td>

                                        {quizzes.map((quiz) => (
                                            <td
                                                key={quiz.id}
                                                className="border-r border-gray-100 px-4 py-3 text-right"
                                            >
                                                <QuizScoreCell
                                                    cell={row.cellsByQuiz[quiz.id]}
                                                    quiz={quiz}
                                                    participantName={row.name}
                                                    onInspect={onInspectAttempt}
                                                />
                                            </td>
                                        ))}

                                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                                            {formatScore(row.totalScore)}
                                        </td>
                                    </tr>
                                ))}

                                {filteredRows.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={quizzes.length + 3}
                                            className="px-4 py-12 text-center text-sm text-gray-500"
                                        >
                                            {allRows.length > 0
                                                ? 'Tidak ada peserta yang sesuai dengan filter huruf atau pencarian.'
                                                : 'Belum ada peserta yang terdaftar pada pelatihan ini.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>

                            {filteredRows.length > 0 && (
                                <tfoot className="border-t-2 border-gray-200 bg-gray-50 font-bold text-gray-900">
                                    <tr>
                                        <th scope="row" colSpan={2} className="border-r border-gray-200 px-4 py-3.5 text-right font-bold">
                                            Overall average (Rata-rata keseluruhan)
                                        </th>
                                        {quizzes.map((quiz) => (
                                            <td
                                                key={quiz.id}
                                                className="border-r border-gray-200 px-4 py-3.5 text-right font-bold"
                                            >
                                                {formatScore(averages.quizAverages[quiz.id])}
                                            </td>
                                        ))}
                                        <td className="px-4 py-3.5 text-right font-bold text-navy-900">
                                            {formatScore(averages.overallTotalAverage)}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>

                    <div className="flex flex-wrap justify-between gap-2 border-t border-gray-100 px-5 py-3 text-[11px] text-gray-400">
                        <span>Nilai tiap kuis menggunakan nilai tertinggi peserta (skala 0–100) · ∑ Course total adalah penjumlahan nilai seluruh kuis.</span>
                        <span>Klik ikon kaca pembesar (🔍) pada nilai kuis untuk meninjau detail jawaban peserta.</span>
                    </div>
                </section>
            )}
        </div>
    );
}
