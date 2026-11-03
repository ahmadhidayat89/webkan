export const isManualQuestion = (type) => ['essay', 'short_answer'].includes(type);

export function getAttemptStatus(attempt) {
    if (!attempt.finished_at) return 'in_progress';
    if (attempt.pending_grading || attempt.is_passed === null) return 'pending';
    return attempt.is_passed ? 'passed' : 'failed';
}

export const statusLabels = {
    in_progress: 'Sedang dikerjakan', pending: 'Menunggu koreksi',
    passed: 'Lulus', failed: 'Tidak lulus',
};

export function questionResult(answer, question) {
    if (!answer) return { label: question.random_group_id ? 'Tidak diambil' : 'Belum dijawab', points: null, state: 'missing' };
    if (isManualQuestion(question.type) && answer.manual_score == null) {
        if (!answer.essay_answer?.trim()) return { label: 'Tidak dijawab', points: 0, state: 'missing' };
        return { label: 'Menunggu koreksi', points: null, state: 'pending' };
    }
    let points = 0;
    if (isManualQuestion(question.type)) {
        points = Number(answer.manual_score) / 100 * Number(question.points);
    } else if (answer.is_correct) {
        points = Number(question.points);
    }
    return { label: points.toLocaleString('id-ID', { maximumFractionDigits: 2 }), points, state: points > 0 ? 'correct' : 'incorrect' };
}

export function formatDuration(seconds) {
    if (seconds == null) return '—';
    const total = Math.max(0, Math.floor(seconds));
    return `${Math.floor(total / 60)} m ${total % 60} d`;
}

export function gradeDistribution(attempts) {
    const bins = Array.from({ length: 10 }, (_, index) => ({ label: `${index * 10}–${index === 9 ? 100 : index * 10 + 9}`, count: 0 }));
    attempts.filter(attempt => ['passed', 'failed'].includes(getAttemptStatus(attempt))).forEach(attempt => {
        const index = Math.min(9, Math.max(0, Math.floor(Number(attempt.score) / 10)));
        bins[index].count += 1;
    });
    return bins;
}

// Quote every cell and neutralize spreadsheet formulas in user-provided text.
export function csvCell(value) {
    const text = String(value ?? '');
    const safe = /^\s*[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    return `"${safe.replaceAll('"', '""')}"`;
}

export function createReportCsv(attempts, questions) {
    const header = ['Nama peserta', 'Email', 'Status', 'Mulai', 'Selesai', 'Durasi (detik)', 'Nilai /100', ...questions.map((q, index) => `S${index + 1} /${q.points}`)];
    const rows = attempts.map(attempt => [
        attempt.user_name, attempt.user_email, statusLabels[getAttemptStatus(attempt)],
        attempt.started_at, attempt.finished_at, attempt.duration_seconds,
        attempt.finished_at ? attempt.score : '',
        ...questions.map(question => {
            const result = questionResult(attempt.answers.find(answer => answer.question_id === question.id), question);
            return result.points ?? result.label;
        }),
    ]);
    return '\uFEFF' + [header, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
}
