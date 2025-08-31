// utils/email/sendadmin.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

/**
 * Envoie un e-mail administrateur avec récapitulatif de l'achat
 * + (optionnel) la clé de licence si c'est un programme.
 *
 * @param {string} email - Email du client
 * @param {string} nom - Nom du client
 * @param {number|string} credits - Crédits ajoutés (ou quantité)
 * @param {number|string|null} total - Total de crédits après ajout (ou quantité totale)
 * @param {string|null} produit - Nom du produit (si achat produit)
 * @param {number|string|null} prix - Montant payé (si achat produit)
 * @param {string|null} license_key - Clé de licence (optionnel)
 */
export async function envoyerEmailNotificationAdmin(
  email,
  nom,
  credits,
  total = null,
  produit = null,
  prix = null,
  license_key = null
) {
  // Transporter Gmail existant (inchangé)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const admin = process.env.ADMIN_EMAIL;
  if (!admin) {
    throw new Error("ADMIN_EMAIL manquant dans l'environnement");
  }

  const sujet = produit
    ? `🎓 Achat : ${produit} - ${nom}`
    : `🧾 Achat de crédits - ${nom}`;

  // Option de masquage de la clé pour confidentialité (1 = masque)
  const MASK = String(process.env.LICENSE_COPY_MASK || "0") === "1";
  const prettyKey = (key) => {
    if (!key) return "";
    if (!MASK) return key;
    // Masque : garde 4 premiers et 4 derniers caractères alphanumériques
    const plain = key.replace(/[^A-Za-z0-9]/g, "");
    if (plain.length <= 10) return "****";
    const head = plain.slice(0, 4);
    const tail = plain.slice(-4);
    return `${head}…${tail}`;
  };

  let contenu = `✅ ${nom} (${email}) a effectué un achat.\n`;
  if (produit) contenu += `Produit : ${produit}\n`;
  if (prix) contenu += `Montant payé : ${prix} €\n`;
  contenu += `Crédits ajoutés : ${credits}`;
  if (total !== null) contenu += `\nCrédits totaux : ${total}`;

  // 🔑 Ajout si programme avec licence
  if (license_key) {
    contenu += `\n\n🔑 Licence générée : ${prettyKey(license_key)}`;
    if (MASK) {
      contenu += `\n(La clé est masquée car LICENSE_COPY_MASK=1)`;
    }
  }

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: admin,
    subject: sujet,
    text: contenu,
  });
}
