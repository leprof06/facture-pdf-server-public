import fs from "fs/promises";
import { google } from "googleapis";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 📁 Emplacements des fichiers nécessaires à l'authentification
const TOKEN_PATH = path.join(__dirname, "../../tokens/token.json");
const CREDENTIALS_PATH = path.join(__dirname, "../../config/credentials.json");

export async function authorizeGoogleCalendar() {
  const credentials = JSON.parse(await fs.readFile(CREDENTIALS_PATH, "utf-8"));
  const token = JSON.parse(await fs.readFile(TOKEN_PATH, "utf-8"));

  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

  const auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  auth.setCredentials(token);

  return auth;
}
