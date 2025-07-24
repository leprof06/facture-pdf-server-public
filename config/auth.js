// /config/auth.js
import { google } from "googleapis";

export async function authorizeGoogle() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_RAW;

  if (!raw) {
    throw new Error("❌ GOOGLE_SERVICE_ACCOUNT_JSON_RAW n'est pas défini !");
  }

  const credentials = JSON.parse(raw);
  const scopes = ["https://www.googleapis.com/auth/spreadsheets"];

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes,
  });

  return await auth.getClient();
}

export const SPREADSHEET_ID = "1EDW7_34dnjCHBtqd4jXrYgOB8HovgPdXcuod1k3_i4A";
export const SHEET_NAME = "Clients";
