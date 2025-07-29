// ✅ /utils/google/decrementCredits.js

import { google } from "googleapis";
import { authorizeGoogle, SPREADSHEET_ID } from "../../config/auth.js";

const RANGE = "Clients!A2:G"; // On lit tout le tableau

export async function decrementCredits(email) {
  const auth = await authorizeGoogle();
  const sheets = google.sheets({ version: "v4", auth });

  // 1. Lecture des données actuelles
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
  });

  const rows = res.data.values;
  if (!rows || rows.length === 0) {
    console.warn("📭 Aucun client trouvé dans la feuille.");
    return;
  }

  // 2. Trouver la ligne correspondante à l’email
  const rowIndex = rows.findIndex((row) => {
    const emailCell = row[1]?.toLowerCase().trim() || "";
    return emailCell === email.toLowerCase().trim();
  });

  if (rowIndex === -1) {
    console.warn(`📭 Client avec l'email "${email}" non trouvé.`);
    return;
  }

  const ligne = rows[rowIndex];
  const currentCredits = parseInt(ligne[6] || "0", 10); // Colonne G (index 6)
  const updatedCredits = currentCredits > 0 ? currentCredits - 1 : 0;

  // 3. Mise à jour de la cellule correspondante (G = colonne 7)
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Clients!G${rowIndex + 2}`, // +2 car A2 = ligne 2
    valueInputOption: "RAW",
    requestBody: {
      values: [[updatedCredits]],
    },
  });

  console.log(`🔄 Crédit mis à jour pour ${email} : ${currentCredits} → ${updatedCredits}`);
}
