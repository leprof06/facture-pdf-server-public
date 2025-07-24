// utils/email/sendadmin.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

/**
 * Envoie un e-mail administrateur avec récapitulatif de l'achat
 */
export async function envoyerEmailNotificationAdmin(email, nom, credits, total = null, produit = null, prix = null) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const admin = process.env.ADMIN_EMAIL;
  const sujet = produit ? `🎓 Achat : ${produit} - ${nom}` : `🧾 Achat de crédits - ${nom}`;

  let contenu = `✅ ${nom} (${email}) a effectué un achat.\n`;
  if (produit) contenu += `Produit : ${produit}\n`;
  if (prix) contenu += `Montant payé : ${prix} €\n`;
  contenu += `Crédits ajoutés : ${credits}`;
  if (total !== null) contenu += `\nCrédits totaux : ${total}`;

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: admin,
    subject: sujet,
    text: contenu,
  });
}
