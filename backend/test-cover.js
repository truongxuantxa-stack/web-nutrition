const PDFDocument = require('pdfkit');

const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, left: 50, right: 50, bottom: 20 },
    bufferPages: true
});

let y = 790;
for (let i = 0; i < 5; i++) {
    doc.text(`Row ${i}`, 50, y, { width: 100 });
    console.log(`Pages after ${y}:`, doc.bufferedPageRange().count);
    y += 14;
}

doc.end();
