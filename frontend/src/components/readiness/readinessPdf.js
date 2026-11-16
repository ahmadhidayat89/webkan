import pdfMake from 'pdfmake/build/pdfmake.js';
import pdfFonts from 'pdfmake/build/vfs_fonts.js';
import {
  friendlyClauseTitle,
  normalizeAnswer,
  readinessLimitation,
  readinessPlainAnswerLabel,
  tallyReadiness,
} from './readiness.js';

pdfMake.addVirtualFileSystem(pdfFonts);

export function downloadReadinessPdf({ assessment, identity = [], scope, groups, questions, responses, summary }) {
  const priorityRows = questions.flatMap((question, index) => {
    const answer = normalizeAnswer(responses[question.id]?.answer);
    if (answer !== 'no' && answer !== 'partial') return [];
    return [[
      { text: '#' + (index + 1), bold: true },
      question.text,
      { text: readinessPlainAnswerLabel(answer), bold: true, color: answer === 'no' ? '#b91c1c' : '#b45309' },
    ]];
  });

  const columnHeadings = ['Bagian', 'Ya', 'Sebagian', 'Tidak', 'Opsional Dilewati', 'Status Kesiapan'];
  const clauseRows = groups.map(({ clause, items }) => {
    const { counts, status } = tallyReadiness(items, responses);
    return [
      friendlyClauseTitle(clause),
      ...[counts.yes, counts.partial, counts.no, counts.na]
        .map((value) => ({ text: String(value), alignment: 'center' })),
      status,
    ];
  });

  const docRows = (assessment.documents || []).flatMap((doc) => {
    if (doc.code === 'D02') {
      return [[
        { text: 'D02', bold: true },
        doc.title,
        'Diisi Tahap Berikutnya',
      ]];
    }
    const dItems = questions.filter((q) => q.documentId === doc.id || q.documentId === doc.code);
    if (!dItems.length) return [];
    const ev = tallyReadiness(dItems, responses);
    return [[
      { text: doc.code, bold: true },
      doc.title,
      ev.status,
    ]];
  });

  const assessmentTitle = assessment.title;
  const date = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format();

  const identityBody = (assessment.identity || []).map((item) => {
    const found = identity.find((entry) => entry.id === item.id || entry.label === item.label);
    return [{ text: item.label, bold: true }, found?.value || '— belum diisi —'];
  });
  identityBody.push([{ text: 'Tanggal Pemeriksaan Mandiri', bold: true }, date]);

  const document = {
    pageSize: 'A4',
    pageMargins: [40, 38, 40, 42],
    info: { title: 'Ringkasan Kesiapan - ' + assessmentTitle },
    defaultStyle: { fontSize: 10, color: '#334155', lineHeight: 1.18 },
    styles: {
      section: { bold: true, fontSize: 13, color: '#1e3a8a', margin: [0, 15, 0, 7] },
      secondary: { fontSize: 9, color: '#475569' },
    },
    footer: (page, total) => ({
      margin: [40, 8, 40, 0],
      columns: [
        { text: 'Readiness Assessment KAN', style: 'secondary' },
        { text: 'Halaman ' + page + ' dari ' + total, alignment: 'right', style: 'secondary' },
      ],
    }),
    content: [
      { text: 'Ringkasan Kesiapan Bukti Akreditasi LSP', fontSize: 20, bold: true, color: '#172554' },
      { text: assessmentTitle, fontSize: 13, bold: true, color: '#1e40af', margin: [0, 4, 0, 2] },
      { text: [assessment.standard, assessment.subtitle].filter(Boolean).join(' · '), style: 'secondary' },
      { text: date + ' | ' + scope, style: 'secondary', margin: [0, 4, 0, 0] },
      { text: 'Profil Lembaga Sertifikasi Person', style: 'section', headlineLevel: 1 },
      {
        layout: 'lightHorizontalLines',
        table: {
          widths: [160, '*'],
          body: identityBody,
        },
      },
      { text: 'Status Kesiapan Bukti LSP Anda: ' + summary.status, style: 'section' },
      { text: summary.description, margin: [0, 0, 0, 8] },
      {
        columns: [
          { text: [{ text: 'Ya (Lengkap)\n', bold: true }, String(summary.counts.yes)] },
          { text: [{ text: 'Sebagian\n', bold: true }, String(summary.counts.partial)] },
          { text: [{ text: 'Tidak (Belum Ada)\n', bold: true }, String(summary.counts.no)] },
          { text: [{ text: 'Opsional Dilewati\n', bold: true }, String(summary.counts.na)] },
          { text: [{ text: 'Wajib Terjawab\n', bold: true }, `${summary.mandDone}/${summary.mandTotal}`] },
        ],
      },
      { text: 'Kesiapan per Bagian', style: 'section' },
      {
        layout: 'lightHorizontalLines',
        table: {
          headerRows: 1,
          keepWithHeaderRows: 1,
          widths: ['*', 28, 45, 32, 65, 110],
          body: [
            columnHeadings.map((text, index) => ({
              text,
              bold: true,
              fillColor: '#eff6ff',
              color: '#172554',
              alignment: index > 0 && index < 5 ? 'center' : 'left',
            })),
            ...clauseRows,
          ],
        },
      },
      ...(docRows.length ? [
        { text: 'Kesiapan Dokumen Pendukung Pengajuan Akreditasi', style: 'section', headlineLevel: 1 },
        {
          layout: 'lightHorizontalLines',
          table: {
            headerRows: 1,
            keepWithHeaderRows: 1,
            widths: [35, '*', 115],
            body: [
              ['Kode', 'Dokumen yang Perlu Disiapkan', 'Status Kesiapan'].map((text) => ({
                text,
                bold: true,
                fillColor: '#eff6ff',
                color: '#172554',
              })),
              ...docRows,
            ],
          },
        },
      ] : []),
      ...(priorityRows.length ? [
        { text: `Daftar Bukti yang Perlu Dilengkapi (${priorityRows.length} Butir)`, style: 'section', headlineLevel: 1 },
        {
          layout: 'lightHorizontalLines',
          table: {
            headerRows: 1,
            keepWithHeaderRows: 1,
            widths: [35, '*', 70],
            body: [
              ['No.', 'Bukti yang Perlu Dilengkapi', 'Status Saat Ini'].map((text) => ({
                text,
                bold: true,
                fillColor: '#eff6ff',
                color: '#172554',
              })),
              ...priorityRows,
            ],
          },
        },
      ] : []),
      { text: 'Langkah Selanjutnya', style: 'section', headlineLevel: 1 },
      { text: 'Apabila hasil kesiapan Anda telah mencapai kategori Siap, silakan gunakan laporan ini sebagai panduan saat mengisi dokumen evaluasi mandiri FPA 09-01 LSP.' },
      { text: 'Catatan Penting', style: 'section', headlineLevel: 1 },
      { text: readinessLimitation, style: 'secondary' },
    ],
    pageBreakBefore: (node, context) =>
      node.headlineLevel === 1 && context.getFollowingNodesOnPage().length === 0,
  };

  return pdfMake.createPdf(document).download('hasil-readiness-assessment.pdf');
}
