import DOMPurify from 'dompurify';

// Domain embed yang diizinkan. Sesuaikan dengan kebutuhan konten.
const ALLOWED_IFRAME_HOSTS = [
  'www.youtube.com',
  'www.youtube-nocookie.com',
  'player.vimeo.com',
  'www.google.com', // khusus Google Maps embed
];

const isAllowedIframeSrc = (src) => {
  try {
    const url = new URL(src, window.location.origin);
    if (url.protocol !== 'https:') return false;
    if (!ALLOWED_IFRAME_HOSTS.includes(url.hostname)) return false;
    if (url.hostname === 'www.google.com') {
      return url.pathname.startsWith('/maps/embed');
    }
    return true;
  } catch {
    return false;
  }
};

// Didaftarkan sekali saja di level modul, supaya tidak menumpuk tiap render.
DOMPurify.addHook('uponSanitizeElement', (node, data) => {
  if (data.tagName === 'iframe' && isAllowedIframeSrc(node.getAttribute('src'))) {
    data.allowedTags.iframe = true;
  }
});

export const sanitizeHtml = (dirty) =>
  DOMPurify.sanitize(dirty, {
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'],
  });