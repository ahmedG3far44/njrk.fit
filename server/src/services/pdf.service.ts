import PDFKit from 'pdfkit';


const document = new PDFKit()

export const generatePDF = async (type: 'grocery' | 'workout' | 'meal', data: any) => {
  // return pdf template based on type 
}
