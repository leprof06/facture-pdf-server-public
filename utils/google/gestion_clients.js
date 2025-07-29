// ✅ utils/google/gestion_clients.js – gestion CRM Google Sheets

import { google } from "googleapis";
import { authorizeGoogle } from "../../config/auth.js";

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const FEUILLE_CLIENTS = "Clients";
const FEUILLE_ACHATS = "Achats";
const FEUILLE_CREDITS = "Crédits";

// ➕ Ajoute un client s'il n'existe pas encore (email unique)
export async function ajouterClientSiNouveau(nom, email) {
  const auth = await authorizeGoogle();
  const sheets = google.sheets({ version: "v4", auth });
  const range = `${FEUILLE_CLIENTS}!A2:B`;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });

  const lignes = res.data.values || [];
  const existe = lignes.some(row => row[1]?.toLowerCase() === email.toLowerCase());

  if (!existe) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "RAW",
      requestBody: {
        values: [[nom, email]],
      },
    });
  }
}

// 🧾 Ajoute une ligne dans l'historique des achats
export async function ajouterLigneAchat({ nom, email, produit, date, quantite, prixUnitaire, prixTotal, credits = "" }) {
  const auth = await authorizeGoogle();
  const sheets = google.sheets({ version: "v4", auth });
  const range = `${FEUILLE_ACHATS}!A2:H`;

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "RAW",
    requestBody: {
      values: [[nom, email, produit, date, quantite, prixUnitaire, prixTotal, credits]],
    },
  });
}

// 🔁 Incrémente ou crée la ligne de crédits restants pour un client
export async function mettreAJourCreditsRestants(email, nom, creditsAAjouter) {
  const auth = await authorizeGoogle();
  const sheets = google.sheets({ version: "v4", auth });
  const range = `${FEUILLE_CREDITS}!A2:C`;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });

  const lignes = res.data.values || [];
  const index = lignes.findIndex(row => row[1]?.toLowerCase() === email.toLowerCase());

  if (index !== -1) {
    const ligneExistante = lignes[index];
    const ancienCredits = parseInt(ligneExistante[2] || "0", 10);
    const nouveauxCredits = ancienCredits + creditsAAjouter;
    const ligneFinale = `${FEUILLE_CREDITS}!A${index + 2}:C${index + 2}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: ligneFinale,
      valueInputOption: "RAW",
      requestBody: {
        values: [[nom, email, nouveauxCredits]],
      },
    });
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "RAW",
      requestBody: {
        values: [[nom, email, creditsAAjouter]],
      },
    });
  }
}
