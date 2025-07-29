// 📁 utils/pdf.js
import puppeteer from "puppeteer";
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

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const buffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();
    return buffer;
  });
}
