export const readinessCatalogPath = '/layanan-akreditasi/readiness-assessment';
export const readinessUrl = (id) => readinessCatalogPath + '/' + id;

export const defaultReadinessMessages = {
  limitation: 'Kuesioner ini merupakan alat bantu kesiapan mandiri bagi lembaga dan bukan merupakan keputusan akreditasi. Pemberian akreditasi KAN tetap didasarkan pada evaluasi resmi dan asesmen oleh tim asesor KAN.',
  guideYes: 'Pilih ini jika dokumen, prosedur, atau rekaman yang ditanyakan sudah ada secara lengkap dan sudah dijalankan di lembaga Anda.',
  guidePartial: 'Pilih ini jika dokumen atau rekamannya baru disusun sebagian (masih berupa draf) atau belum sepenuhnya dijalankan.',
  guideNo: 'Pilih ini jika ketentuan tersebut berlaku bagi lembaga Anda, namun dokumen atau rekamannya belum tersedia sama sekali.',
  guideOptional: 'Khusus pada pertanyaan berlabel Opsional: biarkan kosong (lewati) jika kegiatan tersebut memang tidak dilakukan di lembaga Anda. Pertanyaan opsional yang dilewati tidak akan mengurangi penilaian kesiapan Anda.',
  descSiap: 'Dokumen dan rekaman bukti lembaga Anda sudah sangat lengkap. Anda siap melanjutkan ke tahap pengajuan akreditasi berikutnya.',
  descCukup: 'Sebagian besar bukti sudah tersedia dengan baik, namun masih ada beberapa dokumen yang perlu dilengkapi sebelum mengajukan permohonan.',
  descKurang: 'Bukti yang tersedia masih terbatas. Sebaiknya fokus menyusun prosedur dan rekaman yang belum lengkap terlebih dahulu.',
  descBelum: 'Sebagian besar bukti belum tersedia. Lembaga Anda memerlukan persiapan dokumen sistem manajemen dan teknis secara menyeluruh.',
  completeMessage: 'Seluruh bukti yang berlaku telah lengkap! Tidak ada pertanyaan yang berstatus "Tidak" atau "Sebagian". Anda siap melanjutkan ke tahap evaluasi mandiri berikutnya.',
  nextStepMessage: 'Apabila hasil kesiapan Anda telah mencapai kategori Siap, silakan unduh laporan ini sebagai PDF untuk menjadi panduan saat menyiapkan dokumen pengajuan akreditasi.',
};

export const readinessLimitation = defaultReadinessMessages.limitation;
export const formatReadinessScore = (score) => score === null ? '—' : score.toLocaleString('id-ID', { maximumFractionDigits: 3 });

export function getReadinessMessages(assessment) {
  const custom = assessment?.messages || {};
  return Object.fromEntries(
    Object.entries(defaultReadinessMessages).map(([key, fallback]) => [
      key,
      custom[key]?.trim() ? custom[key] : fallback,
    ])
  );
}

export function getReadinessRatings(messages = defaultReadinessMessages) {
  return [
    { label: 'Siap', tone: 'hijau', meaning: messages.descSiap || defaultReadinessMessages.descSiap },
    { label: 'Cukup', tone: 'hijau', meaning: messages.descCukup || defaultReadinessMessages.descCukup },
    { label: 'Kurang', tone: 'kuning', meaning: messages.descKurang || defaultReadinessMessages.descKurang },
    { label: 'Belum', tone: 'merah', meaning: messages.descBelum || defaultReadinessMessages.descBelum },
  ];
}

export const readinessRatings = getReadinessRatings(defaultReadinessMessages);

export const answersList = [
  ['yes', 'Ya', defaultReadinessMessages.guideYes],
  ['partial', 'Sebagian', defaultReadinessMessages.guidePartial],
  ['no', 'Tidak', defaultReadinessMessages.guideNo],
];

