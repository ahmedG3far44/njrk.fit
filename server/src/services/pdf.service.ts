import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import { IWeeklyFitnessPlan } from '../models/fitness.model';
import { IGroceryList } from '../models/groceryList.model';
import { INutritionPlan } from '../models/nutrition.model';
import { IUser } from '../models/user.model';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserProfile {
  name: string;
  email: string;
  avatarPath?: string; // optional local path to user avatar
}

// ─── Constants ───────────────────────────────────────────────────────────────

const BRAND = {
  primary: '#2D6A4F',      // deep green
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

/**
 * Generates a branded PDF and returns it as a Buffer.
 * Usage in Express:
 *   const buffer = await generatePDF('meal', data, user);
 *   res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': '...' });
 *   res.send(buffer);
 */
export const generatePDF = (
  type: 'grocery' | 'workout' | 'meal',
  data: IWeeklyFitnessPlan | INutritionPlan | IGroceryList,
  user: IUser,
  logoPath?: string, // absolute path to logo PNG
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: PAGE.margins,
      bufferPages: true,
      info: {
        Title: getPDFTitle(type),
        Author: 'Njerka.fit',
        Creator: 'Njerka.fit Platform',
      },
    });

    const chunks: Buffer[] = [];
    const stream = new PassThrough();
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
    doc.pipe(stream);

    // ── Render ──────────────────────────────────────────────────────────────
    drawHeader(doc, user, type, logoPath);
    drawDivider(doc);

    const contentStartY = doc.y + 12;
    doc.y = contentStartY;

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

    // Footer on every page
    const totalPages = (doc.bufferedPageRange().count);
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
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
  const top = PAGE.margins.top - 20;

  // Background bar
  doc.save()
    .rect(0, 0, PAGE.width, 110)
    .fill(BRAND.primary)
    .restore();

  // Logo or brand name
  if (logoPath) {
    try {
      doc.image(logoPath, PAGE.margins.left, 18, { height: 40, fit: [120, 40] });
    } catch {
      drawBrandText(doc, PAGE.margins.left, 22);
    }
  } else {
    drawBrandText(doc, PAGE.margins.left, 22);
  }

  // PDF Title (right-aligned)
  const title = getPDFTitle(type);
  doc.font('Helvetica-Bold')
    .fontSize(18)
    .fillColor(BRAND.white)
    .text(title, PAGE.margins.left, 30, {
      width: CONTENT_WIDTH,
      align: 'right',
    });

  // User info row
  doc.font('Helvetica')
    .fontSize(9)
    .fillColor(BRAND.accent)
    .text(`${user.name}  ·  ${user.email}`, PAGE.margins.left, 72, {
      width: CONTENT_WIDTH,
      align: 'right',
    });

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

// ─── Footer ──────────────────────────────────────────────────────────────────

function drawFooter(doc: PDFKit.PDFDocument, pageNum: number, totalPages: number) {
  const y = PAGE.height - 50;

  doc.save()
    .rect(0, y - 10, PAGE.width, 60)
    .fill(BRAND.primary)
    .restore();

  doc.font('Helvetica')
    .fontSize(8)
    .fillColor(BRAND.white)
    .text(
      `© ${new Date().getFullYear()} Njerka.fit — All rights reserved. | njerka.fit`,
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
  ensureSpace(doc, 40);
  doc.font('Helvetica-Bold')
    .fontSize(13)
    .fillColor(BRAND.primary)
    .text(title, PAGE.margins.left, doc.y, { width: CONTENT_WIDTH });
  doc.moveDown(0.3);
  drawDivider(doc, BRAND.secondary);
}

function drawNotes(doc: PDFKit.PDFDocument, notes: string) {
  ensureSpace(doc, 40);
  doc.moveDown(0.5);
  doc.font('Helvetica-Oblique')
    .fontSize(9)
    .fillColor(BRAND.muted)
    .text(`📝 Notes: ${notes}`, PAGE.margins.left, doc.y, {
      width: CONTENT_WIDTH,
    });
  doc.moveDown(0.5);
}

/** Ensures there's enough vertical space, adds a new page if not */
function ensureSpace(doc: PDFKit.PDFDocument, needed: number) {
  if (doc.y + needed > PAGE.height - PAGE.margins.bottom - 50) {
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

  // ── Header row ──
  ensureSpace(doc, rowHeight + 6);
  let x = startX;
  const headerY = doc.y;

  doc.save()
    .rect(startX, headerY, tableWidth, rowHeight)
    .fill(BRAND.tableHeader)
    .restore();

  columns.forEach((col) => {
    doc.font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(BRAND.white)
      .text(col.header, x + 5, headerY + 7, {
        width: col.width - 10,
        align: col.align ?? 'left',
        lineBreak: false,
      });
    x += col.width;
  });

  doc.y = headerY + rowHeight;

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
        doc.font('Helvetica').fontSize(8).widthOfString(String(cell ?? '')) /
        (col.width - 12),
      );
      if (lines > maxLines) maxLines = lines;
    });
    const cellHeight = Math.max(rowHeight, maxLines * 11 + 8);

    ensureSpace(doc, cellHeight);
    const actualY = doc.y;

    // Row background
    doc.save()
      .rect(startX, actualY, tableWidth, cellHeight)
      .fill(isAlt ? BRAND.tableRow : BRAND.tableRowAlt)
      .restore();

    // Border bottom
    doc.save()
      .moveTo(startX, actualY + cellHeight)
      .lineTo(startX + tableWidth, actualY + cellHeight)
      .lineWidth(0.4)
      .strokeColor(BRAND.border)
      .stroke()
      .restore();

    // Cell content
    x = startX;
    row.forEach((cell, ci) => {
      const col = columns[ci];
      if (!col) return;
      doc.font('Helvetica')
        .fontSize(8.5)
        .fillColor(BRAND.text)
        .text(String(cell ?? '—'), x + 5, actualY + 6, {
          width: col.width - 10,
          align: col.align ?? 'left',
          height: cellHeight - 8,
        });
      x += col.width;
    });

    doc.y = actualY + cellHeight;
  });

  doc.moveDown(1);
}

