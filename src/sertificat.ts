// src/certificate.service.ts

import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

export function generateCertificate(name: string, filename: string): string {
  const dir = path.join(process.cwd(), 'certificates');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  const filePath = path.join(dir, `${filename}.pdf`);

  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(26).text('📜 Sertifikat', { align: 'center' });
  doc.moveDown();
  doc.fontSize(18).text(`Hurmatli ${name}, siz muvaffaqiyatli ro'yxatdan o'tdingiz!`, {
    align: 'center',
  });
  doc.moveDown();
  doc.fontSize(14).text(`Berilgan sana: ${new Date().toLocaleDateString()}`, {
    align: 'center',
  });

  doc.end();

  return filePath;
}
