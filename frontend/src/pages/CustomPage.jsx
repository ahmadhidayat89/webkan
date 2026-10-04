import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';

const CustomPage = () => {
  const { slug } = useParams();
  const { i18n } = useTranslation();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState('');
  const isEnglish = (i18n.resolvedLanguage || i18n.language || 'id').startsWith('en');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setNotFound(false);
    setLoadError('');
    fetch(`/api/v1/pages/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 404) {
          setNotFound(true);
          return null;
        }
        if (!response.ok) throw new Error('Unable to load page.');
        return response.json();
      })
      .then((result) => setPage(result?.data || null))
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('Error loading page:', error);
          setLoadError('Halaman gagal dimuat. Silakan coba lagi.');
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [slug]);

  const title = isEnglish ? page?.title_en || page?.title_id : page?.title_id;
  const content = isEnglish ? page?.content_en || page?.content_id : page?.content_id;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto min-h-[60vh] px-4 pb-16 pt-36">
        {loading ? <p className="py-20 text-center text-gray-500">Memuat...</p>
          : loadError ? <p role="alert" className="py-20 text-center text-red-600">{loadError}</p>
            : notFound || !page ? <h1 className="py-20 text-center text-2xl font-bold">Halaman tidak ditemukan</h1>
            : <article className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-sm md:p-10">
              <h1 className="mb-8 text-3xl font-black text-gray-900">{title}</h1>
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content || '') }} />
            </article>}
      </main>
      <Footer />
    </div>
  );
};

export default CustomPage;
