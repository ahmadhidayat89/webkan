export const readinessCatalogPath = '/layanan-akreditasi/readiness-assessment';
export const readinessUrl = (id) => readinessCatalogPath + '/' + id;

export const readinessLimitation = 'Hasil penilaian mandiri ini hanya mencakup butir yang dipilih. Keputusan akreditasi KAN didasarkan pada asesmen oleh asesor yang berwenang.';
export const formatReadinessScore = (score) => score === null ? '—' : score.toLocaleString('id-ID', { maximumFractionDigits: 2 });

export const answersList = [
  ['yes', 'Ya', 'Praktik sudah terdokumentasi dan diterapkan penuh.'],
  ['partial', 'Sebagian', 'Praktik belum sepenuhnya terdokumentasi atau diterapkan.'],
  ['no', 'Tidak', 'Praktik belum ada.'],
  ['na', 'Tidak berlaku (N/A)', 'Persyaratan tidak relevan. Beri alasan pada kolom catatan.'],
];

export const readinessAnswerLabel = (answer) => answersList.find(([key]) => key === answer)?.[1];

export function tallyReadiness(questions, responses) {
  const counts = { yes: 0, partial: 0, no: 0, na: 0 };
  for (const question of questions) {
    const answer = responses[question.id]?.answer;
    if (answer === 'yes' || answer === 'partial' || answer === 'no' || (answer === 'na' && question.allowNA)) {
      counts[answer] += 1;
    }
  }
  const applicable = counts.yes + counts.partial + counts.no;
  const answered = applicable + counts.na;
  const score = applicable ? (2 * counts.yes + counts.partial) / applicable : null;
  let status = 'Siap diajukan';
  if (answered < questions.length) status = 'Belum lengkap';
  else if (score === null) status = 'Tidak ada butir yang berlaku';
  else if (counts.no) status = 'Perlu perbaikan';
  else if (counts.partial) status = 'Hampir siap';
  return { counts, applicable, answered, score, status };
}

export const readinessButton = 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50';
export const readinessPrimary = 'inline-flex items-center justify-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50';
export const readinessInput = 'mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600';
