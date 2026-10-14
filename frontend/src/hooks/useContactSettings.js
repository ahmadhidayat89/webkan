import { useState, useEffect } from 'react';

const parseList = (raw) => {
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

// Nomor HP (08xx / +628xx) -> WhatsApp. Telepon kantor (021, dll) -> aplikasi telepon.
export const phoneLink = (raw = '') => {
  let n = raw.replace(/\D/g, '');
  if (n.startsWith('0')) n = '62' + n.slice(1);
  if (n.startsWith('628')) return { href: `https://wa.me/${n}`, isWa: true };
  return { href: `tel:+${n}`, isWa: false };
};

// FIX: regex /\s*\n\s*/g diganti split per baris (tanpa backtracking)
export const mapsLink = (address = '') => {
  const query = address
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(', ');

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

export const gmailLink = (email = '') =>
  `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`;

const EMPTY = { address: '', hours: '', emails: [], phones: [] };
const STORAGE_PREFIX = 'kan_contact_';

// memory  : hasil terakhir selama halaman terbuka
// pending : request yang sedang berjalan, dipakai bersama (tidak fetch dobel)
const memory = {};
const pending = {};

const readStored = (lang) => {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + lang);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeStored = (lang, value) => {
  try {
    localStorage.setItem(STORAGE_PREFIX + lang, JSON.stringify(value));
  } catch {
    /* abaikan kalau penyimpanan penuh / diblokir */
  }
};

const normalize = (d = {}) => {
  const emails = parseList(d.contact_emails);
  const phones = parseList(d.contact_phones);

  return {
    address: d.contact_address || '',
    hours: d.contact_hours || '',
    emails: emails.length
      ? emails
      : d.contact_email
        ? [{ label: '', value: d.contact_email }]
        : [],
    phones: phones.length
      ? phones
      : d.contact_phone
        ? [{ label: '', value: d.contact_phone }]
        : [],
  };
};

const load = (lang) => {
  if (!pending[lang]) {
    pending[lang] = fetch(`/api/v1/settings?group=contact&lang=${lang}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success || !data.data) throw new Error('Respons tidak valid');
        const result = normalize(data.data);
        memory[lang] = result;
        writeStored(lang, result);
        return result;
      })
      .catch(() => {
        pending[lang] = null; // boleh dicoba lagi lain waktu
        return null;
      });
  }
  return pending[lang];
};

export default function useContactSettings(lang = 'id') {
  const [contact, setContact] = useState(
    () => memory[lang] || readStored(lang) || null
  );

  useEffect(() => {
    let cancelled = false;
    const hasData = !!(memory[lang] || readStored(lang));

    load(lang).then((result) => {
      if (cancelled) return;
      if (result) setContact(result);
      else if (!hasData) setContact(EMPTY);
    });

    return () => {
      cancelled = true;
    };
  }, [lang]);

  // loaded = false hanya pada kunjungan pertama, selama data belum ada sama sekali
  return { ...(contact || EMPTY), loaded: contact !== null };
}
