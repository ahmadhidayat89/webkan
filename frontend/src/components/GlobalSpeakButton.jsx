import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSpeech } from "../hooks/useSpeech";

// Rute yang TIDAK menampilkan tombol
const EXCLUDED_PREFIXES = ["/admin", "/survei"];

function getPageText() {
  const root = document.querySelector("main") || document.body;
  const clone = root.cloneNode(true);
  clone
    .querySelectorAll("[data-no-speech], [data-speak-ui], script, style, nav, header, footer")
    .forEach((el) => el.remove());
  return (clone.textContent || "").replace(/\s+/g, " ").trim();
}

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
  const { supported, status, speak, pause, resume, stop } = useSpeech();
  const { pathname } = useLocation();

  // Hentikan suara saat pindah halaman
  useEffect(() => {
    stop();
  }, [pathname, stop]);

  const excluded = EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!supported || excluded) return null;

  return (
    <div
      data-speak-ui
      role="group"
      aria-label="Pembaca teks halaman"
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
        <button type="button" style={btnStyle} onClick={() => speak(getPageText())}>
          🔊 Dengarkan halaman
        </button>
      )}
      {status === "speaking" && (
        <button type="button" style={btnStyle} onClick={pause}>⏸ Jeda</button>
      )}
      {status === "paused" && (
        <button type="button" style={btnStyle} onClick={resume}>▶ Lanjut</button>
      )}
      {status !== "idle" && (
        <button type="button" style={{ ...btnStyle, background: "#b91c1c" }} onClick={stop}>
          ⏹ Berhenti
        </button>
      )}
    </div>
  );
}
