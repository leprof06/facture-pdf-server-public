import express from "express";
import { generatePDFBuffer } from "../utils/pdf.js";

const router = express.Router();

router.post("/api/generate-pdf", async (req, res) => {
  try {
    const pdfBuffer = await generatePDFBuffer(req.body);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="facture.pdf"`,
    });
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).send("Erreur PDF : " + error.message);
  }
});

export default router;
