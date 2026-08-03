import PDFDocument from 'pdfkit';

export class PDFExporter {
  async export(data: any[], title: string = 'Report'): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text(title, { align: 'center' });
      doc.moveDown();

      // Table headers
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        const tableTop = 150;
        const rowHeight = 25;
        const colWidth = (doc.page.width - 100) / headers.length;

        doc.fontSize(12);
        headers.forEach((header, i) => {
          doc.text(header, 50 + i * colWidth, tableTop, { width: colWidth, align: 'left' });
        });

        // Rows
        let y = tableTop + rowHeight;
        data.forEach((row) => {
          headers.forEach((header, i) => {
            doc.text(String(row[header] || ''), 50 + i * colWidth, y, { width: colWidth, align: 'left' });
          });
          y += rowHeight;
          if (y > doc.page.height - 50) {
            doc.addPage();
            y = 50;
          }
        });
      }

      doc.end();
    });
  }
}