export const optionalHints = {
  'q-7': 'Lewati (kosongkan) pertanyaan ini jika LSP Anda tidak menggunakan sistem Kecerdasan Buatan (AI).',
  'q-11': 'Lewati (kosongkan) pertanyaan ini jika skema tidak mensyaratkan pelatihan dan LSP/lembaga induk tidak menyelenggarakan pelatihan.',
  'q-15': 'Lewati (kosongkan) pertanyaan ini jika LSP Anda tidak mensertifikasi pegawai atau kontraktor internal sendiri.',
  'q-17': 'Lewati (kosongkan) pertanyaan ini jika LSP Anda tidak menyerahkan sebagian kegiatan sertifikasi kepada lembaga lain (alih daya).',
  'q-19': 'Lewati (kosongkan) pertanyaan ini jika LSP Anda tidak menggunakan sistem Kecerdasan Buatan (AI) dalam proses sertifikasi.',
  'q-26': 'Lewati (kosongkan) pertanyaan ini jika seluruh skema sertifikasi disusun sendiri oleh LSP Anda.',
  'q-39': 'Lewati (kosongkan) pertanyaan ini jika LSP Anda tidak menggunakan sertifikat atau pedoman ISO 9001 sebagai dasar sistem manajemen.',
  'q-42': 'Lewati (kosongkan) pertanyaan ini jika LSP Anda tetap melaksanakan audit internal minimal satu kali setiap tahun.',
};

export const getOptionalHint = (question) =>
  question.optHint?.trim() || optionalHints[question.id] || 'Lewati (kosongkan) pertanyaan ini jika kegiatan tersebut tidak dilakukan di lembaga Anda.';

export const identityMeta = {
  'I-01': {
    hint: 'Nama LSP sesuai nomenklatur KAN (mis. LSP-XXX-IDN); cantumkan brand jika ada dan nama badan hukum induk jika berbeda',
    type: 'text',
    placeholder: 'Contoh: LSP Las Indonesia (PT Sertifikasi Profesi Nusantara)',
    fullSpan: true,
  },
  'I-03': {
    hint: 'Alamat operasional lengkap LSP; tambahkan keterangan bila memiliki Tempat Uji Kompetensi (TUK) di lokasi lain',
    type: 'text',
    placeholder: 'Contoh: Jl. Jenderal Gatot Subroto Kav. 10, Jakarta Selatan',
    fullSpan: true,
  },
  'I-04': {
    hint: 'Alamat email resmi instansi / narahubung akreditasi LSP',
    type: 'email',
    placeholder: 'Contoh: sekretariat@lsp-contoh.or.id',
    fullSpan: false,
  },
  'I-09': {
    hint: 'Daftar bidang dan kategori per ruang lingkup yang akan diajukan (dasar penentuan skema, Klausul 8)',
    type: 'text',
    placeholder: 'Contoh: Welder / Inspektur Las / Ahli K3 Listrik',
    fullSpan: true,
  },
  'I-10': {
    hint: 'Tahun pendirian LSP atau tahun mulai beroperasi kegiatan sertifikasi person',
    type: 'number',
    placeholder: 'Contoh: 2023',
    fullSpan: false,
  },
};

export const getIdentityMeta = (item, index) => {
  const preset = identityMeta[item.id];
  const labelLower = (item.label || '').toLowerCase();
  let inferredType = preset?.type || 'text';
  if (!preset && labelLower.includes('email')) inferredType = 'email';
  else if (!preset && labelLower.includes('tahun')) inferredType = 'number';

  return {
    hint: item.hint?.trim() || preset?.hint || '',
    type: item.type || inferredType,
    placeholder: item.placeholder?.trim() || preset?.placeholder || '',
    fullSpan: preset ? preset.fullSpan : index === 0 || index === 1 || index === 3,
  };
};

const ANSWER_ALIASES = new Map([
  ['yes', 'yes'],
  ['Ya', 'yes'],
  ['partial', 'partial'],
  ['Sebagian', 'partial'],
  ['no', 'no'],
  ['Tidak', 'no'],
]);

const ANSWER_LABELS = new Map([
  ['yes', 'Ya'],
  ['partial', 'Sebagian'],
  ['no', 'Tidak'],
]);

export function normalizeAnswer(raw) {
  return ANSWER_ALIASES.get(raw);
}

