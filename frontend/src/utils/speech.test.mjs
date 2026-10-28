import assert from "node:assert/strict";
import { test } from "node:test";
import { bindSpeechNavigationStops, createSpeechReader, getPageSpeechText, splitSpeechText } from "./speech.js";

function setup(language = "id-ID", voices = []) {
  const spoken = [];
  const states = [];
  const synthesis = {
    paused: false,
    cancel() {},
    pause() { this.paused = true; },
    resume() { this.paused = false; },
    getVoices: () => voices,
    speak: (utterance) => spoken.push(utterance),
  };
  class Utterance { constructor(text) { this.text = text; } }
  const reader = createSpeechReader({ synthesis, Utterance, language, onStatus: (value) => states.push(value) });
  return { reader, synthesis, spoken, states };
}

test("bounds long sentences and unbroken words without losing content", () => {
  for (const text of ["kata ".repeat(100), "x".repeat(500), "a" + "😀".repeat(200)]) {
    const chunks = splitSpeechText(text);
    assert.ok(chunks.length > 1);
    assert.ok(chunks.every((chunk) => chunk.length <= 180 && chunk.isWellFormed()));
    assert.equal(chunks.join("").replace(/\s/gu, ""), text.replace(/\s/gu, ""));
  }
  assert.deepEqual(splitSpeechText("Satu. Dua! Tiga?"), ["Satu.", "Dua!", "Tiga?"]);
});

test("supports browsers without Intl.Segmenter", () => {
  const original = Intl.Segmenter;
  try {
    Intl.Segmenter = undefined;
    assert.deepEqual(splitSpeechText("Satu. Dua!"), ["Satu.", "Dua!"]);
  } finally { Intl.Segmenter = original; }
});

test("only sends the next part after the previous part ends", () => {
  const { reader, spoken, states } = setup();
  reader.speak("Satu. Dua. Tiga.");
  assert.equal(spoken.length, 1);
  spoken[0].onend();
  assert.equal(spoken.length, 2);
  spoken[1].onend();
  assert.equal(spoken.length, 3);
  spoken[2].onend();
  assert.equal(states.at(-1), "idle");
});

test("pause-stop-start clears the engine paused state", () => {
  const { reader, synthesis, states } = setup();
  reader.speak("Lama.");
  reader.pause();
  assert.equal(synthesis.paused, true);
  reader.stop();
  reader.speak("Baru.");
  assert.equal(synthesis.paused, false);
  assert.equal(states.at(-1), "speaking");
});

test("stale canceled and completed events cannot change a new session", () => {
  const { reader, spoken, states } = setup();
  reader.speak("Lama. Berikutnya.");
  const old = spoken[0];
  reader.speak("Baru.");
  old.onerror({ error: "canceled" });
  old.onend();
  assert.equal(states.at(-1), "speaking");
  assert.equal(spoken.length, 2);
  assert.equal(spoken[1].text, "Baru.");
});

test("pause at a chunk boundary does not enqueue until resumed", () => {
  const { reader, spoken, states } = setup();
  reader.speak("Satu. Dua.");
  reader.pause();
  spoken[0].onend();
  assert.equal(spoken.length, 1);
  assert.equal(states.at(-1), "paused");
  reader.resume();
  assert.equal(spoken.length, 2);
});

test("voice and utterance language follow the requested locale", () => {
  const voices = [{ lang: "id-ID" }, { lang: "en-US" }];
  for (const language of ["id-ID", "en-US"]) {
    const { reader, spoken } = setup(language, voices);
    reader.speak("Testing voice.");
    assert.equal(spoken[0].lang, language);
    assert.equal(spoken[0].voice.lang, language);
  }
  const { reader, spoken } = setup("en-US");
  reader.speak("No voices loaded yet.");
  assert.equal(spoken[0].lang, "en-US");
});

test("empty text and voice failures leave no running queue", () => {
  const { reader, spoken, states, synthesis } = setup();
  reader.speak(" \n ");
  assert.equal(spoken.length, 0);
  reader.speak("Satu. Dua.");
  spoken[0].onerror({ error: "language-unavailable" });
  spoken[0].onend();
  assert.equal(spoken.length, 1);
  assert.equal(states.at(-1), "idle");
  synthesis.speak = () => { throw new Error("Voice failed"); };
  reader.speak("Satu.");
  assert.equal(states.at(-1), "idle");
});

