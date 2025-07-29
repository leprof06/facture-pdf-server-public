// sendMail.js
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "Outlook365",
  auth: {
    user: process.env.OUTLOOK_USER,
    pass: process.env.OUTLOOK_PASS,
  },
});

export async function sendMailWithAttachment(to, subject, text, attachmentPath) {
  const mailOptions = {
    from: process.env.OUTLOOK_USER,
    to,
    subject,
    text,
    attachments: [
      {
        filename: path.basename(attachmentPath),
        path: attachmentPath,
      },
    ],
  };

  await transporter.sendMail(mailOptions);
  console.log(`📩 Mail envoyé à ${to}`);
}

export async function sendNoCreditsAlert(to, nom) {
  const mailOptions = {
    from: process.env.OUTLOOK_USER,
    to,
    subject: "⛔ Crédits épuisés",
    text: `Bonjour ${nom},\n\nVous avez utilisé tous vos crédits de cours. Merci de renouveler votre abonnement pour continuer à réserver.\n\n**`,
  };

  await transporter.sendMail(mailOptions);
  console.log(`📩 Alerte crédits à 0 envoyée à ${to}`);
}

export async function sendAdminAlertForZeroCredit(clientNom, clientEmail) {
  const mailOptions = {
    from: process.env.OUTLOOK_USER,
    to: process.env.OUTLOOK_USER,
    subject: `⚠️ ${clientNom} n'a plus de crédit`,
    text: `L'utilisateur ${clientNom} (${clientEmail}) est à 0 crédit.`,
  };

  await transporter.sendMail(mailOptions);
  console.log(`📩 Alerte admin pour ${clientNom} envoyée`);
}

export async function sendReservationConfirmation(to, nom, date, creditsRestants) {
  const mailOptions = {
    from: process.env.OUTLOOK_USER,
    to,
    subject: "📅 Confirmation de réservation",
    text: `Bonjour ${nom},\n\nVotre cours a bien été réservé pour le ${date}.\nIl vous reste ${creditsRestants} crédit(s).\n\nMerci de votre confiance !\n**`,
  };

  await transporter.sendMail(mailOptions);
  console.log(`📩 Confirmation de réservation envoyée à ${to}`);
}

export async function sendRenewalNotification(to, nom, creditsAjoutes) {
  const mailOptions = {
    from: process.env.OUTLOOK_USER,
    to,
    subject: "🔄 Crédits renouvelés",
    text: `Bonjour ${nom},\n\nVotre compte a été rechargé avec ${creditsAjoutes} crédits.\n\nVous pouvez dès maintenant réserver vos prochains cours !\n\nÀ très vite,\n**`,
  };

  await transporter.sendMail(mailOptions);
  console.log(`📩 Notification de renouvellement envoyée à ${to}`);
}