export const readinessAnswerLabel = (answer) => ANSWER_LABELS.get(normalizeAnswer(answer));

// Alias: implementasinya sama dengan readinessAnswerLabel
export const readinessPlainAnswerLabel = readinessAnswerLabel;

export function friendlyClauseTitle(clause) {
  if (!clause) return '';
  if (/^[A-Z]\.\s/.test(clause.title)) return clause.title;
  return `${clause.code} — ${clause.title}`;
}

export function shortClauseTitle(clause) {
  return friendlyClauseTitle(clause).replace('Persyaratan ', '');
}

export function formatScopeClauseLabel(clause, items = []) {
  const mandCount = items.filter((q) => !q.allowNA).length;
  const optCount = items.filter((q) => q.allowNA).length;
  const countLabel = optCount > 0 ? `${mandCount} wajib, ${optCount} opsional` : `${mandCount} wajib`;
  const match = clause.title?.match(/^([A-Z])\.\s*(\S.*)$/);
  if (match) {
    const [, letter, rest] = match;
    const shortRest = ['D', 'F', 'G'].includes(letter) ? rest.replace(/^Persyaratan\s+/i, '') : rest;
    return `Bagian ${letter} — ${shortRest} (${countLabel})`;
  }
  return `${clause.code} — ${clause.title} (${countLabel})`;
}

function countAnswers(questions, responses) {
  const counts = { yes: 0, partial: 0, no: 0, na: 0 };
  const totals = { unansweredMand: 0, mandTotal: 0, optTotal: 0, mandDone: 0, optDone: 0 };

  for (const question of questions) {
    const isOptional = Boolean(question.allowNA);
    const answer = normalizeAnswer(responses[question.id]?.answer);

    totals[isOptional ? 'optTotal' : 'mandTotal'] += 1;

    if (answer) {
      counts[answer] += 1;
      totals[isOptional ? 'optDone' : 'mandDone'] += 1;
    } else if (isOptional) {
      counts.na += 1;
    } else {
      totals.unansweredMand += 1;
    }
  }

  return { counts, ...totals };
}

function resolveReadinessStatus({ unansweredMand, applicable, counts, pct }, messages) {
  const msg = (key) => messages[key] || defaultReadinessMessages[key];

  if (unansweredMand > 0) {
    return {
      status: 'Belum Lengkap',
      tone: 'abu',
      description: `Masih ada ${unansweredMand} pertanyaan wajib yang belum dijawab.`,
    };
  }
  if (applicable === 0 && counts.na > 0) {
    return {
      status: 'Tidak Diperlukan (Dilewati)',
      tone: 'abu',
      description: 'Tidak diperlukan karena kegiatan opsional terkait tidak dilakukan.',
    };
  }
  if (pct >= 80 && counts.no === 0) {
    return { status: 'Siap', tone: 'hijau', description: msg('descSiap') };
  }
  if (pct >= 60) {
    return { status: 'Cukup', tone: 'hijau', description: msg('descCukup') };
  }
  if (pct >= 40) {
    return { status: 'Kurang', tone: 'kuning', description: msg('descKurang') };
  }
  return { status: 'Belum', tone: 'merah', description: msg('descBelum') };
}

export function tallyReadiness(questions, responses, messages = defaultReadinessMessages) {
  const { counts, unansweredMand, mandTotal, optTotal, mandDone, optDone } =
    countAnswers(questions, responses);

  const applicable = counts.yes + counts.partial + counts.no;
  const pct = applicable
    ? Math.round(((counts.yes + 0.5 * counts.partial) / applicable) * 100)
    : 0;
  const score = applicable ? (2 * counts.yes + counts.partial) / applicable : null;

  const { status, tone, description } = resolveReadinessStatus(
    { unansweredMand, applicable, counts, pct },
    messages
  );

  return {
    counts,
    applicable,
    answered: applicable,
    pct,
    score,
    status,
    tone,
    description,
    unansweredMand,
    mandTotal,
    optTotal,
    mandDone,
    optDone,
  };
}

export const readinessButton = 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50';
export const readinessPrimary = 'inline-flex items-center justify-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50';
export const readinessInput = 'mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600';
