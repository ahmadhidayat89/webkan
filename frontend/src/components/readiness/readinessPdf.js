import pdfMake from 'pdfmake/build/pdfmake.js';
import pdfFonts from 'pdfmake/build/vfs_fonts.js';
import {
  formatReadinessScore, readinessAnswerLabel, readinessLimitation, tallyReadiness,
} from './readiness.js';

pdfMake.addVirtualFileSystem(pdfFonts);

export function downloadReadinessPdf({ assessment, scope, groups, questions, responses, summary }) {
  const priorities = questions.flatMap((question, index) => {
    const answer = responses[question.id]?.answer;
    if (answer !== 'no' && answer !== 'partial') return [];

    return [{
      margin: [0, 0, 0, 9],
      stack: [
        { text: 'Butir ' + (index + 1) + ' - ' + readinessAnswerLabel(answer), bold: true, color: '#9a3412' },
        { text: question.text, margin: [0, 2, 0, 0] },
      ],
    }];
  });

  const columnHeadings = ['Klausul', 'Ya', 'Sebagian', 'Tidak', 'N/A', 'Skor', 'Status'];
  const rows = groups.map(({ clause, items }) => {
    const { counts, score, status } = tallyReadiness(items, responses);
    return [
      clause.code + ' - ' + clause.title,
      ...[counts.yes, counts.partial, counts.no, counts.na, formatReadinessScore(score)]
        .map((value) => ({ text: String(value), alignment: 'center' })),
      status,
    ];
  });
  const assessmentTitle = assessment.title;
  const date = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format();
  const score = formatReadinessScore(summary.score) + (summary.score === null ? '' : ' / 2');

  const document = {
    pageSize: 'A4',
    pageMargins: [40, 38, 40, 42],
    info: { title: 'Ringkasan hasil - ' + assessmentTitle },
    defaultStyle: { fontSize: 10, color: '#334155', lineHeight: 1.16 },
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
      { text: 'Ringkasan hasil', fontSize: 24, bold: true, color: '#172554' },
      { text: assessmentTitle, fontSize: 14, bold: true, color: '#1e40af', margin: [0, 5, 0, 3] },
      { text: [assessment.standard, assessment.subtitle].filter(Boolean).join(' - '), style: 'secondary' },
      { text: date + ' | ' + scope, style: 'secondary', margin: [0, 5, 0, 0] },
      { text: summary.status, style: 'section' },
      {
        columns: [
          { text: [{ text: 'Skor kesiapan\n', bold: true }, score] },
          { text: [{ text: 'Butir dijawab\n', bold: true }, summary.answered + ' / ' + questions.length] },
          { text: [{ text: 'Prioritas perbaikan\n', bold: true }, String(priorities.length)] },
        ],
      },
      { text: 'Ya bernilai 2, Sebagian bernilai 1, dan Tidak bernilai 0. Butir N/A dikeluarkan dari skor.', style: 'secondary', margin: [0, 8, 0, 0] },
      { text: 'Hasil per klausul', style: 'section' },
      {
        layout: 'lightHorizontalLines',
        table: {
          headerRows: 1,
          keepWithHeaderRows: 1,
          widths: ['*', 21, 45, 27, 26, 27, 100],
          body: [
            columnHeadings.map((text, index) => ({
              text,
              bold: true,
              fillColor: '#eff6ff',
              color: '#172554',
              alignment: index > 0 && index < 6 ? 'center' : 'left',
            })),
            ...rows,
          ],
        },
      },
      ...(priorities.length ? [
        { text: 'Butir prioritas perbaikan', style: 'section', headlineLevel: 1 },
        ...priorities,
      ] : []),
      { text: 'Langkah selanjutnya', style: 'section', headlineLevel: 1 },
      { text: 'Siapkan bukti untuk butir yang perlu diperbaiki dan lengkapi klausul yang belum dinilai sebelum mengajukan akreditasi.' },
      { text: 'Batasan penilaian', style: 'section', headlineLevel: 1 },
      { text: readinessLimitation, style: 'secondary' },
    ],
    pageBreakBefore: (node, context) =>
      node.headlineLevel === 1 && context.getFollowingNodesOnPage().length === 0,
  };

  return pdfMake.createPdf(document).download('hasil-readiness-assessment.pdf');
}
