// 📁 utils/pdf.js
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { factureTemplate } from "../templates/facture-template.js";
import { enqueuePDF } from "./pdfQueue.js";

export async function generatePDFBuffer(factureData) {
  return enqueuePDF(async () => {
    const html = factureTemplate
      .replaceAll("{{numero}}", factureData.numero)
      .replaceAll("{{date_emission}}", factureData.date_emission)
      .replaceAll("{{date_echeance}}", factureData.date_echeance)
      .replaceAll("{{client_nom}}", factureData.client_nom)
      .replaceAll("{{client_adresse}}", factureData.client_adresse)
      .replaceAll("{{prix}}", factureData.prix)
      .replaceAll("{{prixUnitaire}}", factureData.prixUnitaire)
      .replaceAll("{{quantite}}", factureData.quantite)
      .replaceAll("{{description}}", factureData.description);

    // ✅ Récupérer le binaire Chromium packagé pour Vercel
    const executablePath = await chromium.executablePath();

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, {
        waitUntil: ["load", "domcontentloaded", "networkidle0"],
      });

      const buffer = await page.pdf({
        format: "A4",
        printBackground: true,
      });

      return buffer;
    } finally {
      await browser.close().catch(() => {});
    }
  });
}
