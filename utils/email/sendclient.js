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
export async function envoyerEmailClient({ nom, email, produit, lien = null, motdepasse = null, licence = null }) {
  let subject = "";
  let text = "";

  const produitNom = typeof produit === "string" ? produit.toLowerCase() : "";

  // Formation + ebook
  if (produitNom.includes("formation") && motdepasse && lien) {
    subject = "Accès à votre formation + votre eBook offert";
    text = `Bonjour ${nom},

Merci pour votre achat.

🔐 Voici le mot de passe pour accéder à votre formation : ${motdepasse}

📚 Voici également votre eBook :
${lien}

Bonne formation et bonne lecture !`;
  }

  // Formation seule
  else if (produitNom.includes("formation") && motdepasse) {
    subject = "Accès à votre formation";
    text = `Bonjour ${nom},

Merci pour votre achat. Voici le mot de passe pour accéder à votre formation :
🔐 ${motdepasse}`;
  }

  // eBook (un ou plusieurs liens, avec objet personnalisé)
  else if (produitNom.includes("ebook") && lien) {
    const liens = Array.isArray(lien) ? lien : [lien];
    subject = `Mise à jour de votre eBook : ${produit}`;
    text = `Bonjour ${nom},

  Votre eBook "${produit}" a été mis à jour. Voici le(s) lien(s) à télécharger :
  ${liens.join("\n")}

  Bonne lecture !`;
}

  // Programme (.exe + licence)
  else if (produitNom.includes("programme") && lien && licence) {
    subject = "Votre programme est prêt à être téléchargé";
    text = `Bonjour ${nom},

Merci pour votre achat.

💻 Téléchargez votre programme ici :
${lien}

🔑 Voici votre clé de licence :
${licence}

Conservez bien cette clé pour activer le logiciel.`;
  }

  // Cours ou administratif
  else if ((produitNom.includes("cours") || produitNom.includes("administratif")) && lien) {
    subject = "Vos crédits ont été ajoutés – Réservez votre prochain cours";
    text = `Bonjour ${nom},

Merci pour votre achat. Vos crédits ont été ajoutés.

📅 Réservez ici : ${lien}`;
  }

  else {
    console.log(`ℹ️ Aucun email envoyé à ${email} (produit non reconnu)`);
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
L’équipe Support & Learn.
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
