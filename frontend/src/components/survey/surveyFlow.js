export const CONTENT_TYPES = ['section', 'heading', 'video', 'image'];

export function numberSurveyQuestions(questions) {
  const numbers = new Map();
  let count = 0;
  questions.forEach(question => { if (!CONTENT_TYPES.includes(question.type)) numbers.set(question.id, ++count); });
  return numbers;
}

export function splitSurveyPages(questions) {
  const pages = [[]];
  questions.forEach(question => {
    if (question.type === 'section' && pages.at(-1).length) pages.push([]);
    pages.at(-1).push(question);
  });
  return pages;
}

// Angka acak bulat 0..max-1 memakai CSPRNG (tanpa modulo bias)
const randomInt = max => {
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % max;
};

export function prepareSurveyQuestions(questions, settings = {}) {
  const shuffled = items => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  const canShuffle = settings.shuffle_questions && !questions.some(q => Object.values(q.config?.branches || {}).some(Boolean));
  const ordered = [];
  let group = [];
  const flush = () => { ordered.push(...(canShuffle ? shuffled(group) : group)); group = []; };
  questions.forEach(question => {
    const q = { ...question, options: question.config?.shuffle_options ? shuffled(question.options || []) : question.options };
    if (q.config?.shuffle_rows && Array.isArray(q.config.rows)) q.config = { ...q.config, rows: shuffled(q.config.rows) };
    if (q.type === 'section') { flush(); ordered.push(q); } else group.push(q);
  });
  flush();
  return ordered;
}

/** Same forward-only route used by the server. */
export function visibleQuestions(questions, answers) {
  const visible = [];
  let target = null;
  for (const [i, q] of questions.entries()) {
    if (target) {
      if (q.type !== 'section' || q.config?.key !== target) continue;
      target = null;
    }
    visible.push(q);
    if (['choice', 'drop'].includes(q.type)) {
      const next = q.config?.branches?.[answers[q.id]];
      if (next === '__submit') break;
      if (next && questions.slice(i + 1).some(s => s.type === 'section' && s.config?.key === next)) target = next;
    }
  }
  return visible;
}

const isGridType = type => ['grid', 'check_grid'].includes(type);
const requiresRows = q => q.is_required || q.req || q.config?.require_rows;
const emptyRow = value => !value || (Array.isArray(value) && !value.length);

function validateGrid(q, value) {
  const c = q.config || {};
  if (requiresRows(q) && (c.rows || []).some(row => emptyRow(value[row]))) return 'Isi setiap baris tabel.';
  if (c.unique_columns) {
    const selected = Object.values(value).flat().filter(Boolean);
    if (new Set(selected).size !== selected.length) return 'Setiap kolom hanya boleh dipilih sekali.';
  }
  return null;
}

function validateRating(q, value) {
  const c = q.config || {};
  const min = q.type === 'rating' ? 1 : (c.min ?? 1);
  const number = Number(value);
  return !Number.isInteger(number) || number < min || number > (c.max ?? 5) ? 'Pilih nilai pada rentang yang tersedia.' : null;
}

function validateDate(value) {
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
  return valid && new Date(value).toISOString().slice(0, 10) === value ? null : 'Masukkan tanggal yang valid.';
}

function validatePattern(v, value) {
  if (!v.pattern) return null;
  try {
    return new RegExp(v.pattern, 'u').test(value) ? null : v.error_message || 'Format jawaban tidak sesuai pola.';
  } catch {
    return 'Pola validasi tidak valid.';
  }
}

function validateTextConstraints(q, value) {
  const v = q.validation || {};
  if (v.min_value != null && Number(value) < v.min_value) return 'Angka di bawah batas minimum.';
  if (v.max_value != null && Number(value) > v.max_value) return 'Angka di atas batas maksimum.';
  if (v.contains && !String(value).includes(v.contains)) return `Jawaban harus memuat: ${v.contains}`;
  return validatePattern(v, value);
}

const extendedValidators = {
  linear: validateRating,
  rating: validateRating,
  grid: validateGrid,
  check_grid: validateGrid,
  date: (_q, value) => validateDate(value),
  time: (_q, value) => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value) ? null : 'Masukkan waktu yang valid.',
  duration: (_q, value) => /^\d{1,5}:[0-5]\d:[0-5]\d$/.test(value) ? null : 'Gunakan durasi jam:menit:detik.',
  short: validateTextConstraints,
  para: validateTextConstraints,
};

export function validateExtended(q, value) {
  if (CONTENT_TYPES.includes(q.type)) return null;
  const missing = value == null || value === '' || (Array.isArray(value) && !value.length);
  if (missing && isGridType(q.type) && q.config?.require_rows) return 'Isi setiap baris tabel.';
  if (missing) return q.is_required || q.req ? 'Pertanyaan ini wajib diisi.' : null;
  return extendedValidators[q.type]?.(q, value) ?? null;
}
