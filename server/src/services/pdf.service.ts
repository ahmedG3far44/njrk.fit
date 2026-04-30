import PDFDocument from 'pdfkit';

type GroceryPDFData = {
  title?: string;
  generatedAt?: Date;
  items: Array<{
    name: string;
    category: string;
    quantity: string;
    checked?: boolean;
  }>;
};

type WorkoutPDFData = {
  title?: string;
  generatedAt?: Date;
  sessions: Array<{
    dayLabel: string;
    name: string;
    type: string;
    durationMin: number;
    estimatedCaloriesBurn?: number;
    isCompleted?: boolean;
    exercises: Array<{
      name: string;
      sets?: number;
      reps?: string;
      durationMin?: number;
      isCompleted?: boolean;
    }>;
  }>;
};

type SchedulePDFData = {
  title?: string;
  generatedAt?: Date;
  dateLabel: string;
  timeline: Array<{
    type: 'meal' | 'workout';
    name: string;
    time: string;
    details: Record<string, any>;
  }>;
};

type NutritionPDFData = {
  title?: string;
  generatedAt?: Date;
  view: 'day' | 'week';
  days: Array<{
    dayLabel: string;
    meals: Array<{
      name: string;
      time: string;
      macros?: {
        calories?: number;
        protein?: number;
        carbs?: number;
        fats?: number;
      };
      ingredients?: string[];
      instructions?: string[];
    }>;
  }>;
};

// 1. ضفنا نوع البيانات حق التقرير (Progress)
type ProgressPDFData = {
  title?: string;
  generatedAt?: Date | string;
  items: Array<{
    date: string;
    weight: string;
    bodyFat: string;
    muscleMass: string;
    notes: string;
  }>;
};

// 2. سجلنا النوع هنا عشان TypeScript ما يزعل
type PDFPayloadMap = {
  grocery: GroceryPDFData;
  workout: WorkoutPDFData;
  schedule: SchedulePDFData;
  nutrition: NutritionPDFData;
  progress: ProgressPDFData; 
};

const ensureSpace = (doc: PDFKit.PDFDocument, minHeight = 50) => {
  if (doc.y > doc.page.height - doc.page.margins.bottom - minHeight) {
    doc.addPage();
  }
};

const printSectionTitle = (doc: PDFKit.PDFDocument, title: string) => {
  ensureSpace(doc, 40);
  doc
    .moveDown(0.5)
    .font('Helvetica-Bold')
    .fontSize(15)
    .fillColor('#111827')
    .text(title);
  doc.moveDown(0.35);
};

const printMetaLine = (doc: PDFKit.PDFDocument, label: string, value: string) => {
  ensureSpace(doc, 24);
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor('#374151')
    .text(`${label}: `, { continued: true })
    .font('Helvetica')
    .text(value);
};

const bulletLine = (doc: PDFKit.PDFDocument, text: string, indent = 16) => {
  ensureSpace(doc, 22);
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#1f2937')
    .text(`* ${text}`, { indent });
};

