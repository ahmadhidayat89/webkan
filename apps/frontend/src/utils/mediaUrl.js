import { API_ORIGIN } from '../services/api';

const ABSOLUTE_URL_REGEX = /^https?:\/\//i;

export const resolveMediaUrl = (value) => {
  if (!value) return null;
  if (ABSOLUTE_URL_REGEX.test(value)) return value;

  const normalized = value.startsWith('/') ? value : `/${value}`;

  if (normalized.startsWith('/storage/')) {
    return `${API_ORIGIN}${normalized}`;
  }

  const withoutStoragePrefix = normalized.replace(/^\/?storage\//, '');
  return `${API_ORIGIN}/storage/${withoutStoragePrefix}`;
};

