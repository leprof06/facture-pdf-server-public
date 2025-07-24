// /utils/google/ajouterOuMettreAJour.js
import { findClientByEmail, updateClient, addNewClient } from "./spreadsheet.js";
import { envoyerEmailConfirmationClient } from "../email/sendclient.js";
import { envoyerEmailNotificationAdmin } from "../email/sendadmin.js";
import { traiterProduit } from "../produits/traitementProduit.js";
import { auth } from "../utils/google/auth.js";

export async function ajouterOuMettreAJour({ email, nom, produit, quantite = 1, prixUnitaire, prix }) {
  try {
    const oauth = await auth();

    const resultat = await traiterProduit({
      auth: oauth,
      nom,
      email,
      produit,
      montant: prix
    });

    if (resultat.estSpecial) return; // formation ou ebook → email déjà envoyé

    const client = await findClientByEmail(email);

    if (client) {
      const creditsActuels = parseInt(client.data[6] || "0", 10);
      const creditsMisAJour = creditsActuels + Number(resultat.credits);

      const updatedRow = [
        nom,
        email,
        produit,
        quantite,
        prixUnitaire,
        prix,
        creditsMisAJour,
      ];

      await updateClient(client.rowIndex, updatedRow);
      await envoyerEmailConfirmationClient(email, nom, creditsMisAJour);
      await envoyerEmailNotificationAdmin(email, nom, resultat.credits, creditsMisAJour);
    } else {
      const row = [
        nom,
        email,
        produit,
        quantite,
        prixUnitaire,
        prix,
        resultat.credits,
      ];

      await addNewClient(row);
      await envoyerEmailConfirmationClient(email, nom, resultat.credits);
      await envoyerEmailNotificationAdmin(email, nom, resultat.credits);
    }
  } catch (err) {
    console.error("❌ Erreur Google Sheets (ajout/màj):", err);
    throw new Error("Erreur Google Sheets : " + err.message);
  }
}
