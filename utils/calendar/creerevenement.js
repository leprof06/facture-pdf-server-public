// /utils/calendar/creerevenement.js
import { google } from "googleapis";
import { authorizeGoogle } from "../../config/auth.js";

export async function creerEvenementCalendrier(facture) {
  const auth = await authorizeGoogle();
  const calendar = google.calendar({ version: "v3", auth });

  const startTime = new Date();
  startTime.setDate(startTime.getDate() + 1); // 24h après paiement
  startTime.setHours(10, 0, 0); // 10h00 par défaut

  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + 50); // Durée : 50 min

  const emails = facture.client_email.split(',').map(e => e.trim());
  const attendees = emails.map(email => ({ email }));

  const event = {
    summary: `Cours avec ${facture.client_nom}`,
    description: `Réservation suite à l'achat Stripe. Produit : ${facture.description}`,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: "Europe/Paris",
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: "Europe/Paris",
    },
    attendees,
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: event,
    conferenceDataVersion: 1,
    sendUpdates: "all",
  });

  console.log("📅 Événement créé avec lien Meet :", response.data.htmlLink);
  return response.data;
}
