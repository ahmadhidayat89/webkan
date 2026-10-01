import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';

const FAQSection = () => {
  const [openFaq, setOpenFaq] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/faqs')
      .then((r) => r.json())
      .then((d) => { if (d.success) setFaqs(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Tidak ada FAQ tersimpan → section disembunyikan seluruhnya
  if (!loading && faqs.length === 0) return null;

  return (
    <section id="faq"
  className="py-20 text-white bg-gradient-to-br from-primary-600 to-primary-900 scroll-mt-24">
      <div className="container max-w-4xl px-4 mx-auto">
        <div className="text-center">
          <h2 className="mb-4 text-4xl font-black md:text-5xl">
            FAQs
          </h2>
          <p className="mb-6 text-base text-white/80">
            Temukan jawaban atas berbagai pertanyaan seputar layanan dan proses akreditasi dengan cepat dan mudah.
          </p>
          <a
            href="/proses-akreditasi"
            className="inline-flex items-center gap-2 px-6 py-3 mb-10 text-sm transition-all bg-white rounded-full shadow-lg hover:bg-gray-100 text-primary-600"
          >
            Panduan Akreditasi
            <span aria-hidden="true">→</span>
          </a>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 rounded-full border-white/40 border-t-white animate-spin"></div>
          </div>
        ) : (
          <div className="border-t border-white/20">
            {faqs.map((faq, index) => (
              <div key={faq.id} className="border-b border-white/20">
                <button
                  onClick={() => toggleFaq(index)}
                  className="flex items-center justify-between w-full gap-6 py-6 text-left"
                >
                  <span className="flex items-center gap-6">
                    <span className="flex-shrink-0 font-semibold text-white/60">
                      {String(index + 1).padStart(2, '0')}.
                    </span>
                    <span className="text-lg font-semibold">{faq.question}</span>
                  </span>
                  <span className="flex-shrink-0 w-6 text-2xl font-light text-center">
                    {openFaq === index ? '−' : '+'}
                  </span>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    openFaq === index ? 'max-h-[2000px] pb-6' : 'max-h-0'
                  }`}
                >
                  <div
                    className="text-white/80 pl-0 md:pl-14 space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2 [&_a]:underline [&_strong]:font-bold"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(faq.answer) }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FAQSection;