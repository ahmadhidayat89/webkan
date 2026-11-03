import { BarChart3 } from 'lucide-react';
import { gradeDistribution } from './quizReport.mjs';

export default function QuizGradeDistribution({ attempts }) {
    const bins = gradeDistribution(attempts);
    const total = bins.reduce((sum, bin) => sum + bin.count, 0);
    const maximum = Math.max(1, ...bins.map(bin => bin.count));
    return <section className="card p-5 sm:p-6" aria-labelledby="distribution-title">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3"><div>
            <h3 id="distribution-title" className="flex items-center gap-2 font-bold text-gray-900"><BarChart3 className="h-4 w-4 text-navy-600" /> Distribusi nilai</h3>
            <p className="mt-1 text-xs text-gray-500">Jumlah pengerjaan pada setiap rentang nilai akhir.</p>
        </div><span className="rounded-full bg-navy-50 px-3 py-1 text-xs font-medium text-navy-700">{total} hasil dinilai</span></div>
        {!total ? <p className="rounded-xl bg-gray-50 p-8 text-center text-sm text-gray-500">Diagram akan tampil setelah ada hasil yang selesai dinilai.</p> : <div className="overflow-x-auto pb-2"><div className="min-w-[480px]">
            <div className="relative flex h-48 items-end gap-3 border-b border-gray-200 px-2" role="img" aria-label={bins.map(bin => `Nilai ${bin.label}: ${bin.count} pengerjaan`).join('. ')}>
                <div className="pointer-events-none absolute inset-0 flex flex-col justify-between" aria-hidden="true">{[0, 1, 2, 3].map(line => <div key={line} className="border-t border-dashed border-gray-100" />)}</div>
                {bins.map(bin => <div key={bin.label} className="relative flex h-full flex-1 flex-col items-center justify-end gap-1"><span className="text-xs font-semibold text-gray-600">{bin.count}</span><div title={`${bin.label}: ${bin.count} pengerjaan`} className="w-full max-w-14 rounded-t-md bg-navy-600" style={{ height: `${bin.count / maximum * 82}%`, minHeight: bin.count ? 4 : 0 }} /></div>)}
            </div>
            <div className="flex gap-3 px-2 pt-3 text-center text-[10px] text-gray-500">{bins.map(bin => <span className="flex-1" key={bin.label}>{bin.label}</span>)}</div>
            <p className="mt-3 text-center text-xs text-gray-400">Rentang nilai (0–100)</p>
        </div></div>}
        <p className="mt-4 text-xs text-gray-400">Hasil yang sedang dikerjakan atau menunggu koreksi belum masuk diagram.</p>
    </section>;
}

