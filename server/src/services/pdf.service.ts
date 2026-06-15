import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import path from 'path';
import { IWeeklyFitnessPlan } from '../models/fitness.model';
import { IGroceryList } from '../models/groceryList.model';
import { INutritionPlan } from '../models/nutrition.model';
import { IUser } from '../models/user.model';

// ─── Arabic Support ───────────────────────────────────────────────────────────

const FONTS_DIR = path.join(__dirname, '../../assets/fonts');

const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

function hasArabic(text: string): boolean {
  return ARABIC_REGEX.test(text);
}

function hasUnicode(text: string): boolean {
  return /[^\x00-\x7F]/.test(text);
}

function pickFont(text: string, style: 'regular' | 'bold' | 'oblique' = 'regular'): string {
  if (hasUnicode(text)) {
    return style === 'bold' ? 'Cairo-Bold' : 'Cairo';
  }
  switch (style) {
    case 'bold': return 'Helvetica-Bold';
    case 'oblique': return 'Helvetica-Oblique';
    default: return 'Helvetica';
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserProfile {
  name: string;
  email: string;
  avatarPath?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const BRAND = {
  primary: '#2D6A4F',
  secondary: '#40916C',
  accent: '#74C69D',
  light: '#D8F3DC',
  text: '#1B1B1B',
  muted: '#6B7280',
  white: '#FFFFFF',
  tableHeader: '#2D6A4F',
  tableRow: '#F0FDF4',
  tableRowAlt: '#FFFFFF',
  border: '#B7E4C7',
};

const PAGE = {
  margins: { top: 60, bottom: 80, left: 50, right: 50 },
  width: 595.28,  // A4
  height: 841.89,
};

const CONTENT_WIDTH = PAGE.width - PAGE.margins.left - PAGE.margins.right;

// ─── Main Export ─────────────────────────────────────────────────────────────

export const generatePDF = (
  type: 'grocery' | 'workout' | 'meal',
  data: IWeeklyFitnessPlan | INutritionPlan | IGroceryList,
  user: IUser,
  logoPath?: string,
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: PAGE.margins,
      bufferPages: true,
      autoFirstPage: true,
      info: {
        Title: getPDFTitle(type),
        Author: 'Njerka.fit',
        Creator: 'Njerka.fit Platform',
      },
    });

    doc.registerFont('Cairo', path.join(FONTS_DIR, 'Cairo-Regular.ttf'));
    doc.registerFont('Cairo-Bold', path.join(FONTS_DIR, 'Cairo-Bold.ttf'));

    const chunks: Buffer[] = [];
    const stream = new PassThrough();
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
    doc.pipe(stream);

    // ── Auto-draw compact header on continuation pages ──────────────────────
    let pageCount = 0;
    doc.on('pageAdded', () => {
      pageCount++;
      if (pageCount > 1) {
        drawPageHeader(doc, type);
      }
    });

    // ── Render body ─────────────────────────────────────────────────────────
    drawHeader(doc, user, type, logoPath);
    drawDivider(doc);
    doc.y += 12;

    switch (type) {
      case 'grocery':
        drawGroceryBody(doc, data as IGroceryList);
        break;
      case 'workout':
        drawWorkoutBody(doc, data as IWeeklyFitnessPlan);
        break;
      case 'meal':
        drawMealBody(doc, data as INutritionPlan);
        break;
    }

    const range = doc.bufferedPageRange();
    const totalPages = range.count;

    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(range.start + i);
      drawFooter(doc, i + 1, totalPages);
    }

    doc.end();
  });
};

// ─── Header ──────────────────────────────────────────────────────────────────

function drawHeader(
  doc: PDFKit.PDFDocument,
  user: UserProfile,
  type: 'grocery' | 'workout' | 'meal',
  logoPath?: string,
) {
  doc.save()
    .rect(0, 0, PAGE.width, 110)
    .fill(BRAND.primary)
    .restore();

  if (logoPath) {
    try {
      doc.image(logoPath, PAGE.margins.left, 18, { height: 40, fit: [120, 40] });
    } catch {
      drawBrandText(doc, PAGE.margins.left, 22);
    }
  } else {
    drawBrandText(doc, PAGE.margins.left, 22);
  }

  doc.font('Helvetica-Bold')
    .fontSize(18)
    .fillColor(BRAND.white)
    .text(getPDFTitle(type), PAGE.margins.left, 30, {
      width: CONTENT_WIDTH,
      align: 'right',
    });

  const userInfo = `${user.name}  |  ${user.email}`;
  const isAr = hasArabic(userInfo);
  doc.font(pickFont(userInfo))
    .fontSize(9)
    .fillColor(BRAND.accent)
    .text(userInfo, PAGE.margins.left, 72, {
      width: CONTENT_WIDTH,
      align: 'right',
      direction: isAr ? 'rtl' : 'ltr',
    } as any);

  doc.y = 118;
}

