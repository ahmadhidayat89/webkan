import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSpeech } from "../hooks/useSpeech";
import { getPageSpeechText } from "../utils/speech";

// Rute yang TIDAK menampilkan tombol
const EXCLUDED_PREFIXES = ["/admin", "/survei"];

const btnStyle = {
  background: "#0b5cad",
  color: "#fff",
  border: "none",
  borderRadius: 9999,
  padding: "10px 16px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
};

export default function GlobalSpeakButton() {
  const { i18n } = useTranslation();
  const english = (i18n.resolvedLanguage || i18n.language || "id").startsWith("en");
  const language = english ? "en-US" : "id-ID";
  const { pathname, key } = useLocation();
  const { supported, status, speak, pause, resume, stop } = useSpeech(language, key);

  const excluded = EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!supported || excluded) return null;

  return (
    <div
      data-speak-ui
      data-no-auto-translate="true"
      lang={language}
      role="group"
      aria-label={english ? "Page reader" : "Pembaca teks halaman"}
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 9990,
        display: "flex",
        gap: 8,
      }}
    >
      {status === "idle" && (
        <button type="button" style={btnStyle} onClick={() => speak(getPageSpeechText(document.querySelector("main") || document.body))}>
          🔊 {english ? "Read page aloud" : "Dengarkan halaman"}
        </button>
      )}
      {status === "speaking" && (
        <button type="button" style={btnStyle} onClick={pause}>⏸ {english ? "Pause" : "Jeda"}</button>
      )}
      {status === "paused" && (
        <button type="button" style={btnStyle} onClick={resume}>▶ {english ? "Resume" : "Lanjut"}</button>
      )}
      {status !== "idle" && (
        <button type="button" style={{ ...btnStyle, background: "#b91c1c" }} onClick={stop}>
          ⏹ {english ? "Stop" : "Berhenti"}
        </button>
      )}
    </div>
  );
}
