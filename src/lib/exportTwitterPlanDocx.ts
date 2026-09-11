import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import type { DayPlan } from '@/lib/twitterContent';

const NAVY = '0B1F3A';
const ORANGE = 'E8720C';
const LIGHT_GRAY = 'F2F2F2';

function cellBorder() {
  return {
    top: { style: BorderStyle.SINGLE, size: 2, color: 'D9D9D9' },
    bottom: { style: BorderStyle.SINGLE, size: 2, color: 'D9D9D9' },
    left: { style: BorderStyle.SINGLE, size: 2, color: 'D9D9D9' },
    right: { style: BorderStyle.SINGLE, size: 2, color: 'D9D9D9' },
  };
}

function headerCell(text: string, widthPct: number): TableCell {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, color: 'auto', fill: NAVY },
    borders: cellBorder(),
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 20 })],
      }),
    ],
  });
}

function bodyCell(text: string, widthPct: number, opts?: { bold?: boolean }): TableCell {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    borders: cellBorder(),
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: opts?.bold ?? false, size: 20, color: '1A1A1A' })],
      }),
    ],
  });
}

export async function exportTwitterPlanToDocx(days: DayPlan[], fileName = 'Twitter-Content-Plan.docx') {  const children: (Paragraph | Table)[] = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({ text: 'AI Pulse — 5-Day Twitter Content Plan', bold: true, size: 40, color: NAVY }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: 'Generated from current trending topics & hashtags · 4 posts/day · English',
          italics: true,
          size: 20,
          color: '555555',
        }),
      ],
    })
  );

  days.forEach((day) => {
    children.push(
      new Paragraph({
        spacing: { before: 300, after: 120 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 6, color: ORANGE },
        },
        children: [
          new TextRun({ text: `Day ${day.day} — `, bold: true, size: 28, color: NAVY }),
          new TextRun({ text: day.label, bold: true, size: 28, color: ORANGE }),
        ],
      })
    );

    const rows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [
          headerCell('#', 6),
          headerCell('Tweet Copy', 52),
          headerCell('Hashtags', 22),
          headerCell('Mentions', 20),
        ],
      }),
    ];

    day.tweets.forEach((tweet, idx) => {
      rows.push(
        new TableRow({
          children: [
            bodyCell(String(idx + 1), 6, { bold: true }),
            bodyCell(tweet.text, 52),
            bodyCell(tweet.hashtags.join('  '), 22),
            bodyCell(tweet.mentions.join('  ') || '—', 20),
          ],
        })
      );
    });

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows,
      })
    );

    children.push(new Paragraph({ text: '', spacing: { after: 120 } }));
  });

  children.push(
    new Paragraph({
      spacing: { before: 200 },
      shading: { type: ShadingType.CLEAR, color: 'auto', fill: LIGHT_GRAY },
      children: [
        new TextRun({
          text: 'Note: Review and lightly personalize each post before publishing. Swap hashtags for the day if a fresher trend has emerged since generation.',
          italics: true,
          size: 18,
          color: '555555',
        }),
      ],
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  // Note: we deliberately use toArrayBuffer() + a manually constructed Blob
  // rather than Packer.toBlob(). JSZip's own "blob" output mode has a known
  // reliability issue in bundled browser builds (it silently produces a
  // corrupted/truncated zip depending on the bundler's Node polyfills),
  // while "arraybuffer" mode avoids that code path entirely and has proven
  // reliable in testing.
  const arrayBuffer = await Packer.toArrayBuffer(doc);
  const blob = new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
