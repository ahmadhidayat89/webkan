import DOMPurify from 'dompurify';

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

const ALLOWED = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
};

const normalizeRichHtml = (html = '') => {
  const decoder = document.createElement('textarea');
  decoder.innerHTML = html;
  return decoder.value;
};

// Ubah HTML menjadi teks polos (untuk header tabel, pengecekan kosong, dll.)
export const stripHtml = (html = '') => {
  const d = document.createElement('div');
  d.innerHTML = DOMPurify.sanitize(normalizeRichHtml(html || ''), ALLOWED);
  return d.textContent || '';
};

export default function RichText({ html, className = '', block = false }) {
  return (
    <span
      className={`${block ? '[&_p]:block [&_p]:my-1' : '[&_p]:inline'} [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:text-blue-600 [&_a]:underline ${className}`}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(normalizeRichHtml(html || ''), ALLOWED) }}
    />
  );
}