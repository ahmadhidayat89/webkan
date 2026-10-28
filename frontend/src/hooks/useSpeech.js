import { useEffect, useRef, useState, useCallback } from "react";

const MAX_CHUNK = 180; // Chrome sering berhenti jika teks terlalu panjang

function splitText(text) {
  const sentences = text.match(/[^.!?\n]+[.!?]?/g) || [text];
  const chunks = [];
  let current = "";
  for (const s of sentences) {
    if ((current + s).length > MAX_CHUNK) {
      if (current) chunks.push(current.trim());
      current = s;
    } else {
      current += s;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export function useSpeech() {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [status, setStatus] = useState("idle"); // idle | speaking | paused
  const voiceRef = useRef(null);

  useEffect(() => {
    if (!supported) return;
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      voiceRef.current =
        voices.find((v) => v.lang === "id-ID") ||
        voices.find((v) => v.lang.startsWith("id")) ||
        null;
    };
    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  const speak = useCallback(
    (text) => {
      if (!supported || !text) return;
      window.speechSynthesis.cancel();
      const chunks = splitText(text);
      chunks.forEach((chunk, i) => {
        const u = new SpeechSynthesisUtterance(chunk);
        u.lang = "id-ID";
        if (voiceRef.current) u.voice = voiceRef.current;
        u.rate = 1;
        if (i === chunks.length - 1) u.onend = () => setStatus("idle");
        u.onerror = () => setStatus("idle");
        window.speechSynthesis.speak(u);
      });
      setStatus("speaking");
    },
    [supported]
  );

  const pause = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.pause();
    setStatus("paused");
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.resume();
    setStatus("speaking");
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setStatus("idle");
  }, [supported]);

  return { supported, status, speak, pause, resume, stop };
}
