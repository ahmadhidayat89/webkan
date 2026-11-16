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

function inferIdentityType(preset, label) {
  if (preset?.type) return preset.type;
  const lower = (label || '').toLowerCase();
  if (lower.includes('email')) return 'email';
  if (lower.includes('tahun')) return 'number';
  return 'text';
}

export const getIdentityMeta = (item, index) => {
  const preset = identityMeta[item.id];
  return {
    hint: item.hint?.trim() || preset?.hint || '',
    type: item.type || inferIdentityType(preset, item.label),
    placeholder: item.placeholder?.trim() || preset?.placeholder || '',
    fullSpan: preset ? preset.fullSpan : index === 0 || index === 1 || index === 3,
  };
};

const DANGEROUS_PATTERNS = [
  /['"]\s*(or|and)\s+\S+\s*=\s*\S+/i,
  /\b(or|and)\s+(\d+)\s*=\s*\2\b/i,
  /\bunion\s+(all\s+)?select\b/i,
  /\b(drop|truncate|alter)\s+table\b/i,
  /['"]\s*--/,
  /\bxp_cmdshell\b/i,
  /\bsleep\s*\(\s*\d+\s*\)/i,
  /\bbenchmark\s*\(/i,
  /<\s*\/?\s*(script|iframe|object|embed|svg|img|style|link|meta)\b/i,
  /\b(javascript|vbscript|data)\s*:/i,
  /\bon[a-z]+\s*=/i,
];

export function sanitizeIdentityInput(raw, meta = {}) {
  const str = String(raw ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>`]/g, '');

  if (meta.type === 'number') {
    return str.replace(/\D/g, '').slice(0, 4);
  }
  if (meta.type === 'email') {
    return str.replace(/[\s"'\\;()]/g, '').slice(0, 254);
  }
  return str.replace(/\s{2,}/g, ' ').slice(0, 300);
}

function validateYearValue(trimmed) {
  const currentYear = new Date().getFullYear();
  const yearNum = Number(trimmed);
  if (!/^\d{4}$/.test(trimmed) || yearNum < 1900 || yearNum > currentYear) {
    return `Tahun berdiri harus berupa 4 digit angka antara 1900 dan ${currentYear}.`;
  }
  return '';
}

function validateEmailValue(trimmed) {
  const emailOk = /^[^\s@?&=<>]+@[^\s@?&=<>]+\.[^\s@?&=<>]{2,}$/.test(trimmed);
  return emailOk ? '' : 'Format alamat email tidak valid (contoh: sekretariat@lsp-contoh.or.id).';
}

export function validateIdentityField(value, item, meta = {}) {
  const raw = String(value ?? '');
  const trimmed = raw.trim();
  if (!trimmed) return '';

  if (DANGEROUS_PATTERNS.some((pattern) => pattern.test(raw))) {
    return 'Isian mengandung pola atau karakter yang tidak diizinkan.';
  }
  if (meta.type === 'email') {
    return validateEmailValue(trimmed);
  }
  if (meta.type === 'number' || (item?.label || '').toLowerCase().includes('tahun')) {
    return validateYearValue(trimmed);
  }
  if (!/^[\p{L}\p{N}\s.,/()&\-:'"+#]+$/u.test(trimmed)) {
    return 'Isian hanya boleh menggunakan huruf, angka, dan tanda baca umum.';
  }
  return '';
}

export function validateAllIdentity(identityItems = [], identityValues = {}) {
  const errors = {};
  let firstInvalidId = null;

  identityItems.forEach((item, idx) => {
    const meta = getIdentityMeta(item, idx);
    const err = validateIdentityField(identityValues[item.id], item, meta);
    if (err) {
      errors[item.id] = err;
      firstInvalidId ??= item.id;
    }
  });

  return { errors, firstInvalidId, isValid: !firstInvalidId };
}

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