function drawBrandText(doc: PDFKit.PDFDocument, x: number, y: number) {
  doc.font('Helvetica-Bold')
    .fontSize(22)
    .fillColor(BRAND.white)
    .text('Njerka', x, y, { continued: true })
    .fillColor(BRAND.accent)
    .text('.fit');
}

function drawPageHeader(doc: PDFKit.PDFDocument, type: 'grocery' | 'workout' | 'meal') {
  doc.save()
    .rect(0, 0, PAGE.width, 28)
    .fill(BRAND.primary)
    .restore();

  doc.font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(BRAND.white)
    .text('Njerka.fit', PAGE.margins.left, 6);

  doc.font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(BRAND.white)
    .text(getPDFTitle(type), PAGE.margins.left, 6, {
      width: CONTENT_WIDTH,
      align: 'right',
    });

  doc.y = 38;
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function drawFooter(doc: PDFKit.PDFDocument, pageNum: number, totalPages: number) {
  const y = PAGE.height - 50;

  // Temporarily disable bottom margin to prevent PDFKit from triggering page breaks when drawing footer text
  const originalBottom = (doc as any).page.margins.bottom;
  (doc as any).page.margins.bottom = 0;

  doc.save()
    .rect(0, y - 10, PAGE.width, 60)
    .fill(BRAND.primary)
    .restore();

  doc.font('Helvetica')
    .fontSize(8)
    .fillColor(BRAND.white)
    .text(
      `(c) ${new Date().getFullYear()} Njerka.fit - All rights reserved. | njerka.fit`,
      PAGE.margins.left,
      y + 2,
      { width: CONTENT_WIDTH, align: 'center' },
    );

  doc.font('Helvetica')
    .fontSize(8)
    .fillColor(BRAND.accent)
    .text(
      `Page ${pageNum} of ${totalPages}`,
      PAGE.margins.left,
      y + 14,
      { width: CONTENT_WIDTH, align: 'center' },
    );

  // Restore the original bottom margin
  (doc as any).page.margins.bottom = originalBottom;
}

// ─── Shared Helpers ───────────────────────────────────────────────────────────

function drawDivider(doc: PDFKit.PDFDocument, color = BRAND.accent, yOffset = 0) {
  const y = doc.y + yOffset;
  doc.save()
    .moveTo(PAGE.margins.left, y)
    .lineTo(PAGE.width - PAGE.margins.right, y)
    .lineWidth(1.5)
    .strokeColor(color)
    .stroke()
    .restore();
  doc.y = y + 10;
}

function drawSectionTitle(doc: PDFKit.PDFDocument, title: string) {
  ensureSpace(doc, 30);
  const isAr = hasArabic(title);
  doc.font(pickFont(title, 'bold'))
    .fontSize(13)
    .fillColor(BRAND.primary)
    .text(title, PAGE.margins.left, doc.y, {
      width: CONTENT_WIDTH,
      align: isAr ? 'right' : 'left',
      direction: isAr ? 'rtl' : 'ltr',
    } as any);
  doc.moveDown(0.2);
  drawDivider(doc, BRAND.secondary);
}

function drawNotes(doc: PDFKit.PDFDocument, notes: string) {
  ensureSpace(doc, 40);
  doc.moveDown(0.5);
  const noteText = `Notes: ${notes}`;
  const isAr = hasArabic(noteText);
  doc.font(pickFont(noteText, 'oblique'))
    .fontSize(9)
    .fillColor(BRAND.muted)
    .text(noteText, PAGE.margins.left, doc.y, {
      width: CONTENT_WIDTH,
      align: isAr ? 'right' : 'left',
      direction: isAr ? 'rtl' : 'ltr',
    } as any);
  doc.moveDown(0.5);
}

/**
 * FIX: The bottom boundary must account for the footer height (50px) so content
 * never overlaps the footer bar — and never triggers a spurious new page too early.
 * Old value was PAGE.margins.bottom (80), but footer starts at PAGE.height - 50,
 * so the real safe bottom is PAGE.height - 60 (a small buffer above the footer).
 */
function ensureSpace(doc: PDFKit.PDFDocument, needed: number) {
  const safeBottom = PAGE.height - 60; // 60px from bottom = just above footer bar
  if (doc.y + needed > safeBottom) {
    doc.addPage();
    doc.y = PAGE.margins.top;
  }
}

// ─── Table Engine ─────────────────────────────────────────────────────────────

interface ColDef {
  header: string;
  width: number;
  align?: 'left' | 'right' | 'center';
}

function drawTable(
  doc: PDFKit.PDFDocument,
  columns: ColDef[],
  rows: string[][],
  rowHeight = 22,
) {
  const tableWidth = columns.reduce((s, c) => s + c.width, 0);
  const startX = PAGE.margins.left;

  const drawHeaderRow = () => {
    ensureSpace(doc, rowHeight + 6);
    let x = startX;
    const hdrY = doc.y;

    doc.save()
      .rect(startX, hdrY, tableWidth, rowHeight)
      .fill(BRAND.tableHeader)
      .restore();

    columns.forEach((col) => {
      const headerText = col.header || '';
      doc.font(pickFont(headerText, 'bold'))
        .fontSize(9)
        .fillColor(BRAND.white)
        .text(headerText, x + 5, hdrY + 7, {
          width: col.width - 10,
          align: col.align ?? 'left',
          lineBreak: false,
        });
      x += col.width;
    });

    doc.y = hdrY + rowHeight;
  };

  // ── Draw initial header row ──
  drawHeaderRow();

  // ── Data rows ──
  rows.forEach((row, rowIdx) => {
    const isAlt = rowIdx % 2 === 0;
    const rowY = doc.y;

    // Measure max line height for this row
    let maxLines = 1;
    row.forEach((cell, ci) => {
      const col = columns[ci];
      if (!col) return;
      const lines = Math.ceil(
        doc.font(pickFont(String(cell ?? ''))).fontSize(8).widthOfString(String(cell ?? '')) /
        (col.width - 12),
      );
      if (lines > maxLines) maxLines = lines;
    });
    const cellHeight = Math.max(rowHeight, maxLines * 11 + 8);

    const pageBefore = doc.bufferedPageRange().count;
    ensureSpace(doc, cellHeight);

    // Redraw table header if a page break occurred
    if (doc.bufferedPageRange().count > pageBefore) {
      drawHeaderRow();
    }

    const actualY = doc.y;

    doc.save()
      .rect(startX, actualY, tableWidth, cellHeight)
      .fill(isAlt ? BRAND.tableRow : BRAND.tableRowAlt)
      .restore();

    doc.save()
      .moveTo(startX, actualY + cellHeight)
      .lineTo(startX + tableWidth, actualY + cellHeight)
      .lineWidth(0.4)
      .strokeColor(BRAND.border)
      .stroke()
      .restore();

    let x = startX;
    row.forEach((cell, ci) => {
      const col = columns[ci];
      if (!col) return;
      const cellText = String(cell ?? '-');
      const isAr = hasArabic(cellText);
      const cellAlign = isAr && col.align === 'left' ? 'right' : col.align ?? 'left';
      doc.font(pickFont(cellText))
        .fontSize(8.5)
        .fillColor(BRAND.text)
        .text(cellText, x + 5, actualY + 6, {
          width: col.width - 10,
          align: cellAlign,
          direction: isAr ? 'rtl' : 'ltr',
          height: cellHeight - 8,
        } as any);
      x += col.width;
    });

    doc.y = actualY + cellHeight;
  });

  doc.moveDown(1);
}

// ─── Grocery Body ─────────────────────────────────────────────────────────────

function drawGroceryBody(doc: PDFKit.PDFDocument, data: IGroceryList) {
  const genText = `Generated on: ${new Date().toLocaleDateString()}`;
  doc.font(pickFont(genText))
    .fontSize(9)
    .fillColor(BRAND.muted)
    .text(genText, PAGE.margins.left, doc.y, {
      width: CONTENT_WIDTH,
      align: 'right',
    });
  doc.moveDown(0.5);

  const byCategory = data.items.reduce<Record<string, typeof data.items[0][]>>((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {});

  Object.entries(byCategory).forEach(([category, items]) => {
    drawSectionTitle(doc, `  ${category}`);

    const cols: ColDef[] = [
      { header: 'Item', width: 250 },
      { header: 'Quantity', width: 80, align: 'center' },
      { header: 'Unit', width: 80, align: 'center' },
      { header: '\u2713', width: 85, align: 'center' },
    ];

    const rows = items.map((item) => [
      item.name,
      String(item.totalQuantity),
      item.unit,
      '',
    ]);

    drawTable(doc, cols, rows);
  });
}

// ─── Meal Plan Body ───────────────────────────────────────────────────────────

function drawMealBody(doc: PDFKit.PDFDocument, data: INutritionPlan) {
  const dateText = `Date: ${new Date(data.date).toLocaleDateString()}  |  Daily Target: ${data.targetMacros?.calories ?? 0} kcal`;
  doc.font(pickFont(dateText))
    .fontSize(9)
    .fillColor(BRAND.muted)
    .text(dateText, PAGE.margins.left, doc.y, {
      width: CONTENT_WIDTH, align: 'right',
    });
  doc.moveDown(0.5);

  const mealsByDay = data.meals.reduce<Record<string, typeof data.meals>>((acc, meal) => {
    (acc[meal.day] = acc[meal.day] || []).push(meal);
    return acc;
  }, {});

  Object.entries(mealsByDay).forEach(([day, meals]) => {
    drawSectionTitle(doc, `  ${day}`);

    let totalCals = 0, totalPro = 0, totalCarb = 0, totalFat = 0;

    meals.forEach((meal) => {
      totalCals += meal.macros.calories;
      totalPro += meal.macros.protein;
      totalCarb += meal.macros.carbs;
      totalFat += meal.macros.fats;

      ensureSpace(doc, 28);

      const mealNameText = `${meal.name} (${meal.time})`;
      const isMealAr = hasArabic(mealNameText);
      doc.font(pickFont(mealNameText, 'bold'))
        .fontSize(10)
        .fillColor(BRAND.primary)
        .text(mealNameText, PAGE.margins.left, doc.y, {
          width: CONTENT_WIDTH,
          align: isMealAr ? 'right' : 'left',
          direction: isMealAr ? 'rtl' : 'ltr',
        } as any);

      doc.font('Helvetica')
        .fontSize(8.5)
        .fillColor(BRAND.text)
        .text(
          `Calories: ${meal.macros.calories} kcal  |  Protein: ${meal.macros.protein}g  |  Carbs: ${meal.macros.carbs}g  |  Fats: ${meal.macros.fats}g`,
          PAGE.margins.left + 10,
          doc.y + 2,
          { width: CONTENT_WIDTH - 10 },
        );

      if (meal.ingredients && meal.ingredients.length > 0) {
        ensureSpace(doc, 14 + meal.ingredients.length * 11);
        doc.font('Helvetica-Oblique')
          .fontSize(8.5)
          .fillColor(BRAND.muted)
          .text('Ingredients:', PAGE.margins.left + 10, doc.y + 2, { width: CONTENT_WIDTH - 10 });

        meal.ingredients.forEach((ing) => {
          ensureSpace(doc, 12);
          const label = `  \u2022 ${ing.name}${ing.quantity ? ' - ' + ing.quantity : ''}${ing.unit ? ' ' + ing.unit : ''}`;
          const isIngAr = hasArabic(label);
          doc.font(pickFont(label))
            .fontSize(8.5)
            .fillColor(BRAND.text)
            .text(label, PAGE.margins.left + 20, doc.y, {
              width: CONTENT_WIDTH - 20,
              align: isIngAr ? 'right' : 'left',
              direction: isIngAr ? 'rtl' : 'ltr',
            } as any);
        });
      }

      doc.moveDown(0.3);
    });

    ensureSpace(doc, 18);
    drawDivider(doc, BRAND.secondary);
    doc.font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(BRAND.primary)
      .text(
        `Daily Total: ${totalCals} kcal  |  Protein: ${totalPro}g  |  Carbs: ${totalCarb}g  |  Fats: ${totalFat}g`,
        PAGE.margins.left,
        doc.y,
        { width: CONTENT_WIDTH },
      );
    doc.moveDown(0.5);
  });
}

// ─── Workout Body ─────────────────────────────────────────────────────────────

function drawWorkoutBody(doc: PDFKit.PDFDocument, data: IWeeklyFitnessPlan) {
  const weekText = `Week: ${new Date(data.startDate).toLocaleDateString()} - ${new Date(data.endDate).toLocaleDateString()}`;
  doc.font(pickFont(weekText))
    .fontSize(9)
    .fillColor(BRAND.muted)
    .text(weekText, PAGE.margins.left, doc.y, {
      width: CONTENT_WIDTH, align: 'right',
    });
  doc.moveDown(0.5);

  data.sessions.forEach((session) => {
    const sectionLabel = session.durationMin
      ? `${session.dayOfWeek} - ${session.name} (${session.type})  (${session.durationMin} min)`
      : `${session.dayOfWeek} - ${session.name} (${session.type})`;

    drawSectionTitle(doc, sectionLabel);

    const cols: ColDef[] = [
      { header: 'Exercise', width: 185 },
      { header: 'Sets', width: 55, align: 'center' },
      { header: 'Reps', width: 70, align: 'center' },
      { header: 'Duration', width: 70, align: 'center' },
      { header: 'Notes', width: 115 },
    ];

    const rows = session.exercises.map((ex) => [
      ex.name,
      String(ex.sets || '-'),
      ex.reps || '-',
      ex.durationMin ? `${ex.durationMin} min` : '-',
      '-',
    ]);

    drawTable(doc, cols, rows);
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPDFTitle(type: 'grocery' | 'workout' | 'meal'): string {
  return { grocery: 'Grocery List', workout: 'Workout Plan', meal: 'Diet & Nutrition Plan' }[type];
}