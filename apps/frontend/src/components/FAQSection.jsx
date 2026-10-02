import { useEffect, useMemo, useRef, useState } from 'react';
import { FaPlus, FaMinus } from 'react-icons/fa';

const FAQSection = ({ items = [] }) => {
  const [openIndex, setOpenIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  const faqItems = items;

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  const decoratedItems = useMemo(
    () =>
      faqItems.map((item, index) => ({
        ...item,
        id: item.id ? `faq-item-${item.id}` : `faq-item-${index + 1}`,
      })),
    [faqItems]
  );

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100 py-20"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-14 top-10 h-44 w-44 rounded-full bg-primary-200/50 blur-3xl" />
        <div className="absolute -right-10 bottom-8 h-56 w-56 rounded-full bg-accent-200/40 blur-3xl" />
      </div>

      <div className="container relative z-10">
        <div
          className={`mx-auto mb-12 max-w-3xl text-center transition-all duration-700 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <p className="mb-3 inline-flex rounded-full border border-primary-200 bg-primary-50 px-4 py-1 text-sm font-semibold text-primary-700">
            Frequently Asked Questions
          </p>
          <h2 className="mb-4 text-3xl font-bold text-slate-900 md:text-4xl">
            Pertanyaan yang Paling Sering Ditanyakan
          </h2>
          <p className="text-base text-slate-600 md:text-lg">
            Temukan jawaban cepat seputar proses akreditasi, status layanan, dan dukungan dari KAN.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-4">
          {decoratedItems.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
              FAQ beranda belum tersedia. Silakan lihat daftar FAQ lengkap.
            </div>
          )}

          {decoratedItems.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <article
                key={item.id}
                className={`group rounded-2xl border transition-all duration-500 ${
                  isOpen
                    ? 'border-primary-300 bg-white shadow-[0_14px_40px_-20px_rgba(37,99,235,0.45)]'
                    : 'border-slate-200/90 bg-white/80 hover:border-primary-200 hover:bg-white'
                } ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                style={{ transitionDelay: `${140 + index * 90}ms` }}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex((prev) => (prev === index ? -1 : index))}
                  aria-expanded={isOpen}
                  aria-controls={item.id}
                  className="flex w-full items-center justify-between gap-4 p-6 text-left md:p-7"
                >
                  <span className="text-lg font-semibold leading-snug text-slate-900 md:text-xl">
                    {item.question}
                  </span>
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                      isOpen
                        ? 'border-primary-300 bg-primary-600 text-white'
                        : 'border-slate-300 bg-white text-slate-600 group-hover:border-primary-300 group-hover:text-primary-700'
                    }`}
                  >
                    {isOpen ? <FaMinus className="text-xs" /> : <FaPlus className="text-xs" />}
                  </span>
                </button>

                <div
                  id={item.id}
                  className="grid transition-all duration-500 ease-out"
                  style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-6 text-slate-600 md:px-7 md:pb-7 md:text-base">
                      <div className="h-px w-full bg-gradient-to-r from-primary-100 via-slate-200 to-transparent" />
                      <p className="pt-4 leading-relaxed">{item.answer}</p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <a
            href="/faq"
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-primary-700"
          >
            Lihat Semua FAQ
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
