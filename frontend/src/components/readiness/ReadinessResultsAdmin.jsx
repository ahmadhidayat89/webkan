import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  deleteReadinessResponse,
  exportReadinessCsv,
  getReadinessResponses,
} from '../../services/api';
import {
  friendlyClauseTitle,
  readinessButton,
  readinessInput,
  readinessPlainAnswerLabel,
  readinessPrimary,
  tallyReadiness,
} from './readiness';

const statusBadgeColors = {
  Siap: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  Cukup: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  Kurang: 'border-accent-300 bg-accent-50 text-accent-900',
  Belum: 'border-red-300 bg-red-50 text-red-800',
  'Belum Lengkap': 'border-slate-300 bg-slate-100 text-slate-700',
  'Tidak Diperlukan (Dilewati)': 'border-slate-300 bg-slate-100 text-slate-700',
};

const percentOf = (count, total) => (total > 0 ? Math.round((count / total) * 100) : 0);

function StatusBadge({ status }) {
  const cls = statusBadgeColors[status] || statusBadgeColors['Belum Lengkap'];
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold ${cls}`}>
      {status}
    </span>
  );
}

function BarRow({ label, count, total, barClass }) {
  const pct = percentOf(count, total);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
        <span className="truncate pr-2">{label}</span>
        <span className="shrink-0 font-bold">
          {count} ({pct}%)
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`${barClass} h-full rounded-full transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function RespondentDetailModal({ respondent, draft, onClose }) {
  const [pdfStatus, setPdfStatus] = useState('idle');
  if (!respondent) return null;

  const activeClauseIds = respondent.selected_clauses?.length
    ? respondent.selected_clauses
    : draft.clauses.map((c) => c.id);

  const groups = draft.clauses
    .filter((c) => c.always || activeClauseIds.includes(c.id))
    .map((clause) => ({
      clause,
      items: draft.questions.filter((q) => q.clauseId === clause.id),
    }))
    .filter(({ items }) => items.length > 0);

  const questions = groups.flatMap(({ items }) => items);
  const summary = tallyReadiness(questions, respondent.responses || {});
  const filledIdentity = draft.identity
    .map(({ id, label }) => ({
      id,
      label,
      value: (respondent.identity?.[id] || '').trim(),
    }))
    .filter(({ value }) => value);

  const handleDownloadPdf = async () => {
    setPdfStatus('loading');
    try {
      const { downloadReadinessPdf } = await import('./readinessPdf.js');
      await downloadReadinessPdf({
        assessment: draft,
        identity: filledIdentity,
        scope: respondent.scope || 'Cakupan lengkap',
        groups,
        questions,
        responses: respondent.responses || {},
        summary,
      });
      setPdfStatus('idle');
    } catch {
      setPdfStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="max-h-[90vh] w-[min(96vw,56rem)] overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary-700">
              Detail Jawaban Responden
            </span>
            <h3 className="text-lg font-bold text-slate-900">
              {respondent.identity?.[draft.identity?.[0]?.id] || `Responden #${respondent.id}`}
            </h3>
            <p className="text-xs text-slate-500">
              Waktu pengisian: {respondent.created_at_human} · {respondent.scope || 'Cakupan lengkap'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={pdfStatus === 'loading'}
              className={readinessPrimary}
            >
              {pdfStatus === 'loading' ? 'Menyiapkan PDF…' : 'Unduh PDF'}
            </button>
            <button type="button" onClick={onClose} className={readinessButton}>
              Tutup
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-xl border border-primary-100 bg-primary-50 p-3 text-center">
            <div className="text-xs font-semibold text-slate-600">Status</div>
            <div className="mt-1">
              <StatusBadge status={respondent.status} />
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
            <div className="text-xs font-semibold text-slate-600">Kesiapan</div>
            <div className="mt-1 text-lg font-bold text-primary-900">{respondent.percentage}%</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
            <div className="text-xs font-semibold text-slate-600">Ya</div>
            <div className="mt-1 text-lg font-bold text-emerald-700">{respondent.yes_count}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
            <div className="text-xs font-semibold text-slate-600">Sebagian</div>
            <div className="mt-1 text-lg font-bold text-accent-700">{respondent.partial_count}</div>
          </div>
          <div className="col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center sm:col-span-1">
            <div className="text-xs font-semibold text-slate-600">Tidak</div>
            <div className="mt-1 text-lg font-bold text-red-700">{respondent.no_count}</div>
          </div>
        </div>

        {draft.identity?.length > 0 && (
          <div className="mt-5">
            <h4 className="mb-2 text-sm font-bold text-primary-900">Profil Lembaga</h4>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs sm:text-sm">
                <tbody className="divide-y divide-slate-200">
                  {draft.identity.map((item) => (
                    <tr key={item.id}>
                      <th scope="row" className="w-2/5 bg-slate-50 px-3 py-2 font-semibold text-slate-700">
                        {item.label}
                      </th>
                      <td className="px-3 py-2 text-slate-800">
                        {respondent.identity?.[item.id] || <span className="text-slate-400">Belum diisi</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-5">
          <h4 className="mb-2 text-sm font-bold text-primary-900">Rincian Jawaban per Bagian</h4>
          <div className="space-y-4">
            {groups.map(({ clause, items }) => (
              <div key={clause.id} className="overflow-hidden rounded-xl border border-slate-200">
                <div className="bg-primary-50 px-4 py-2.5 text-xs font-bold text-primary-950 sm:text-sm">
                  {friendlyClauseTitle(clause)}
                </div>
                <div className="divide-y divide-slate-200">
                  {items.map((item) => {
                    const ans = respondent.responses?.[item.id]?.answer;
                    let badgeText = item.allowNA ? 'Dilewati (Opsional)' : 'Belum dijawab';
                    let badgeCls = 'border-slate-300 bg-slate-100 text-slate-600';
                    if (ans === 'yes') {
                      badgeText = 'Ya';
                      badgeCls = 'border-emerald-300 bg-emerald-50 text-emerald-800';
                    } else if (ans === 'partial') {
                      badgeText = 'Sebagian';
                      badgeCls = 'border-accent-300 bg-accent-50 text-accent-900';
                    } else if (ans === 'no') {
                      badgeText = 'Tidak';
                      badgeCls = 'border-red-300 bg-red-50 text-red-800';
                    }
                    return (
                      <div key={item.id} className="flex items-start justify-between gap-3 px-4 py-2.5 text-xs sm:text-sm">
                        <div className="flex-1">
                          <span className="font-bold text-primary-900">
                            Butir {questions.indexOf(item) + 1}
                          </span>
                          {item.reference && (
                            <span className="ml-1.5 text-xs text-slate-500">
                              (Klausul {item.reference})
                            </span>
                          )}
                          <p className="mt-0.5 text-slate-800">{item.text}</p>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-bold ${badgeCls}`}>
                          {badgeText}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReadinessResultsAdmin({ assessmentId, draft, confirm, onCountChange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clauseFilter, setClauseFilter] = useState('');
  const [showAllRows, setShowAllRows] = useState(false);
  const [selectedRespondent, setSelectedRespondent] = useState(null);
  const [subTab, setSubTab] = useState('respondents');

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await getReadinessResponses(assessmentId);
      setData(res.data.data);
      if (onCountChange) {
        onCountChange(res.data.data?.stats?.total_responses ?? 0);
      }
    } catch {
      toast.error('Gagal memuat data hasil readiness assessment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assessmentId) {
      void fetchResults();
    }
  }, [assessmentId]);

  const handleDownloadCsv = async () => {
    try {
      const res = await exportReadinessCsv(assessmentId);
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hasil-readiness-assessment-${assessmentId}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Berkas CSV berhasil diunduh.');
    } catch {
      toast.error('Gagal mengunduh berkas CSV.');
    }
  };

  const handleDeleteResponse = async (resp) => {
    const instName = resp.identity?.[draft.identity?.[0]?.id] || `Responden #${resp.id}`;
    if (!(await confirm(`Hapus data hasil penilaian dari "${instName}"?`))) return;
    try {
      await deleteReadinessResponse(assessmentId, resp.id);
      toast.success('Data responden dihapus.');
      if (selectedRespondent?.id === resp.id) setSelectedRespondent(null);
      await fetchResults();
    } catch {
      toast.error('Gagal menghapus data responden.');
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        Memuat data hasil readiness assessment…
      </div>
    );
  }

  if (!data?.stats || data.stats.total_responses === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <h3 className="text-base font-bold text-slate-800">Belum ada hasil penilaian</h3>
        <p className="mt-1 text-sm text-slate-500">
          Data profil instansi, status kesiapan, dan rincian jawaban akan muncul di sini setelah peserta menyelesaikan penilaian kesiapan.
        </p>
      </div>
    );
  }

  const { stats, question_summary: questionSummary = [], responses = [] } = data;
  const primaryIdent = draft.identity?.[0];
  const secondaryIdent = draft.identity?.[2] || draft.identity?.[1];

  const filteredResponses = responses.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (!query.trim()) return true;
    return JSON.stringify(r).toLowerCase().includes(query.trim().toLowerCase());
  });

  const visibleResponses = showAllRows ? filteredResponses : filteredResponses.slice(0, 10);

  const filteredQuestions = questionSummary.filter(
    (q) => !clauseFilter || q.clauseId === clauseFilter
  );

  return (
    <div className="space-y-5">
      {/* Ringkasan Statistik */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Ringkasan Hasil Responden</h3>
            <p className="text-xs text-slate-500">
              Rekapitulasi hasil penilaian kesiapan mandiri yang telah disimpan dari halaman publik.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={fetchResults} className={readinessButton}>
              Muat Ulang
            </button>
            <button type="button" onClick={handleDownloadCsv} className={readinessPrimary}>
              Unduh CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-primary-100 bg-primary-50/70 p-4">
            <span className="block text-2xl font-extrabold text-primary-800">
              {stats.total_responses}
            </span>
            <span className="text-xs font-semibold text-slate-600">Total Responden</span>
          </div>
          <div className="rounded-xl border border-primary-100 bg-primary-50/70 p-4">
            <span className="block text-2xl font-extrabold text-primary-800">
              {stats.average_percentage}%
            </span>
            <span className="text-xs font-semibold text-slate-600">Rata-rata Kesiapan</span>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
            <span className="block text-2xl font-extrabold text-emerald-700">
              {stats.ready_count}
            </span>
            <span className="text-xs font-semibold text-slate-600">Kategori Siap</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="block pt-1 text-base font-bold text-slate-800">
              {stats.last_response_time || '-'}
            </span>
            <span className="text-xs font-semibold text-slate-600">Terakhir Mengisi</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-5">
          {Object.entries(stats.status_counts || {}).map(([label, count]) => (
            <div key={label} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
              <span className="font-semibold text-slate-700">{label}</span>
              <span className="font-bold text-slate-900">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pilihan Tampilan: Daftar Responden vs Statistik per Pertanyaan */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSubTab('respondents')}
          className={subTab === 'respondents' ? readinessPrimary : readinessButton}
        >
          Daftar Responden ({responses.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab('questions')}
          className={subTab === 'questions' ? readinessPrimary : readinessButton}
        >
          Statistik per Pertanyaan ({questionSummary.length})
        </button>
      </div>

      {subTab === 'respondents' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Jawaban per Responden</h3>
              <p className="text-xs text-slate-500">
                Menampilkan {filteredResponses.length} dari {responses.length} responden. Klik Detail untuk melihat profil dan seluruh jawaban responden.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                aria-label="Cari responden"
                placeholder="Cari instansi, email, alamat…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={readinessInput + ' !mt-0 sm:w-64'}
              />
              <select
                aria-label="Filter status kesiapan"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={readinessInput + ' !mt-0 sm:w-48'}
              >
                <option value="">Semua Status</option>
                <option value="Siap">Siap</option>
                <option value="Cukup">Cukup</option>
                <option value="Kurang">Kurang</option>
                <option value="Belum">Belum</option>
                <option value="Belum Lengkap">Belum Lengkap</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs sm:text-sm">
              <thead className="bg-primary-50 text-xs font-bold uppercase tracking-wider text-primary-950">
                <tr>
                  <th className="px-3 py-3">#</th>
                  <th className="px-3 py-3 whitespace-nowrap">Waktu</th>
                  <th className="px-3 py-3">{primaryIdent?.label || 'Instansi'}</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Skor</th>
                  <th className="px-3 py-3 whitespace-nowrap">Ya / Sebagian / Tidak</th>
                  <th className="px-3 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {visibleResponses.map((resp, idx) => {
                  const primaryVal = primaryIdent ? resp.identity?.[primaryIdent.id] : '';
                  const secondaryVal = secondaryIdent ? resp.identity?.[secondaryIdent.id] : '';
                  return (
                    <tr key={resp.id} className="hover:bg-slate-50">
                      <td className="px-3 py-3 font-bold text-slate-600">{idx + 1}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-slate-600">
                        {resp.created_at_human}
                      </td>
                      <td className="max-w-xs px-3 py-3">
                        <div className="truncate font-semibold text-slate-900">
                          {primaryVal || <span className="italic text-slate-400">Tanpa nama instansi</span>}
                        </div>
                        {secondaryVal && (
                          <div className="truncate text-xs text-slate-500">{secondaryVal}</div>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <StatusBadge status={resp.status} />
                      </td>
                      <td className="px-3 py-3 font-bold text-primary-900">
                        {resp.percentage}%
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-xs">
                        <span className="font-bold text-emerald-700">{resp.yes_count} Ya</span>
                        {' · '}
                        <span className="font-bold text-accent-700">{resp.partial_count} Sebagian</span>
                        {' · '}
                        <span className="font-bold text-red-700">{resp.no_count} Tidak</span>
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedRespondent(resp)}
                            className={readinessButton + ' !px-3 !py-1 text-xs'}
                          >
                            Detail
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteResponse(resp)}
                            className={readinessButton + ' !px-3 !py-1 text-xs text-red-700'}
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredResponses.length > 10 && (
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => setShowAllRows((prev) => !prev)}
                className="text-xs font-bold text-primary-700 hover:underline"
              >
                {showAllRows
                  ? 'Tampilkan lebih sedikit'
                  : `Tampilkan semua ${filteredResponses.length} responden`}
              </button>
            </div>
          )}
        </div>
      )}

      {subTab === 'questions' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <span className="text-sm font-bold text-slate-900">
              Distribusi Jawaban per Butir Pertanyaan
            </span>
            <select
              aria-label="Filter bagian klausul"
              value={clauseFilter}
              onChange={(e) => setClauseFilter(e.target.value)}
              className={readinessInput + ' !mt-0 sm:w-72'}
            >
              <option value="">Semua Bagian ({questionSummary.length} butir)</option>
              {draft.clauses.map((c) => (
                <option key={c.id} value={c.id}>
                  {friendlyClauseTitle(c)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredQuestions.map((qSum) => (
              <div
                key={qSum.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-primary-800">
                    Pertanyaan {qSum.number}
                    {qSum.reference ? ` · Klausul ${qSum.reference}` : ''}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                    {qSum.allowNA ? 'Opsional' : 'Wajib'} · {qSum.total_answers} menjawab
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-900">{qSum.text}</p>
                <div className="space-y-2 pt-1">
                  <BarRow
                    label={readinessPlainAnswerLabel('yes')}
                    count={qSum.counts.yes}
                    total={stats.total_responses}
                    barClass="bg-emerald-600"
                  />
                  <BarRow
                    label={readinessPlainAnswerLabel('partial')}
                    count={qSum.counts.partial}
                    total={stats.total_responses}
                    barClass="bg-accent-500"
                  />
                  <BarRow
                    label={readinessPlainAnswerLabel('no')}
                    count={qSum.counts.no}
                    total={stats.total_responses}
                    barClass="bg-red-600"
                  />
                  {qSum.allowNA && (
                    <BarRow
                      label="Dilewati (Opsional)"
                      count={qSum.counts.na}
                      total={stats.total_responses}
                      barClass="bg-slate-400"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <RespondentDetailModal
        respondent={selectedRespondent}
        draft={draft}
        onClose={() => setSelectedRespondent(null)}
      />
    </div>
  );
}
