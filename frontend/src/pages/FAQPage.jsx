import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import DOMPurify from "dompurify";

const FAQPage = () => {
    const [faqs, setFaqs] = useState([]);
    const [openFaq, setOpenFaq] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);

        fetch("/api/v1/faqs")
            .then((r) => {
                if (!r.ok) throw new Error("Gagal mengambil data FAQ");
                return r.json();
            })
            .then((data) => {
                if (data.success) {
                    setFaqs(data.data || []);
                } else {
                    setError(true);
                }
            })
            .catch((err) => {
                console.error("Error fetching FAQs:", err);
                setError(true);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            {/* Hero Section */}
            <section className="relative py-24 pt-32 overflow-hidden text-white bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 lg:pt-40">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 bg-white rounded-full w-96 h-96 blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 rounded-full w-96 h-96 bg-accent-500 blur-3xl"></div>
                </div>

                <div className="container relative z-10 px-6 mx-auto">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="mb-4 text-4xl font-black leading-tight md:text-5xl">
                            FAQs
                        </h1>

                        <p className="text-base md:text-lg text-white/90">
                            Temukan jawaban atas berbagai pertanyaan seputar layanan dan
                            proses akreditasi.
                        </p>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 bg-white">
                <div className="container px-6 mx-auto">
                    <div className="max-w-4xl mx-auto">

                        {loading ? (
                            <div className="flex justify-center py-16">
                                <div className="w-10 h-10 border-4 rounded-full border-primary-600 border-t-transparent animate-spin"></div>
                            </div>
                        ) : error ? (
                            <div className="py-16 text-center">
                                <div className="mb-4 text-5xl">⚠️</div>

                                <h2 className="mb-2 text-2xl font-bold text-gray-900">
                                    Gagal Memuat FAQ
                                </h2>

                                <p className="mb-6 text-gray-500">
                                    Terjadi kesalahan saat mengambil data FAQ.
                                </p>

                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-6 py-3 font-semibold text-white transition-all rounded-xl bg-primary-600 hover:bg-primary-700"
                                >
                                    Coba Lagi
                                </button>
                            </div>
                        ) : faqs.length === 0 ? (
                            <div className="py-16 text-center">
                                <p className="text-gray-400">
                                    Belum ada FAQ yang tersedia.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-hidden border border-gray-200 shadow-lg rounded-2xl">
                                {faqs.map((faq, index) => (
                                    <div
                                        key={faq.id}
                                        className="border-b border-gray-200 last:border-b-0"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => toggleFaq(index)}
                                            className="flex items-center justify-between w-full gap-6 px-6 py-6 text-left transition-all md:px-8 hover:bg-gray-50"
                                        >
                                            <span className="flex items-center gap-5">
                                                <span className="flex-shrink-0 font-bold text-primary-600">
                                                    {String(index + 1).padStart(2, "0")}.
                                                </span>

                                                <span className="text-base font-bold text-gray-800 md:text-lg">
                                                    {faq.question}
                                                </span>
                                            </span>

                                            <span className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-xl font-light rounded-full bg-primary-50 text-primary-600">
                                                {openFaq === index ? "−" : "+"}
                                            </span>
                                        </button>

                                        <div
                                            className={`overflow-hidden transition-all duration-500 ease-in-out ${openFaq === index
                                                    ? "max-h-[2000px]"
                                                    : "max-h-0"
                                                }`}
                                        >
                                            <div
                                                className="px-6 pb-6 leading-relaxed text-gray-500 md:px-8 md:pl-[84px]
                          [&_p]:mb-3
                          [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:space-y-2 [&_ul]:list-disc
                          [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:space-y-2 [&_ol]:list-decimal
                          [&_a]:text-primary-600 [&_a]:underline
                          [&_strong]:font-bold [&_strong]:text-gray-800"
                                                dangerouslySetInnerHTML={{
                                                    __html: DOMPurify.sanitize(faq.answer || ""),
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default FAQPage;