const renderGroceryPDF = (doc: PDFKit.PDFDocument, data: GroceryPDFData) => {
  const groupedItems = data.items.reduce<Record<string, GroceryPDFData['items']>>((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  Object.entries(groupedItems).forEach(([category, items]) => {
    printSectionTitle(doc, category);
    items.forEach((item) => {
      const status = item.checked ? '[x]' : '[ ]';
      bulletLine(doc, `${status} ${item.name} - ${item.quantity}`);
    });
  });
};

const renderWorkoutPDF = (doc: PDFKit.PDFDocument, data: WorkoutPDFData) => {
  if (data.sessions.length === 0) {
    bulletLine(doc, 'No workout sessions found for this export.');
    return;
  }

  data.sessions.forEach((session) => {
    printSectionTitle(doc, `${session.dayLabel} - ${session.name}`);
    printMetaLine(doc, 'Type', session.type);
    printMetaLine(doc, 'Duration', `${session.durationMin} min`);
    printMetaLine(
      doc,
      'Calories',
      session.estimatedCaloriesBurn ? `${session.estimatedCaloriesBurn} kcal` : 'Not set'
    );
    printMetaLine(doc, 'Completed', session.isCompleted ? 'Yes' : 'No');

    if (session.exercises.length > 0) {
      doc.moveDown(0.35);
      session.exercises.forEach((exercise) => {
        const parts = [exercise.name];
        if (exercise.sets) parts.push(`${exercise.sets} sets`);
        if (exercise.reps) parts.push(`${exercise.reps} reps`);
        if (exercise.durationMin) parts.push(`${exercise.durationMin} min`);
        if (exercise.isCompleted) parts.push('done');
        bulletLine(doc, parts.join(' | '));
      });
    } else {
      bulletLine(doc, 'No exercises listed.');
    }
  });
};

const renderSchedulePDF = (doc: PDFKit.PDFDocument, data: SchedulePDFData) => {
  printMetaLine(doc, 'Date', data.dateLabel);
  doc.moveDown(0.35);

  if (data.timeline.length === 0) {
    bulletLine(doc, 'No meals or workouts scheduled for this date.');
    return;
  }

  data.timeline.forEach((item) => {
    printSectionTitle(doc, `${item.time} - ${item.name}`);
    printMetaLine(doc, 'Type', item.type);

    if (item.type === 'meal') {
      const macros = item.details.macros;
      if (macros) {
        printMetaLine(
          doc,
          'Macros',
          `${macros.calories} kcal | P ${macros.protein}g | C ${macros.carbs}g | F ${macros.fats}g`
        );
      }
      const ingredients: string[] = item.details.ingredients || [];
      if (ingredients.length > 0) {
        doc.moveDown(0.35);
        ingredients.forEach((ingredient) => bulletLine(doc, ingredient));
      }
    }

    if (item.type === 'workout') {
      if (item.details.durationMin) {
        printMetaLine(doc, 'Duration', `${item.details.durationMin} min`);
      }
      if (item.details.estimatedCaloriesBurn) {
        printMetaLine(doc, 'Calories', `${item.details.estimatedCaloriesBurn} kcal`);
      }
      const exercises = item.details.exercises || [];
      if (exercises.length > 0) {
        doc.moveDown(0.35);
        exercises.forEach((exercise: any) => {
          const summary = [exercise.name, exercise.sets && `${exercise.sets} sets`, exercise.reps];
          bulletLine(doc, summary.filter(Boolean).join(' | '));
        });
      }
    }
  });
};

const renderNutritionPDF = (doc: PDFKit.PDFDocument, data: NutritionPDFData) => {
  printMetaLine(doc, 'View', data.view === 'day' ? 'Daily plan' : 'Weekly plan');
  doc.moveDown(0.35);

  if (data.days.length === 0) {
    bulletLine(doc, 'No meals found for this export.');
    return;
  }

  data.days.forEach((day) => {
    printSectionTitle(doc, day.dayLabel);

    if (day.meals.length === 0) {
      bulletLine(doc, 'No meals scheduled.');
      return;
    }

    day.meals.forEach((meal) => {
      printSectionTitle(doc, `${meal.time} - ${meal.name}`);
      if (meal.macros) {
        printMetaLine(
          doc,
          'Macros',
          `${meal.macros.calories || 0} kcal | P ${meal.macros.protein || 0}g | C ${meal.macros.carbs || 0}g | F ${meal.macros.fats || 0}g`
        );
      }
      if (meal.ingredients && meal.ingredients.length > 0) {
        doc.moveDown(0.35);
        meal.ingredients.forEach((ingredient) => bulletLine(doc, ingredient));
      }
    });
  });
};

// 3. هذي الدالة الجديدة اللي ترسم بيانات الـ Progress في الـ PDF
const renderProgressPDF = (doc: PDFKit.PDFDocument, data: ProgressPDFData) => {
  if (data.items.length === 0) {
    bulletLine(doc, 'No progress logs found.');
    return;
  }

  data.items.forEach((item) => {
    printSectionTitle(doc, `Date: ${item.date}`);
    printMetaLine(doc, 'Weight', item.weight);
    printMetaLine(doc, 'Body Fat', item.bodyFat);
    printMetaLine(doc, 'Muscle Mass', item.muscleMass);

    if (item.notes) {
      doc.moveDown(0.35);
      bulletLine(doc, `Notes: ${item.notes}`);
    }
  });
};

export const generatePDF = async <T extends keyof PDFPayloadMap>(
  type: T,
  data: PDFPayloadMap[T]
): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      info: {
        Title: data.title || `${type} export`,
      },
    });

    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc
      .font('Helvetica-Bold')
      .fontSize(22)
      .fillColor('#111827')
      .text(data.title || `${type} export`, { align: 'left' });

    printMetaLine(
      doc,
      'Generated',
      (data.generatedAt ? new Date(data.generatedAt) : new Date()).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    );

    doc.moveDown();

    // 4. ضفنا الـ Progress في جملة الـ if عشان يشتغل
    if (type === 'grocery') {
      renderGroceryPDF(doc, data as GroceryPDFData);
    } else if (type === 'workout') {
      renderWorkoutPDF(doc, data as WorkoutPDFData);
    } else if (type === 'nutrition') {
      renderNutritionPDF(doc, data as NutritionPDFData);
    } else if (type === 'progress') {
      renderProgressPDF(doc, data as ProgressPDFData);
    } else {
      renderSchedulePDF(doc, data as SchedulePDFData);
    }

    doc.end();
  });