// /config/googleSheetsClient.js
import { google } from "googleapis";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CREDENTIALS_PATH = path.join(__dirname, "google-service-account.json");

export async function getAuthClient() {
  const credentials = JSON.parse(await readFile(CREDENTIALS_PATH, "utf-8"));

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return auth.getClient();
}

export async function getSheetsInstance() {
  const authClient = await getAuthClient();
  return google.sheets({ version: "v4", auth: authClient });
}