// DOM interface doubles test filtering without adding a browser dependency.
function element({ text = "", raw = text, children = [], excluded = false, tag = "div", display = "block", visibility = "visible" } = {}) {
  const result = {
    nodeType: 1, innerText: text, textContent: raw, childNodes: children,
    style: { display, visibility },
    matches: (selector = "") => excluded || selector.split(",").some((part) => part.trim() === tag),
    getClientRects: () => display === "none" ? [] : [{}],
    querySelector: (selector = "") => children.find((child) => child.nodeType === 1 && (child.matches(selector) || child.querySelector(selector))) || null,
  };
  return result;
}

test("uses rendered innerText and separates paragraphs while filtering excluded or hidden elements", () => {
  const original = globalThis.window;
  globalThis.window = { getComputedStyle: (node) => node.style };
  try {
    const root = element({ children: [
      element({ text: "Kontrol", excluded: true }),
      element({ text: "Paragraf pertama.", raw: "<p>Paragraf pertama.</p> rahasia tersembunyi" }),
      element({ text: "Paragraf kedua." }),
      element({ text: "Disembunyikan CSS", display: "none" }),
      element({ text: "Tidak terlihat", visibility: "hidden" }),
      element({ text: "Pembaca halaman", excluded: true }),
    ] });
    assert.equal(getPageSpeechText(root), "Paragraf pertama. Paragraf kedua.");
    assert.equal(getPageSpeechText(null), "");
  } finally { globalThis.window = original; }
});

test("omits the sidebar home button while retaining article text and FAQ questions", () => {
  const original = globalThis.window;
  globalThis.window = { getComputedStyle: (node) => node.style };
  try {
    const sidebar = element({ tag: "aside", text: "Kembali ke Beranda Profil KAN" });
    const article = element({ text: "Komite Akreditasi Nasional Visi dan Misi" });
    const question = element({ tag: "button", text: "Apa itu akreditasi?" });
    const root = element({
      text: "Kembali ke Beranda Profil KAN Komite Akreditasi Nasional Visi dan Misi Apa itu akreditasi?",
      children: [sidebar, article, question],
    });
    assert.equal(getPageSpeechText(root), "Komite Akreditasi Nasional Visi dan Misi Apa itu akreditasi?");
  } finally { globalThis.window = original; }
});

function eventSurface() {
  const listeners = new Map();
  return {
    addEventListener: (type, callback) => listeners.set(type, callback),
    removeEventListener: (type, callback) => {
      if (listeners.get(type) === callback) listeners.delete(type);
    },
    fire: (type, event = {}) => listeners.get(type)?.(event),
  };
}

test("a home link stops and silences speech before page loading, rejecting old callbacks", () => {
  const browserWindow = eventSurface();
  const pageDocument = eventSurface();
  const { reader, spoken, states, synthesis } = setup();
  const unbind = bindSpeechNavigationStops(browserWindow, pageDocument, reader.stop);
  reader.speak("Isi artikel. Kalimat berikutnya.");
  const old = spoken[0];
  const link = { hasAttribute: () => false, getAttribute: () => null };
  pageDocument.fire("click", { button: 0, target: { closest: () => link } });
  assert.equal(states.at(-1), "idle");
  assert.equal(synthesis.paused, true);
  old.onend();
  old.onerror();
  assert.equal(spoken.length, 1);
  reader.speak("Konten beranda.");
  assert.equal(synthesis.paused, false);
  assert.equal(states.at(-1), "speaking");
  unbind();
});

test("browser Back and page exits stop speech and listeners are removed on cleanup", () => {
  const browserWindow = eventSurface();
  const pageDocument = eventSurface();
  let stops = 0;
  const unbind = bindSpeechNavigationStops(browserWindow, pageDocument, () => { stops += 1; });
  browserWindow.fire("popstate");
  browserWindow.fire("beforeunload");
  browserWindow.fire("pagehide");
  assert.equal(stops, 3);
  unbind();
  browserWindow.fire("popstate");
  browserWindow.fire("beforeunload");
  browserWindow.fire("pagehide");
  pageDocument.fire("click", { button: 0, target: { closest: () => ({ hasAttribute: () => false, getAttribute: () => null }) } });
  assert.equal(stops, 3);
});

test("reading controls and links opened in a new tab do not stop current speech", () => {
  const browserWindow = eventSurface();
  const pageDocument = eventSurface();
  let stops = 0;
  const unbind = bindSpeechNavigationStops(browserWindow, pageDocument, () => { stops += 1; });
  pageDocument.fire("click", { button: 0, target: { closest: () => null } });
  pageDocument.fire("click", { button: 0, target: { closest: () => ({ hasAttribute: () => false, getAttribute: () => "_blank" }) } });
  pageDocument.fire("click", { button: 0, ctrlKey: true });
  assert.equal(stops, 0);
  unbind();
});
