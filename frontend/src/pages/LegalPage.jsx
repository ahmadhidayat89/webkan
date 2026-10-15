import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Isi halaman: memuat, ada isi, atau belum tersedia
const LegalBody = ({ loading, body }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-8 h-8 border-4 rounded-full border-primary-600 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (body) {
    return (
      <div
        className="text-gray-500 leading-relaxed
          [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-10 [&_h2]:mb-4
          [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-8 [&_h3]:mb-3
          [&_p]:mb-4
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1
          [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-1
          [&_a]:text-primary-600 [&_a]:underline
          [&_strong]:text-gray-800"
        dangerouslySetInnerHTML={{ __html: body }}
      />
    );
  }

  return <p className="text-center text-gray-400">Konten belum tersedia.</p>;
};

const LegalPage = ({ pageId, fallbackTitle }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    fetch(`/api/v1/page-content/${pageId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setData(json?.data ?? null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [pageId]);

  const title = data?.title || fallbackTitle;
  const body = data?.content_id;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* pt-32/lg:pt-40 sama seperti About.jsx, supaya tidak tertutup header */}
      <main className="pt-32 pb-20 lg:pt-40">

        {/* Breadcrumb */}
        <nav className="container flex items-center max-w-5xl gap-2 px-6 mx-auto text-xs text-gray-500">
          <Link to="/" className="hover:text-primary-600">Beranda</Link>
          <span>&gt;</span>
          <span className="font-medium text-gray-900">{title}</span>
        </nav>

        {/* Judul */}
        <h1 className="px-6 mb-12 text-4xl font-bold text-center text-gray-900 md:text-5xl mt-14">
          {title}
        </h1>

        {/* Isi */}
        <article className="max-w-2xl px-6 mx-auto">
          <LegalBody loading={loading} body={body} />
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default LegalPage;