// ─── Grocery Body ─────────────────────────────────────────────────────────────

function drawGroceryBody(doc: PDFKit.PDFDocument, data: IGroceryList) {
  // Meta info
  doc.font('Helvetica')
    .fontSize(9)
    .fillColor(BRAND.muted)
    .text(`Generated on: ${new Date().toLocaleDateString()}`, PAGE.margins.left, doc.y, {
      width: CONTENT_WIDTH,
      align: 'right',
    });
  doc.moveDown(0.5);

  // Group by category
  const byCategory = data.items.reduce<Record<string, typeof data.items[0][]>>((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {});

  Object.entries(byCategory).forEach(([category, items]) => {
    drawSectionTitle(doc, `🛒 ${category}`);

    const cols: ColDef[] = [
      { header: 'Item', width: 250 },
      { header: 'Quantity', width: 80, align: 'center' },
      { header: 'Unit', width: 80, align: 'center' },
      { header: '✓', width: 85, align: 'center' },
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
  // Plan meta
  doc.font('Helvetica')
    .fontSize(9)
    .fillColor(BRAND.muted)
    .text(
      `Date: ${new Date(data.date).toLocaleDateString()}  ·  Daily Target: ${data.targetMacros?.calories ?? 0} kcal`,
      PAGE.margins.left,
      doc.y,
      { width: CONTENT_WIDTH, align: 'right' },
    );
  doc.moveDown(0.5);

  // Group meals by day
  const mealsByDay = data.meals.reduce<Record<string, typeof data.meals>>((acc, meal) => {
    (acc[meal.day] = acc[meal.day] || []).push(meal);
    return acc;
  }, {});

  Object.entries(mealsByDay).forEach(([day, meals]) => {
    drawSectionTitle(doc, `🗓 ${day}`);

    const cols: ColDef[] = [
      { header: 'Meal', width: 150 },
      { header: 'Calories', width: 75, align: 'right' },
      { header: 'Protein (g)', width: 80, align: 'right' },
      { header: 'Carbs (g)', width: 80, align: 'right' },
      { header: 'Fat (g)', width: 75, align: 'right' },
      { header: 'Ingredients', width: 135 },
    ];

    let totalCals = 0, totalPro = 0, totalCarb = 0, totalFat = 0;

    const rows = meals.map((meal) => {
      totalCals += meal.macros.calories;
      totalPro += meal.macros.protein;
      totalCarb += meal.macros.carbs;
      totalFat += meal.macros.fats;

      return [
        meal.name,
        String(meal.macros.calories),
        String(meal.macros.protein),
        String(meal.macros.carbs),
        String(meal.macros.fats),
        meal.ingredients?.map(i => `${i.quantity} ${i.name}`).join(', ') ?? '—',
      ];
    });

    // Totals row
    rows.push([
      'DAILY TOTAL',
      String(totalCals),
      String(totalPro),
      String(totalCarb),
      String(totalFat),
      '',
    ]);

    drawTable(doc, cols, rows);
  });
}

// ─── Workout Body ─────────────────────────────────────────────────────────────

function drawWorkoutBody(doc: PDFKit.PDFDocument, data: IWeeklyFitnessPlan) {
  // Plan meta
  doc.font('Helvetica')
    .fontSize(9)
    .fillColor(BRAND.muted)
    .text(
      `Week: ${new Date(data.startDate).toLocaleDateString()} - ${new Date(data.endDate).toLocaleDateString()}`,
      PAGE.margins.left,
      doc.y,
      { width: CONTENT_WIDTH, align: 'right' },
    );
  doc.moveDown(0.5);

  data.sessions.forEach((session) => {
    const sectionLabel = session.durationMin
      ? `💪 ${session.dayOfWeek} — ${session.name} (${session.type})  (${session.durationMin} min)`
      : `💪 ${session.dayOfWeek} — ${session.name} (${session.type})`;

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
      String(ex.sets || '—'),
      ex.reps || '—',
      ex.durationMin ? `${ex.durationMin} min` : '—',
      '—', // no notes in IExercise
    ]);

    drawTable(doc, cols, rows);
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPDFTitle(type: 'grocery' | 'workout' | 'meal'): string {
  const map = {
    grocery: 'Grocery List',
    workout: 'Workout Plan',
    meal: 'Diet & Nutrition Plan',
  };
  return map[type];
}