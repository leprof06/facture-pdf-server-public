// ✅ api/reserve-slot.js — version fusionnée avec logique métier (crédits + mails)

import express from "express";
import { authorizeGoogle } from "../config/auth.js";
import { google } from "googleapis";
import { decrementCredits, getCredits } from "../utils/decrementcredits.js";
import { sendMailWithAttachment } from "../utils/sendmail.js";

const router = express.Router();

router.post("/reserve-slot", express.json(), async (req, res) => {
  const { email, date, heure, duree = 50 } = req.body;

  if (!email || !date || !heure) {
    return res.status(400).json({ error: "Email, date et heure sont requis" });
  }

  try {
    const credits = await getCredits(email);

    if (credits <= 0) {
      await sendMailWithAttachment({
        to: email,
        subject: "Crédits épuisés",
        text: `Bonjour, vous n'avez plus de crédit disponible. Merci de renouveler votre forfait.`,
      });
      return res.status(403).json({ error: "Pas assez de crédit" });
    }

    const startDate = new Date(`${date}T${heure}:00`);
    const endDate = new Date(startDate.getTime() + duree * 60000);

    const auth = await authorizeGoogle();
    const calendar = google.calendar({ version: "v3", auth });

    const event = {
      summary: `Cours réservé par ${email}`,
      description: `Réservation validée pour ${email}`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: "Europe/Paris",
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: "Europe/Paris",
      },
      attendees: [{ email }],
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

    await decrementCredits(email);

    await sendMailWithAttachment({
      to: email,
      subject: "Confirmation de réservation",
      text: `Votre cours du ${date} à ${heure} a bien été réservé. Il vous reste ${credits - 1} crédit(s).`,
    });

    res.status(200).json({
      message: "Réservation confirmée",
      eventLink: response.data.htmlLink,
    });
  } catch (err) {
    console.error("❌ Erreur lors de la réservation :", err);
    res.status(500).json({ error: "Erreur serveur lors de la réservation" });
  }
});

export default router;
