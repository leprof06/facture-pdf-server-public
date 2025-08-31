// 📁 /config/auth.js
import fs from "fs";
import path from "path";
import { google } from "googleapis";

// 📌 Chargement dynamique du fichier JSON local (même dossier que ce fichier)
const jsonPath = path.resolve("config", "agenda-auto-reservations-f2291e47889f.json");
const credentials = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

// 🧾 ID de la feuille Google Sheets
export const SPREADSHEET_ID = "***";

// ✅ Fonction unique d’authentification à Google API
export async function authorizeGoogle() {
  const auth = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    [
      "https://www.googleapis.com/auth/spreadsheets",        // accès Google Sheets
      "https://www.googleapis.com/auth/calendar",            // accès Google Calendar
      "https://www.googleapis.com/auth/drive.metadata.readonly", // accès aux métadonnées Google Drive
    ]
  );
  return auth;
}

