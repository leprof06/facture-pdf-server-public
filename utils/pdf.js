// utils/pdf.js

import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { factureTemplate } from "../templates/facture-template.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Génère un buffer PDF à partir des données de facture.
 */
export async function generatePDFBuffer({
  numero,
  date_emission,
  date_echeance,
  client_nom,
  client_adresse,
  prix,
  prixUnitaire,
  quantite,
  description,
}) {
  const html = factureTemplate
    .replaceAll("{{numero}}", numero)
    .replaceAll("{{date_emission}}", date_emission)
    .replaceAll("{{date_echeance}}", date_echeance)
    .replaceAll("{{client_nom}}", client_nom)
    .replaceAll("{{client_adresse}}", client_adresse)
    .replaceAll("{{prix}}", prix)
    .replaceAll("{{prixUnitaire}}", prixUnitaire)
    .replaceAll("{{quantite}}", quantite)
    .replaceAll("{{description}}", description);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const buffer = await page.pdf({ format: "A4", printBackground: true });
  await browser.close();

  return buffer;
}
