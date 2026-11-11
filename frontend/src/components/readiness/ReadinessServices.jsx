import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaClipboardCheck } from 'react-icons/fa';
import { listPublicReadiness } from '../../services/api';
import { readinessUrl } from './readiness';

export default function ReadinessServices() {
  const [assessments, setAssessments] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    listPublicReadiness(controller.signal)
      .then(({ data }) => setAssessments(data.data))
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, []);

  return (
    <section className="rounded-2xl border border-primary-100 bg-primary-50 p-5 sm:p-7" aria-labelledby="readiness-services-title">
      <div className="flex items-start gap-4">
        <FaClipboardCheck className="mt-1 shrink-0 text-2xl text-primary-700" aria-hidden="true" />
        <div>
          <h2 id="readiness-services-title" className="text-xl font-bold text-slate-900">Pilih asesmen</h2>
          <p className="mt-1 text-sm text-slate-700">Nilai kesiapan lembaga Anda secara mandiri sebelum mengajukan akreditasi.</p>
        </div>
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-slate-700">Daftar asesmen belum dapat dimuat. Silakan muat ulang halaman.</p>}
      {!error && assessments === null && <p role="status" className="mt-4 text-sm text-slate-700">Memuat daftar asesmen…</p>}
      {assessments?.length === 0 && <p className="mt-4 text-sm text-slate-700">Belum ada asesmen yang diterbitkan.</p>}
      {assessments?.length > 0 && (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {assessments.map((assessment) => (
            <li key={assessment.id}>
              <Link to={readinessUrl(assessment.id)} className="flex h-full items-center justify-between gap-4 rounded-xl border border-primary-100 bg-white p-4 hover:border-primary-500">
                <div>
                  <p className="text-xs font-semibold text-primary-700">{assessment.standard}</p>
                  <p className="mt-1 font-semibold text-slate-900">{assessment.title}</p>
                  {assessment.subtitle && <p className="text-sm text-slate-600">{assessment.subtitle}</p>}
                  <span className="mt-2 inline-block text-sm font-semibold text-primary-700">Mulai asesmen</span>
                </div>
                <FaArrowRight className="shrink-0 text-primary-700" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
