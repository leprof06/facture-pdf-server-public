// ✅ utils/google_sheets_utils.js — version complète et corrigée

import { google } from "googleapis";
import { authorizeGoogle, SPREADSHEET_ID } from "../config/auth.js";

/**
 * Exporte les données de la feuille "Clients"
 * @returns {Promise<Array<Array<string>>>}
 */
export async function exporterClients() {
  const auth = await authorizeGoogle();
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Clients!A2:G"
  });

  return res.data.values || [];
}

/**
 * Cherche une ligne client en fonction de son email
 * @param {string} email
 * @returns {Promise<{ rowIndex: number, data: string[] } | null>}
 */
export async function chercherClientParEmail(email) {
  const lignes = await exporterClients();

  const index = lignes.findIndex((row) => {
    const emailCell = row[1]?.toLowerCase().trim();
    return emailCell === email.toLowerCase().trim();
  });

  if (index !== -1) {
    return {
      rowIndex: index + 2,
      data: lignes[index]
    };
  }

  return null;
}

/**
 * Cherche un produit spécial dans l'onglet "Produits spéciaux"
 */
export async function getProduitSpecial(auth, nomProduit) {
  const sheets = google.sheets({ version: "v4", auth });
  const range = "Produits spéciaux!A2:D";
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });

  const lignes = res.data.values || [];
  for (const [motCle, type, action, valeur] of lignes) {
    if (nomProduit.toLowerCase().includes(motCle.toLowerCase())) {
      return { type, action, valeur };
    }
  }
  return null;
}

/**
 * Retourne le numéro de ligne du client selon l'e-mail et le produit dans l'onglet "Clients"
 */
export async function getLigneClientParEmailEtProduit(auth, email, produit) {
  const sheets = google.sheets({ version: "v4", auth });
  const range = "Clients!A2:D";
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });

  const lignes = res.data.values || [];
  for (let i = 0; i < lignes.length; i++) {
    const [nom, mail, prod, date] = lignes[i];
    if (
      mail?.toLowerCase().trim() === email.toLowerCase().trim() &&
      prod?.toLowerCase().trim() === produit.toLowerCase().trim()
    ) {
      return i + 2; // +2 car index 0 + entête
    }
  }
  return null;
}

/**
 * Met à jour une cellule donnée dans un onglet
 * @param ligne : numéro de ligne (à partir de 2)
 * @param colonne : numéro de colonne (A=1, B=2, ...)
 */
export async function updateCellule(auth, onglet, ligne, colonne, valeur) {
  const sheets = google.sheets({ version: "v4", auth });
  const lettreColonne = String.fromCharCode(64 + colonne);
  const range = `${onglet}!${lettreColonne}${ligne}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[valeur]],
    },
  });
}
