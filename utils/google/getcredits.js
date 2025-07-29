// 📁 utils/google/getcredits.js


import { google } from "googleapis";
import { authorizeGoogle, SPREADSHEET_ID } from "../../config/auth.js";

const RANGE = "Tarifs!A2:B"; // Colonne A = prix, Colonne B = crédits

/**
 * Retourne le nombre de crédits correspondant à un prix donné
 * @param {number} montant
 * @returns {Promise<number>} crédits trouvés ou 0 si aucun prix ne correspond
 */
export async function getCreditsParMontant(montant) {
  const auth = await authorizeGoogle();
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
  });

  const lignes = res.data.values || [];

  for (const [prixStr, creditsStr] of lignes) {
    const prix = parseFloat(prixStr);
    if (Math.abs(montant - prix) < 0.01) {
      return parseInt(creditsStr);
    }
  }

  console.warn(`💸 Aucun crédit trouvé pour le prix ${montant}€.`);
  return 0;
}