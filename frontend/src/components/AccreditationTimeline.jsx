import { useEffect, useRef, useState } from 'react';
import { getAccreditationSteps } from '../services/api';

export default function AccreditationTimeline() {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const rowRefs = useRef([]);
  const circleRefs = useRef([]);
  const timers = useRef([]);

  useEffect(() => {
    getAccreditationSteps()
      .then(({ data }) => {
        if (data.success) setSteps(data.data);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (steps.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const row = entry.target;
          const idx = Number(row.dataset.idx);
          const circleWrap = circleRefs.current[idx];

          if (entry.isIntersecting) {
            row.classList.add('tl-visible');
            if (circleWrap) {
              circleWrap.classList.remove('tl-pulse');
              void circleWrap.offsetWidth;
              circleWrap.classList.add('tl-pulse');
              const id = setTimeout(() => circleWrap.classList.remove('tl-pulse'), 2000);
              timers.current.push(id);
            }
          } else {
            row.classList.remove('tl-visible');
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -30px 0px' }
    );

    rowRefs.current.forEach((row) => { if (row) observer.observe(row); });
    return () => {
      observer.disconnect();
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [steps]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-blue-600 rounded-full animate-spin border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-base text-center text-slate-500 md:text-lg">
        Gagal memuat data tahapan akreditasi.
      </div>
    );
  }

  return (
    <div className="relative pb-2">
      {/* Garis vertikal tengah */}
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-gradient-to-b from-blue-600 via-blue-300 to-transparent rounded-full" />

      {steps.map((step, i) => {
        const isLeft = i % 2 === 0;
        return (
          <div
            key={step.id}
            ref={(el) => (rowRefs.current[i] = el)}
            data-idx={i}
            className={`tl-row flex items-center mb-9 relative min-h-[110px] ${isLeft ? 'tl-left' : 'tl-right'}`}
          >
            {/* Card sisi kiri atau spacer */}
            {isLeft ? (
              <div className="flex justify-end flex-1 pr-12">
                <StepCard step={step} side="left" />
              </div>
            ) : (
              <div className="flex-1" />
            )}

            {/* Garis horizontal kiri ke circle */}
            <div className="absolute top-1/2 -translate-y-1/2 h-0.5 bg-blue-200 z-10"
              style={{ right: 'calc(50% + 24px)', width: '24px' }} />

            {/* Lingkaran nomor di tengah */}
            <div
              ref={(el) => (circleRefs.current[i] = el)}
              className="absolute z-20 -translate-x-1/2 tl-circle-wrap left-1/2"
            >
              <div className="tl-circle-num w-12 h-12 rounded-full bg-gradient-to-br from-blue-900 to-blue-600 text-white flex items-center justify-center font-extrabold text-lg shadow-[0_0_0_5px_#dbeafe,0_4px_12px_rgba(37,99,235,0.35)] relative z-10">
                {i + 1}
              </div>
            </div>

            {/* Garis horizontal circle ke kanan */}
            <div className="absolute top-1/2 -translate-y-1/2 h-0.5 bg-blue-200 z-10"
              style={{ left: 'calc(50% + 24px)', width: '24px' }} />

            {/* Spacer atau card kanan */}
            {isLeft ? (
              <div className="flex-1" />
            ) : (
              <div className="flex justify-start flex-1 pl-12">
                <StepCard step={step} side="right" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepCard({ step, side }) {
  const arrowClass = side === 'left'
    ? 'after:absolute after:right-[-9px] after:top-1/2 after:-translate-y-1/2 after:border-[7px] after:border-transparent after:border-l-gray-50 after:border-r-0'
    : 'after:absolute after:left-[-9px] after:top-1/2 after:-translate-y-1/2 after:border-[7px] after:border-transparent after:border-r-gray-50 after:border-l-0';

  return (
    <div className={`tl-card bg-gray-50 rounded-xl p-5 w-full border-l-4 border-blue-600 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative ${arrowClass}`}>
      <div className="flex items-start gap-3 mb-2">
        <span className="text-2xl flex-shrink-0 mt-0.5">{step.icon}</span>
        <span className="text-lg font-bold leading-snug text-gray-900 md:text-xl">{step.title}</span>
      </div>
      <p className="text-base leading-relaxed text-gray-700 md:text-lg">{step.description}</p>
      <span className="inline-flex items-center gap-1 px-3 py-1 mt-3 text-sm font-semibold text-blue-600 rounded-full bg-blue-50">
        ✦ {step.tag}
      </span>
    </div>
  );
}