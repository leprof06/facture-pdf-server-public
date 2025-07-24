// /utils/email/envoyerFacture.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export async function envoyerFacturePDF(facture) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const mailOptionsClient = {
    from: process.env.GMAIL_USER,
    to: facture.client_email,
    subject: "Votre facture Support & Learn with Yann",
    text: "Veuillez trouver ci-joint votre facture.",
    attachments: [
      {
        filename: `facture-${facture.numero}.pdf`,
        content: facture.pdfBuffer,
      },
    ],
  };

  const mailOptionsAdmin = {
    from: process.env.GMAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: `COPIE | Facture envoyée à ${facture.client_nom}`,
    text: `Voici la copie de la facture envoyée à ${facture.client_email}.`,
    attachments: [
      {
        filename: `facture-${facture.numero}.pdf`,
        content: facture.pdfBuffer,
      },
    ],
  };

  await transporter.sendMail(mailOptionsClient);
  console.log(`📩 Facture envoyée à ${facture.client_email}`);

  await transporter.sendMail(mailOptionsAdmin);
  console.log(`📩 Copie envoyée à l'admin (${process.env.ADMIN_EMAIL})`);
}
