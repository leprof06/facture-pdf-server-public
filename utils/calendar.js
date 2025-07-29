import fs from "fs";
import path from "path";
import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const TOKEN_PATH = path.join("tokens", "token.json");

export async function authorizeGoogleCalendar() {
  const credentials = {
    installed: {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uris: ["votre server/oauth2callback"]
    }
  };

  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Vérifier s'il existe déjà un token
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  }

  // Sinon, générer une URL pour autoriser
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Autorise cette application ici :", authUrl);
  throw new Error("OAuth non encore autorisé. Clique sur l’URL ci-dessus et copie le code.");
}

export async function createCalendarEvent({ auth, summary, description, startTime, endTime }) {
  const calendar = google.calendar({ version: "v3", auth });

  const event = {
    summary,
    description,
    start: {
      dateTime: startTime,
      timeZone: "Europe/Paris", //mettre votre time zone programmer pour la France
    },
    end: {
      dateTime: endTime,
      timeZone: "Europe/Paris", //mettre votre time zone programmer pour la France
    },
  };

  const response = await calendar.events.insert({
    calendarId: "primary",
    resource: event,
  });

  console.log("📅 Événement ajouté :", response.data.htmlLink);
  return response.data;
}
