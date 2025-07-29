// 📁 utils/email/sendclient.js

import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

/**
 * Envoie un email personnalisé selon le type de produit traité
 */
export async function envoyerEmailClient({ nom, email, produit, lien = null, motdepasse = null }) {
  let subject = "";
  let text = "";

  const produitNom = typeof produit === "string" ? produit.toLowerCase() : "";

  if ((produitNom.includes("cours") || produitNom.includes("administratif")) && lien) {
    subject = "Vos crédits ont été ajoutés – Réservez votre prochain cours";
    text = `Bonjour ${nom},\n\nMerci pour votre achat. Vos crédits ont été ajoutés avec succès.\n\n📅 Réservez dès maintenant ici : ${lien}\n\nÀ bientôt !`;
  } else if (produitNom.includes("ebook") && lien) {
    subject = "Votre e-book est prêt à être téléchargé";
    text = `Bonjour ${nom},\n\nMerci pour votre achat. Voici votre lien pour télécharger l'e-book :\n${lien}\n\nBonne lecture !`;
  } else if (produitNom.includes("formation") && motdepasse) {
    subject = "Accès à votre formation";
    text = `Bonjour ${nom},\n\nMerci pour votre achat. Voici le mot de passe pour accéder à votre formation :\n🔐 ${motdepasse}\n\nConnectez-vous à la plateforme dès maintenant.`;
  } else {
    console.log(`ℹ️ Aucun email envoyé à ${email} (informations incomplètes ou produit non reconnu)`);
    return;
  }

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: email,
    subject,
    text,
  });

  console.log(`📧 Email client envoyé à ${email} : ${subject}`);
}

// ✅ Fonction d'envoi de confirmation de crédits ajoutés
export async function envoyerEmailConfirmationClient(email, nom, credits, lien) {
  const sujet = "Vos crédits de réservation ont été mis à jour";
  const message = `
Bonjour ${nom},

Nous vous confirmons que vos crédits de réservation ont été mis à jour.
Vous disposez désormais de ${credits} crédit(s) sur votre compte.

📅 Réservez vos cours ici : ${lien}

À bientôt,
L’équipe Support & Learn with Yann
`.trim();

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: email,
    subject: sujet,
    text: message,
  });

  console.log(`📧 Email de confirmation crédits envoyé à ${email}`);
}

// ✅ alias pour actions.js
export { envoyerEmailClient as envoyerEmail };
