import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import ReadinessForm from '../components/readiness/ReadinessForm';
import { readinessCatalogPath, readinessUrl } from '../components/readiness/readiness';
import { getPublicReadiness } from '../services/api';

function AssessmentPage({ id }) {
  const [assessment, setAssessment] = useState(null);
  const [error, setError] = useState('');
  const validId = /^[1-9][0-9]{0,17}$/.test(id);

  useEffect(() => {
    const controller = new AbortController();
    if (validId) {
      getPublicReadiness(id, controller.signal)
        .then(({ data }) => setAssessment(data.data))
        .catch((error) => {
          if (!controller.signal.aborted) {
            setError(error.response?.status === 404
              ? 'Asesmen tidak tersedia.'
              : 'Asesmen belum dapat dimuat. Silakan muat ulang halaman.');
          }
        });
    }
    return () => controller.abort();
  }, [id, validId]);

  const message = validId ? error : 'Asesmen tidak tersedia.';

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      <SEO title={assessment?.title || 'Readiness Assessment'} url={'https://kan.go.id' + (validId ? readinessUrl(id) : readinessCatalogPath)} />
      <div className="print:hidden"><Header /></div>
      <main>
        <div className="border-b border-primary-800 bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 pb-5 pt-24 md:pt-36 lg:pt-40 print:hidden">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <Link to={readinessCatalogPath} className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:underline">
              <FaArrowLeft aria-hidden="true" /> Daftar asesmen
            </Link>
          </div>
        </div>
        <div className="mx-auto max-w-4xl px-4 pb-16 pt-4 sm:px-6 print:max-w-none print:p-0">
          {message && <p role="alert" className="rounded-xl border border-slate-200 bg-white p-5 text-slate-700">{message}</p>}
          {!assessment && !message && <p role="status" className="text-slate-700">Memuat asesmen…</p>}
          {assessment && <ReadinessForm assessment={assessment} />}
        </div>
      </main>
      <div className="print:hidden"><Footer /></div>
    </div>
  );
}

export default function PublicReadiness() {
  const { id } = useParams();
  return <AssessmentPage key={id} id={id} />;
}
