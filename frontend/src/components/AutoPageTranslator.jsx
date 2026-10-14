import { useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const EXCLUDED_TAGS = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION',
  'CODE', 'PRE', 'KBD', 'SVG',
]);

const MIN_TEXT_LENGTH = 2;
const MAX_ITEMS_PER_REQUEST = 180;
const MAX_TEXT_LENGTH = 1000;
const STORAGE_KEY = 'kan_auto_translate_cache_v2';

const isTranslatableTextNode = (node) => {
  if (!node || node.nodeType !== Node.TEXT_NODE) return false;
  const text = node.nodeValue?.trim() || '';
  if (text.length < MIN_TEXT_LENGTH) return false;

  const parent = node.parentElement;
  if (!parent) return false;
  if (EXCLUDED_TAGS.has(parent.tagName)) return false;
  if (parent.closest('[data-no-auto-translate="true"]')) return false;
  if (parent.closest('.ql-editor')) return false;
  if (parent.closest('[contenteditable="true"]')) return false;

  return true;
};

const normalizeText = (text) => text.replace(/\s+/g, ' ').trim();

const chunkArray = (arr, size) => {
  if (!Array.isArray(arr) || size <= 0) return [];
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const AutoPageTranslator = () => {
  const { i18n } = useTranslation();
  const location = useLocation();

  const observerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const isApplyingRef = useRef(false);
  const isTranslatingRef = useRef(false);
  const cacheLoadedRef = useRef(false);
  const originalTextByNodeRef = useRef(new Map());
  const translatedCacheRef = useRef(new Map());

  const isEnglish = (i18n.resolvedLanguage || i18n.language || 'id').startsWith('en');
  const isAdminRoute = useMemo(() => location.pathname.startsWith('/admin'), [location.pathname]);

  const collectTranslatableNodes = () => {
    const root = document.getElementById('root');
    if (!root) return [];

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let current = walker.nextNode();
    while (current) {
      if (isTranslatableTextNode(current)) {
        nodes.push(current);
      }
      current = walker.nextNode();
    }
    return nodes;
  };

  const loadCacheFromStorage = () => {
    if (cacheLoadedRef.current) return;
    cacheLoadedRef.current = true;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return;
      Object.entries(parsed).forEach(([k, v]) => {
        if (typeof k === 'string' && typeof v === 'string') {
          translatedCacheRef.current.set(k, v);
        }
      });
    } catch {
      // ignore
    }
  };

  const persistCacheToStorage = () => {
    try {
      const entries = Array.from(translatedCacheRef.current.entries()).slice(-2000);
      const obj = Object.fromEntries(entries);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch {
      // ignore
    }
  };

  const restoreOriginalTexts = () => {
    for (const [node, original] of originalTextByNodeRef.current.entries()) {
      if (node?.isConnected) {
        node.nodeValue = original;
      }
    }
  };

  const collectUntranslatedTexts = (nodes) => {
    const texts = [];
    const seen = new Set();
    for (const node of nodes) {
      const currentText = node.nodeValue || '';
      if (!originalTextByNodeRef.current.has(node)) originalTextByNodeRef.current.set(node, currentText);
      const source = normalizeText(originalTextByNodeRef.current.get(node) || currentText);
      if (source.length >= MIN_TEXT_LENGTH && !translatedCacheRef.current.has(source) && !seen.has(source)) {
        seen.add(source);
        texts.push(source);
      }
    }
    return texts.filter((text) => text.length <= MAX_TEXT_LENGTH);
  };

  const fetchMissingTranslations = async (texts) => {
    for (const chunk of chunkArray(texts, MAX_ITEMS_PER_REQUEST)) {
      try {
        const response = await fetch('/api/v1/translate/texts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ from: 'id', to: 'en', texts: chunk }),
        });
        const data = await response.json();
        if (!response.ok || !data?.success || !Array.isArray(data?.data?.items)) continue;
        data.data.items.forEach((item) => {
          const source = normalizeText(item?.source || '');
          if (source && typeof item?.translated === 'string' && item.translated) {
            translatedCacheRef.current.set(source, item.translated);
          }
        });
        persistCacheToStorage();
      } catch {
        // Best-effort translation only; keep original text on failure.
      }
    }
  };

  const applyTranslationsToNodes = (nodes) => {
    for (const node of nodes) {
      if (!node?.isConnected) continue;
      const original = originalTextByNodeRef.current.get(node);
      if (!original) continue;
      const translated = translatedCacheRef.current.get(normalizeText(original));
      if (!translated) continue;
      const match = original.match(/^(\s*)([\s\S]*?)(\s*)$/);
      node.nodeValue = match ? `${match[1]}${translated}${match[3]}` : translated;
    }
  };

  const translateVisibleTexts = async () => {
    if (isTranslatingRef.current || isApplyingRef.current) return;
    isTranslatingRef.current = true;
    try {
      const nodes = collectTranslatableNodes();
      if (!nodes.length) return;
      await fetchMissingTranslations(collectUntranslatedTexts(nodes));
      isApplyingRef.current = true;
      applyTranslationsToNodes(nodes);
    } finally {
      isApplyingRef.current = false;
      isTranslatingRef.current = false;
    }
  };

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (isAdminRoute || !isEnglish) {
      restoreOriginalTexts();
      return;
    }

    loadCacheFromStorage();
    translateVisibleTexts();

    const root = document.getElementById('root');
    if (!root) return;

    const observer = new MutationObserver(() => {
      if (isApplyingRef.current) return;
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        translateVisibleTexts();
      }, 120);
    });
    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
    });
    observerRef.current = observer;

    return () => {
      clearTimeout(debounceTimerRef.current);
      observer.disconnect();
      if (!isEnglish) {
        restoreOriginalTexts();
      }
    };
  }, [isEnglish, isAdminRoute, location.pathname]);

  return null;
};

export default AutoPageTranslator;