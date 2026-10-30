import { CONTENT_TYPES, validateExtended } from './surveyFlow.js';

const isMissingAnswer = (value) => value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
export const isValidEmail = (value) => {
  const email = String(value);
  const at = email.indexOf('@');
  const domain = email.slice(at + 1);
  const dot = domain.lastIndexOf('.');
  return at > 0 && at === email.lastIndexOf('@') && !/\s/.test(email)
    && dot > 0 && dot < domain.length - 1;
};
const isValidPhone = (value) => {
  const phone = String(value);
  const digits = phone.replace(/\D/g, '');
  return /^\+?[0-9() .-]{7,20}$/.test(phone) && digits.length >= 7 && digits.length <= 15;
};

function validateTextResponse(question, value, rules) {
  const length = value.trim().length;
  if (rules.min_length != null && length < rules.min_length) return `Jawaban minimal ${rules.min_length} karakter.`;
  if (rules.max_length != null && length > rules.max_length) return `Jawaban maksimal ${rules.max_length} karakter.`;

  const answerType = question.type === 'short' ? (rules.answer_type || 'text') : question.type;
  if (answerType === 'email' && !isValidEmail(value)) return 'Masukkan alamat email yang valid.';
  if (answerType === 'phone' && !isValidPhone(value)) return 'Masukkan nomor telepon yang valid (7–15 digit).';
  if (answerType === 'number' && !/^-?\d+(?:[.,]\d+)?$/.test(String(value))) return 'Masukkan angka yang valid.';
  if (answerType === 'text_number' && !/^[\p{L}\p{N}\s.,'-]+$/u.test(String(value))) return 'Gunakan huruf dan angka saja.';
  return null;
}

export function validateQuestion(question, value) {
  if (CONTENT_TYPES.includes(question.type)) return null;
  const extra = validateExtended(question, value);
  if (extra) return question.validation?.error_message || extra;
  if (question.is_required && isMissingAnswer(value)) return 'Pertanyaan ini wajib diisi.';
  if (isMissingAnswer(value)) return null;

  if (['short', 'para'].includes(question.type) && typeof value === 'string') {
    return validateTextResponse(question, value, question.validation || {});
  }
  if (question.type === 'check' && Array.isArray(value)) {
    return validateCheckResponse(value, question.validation || {});
  }

  return validateSingleResponse(question, value);
}

function validateCheckResponse(value, rules) {
  if (rules.min_selections != null && value.length < rules.min_selections) return `Pilih minimal ${rules.min_selections} opsi.`;
  if (rules.max_selections != null && value.length > rules.max_selections) return `Pilih maksimal ${rules.max_selections} opsi.`;
  return null;
}

function validateSingleResponse(question, value) {
  switch (question.type) {
    case 'choice':
    case 'drop':
      return question.options?.includes(value) || (question.config?.allow_other && String(value).startsWith('Lainnya: ') && String(value).slice(9).trim()) ? null : 'Silakan pilih opsi yang tersedia.';
    case 'email':
      return isValidEmail(value) ? null : 'Masukkan alamat email yang valid.';
    case 'phone':
      return isValidPhone(value) ? null : 'Masukkan nomor telepon yang valid (7–15 digit).';
    case 'file':
      return (Array.isArray(value) ? value.length > 0 && value.every(f => f.url && f.name) : value?.url && value?.name) ? null : 'Silakan unggah berkas.';
    case 'scale':
      return Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 5
        ? null
        : 'Pilih nilai skala antara 1 dan 5.';
    default:
      return null;
  }
}

