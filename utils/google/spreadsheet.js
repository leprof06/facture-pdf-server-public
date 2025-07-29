// ✅ fichier : utils/google/spreadsheet.js

import { google } from "googleapis";
import { authorizeGoogle, SPREADSHEET_ID } from "../../config/auth.js";

<<<<<<< HEAD
const CLIENTS_RANGE = "Clients!A2:G";
=======
const SPREADSHEET_ID = "...."; // Remplace par ton ID correct
const RANGE = "...";
>>>>>>> d6675144a9210805baf0dfa9aef50cc53424f788

// 🔍 Trouver un client par email
export async function findClientByEmail(email) {
  const auth = await authorizeGoogle();
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: CLIENTS_RANGE,
  });

  const rows = res.data.values;
  if (!rows) return null;

  const index = rows.findIndex((row) => row[1]?.split(',').map(e => e.trim()).includes(email));
  return index !== -1 ? { rowIndex: index + 2, data: rows[index] } : null;
}

// 🔁 Mise à jour d’un client existant
export async function updateClient(rowIndex, updatedData) {
  const auth = await authorizeGoogle();
  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Clients!A${rowIndex}:G${rowIndex}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [updatedData],
    },
  });
}

// ➕ Ajout d’un nouveau client
export async function addNewClient(data) {
  const auth = await authorizeGoogle();
  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: CLIENTS_RANGE,
    valueInputOption: "RAW",
    requestBody: {
      values: [data],
    },
  });
}

// 🔍 Trouver la ligne d’un client avec un produit spécifique
export async function getLigneClientParEmailEtProduit(auth, email, produit) {
  const sheets = google.sheets({ version: 'v4', auth });
  const range = "Clients!A2:G";
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });

  const lignes = response.data.values || [];
  for (let i = 0; i < lignes.length; i++) {
    const ligne = lignes[i];
    const emailCell = ligne[1]?.toLowerCase().trim();
    const produitCell = ligne[2]?.toLowerCase().trim();
    if (emailCell === email.toLowerCase() && produitCell.includes(produit.toLowerCase())) {
      return i + 2;
    }
  }

  return null;
}

// 📌 Lecture de l'onglet "Produits spéciaux"
export async function getProduitSpecial(auth, nomProduit) {
  const sheets = google.sheets({ version: 'v4', auth });
  const range = 'Produits spéciaux!A2:D';

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });

  const lignes = response.data.values || [];

  for (const [motCle, type, action, valeur] of lignes) {
    if (nomProduit.toLowerCase().includes(motCle.toLowerCase())) {
      return { type, action, valeur };
    }
  }

  return null;
}

// ✏️ Mise à jour d’une cellule spécifique
export async function updateCellule(auth, feuille, ligne, colonne, valeur) {
  const sheets = google.sheets({ version: 'v4', auth });

  const lettreColonne = String.fromCharCode(64 + colonne); // A = 1, B = 2, ...
  const cellule = `${feuille}!${lettreColonne}${ligne}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: cellule,
    valueInputOption: "RAW",
    requestBody: {
      values: [[valeur]],
    },
  });
}
