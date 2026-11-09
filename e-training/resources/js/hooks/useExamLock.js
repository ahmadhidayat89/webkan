import { useEffect, useRef, useState, useCallback } from 'react';

export default function useExamLock({ active, maxViolations = 3, onLimitReached }) {
    const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
    const [violations, setViolations] = useState(0);
    const [warning, setWarning] = useState(null);

    const countRef = useRef(0);
    const lastRef = useRef(0);
    const limitRef = useRef(onLimitReached);
    limitRef.current = onLimitReached;

    const report = useCallback((reason) => {
        const now = Date.now();
        if (now - lastRef.current < 1500) return; // cegah hitungan ganda (blur + visibilitychange)
        lastRef.current = now;
        countRef.current += 1;
        setViolations(countRef.current);
        setWarning(reason);
        if (countRef.current >= maxViolations) limitRef.current?.();
    }, [maxViolations]);

    // Harus dipanggil langsung dari klik tombol (syarat browser)
    const enterFullscreen = useCallback(async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            }
            await navigator.keyboard?.lock?.(['Escape']); // hanya Chrome/Edge, abaikan jika gagal
        } catch (e) {
            console.warn('Fullscreen gagal:', e);
        }
    }, []);

    useEffect(() => {
        if (!active) return undefined;

        // Kuis baru dimulai: reset hitungan dan sinkronkan status layar penuh
        countRef.current = 0;
        setViolations(0);
        setWarning(null);
        setIsFullscreen(!!document.fullscreenElement);

        const onFsChange = () => {
            const fs = !!document.fullscreenElement;
            setIsFullscreen(fs);
            if (!fs) report('Anda keluar dari mode layar penuh.');
        };
        const onVisibility = () => {
            if (document.hidden) report('Anda berpindah tab atau aplikasi.');
        };
        const onBlur = () => report('Jendela kuis tidak lagi aktif.');
        const block = (e) => e.preventDefault();
        const onKeyDown = (e) => {
            const k = e.key.toLowerCase();
            const ctrl = e.ctrlKey || e.metaKey;
            if (
                k === 'f12' ||
                (ctrl && e.shiftKey && ['i', 'j', 'c'].includes(k)) ||
                (ctrl && ['u', 's', 'p'].includes(k))
            ) {
                e.preventDefault();
                report('Shortcut tidak diizinkan selama kuis.');
            }
        };
        const onBeforeUnload = (e) => { e.preventDefault(); e.returnValue = ''; };

        document.addEventListener('fullscreenchange', onFsChange);
        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('blur', onBlur);
        document.addEventListener('contextmenu', block);
        document.addEventListener('copy', block);
        document.addEventListener('cut', block);
        document.addEventListener('paste', block);
        document.addEventListener('keydown', onKeyDown);
        window.addEventListener('beforeunload', onBeforeUnload);

        return () => {
            document.removeEventListener('fullscreenchange', onFsChange);
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('blur', onBlur);
            document.removeEventListener('contextmenu', block);
            document.removeEventListener('copy', block);
            document.removeEventListener('cut', block);
            document.removeEventListener('paste', block);
            document.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('beforeunload', onBeforeUnload);
            navigator.keyboard?.unlock?.();
            if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
        };
    }, [active, report]);

    return { isFullscreen, violations, warning, enterFullscreen, dismissWarning: () => setWarning(null) };
}
