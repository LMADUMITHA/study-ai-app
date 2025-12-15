import express from "express";
import { PDFDocument, StandardFonts } from "pdf-lib";

const router = express.Router();

router.post("/export", async (req, res) => {
  try {
    const { content, title } = req.body;

    if (!content) {
      return res.status(400).json({ error: "No content provided" });
    }

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 12;

    // text wrapping
    const wrappedText = content.match(/.{1,90}/g) || [];

    let y = height - 50;
    wrappedText.forEach((line) => {
      page.drawText(line, { x: 40, y, size: fontSize, font });
      y -= 20;
    });

    const pdfBytes = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${title || "studyai"}-export.pdf"`);

    return res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error("PDF export error", err);
    res.status(500).json({ error: "PDF generation failed" });
  }
});

export default router;
