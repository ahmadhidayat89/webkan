import { useEffect, useMemo, useState } from "react";
import {
  FaQuestionCircle,
  FaPlus,
  FaMinus,
  FaSyncAlt,
  FaSearch,
  FaFire,
} from "react-icons/fa";
import Header from "../components/Header";
import Footer from "../components/Footer";

const FAQPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openIndex, setOpenIndex] = useState(0);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/v1/faqs");
        const data = await response.json();

        if (data.success) {
          setFaqs(Array.isArray(data.data) ? data.data : []);
        } else {
          setError("Gagal memuat data FAQ");
        }
      } catch (err) {
        setError("Gagal memuat data FAQ");
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  const filteredFaqItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return faqs;
    return faqs.filter((item) =>
      `${item.question} ${item.answer}`.toLowerCase().includes(keyword),
    );
  }, [faqs, query]);

  return (
    <div className="min-h-screen bg-slate-100">
      <Header />

      <section className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 pb-16 pt-40 md:pt-44">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-primary-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="container">
          <div className="mx-auto max-w-4xl text-center text-white">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm font-semibold">
              <FaQuestionCircle className="text-xs" />
              Halaman FAQ
            </p>
            <h1 className="mb-4 text-4xl font-black leading-tight md:text-5xl">
              FAQ Terbaru
            </h1>
            <p className="mx-auto max-w-2xl text-base text-white/80 md:text-lg">
              Kumpulan pertanyaan yang paling sering diajukan seputar layanan
              dan proses akreditasi.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-bold text-white/80 md:text-sm">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
                {faqs.length} Pertanyaan
              </span>
            </div>
          </div>
        </div>
      </section>

      <main className="pb-24 pt-8 md:pt-10">
        <div className="container flex justify-center">
          <div className="w-full max-w-5xl rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_20px_60px_-30px_rgba(2,6,23,0.4)] md:p-8">
            <div className="mb-6 grid gap-4 border-b border-slate-100 pb-5 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <h2 className="text-2xl font-black text-slate-900 md:text-3xl">
                  Daftar FAQ
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Menampilkan {filteredFaqItems.length} dari {faqs.length}{" "}
                  pertanyaan
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Cari pertanyaan..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm font-medium text-slate-700 outline-none transition-all focus:border-primary-300 focus:bg-white focus:ring-2 focus:ring-primary-200 md:w-64"
                  />
                </div>

                {loading && (
                  <div className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-bold text-primary-700">
                    <FaSyncAlt className="animate-spin text-[11px]" />
                    Memuat...
                  </div>
                )}
                {!loading && (
                  <div className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
                    <FaFire className="text-[11px]" />
                    FAQ Terbaru
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            {!loading && filteredFaqItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
                <FaQuestionCircle className="mx-auto mb-3 text-3xl text-slate-300" />
                <p className="text-sm font-semibold text-slate-500">
                  {query ? (
                    <>
                      FAQ tidak ditemukan untuk kata kunci:{" "}
                      <span className="text-primary-700">{query}</span>
                    </>
                  ) : (
                    "Belum ada FAQ."
                  )}
                </p>
              </div>
            ) : (
              <div className="grid gap-3 md:gap-4">
                {filteredFaqItems.map((item, index) => {
                  const isOpen = index === openIndex;
                  return (
                    <article
                      key={item.id || index}
                      className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
                        isOpen
                          ? "border-primary-300 bg-gradient-to-b from-primary-50/60 to-white shadow-[0_12px_30px_-20px_rgba(37,99,235,0.45)]"
                          : "border-slate-200 bg-white hover:border-primary-200"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenIndex((prev) => (prev === index ? -1 : index))
                        }
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left md:px-6 md:py-5"
                        aria-expanded={isOpen}
                      >
                        <span className="flex items-start gap-3">
                          <span
                            className={`mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-lg text-[11px] font-black ${
                              isOpen
                                ? "bg-primary-600 text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {index + 1}
                          </span>
                          <span className="text-sm font-bold text-slate-900 md:text-xl">
                            {item.question}
                          </span>
                        </span>
                        <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-300 ${isOpen ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          {isOpen ? <FaMinus className="text-xs" /> : <FaPlus className="text-xs" />}
                        </span>
                      </button>

                      <div
                        className="grid transition-all duration-300"
                        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                      >
                        <div className="overflow-hidden">
                          <div className="px-5 pb-5 text-sm leading-relaxed text-slate-700 md:px-6 md:pb-6 md:text-base">
                            <div className="h-px w-full bg-gradient-to-r from-primary-200 to-transparent" />
                            <p className="pt-3">{item.answer}</p>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQPage;
