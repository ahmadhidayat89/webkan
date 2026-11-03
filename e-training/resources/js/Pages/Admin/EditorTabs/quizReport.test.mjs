import test from 'node:test';
import assert from 'node:assert/strict';
import { createReportCsv, csvCell, formatDuration, gradeDistribution, questionResult } from './quizReport.mjs';

test('weighted scores distinguish pending, zero, partial and missing answers', () => {
    const question = { id: 1, type: 'essay', points: 4 };
    assert.equal(questionResult({ manual_score: 75 }, question).points, 3);
    assert.equal(questionResult({ manual_score: 0 }, question).points, 0);
    assert.equal(questionResult({ manual_score: null, essay_answer: 'Jawaban' }, question).state, 'pending');
    assert.equal(questionResult({ manual_score: null, essay_answer: ' ' }, question).points, 0);
    assert.equal(questionResult(undefined, question).state, 'missing');
    assert.equal(questionResult({ is_correct: true }, { type: 'multiple_choice', points: 2 }).points, 2);
});

test('distribution handles boundaries and excludes provisional or unfinished scores', () => {
    const complete = score => ({ score, finished_at: '2026-11-03', is_passed: score >= 70 });
    const bins = gradeDistribution([complete(0), complete(10), complete(90), complete(100), { ...complete(80), pending_grading: true }, { ...complete(50), finished_at: null }]);
    assert.deepEqual(bins.map(bin => bin.count), [1, 1, 0, 0, 0, 0, 0, 0, 0, 2]);
});

test('CSV preserves quoted names, email, weighted question values and spreadsheet safety', () => {
    const csv = createReportCsv([{ user_name: 'Nama, "Peserta"', user_email: '=HYPERLINK("bad")', finished_at: '2026-11-03', score: 75, is_passed: true, duration_seconds: 65, answers: [{ question_id: 1, manual_score: 75 }] }], [{ id: 1, type: 'essay', points: 4 }]);
    assert.ok(csv.startsWith('\uFEFF'));
    assert.ok(csv.includes('"Nama, ""Peserta"""'));
    assert.ok(csv.includes('"\'=HYPERLINK(""bad"")"'));
    assert.ok(csv.endsWith('"3"'));
    assert.equal(csvCell('@formula'), '"\'@formula"');
    assert.equal(formatDuration(65), '1 m 5 d');
    assert.equal(formatDuration(null), '—');
});
