import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import { IWeeklyFitnessPlan } from '../models/fitness.model';
import { IGroceryList } from '../models/groceryList.model';
import { INutritionPlan } from '../models/nutrition.model';
import { IUser } from '../models/user.model';
import { formatQuantity } from '../utils/unitConverter';

const BRAND = {
  primary: '#2D6A4F',
  secondary: '#40916C',
  accent: '#74C69D',
  light: '#D8F3DC',
  text: '#1B1B1B',
  muted: '#6B7280',
  white: '#FFFFFF',
  row: '#F0FDF4',
  border: '#D1FAE5',
};

const PAGE = {
  width: 595.28,
  height: 841.89,
  margins: { top: 60, bottom: 70, left: 50, right: 50 },
};

const CONTENT_WIDTH = PAGE.width - PAGE.margins.left - PAGE.margins.right;
const SAFE_BOTTOM = PAGE.height - PAGE.margins.bottom;

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
      autoFirstPage: true,
      bufferPages: false,
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

    drawHeader(doc, user, type, logoPath);

    if (type === 'grocery') drawGroceryBody(doc, data as IGroceryList);
    if (type === 'workout') drawWorkoutBody(doc, data as IWeeklyFitnessPlan);
    if (type === 'meal') drawMealBody(doc, data as INutritionPlan);

    doc.end();
  });
};

function drawHeader(
  doc: PDFKit.PDFDocument,
  user: IUser,
  type: 'grocery' | 'workout' | 'meal',
  logoPath?: string,
) {
  doc.save().rect(0, 0, PAGE.width, 105).fill(BRAND.primary).restore();

  if (logoPath) {
    try {
      doc.image(logoPath, PAGE.margins.left, 20, { height: 38, fit: [120, 38] });
    } catch {
      drawBrandText(doc);
    }
  } else {
    drawBrandText(doc);
  }

  doc.font('Helvetica-Bold')
    .fontSize(20)
    .fillColor(BRAND.white)
    .text(getPDFTitle(type), PAGE.margins.left, 28, {
      width: CONTENT_WIDTH,
      align: 'right',
    });

  doc.font('Helvetica')
    .fontSize(9)
    .fillColor(BRAND.accent)
    .text(`${user.name}  |  ${user.email}`, PAGE.margins.left, 70, {
      width: CONTENT_WIDTH,
      align: 'right',
    });

  doc.y = 128;
}

function drawBrandText(doc: PDFKit.PDFDocument) {
  doc.font('Helvetica-Bold')
    .fontSize(22)
    .fillColor(BRAND.white)
    .text('Njerka', PAGE.margins.left, 26, { continued: true })
    .fillColor(BRAND.accent)
    .text('.fit');
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number) {
  if (doc.y + needed <= SAFE_BOTTOM) return;
  doc.addPage();
  doc.y = PAGE.margins.top;
}

function drawGeneratedDate(doc: PDFKit.PDFDocument, label = 'Generated on') {
  doc.font('Helvetica')
    .fontSize(9)
    .fillColor(BRAND.muted)
    .text(`${label}: ${new Date().toLocaleDateString()}`, PAGE.margins.left, doc.y, {
      width: CONTENT_WIDTH,
      align: 'right',
    });
  doc.moveDown(0.7);
}

