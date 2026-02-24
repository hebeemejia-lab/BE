const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');

// Exportar transacciones a PDF
async function exportPDF(req, res) {
  try {
    const transactions = await Transaction.find({ userId: req.usuario.id });
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="gastos-personales.pdf"');
    doc.pipe(res);
    doc.fontSize(18).text('Reporte de Gastos Personales', { align: 'center' });
    doc.moveDown();
    transactions.forEach(t => {
      doc.fontSize(12).text(`Tipo: ${t.type} | Categoría: ${t.category} | Monto: $${t.amount} | Fecha: ${t.date.toLocaleDateString()}`);
    });
    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Exportar transacciones a Excel
async function exportExcel(req, res) {
  try {
    const transactions = await Transaction.find({ userId: req.usuario.id });
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Gastos Personales');
    sheet.columns = [
      { header: 'Tipo', key: 'type', width: 15 },
      { header: 'Categoría', key: 'category', width: 20 },
      { header: 'Monto', key: 'amount', width: 15 },
      { header: 'Fecha', key: 'date', width: 20 }
    ];
    transactions.forEach(t => {
      sheet.addRow({
        type: t.type,
        category: t.category,
        amount: t.amount,
        date: t.date.toLocaleDateString()
      });
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="gastos-personales.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { exportPDF, exportExcel };