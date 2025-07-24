// utils/google/auth.js
import { google } from 'googleapis';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/calendar'
];

export async function auth() {
  const credentialsPath = path.join(__dirname, '../../tokens/credentials.json');
  const tokenPath = path.join(__dirname, '../../tokens/token.json');

  const content = await readFile(credentialsPath, 'utf8');
  const credentials = JSON.parse(content);
  const { client_secret, client_id, redirect_uris } = credentials.installed;

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  const token = await readFile(tokenPath, 'utf8');
  oAuth2Client.setCredentials(JSON.parse(token));

  return oAuth2Client;
}