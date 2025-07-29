// ✅ fichier : utils/produits/actions.js 
import { envoyerEmail,envoyerEmailClient } from "../email/sendclient.js";
import { getCreditsFromTarif } from "./traitement_produit.js";
import { google } from "googleapis";
import { authorizeGoogle, SPREADSHEET_ID } from "../../config/auth.js";

// ✉️ Envoie un mot de passe dans un email au client
export async function envoyerMotDePasse(email, nom, produit, motDePasse) {
  const sujet = `Accès à votre formation : ${produit}`;
  const corps = `Bonjour ${nom},\n\nMerci pour votre achat. Voici le mot de passe pour accéder à votre formation :\n🔐 ${motDePasse}\n\nConnectez-vous dès maintenant à la plateforme.\n\nL'équipe **.`;
  await envoyerEmailClient({ nom, email, produit, motdepasse: motDePasse });
}

// ✉️ Envoie un lien d'eBook dans un email au client
export async function envoyerLienEbook(email, produit, lien) {
  const sujet = `Téléchargement de votre eBook : ${produit}`;
  const corps = `Bonjour,\n\nMerci pour votre achat. Vous pouvez télécharger votre eBook via le lien ci-dessous :\n\n${lien}\n\nBonne lecture !\n\nL'équipe **.`;
  await envoyerEmail(email, sujet, corps);
}

// ➕ Ajoute des crédits en fonction du montant et envoie un lien de réservation
export async function ajouterCreditClient(auth, email, produit, valeurOuLien) {
  // valeurOuLien = valeur de la colonne "valeur" → lien Google Calendar
  const sheets = google.sheets({ version: "v4", auth });

  // 🔢 Lire les crédits actuels du client
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Clients!A2:G",
  });

  const lignes = res.data.values || [];
  let ligneTrouvee = -1;

  for (let i = 0; i < lignes.length; i++) {
    const ligne = lignes[i];
    const emails = ligne[1]?.split(",").map(e => e.trim().toLowerCase()) || [];
    if (emails.includes(email.toLowerCase())) {
      ligneTrouvee = i + 2; // ligne réelle dans Sheets
      break;
    }
  }

  if (ligneTrouvee === -1) {
    console.warn("Client non trouvé pour ajout crédit :", email);
    return;
  }

  // 💳 Récupérer le prix total payé (colonne F) pour cette ligne
  const prixTexte = lignes[ligneTrouvee - 2]?.[5] || ""; // index 5 = colonne F
  const montant = parseFloat(prixTexte.replace(/[^\d.]/g, "")) || 0;

  const credits = await getCreditsFromTarif(auth, montant);
  if (credits === 0) {
    console.warn("⚠️ Aucun crédit trouvé pour ce montant :", montant);
  }

  // ➕ Ajouter le crédit au champ "Crédits restants" (colonne G → index 6)
  const ancienneValeur = parseInt(lignes[ligneTrouvee - 2]?.[6]) || 0;
  const nouvelleValeur = ancienneValeur + credits;

  const rangeMaj = `Clients!G${ligneTrouvee}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: rangeMaj,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[nouvelleValeur]],
    },
  });

  // 📩 Envoi de l’e-mail avec le lien de réservation
  const sujet = `Crédits ajoutés pour : ${produit}`;
  const corps = `Bonjour,\n\nVos crédits ont été ajoutés pour le produit : ${produit}.\n\nVous pouvez réserver vos créneaux ici :\n${valeurOuLien}\n\nÀ très bientôt !\n\nL'équipe **.`;
  await envoyerEmail(email, sujet, corps);
}
