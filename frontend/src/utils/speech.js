const MAX_CHUNK = 180;

export function splitSpeechText(text, language = "id-ID") {
  const normalized = text.replace(/\s+/gu, " ").trim();
  if (!normalized) return [];
  const sentences = typeof Intl.Segmenter === "function"
    ? Array.from(new Intl.Segmenter(language, { granularity: "sentence" }).segment(normalized), ({ segment }) => segment)
    : normalized.match(/[^.!?]+[.!?]*|[.!?]+/gu) || [];
  return sentences.flatMap((sentence) => {
    const chunks = [];
    let remaining = sentence.trim();
    while (remaining.length > MAX_CHUNK) {
      const space = remaining.lastIndexOf(" ", MAX_CHUNK);
      let end = space > 0 ? space : MAX_CHUNK;
      // Preserve surrogate pairs when splitting long strings without spaces.
      if (/[\uD800-\uDBFF]/u.test(remaining[end - 1])) end -= 1;
      chunks.push(remaining.slice(0, end));
      remaining = remaining.slice(end).trim();
    }
    if (remaining) chunks.push(remaining);
    return chunks;
  });
}

const EXCLUDED = "[data-no-speech], [data-speak-ui], [hidden], [aria-hidden='true'], script, style, noscript, nav, aside, header, footer, svg, form, input, textarea, select";

export function getPageSpeechText(root) {
  if (!root) return "";
  const read = (element) => {
    if (element.matches(EXCLUDED)) return "";
    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse") return "";
    if (style.display !== "contents" && !element.getClientRects().length) return "";
    let text;
    if (!element.querySelector(EXCLUDED)) {
      // Live innerText preserves paragraph boundaries and CSS visibility.
      text = element.innerText || "";
    } else {
      text = Array.from(element.childNodes, (node) => {
        if (node.nodeType === 3) return node.textContent;
        return node.nodeType === 1 ? read(node) : "";
      }).join("");
    }
    return /^(block|flex|grid|list-item|table.*|flow-root)$/u.test(style.display)
      ? `\n${text}\n` : text;
  };
  return read(root).replace(/\s+/gu, " ").trim();
}

export function createSpeechReader({ synthesis, Utterance, language, onStatus }) {
  let session = 0;
  let current = null;
  let chunks = [];
  let index = 0;
  let paused = false;
  const stop = () => {
    // Invalidate callbacks before cancel() can dispatch events from old speech.
    session += 1;
    current = null;
    chunks = [];
    paused = false;
    // Silence immediately, including while a full-page navigation is loading.
    // Keep the engine paused until the user explicitly starts reading again.
    synthesis.pause();
    synthesis.cancel();
    onStatus("idle");
  };
  const next = (activeSession) => {
    if (session !== activeSession || paused) return;
    if (index >= chunks.length) {
      chunks = [];
      onStatus("idle");
      return;
    }
    const utterance = new Utterance(chunks[index]);
    current = utterance;
    utterance.lang = language;
    utterance.rate = 1;
    const voices = synthesis.getVoices();
    const voice = voices.find((item) => item.lang.toLowerCase() === language.toLowerCase())
      || voices.find((item) => item.lang.toLowerCase().startsWith(language.split("-")[0]));
    if (voice) utterance.voice = voice;
    utterance.onend = () => {
      if (session !== activeSession || current !== utterance) return;
      current = null;
      index += 1;
      next(activeSession);
    };
    utterance.onerror = () => {
      if (session === activeSession && current === utterance) stop();
    };
    try {
      synthesis.speak(utterance);
    } catch {
      utterance.onerror();
    }
  };
  return {
    speak(text) {
      stop();
      chunks = splitSpeechText(text, language);
      index = 0;
      if (!chunks.length) return;
      if (synthesis.paused) synthesis.resume();
      onStatus("speaking");
      next(session);
    },
    pause() {
      if (!chunks.length || paused) return;
      paused = true;
      synthesis.pause();
      onStatus("paused");
    },
    resume() {
      if (!chunks.length || !paused) return;
      paused = false;
      synthesis.resume();
      onStatus("speaking");
      if (!current) next(session);
    },
    stop,
  };
}

export function bindSpeechNavigationStops(browserWindow, pageDocument, stop) {
  const handleLinkClick = (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey
      || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target?.closest?.("a[href]");
    if (!link || link.hasAttribute("download")) return;
    const target = link.getAttribute("target");
    if (target && target.toLowerCase() !== "_self") return;
    stop();
  };
  // Capture runs before React handlers or the browser starts loading a link.
  pageDocument.addEventListener("click", handleLinkClick, true);
  browserWindow.addEventListener("popstate", stop);
  browserWindow.addEventListener("pagehide", stop);
  browserWindow.addEventListener("beforeunload", stop);
  return () => {
    pageDocument.removeEventListener("click", handleLinkClick, true);
    browserWindow.removeEventListener("popstate", stop);
    browserWindow.removeEventListener("pagehide", stop);
    browserWindow.removeEventListener("beforeunload", stop);
  };
}
