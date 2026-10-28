import { useLayoutEffect, useRef, useState, useCallback } from "react";
import { bindSpeechNavigationStops, createSpeechReader } from "../utils/speech";

export function useSpeech({ language = "id-ID", navigationKey } = {}) {
  const supported = typeof window !== "undefined"
    && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  const [status, setStatus] = useState("idle");
  const readerRef = useRef(null);

  // Destroy the old session before the newly navigated page is painted.
  useLayoutEffect(() => {
    if (!supported) return;
    const reader = createSpeechReader({
      synthesis: window.speechSynthesis,
      Utterance: window.SpeechSynthesisUtterance,
      language,
      onStatus: setStatus,
    });
    readerRef.current = reader;
    const unbindNavigation = bindSpeechNavigationStops(window, document, reader.stop);
    return () => {
      reader.stop();
      readerRef.current = null;
      unbindNavigation();
    };
  }, [supported, language, navigationKey]);

  const speak = useCallback((text) => readerRef.current?.speak(text), []);
  const pause = useCallback(() => readerRef.current?.pause(), []);
  const resume = useCallback(() => readerRef.current?.resume(), []);
  const stop = useCallback(() => readerRef.current?.stop(), []);

  return { supported, status, speak, pause, resume, stop };
}
