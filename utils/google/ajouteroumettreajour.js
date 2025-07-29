// ✅ utils/google/ajouteroumettreajour.js

import { getProduitSpecial } from "./spreadsheet.js";
import { envoyerEmailNotificationAdmin } from "../email/sendadmin.js";
import { envoyerEmailConfirmationClient } from "../email/sendclient.js";
import { getCreditsFromTarif } from "../produits/traitement_produit.js";
import { authorizeGoogle } from "../../config/auth.js";
import {
  ajouterClientSiNouveau,
  ajouterLigneAchat,
  mettreAJourCreditsRestants,
} from "./gestion_clients.js";

export async function ajouterOuMettreAJour(data) {
  try {
    const auth = await authorizeGoogle();

    const produitSpecial = await getProduitSpecial(auth, data.produit);

    let credits = Number(data.credits || 0);
    if (produitSpecial && produitSpecial.action === "ajouter_credit") {
      credits = await getCreditsFromTarif(auth, Number(data.prix));
    }

    const date = new Date().toISOString().split("T")[0];

    // ➕ Ajouter dans l’onglet Clients (si nouveau)
    await ajouterClientSiNouveau(data.nom, data.email);

    // 🧾 Ajouter une ligne d’achat complète
    await ajouterLigneAchat({
      nom: data.nom,
      email: data.email,
      produit: data.produit,
      date,
      quantite: data.quantite,
      prixUnitaire: data.prixUnitaire,
      prix: data.prix,
      credits,
    });

    // 🔁 Mettre à jour les crédits restants si besoin
    let totalCredits = null;
    if (credits > 0) {
      totalCredits = await mettreAJourCreditsRestants(data.email, data.nom, credits);
      await envoyerEmailConfirmationClient(data.email, data.nom, totalCredits);
    }

    await envoyerEmailNotificationAdmin(
      data.email,
      data.nom,
      credits,
      totalCredits,
      data.produit,
      data.prix
    );

  } catch (err) {
    console.error("❌ Erreur lors de l'ajout/mise à jour dans Google Sheets:", err);
    throw new Error("Erreur Google Sheets : " + err.message);
  }
}