function drawGroceryBody(doc: PDFKit.PDFDocument, data: IGroceryList) {
  drawGeneratedDate(doc);

  const byCategory = data.items.reduce<Record<string, typeof data.items>>((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {});

  Object.entries(byCategory).forEach(([category, items], index) => {
    if (index > 0) doc.moveDown(0.3);
    drawGrocerySection(doc, category, items);
  });
}

function drawGrocerySection(
  doc: PDFKit.PDFDocument,
  category: string,
  items: IGroceryList['items'],
) {
  ensureSpace(doc, 26);

  const sectionY = doc.y;
  doc.save()
    .roundedRect(PAGE.margins.left, sectionY, CONTENT_WIDTH, 18, 4)
    .fill(BRAND.light)
    .restore();

  doc.font('Helvetica-Bold')
    .fontSize(9.5)
    .fillColor(BRAND.primary)
    .text(category, PAGE.margins.left + 8, sectionY + 4, {
      width: CONTENT_WIDTH - 16,
      lineBreak: false,
    });

  doc.y = sectionY + 22;

  items.forEach((item) => {
    ensureSpace(doc, 15);
    const rowY = doc.y;
    const quantity = formatQuantity(Number(item.totalQuantity), item.unit);

    doc.save()
      .rect(PAGE.margins.left + 2, rowY + 2, 8, 8)
      .lineWidth(0.8)
      .strokeColor(BRAND.secondary)
      .stroke()
      .restore();

    doc.font('Helvetica')
      .fontSize(8.5)
      .fillColor(BRAND.text)
      .text(item.name, PAGE.margins.left + 18, rowY, {
        width: CONTENT_WIDTH - 125,
        height: 12,
        lineBreak: false,
        ellipsis: true,
      });

    doc.font('Helvetica-Bold')
      .fontSize(8.5)
      .fillColor(BRAND.primary)
      .text(quantity, PAGE.width - PAGE.margins.right - 95, rowY, {
        width: 95,
        align: 'right',
        lineBreak: false,
      });

    doc.save()
      .moveTo(PAGE.margins.left, rowY + 13)
      .lineTo(PAGE.width - PAGE.margins.right, rowY + 13)
      .lineWidth(0.25)
      .strokeColor('#E5E7EB')
      .stroke()
      .restore();

    doc.y = rowY + 15;
  });
}

function drawMealBody(doc: PDFKit.PDFDocument, data: INutritionPlan) {
  doc.font('Helvetica')
    .fontSize(9)
    .fillColor(BRAND.muted)
    .text(
      `Date: ${new Date(data.date).toLocaleDateString()}  |  Daily Target: ${data.targetMacros?.calories ?? 0} kcal`,
      PAGE.margins.left,
      doc.y,
      { width: CONTENT_WIDTH, align: 'right' },
    );
  doc.moveDown(0.8);

  const mealsByDay = data.meals.reduce<Record<string, typeof data.meals>>((acc, meal) => {
    (acc[meal.day] = acc[meal.day] || []).push(meal);
    return acc;
  }, {});

  Object.entries(mealsByDay).forEach(([day, meals]) => {
    drawSectionLabel(doc, day);
    meals.forEach((meal) => {
      ensureSpace(doc, 46);
      doc.font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(BRAND.primary)
        .text(`${meal.name} (${meal.time})`, PAGE.margins.left, doc.y, { width: CONTENT_WIDTH });
      doc.font('Helvetica')
        .fontSize(8.5)
        .fillColor(BRAND.text)
        .text(
          `Calories: ${meal.macros.calories} kcal  |  Protein: ${meal.macros.protein}g  |  Carbs: ${meal.macros.carbs}g  |  Fats: ${meal.macros.fats}g`,
          PAGE.margins.left + 10,
          doc.y + 2,
          { width: CONTENT_WIDTH - 10 },
        );
      doc.moveDown(0.35);
    });
  });
}

function drawWorkoutBody(doc: PDFKit.PDFDocument, data: IWeeklyFitnessPlan) {
  doc.font('Helvetica')
    .fontSize(9)
    .fillColor(BRAND.muted)
    .text(
      `Week: ${new Date(data.startDate).toLocaleDateString()} - ${new Date(data.endDate).toLocaleDateString()}`,
      PAGE.margins.left,
      doc.y,
      { width: CONTENT_WIDTH, align: 'right' },
    );
  doc.moveDown(0.8);

  data.sessions.forEach((session) => {
    drawSectionLabel(doc, `${session.dayOfWeek} - ${session.name} (${session.type})`);
    session.exercises.forEach((exercise) => {
      ensureSpace(doc, 18);
      doc.font('Helvetica')
        .fontSize(8.5)
        .fillColor(BRAND.text)
        .text(
          `${exercise.name}  |  Sets: ${exercise.sets || '-'}  |  Reps: ${exercise.reps || '-'}${exercise.durationMin ? `  |  ${exercise.durationMin} min` : ''}`,
          PAGE.margins.left + 10,
          doc.y,
          { width: CONTENT_WIDTH - 10 },
        );
    });
    doc.moveDown(0.5);
  });
}

function drawSectionLabel(doc: PDFKit.PDFDocument, label: string) {
  ensureSpace(doc, 26);
  const y = doc.y;
  doc.save()
    .roundedRect(PAGE.margins.left, y, CONTENT_WIDTH, 18, 4)
    .fill(BRAND.light)
    .restore();
  doc.font('Helvetica-Bold')
    .fontSize(9.5)
    .fillColor(BRAND.primary)
    .text(label, PAGE.margins.left + 8, y + 4, {
      width: CONTENT_WIDTH - 16,
      lineBreak: false,
      ellipsis: true,
    });
  doc.y = y + 23;
}

function getPDFTitle(type: 'grocery' | 'workout' | 'meal'): string {
  return {
    grocery: 'Grocery List',
    workout: 'Workout Plan',
    meal: 'Diet & Nutrition Plan',
  }[type];
}
