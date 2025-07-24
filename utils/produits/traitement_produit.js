// utils/produits/traitementProduit.js
import { google } from 'googleapis';
import { envoyerMotDePasse } from "../email/envoyermotdepasse.js";
import { envoyerLienEbook } from "../email/envoyerlienebook.js";
import { creerEvenementCalendrier } from "../calendar/creerevenement.js";

/**
 * Retourne le nombre de crédits selon le montant payé (depuis Google Sheets)
 */
export async function getCreditsFromTarif(auth, montant) {
  const sheets = google.sheets({ version: 'v4', auth });
  const range = 'Tarifs!A2:B';
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range
  });

  const lignes = response.data.values || [];
  for (const [prix, credits] of lignes) {
    if (Number(prix) === Number(montant)) return Number(credits);
  }
  return 1; // Par défaut
}

/**
 * Vérifie si un produit correspond à une formation ou un ebook
 */
export async function getProduitSpecial(auth, nomProduit) {
  const sheets = google.sheets({ version: 'v4', auth });
  const range = 'Produits spéciaux!A2:D';
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range
  });

  const lignes = response.data.values || [];
  for (const [motCle, type, action, valeur] of lignes) {
    if (nomProduit.toLowerCase().includes(motCle.toLowerCase())) {
      return { type, action, valeur };
    }
  }
  return null;
}

/**
 * Applique l’action à faire selon le type de produit acheté (cours / formation / ebook)
 */
export async function traiterProduit({ auth, nom, email, produit, montant }) {
  const produitSpecial = await getProduitSpecial(auth, produit);

  if (produitSpecial) {
    if (produitSpecial.action === 'envoyer_mot_de_passe') {
      await envoyerMotDePasse(email, nom, produitSpecial.valeur);
    } else if (produitSpecial.action === 'envoyer_lien_ebook') {
      await envoyerLienEbook(email, nom, produitSpecial.valeur);
    }
    return { estSpecial: true };
  }

  // Produit standard → ajout crédits et création calendrier
  const credits = await getCreditsFromTarif(auth, montant);
  await creerEvenementCalendrier(email, nom); // ou seulement envoyer lien de réservation

  return { estSpecial: false, credits };
}
