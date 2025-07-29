// ✅ fichier corrigé : utils/produits/traitement_produit.js

import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

import { authorizeGoogle, SPREADSHEET_ID } from "../../config/auth.js";
import {
  getProduitSpecial,
  getLigneClientParEmailEtProduit,
  updateCellule
} from "../google/spreadsheet.js";
import {
  envoyerMotDePasse,
  envoyerLienEbook,
  ajouterCreditClient
} from "./actions.js";

const RANGE = "Tarifs!A2:B"; // A = Prix, B = Crédits

export async function traiterProduit({ nom, email, produit, montant }) {
  const auth = await authorizeGoogle();

  const produitSpecial = await getProduitSpecial(auth, produit);
  const ligneClient = await getLigneClientParEmailEtProduit(auth, email, produit);

  if (!ligneClient) {
    console.warn("Client introuvable dans Google Sheets");
    return;
  }

  if (produitSpecial) {
    const { action, valeur, type } = produitSpecial;

    if (action === "envoyer_mot_de_passe") {
      await envoyerMotDePasse(email, nom, produit, valeur);
      await updateCellule(auth, "Clients", ligneClient, 8, "Oui"); // Colonne H = mot de passe envoyé
    }

    if (action === "envoyer_lien_ebook") {
      await envoyerLienEbook(email, produit, valeur);
      await updateCellule(auth, "Clients", ligneClient, 7, "Oui"); // Colonne G = ebook envoyé
    }

    if (action === "ajouter_credit") {
      await ajouterCreditClient(auth, email, produit, valeur, type);
      await updateCellule(auth, "Clients", ligneClient, 7, "Oui"); // Colonne G = lien calendrier envoyé
    }

    return { estSpecial: true };
  }

  return { estSpecial: false };
}

export async function getCreditsFromTarif(prix) {
  const auth = await authorizeGoogle();
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
  });

  const lignes = res.data.values || [];

  for (const [prixCell, creditsCell] of lignes) {
    if (Number(prixCell) === Number(prix)) {
      return Number(creditsCell);
    }
  }

  console.warn(`Prix ${prix}€ non trouvé dans l’onglet Tarifs.`);
  return 0;
}
