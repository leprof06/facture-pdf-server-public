// reserve-slot.js
import express from "express";
import { authorizeGoogleCalendar, createCalendarEvent } from "../utils/calendar.js";
import { decrementCredits, getCredits } from "../utils/airtable.js";
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

    const auth = await authorizeGoogleCalendar();

    const event = await createCalendarEvent({
      auth,
      summary: "Cours réservé",
      description: `Réservé par ${email}`,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
    });

    await decrementCredits(email);

    await sendMailWithAttachment({
      to: email,
      subject: "Confirmation de réservation",
      text: `Votre cours du ${date} à ${heure} a bien été réservé. Il vous reste ${credits - 1} crédit(s).`,
    });

    res.status(200).json({ message: "Réservation confirmée", eventLink: event.htmlLink });
  } catch (err) {
    console.error("❌ Erreur lors de la réservation :", err);
    res.status(500).json({ error: "Erreur serveur lors de la réservation" });
  }
});

export default router;
