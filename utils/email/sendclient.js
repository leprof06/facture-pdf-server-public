// sendClient.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export async function envoyerEmailConfirmationClient(email, nom, credits) {
  const lienCalendrier = "lien google calendar";

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: email,
    subject: "Vos crédits ont été ajoutés",
    text: `Bonjour ${nom},\n\nMerci pour votre achat. Vous disposez maintenant de ${credits} crédit(s) utilisables.\n\n📅 Réservez votre prochain cours ici : ${lienCalendrier}\n\nÀ bientôt !`,
  });
}
