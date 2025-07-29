// ✅ Fichier corrigé : /api/webhook-stripe.js 

import Stripe from "stripe";
import dotenv from "dotenv";
dotenv.config();

import { envoyerFacturePDF } from "../utils/email/envoyerfacture.js";
import { envoyerEmailNotificationAdmin } from "../utils/email/sendadmin.js";
import { envoyerEmailClient } from "../utils/email/sendclient.js";
import { ajouterOuMettreAJour } from "../utils/google/ajouteroumettreajour.js";
import { genererDonneesFacture } from "../utils/genererdonneesfacture.js";
import { traiterProduit } from "../utils/produits/traitement_produit.js";
import { getProduitSpecial } from "../utils/google/spreadsheet.js";
import { getCreditsParMontant } from "../utils/google/getcredits.js";
import { authorizeGoogle } from "../config/auth.js";
import { ajouterClientSiNouveau, ajouterLigneAchat, mettreAJourCreditsRestants } from "../utils/google/gestion_clients.js";

function getStripeInstance(sessionId) {
  const isTest = sessionId?.startsWith("cs_test_");
  const apiKey = isTest ? process.env.STRIPE_SECRET_KEY_TEST : process.env.STRIPE_SECRET_KEY_LIVE;
  return new Stripe(apiKey, { apiVersion: "2023-08-16" });
}

export default async function webhookStripe(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Méthode non autorisée");
  }

  const sig = req.headers["stripe-signature"];
  const buf = req.body;

  const webhookSecrets = [
    process.env.STRIPE_WEBHOOK_SECRET_LIVE,
    process.env.STRIPE_WEBHOOK_SECRET_TEST,
  ];

  let event;
  let verified = false;
  let lastError;

  for (const secret of webhookSecrets.filter(Boolean)) {
    try {
      const stripe = new Stripe(secret.includes("_LIVE") ? process.env.STRIPE_SECRET_KEY_LIVE : process.env.STRIPE_SECRET_KEY_TEST, {
        apiVersion: "2023-08-16",
      });
      event = stripe.webhooks.constructEvent(buf, sig, secret);
      verified = true;
      break;
    } catch (err) {
      lastError = err;
    }
  }

  if (!verified) {
    console.error("❌ Erreur de signature Stripe :", lastError?.message);
    return res.status(400).send(`Webhook Error: ${lastError?.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const stripe = getStripeInstance(session.id);

    let produit = "Cours";

    try {
      console.log("🔍 Récupération du line item Stripe...");
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
      produit = lineItems.data[0]?.description || "Cours";
      console.log("✅ Produit détecté :", produit);
    } catch (err) {
      console.warn("⚠️ Impossible de récupérer les line items :", err.message);
    }

    try {
      console.log("🧾 Génération des données de facture...");
      const facture = await genererDonneesFacture(session, produit);
      console.log("📄 Données de la facture générées pour :", facture.client_nom);

      facture.credits = await getCreditsParMontant(facture.prix);
      console.log("💳 Crédits associés :", facture.credits);

      console.log("📤 Envoi de la facture PDF...");
      await envoyerFacturePDF(facture);
      console.log("📧 Facture envoyée à :", facture.client_email);

      const auth = await authorizeGoogle();

      console.log("📦 Traitement du produit...");
      const resultat = await traiterProduit({
        auth,
        nom: facture.client_nom,
        email: facture.client_email,
        produit: facture.description,
        montant: facture.prix,
      });
      console.log("✅ Résultat traitement produit :", resultat);

      console.log("🔍 Lecture des infos produit depuis Google Sheets...");
      const infoProduit = await getProduitSpecial(auth, facture.description);
      const type = infoProduit?.type || "";
      const action = infoProduit?.action || "";
      const valeur = infoProduit?.valeur?.startsWith("http") ? infoProduit.valeur : null;

      console.log("✉️ Envoi de l’email client...");
      await envoyerEmailClient({
        nom: facture.client_nom,
        email: facture.client_email,
        produit: facture.description,
        lien: valeur,
        motdepasse: action === "envoyer_mot_de_passe" ? valeur : null,
      });

      console.log("📇 Mise à jour CRM Google Sheets...");
      await ajouterClientSiNouveau(facture.client_nom, facture.client_email);
      await ajouterLigneAchat({
        nom: facture.client_nom,
        email: facture.client_email,
        produit: facture.description,
        date: facture.date_emission,
        quantite: facture.quantite,
        prixUnitaire: facture.prixUnitaire,
        prixTotal: facture.prix,
        credits: facture.credits || ""
      });

      if (action === "ajouter_credit") {
        await mettreAJourCreditsRestants(facture.client_email, facture.client_nom, facture.credits || 0);
      }

      console.log("📨 Envoi notification admin...");
      await envoyerEmailNotificationAdmin(
        facture.client_email,
        facture.client_nom,
        facture.credits || facture.quantite,
        facture.credits || facture.quantite,
        facture.description,
        facture.prix
      );

      console.log("📊 Ajout ou mise à jour client dans Google Sheets...");
      await ajouterOuMettreAJour({
        nom: facture.client_nom,
        email: facture.client_email,
        produit: facture.description,
        quantite: facture.quantite,
        prixUnitaire: facture.prixUnitaire,
        prix: facture.prix,
      });

      console.log("✅ Traitement complet terminé pour :", facture.client_nom);
      return res.status(200).send("✅ Webhook reçu et traité");
    } catch (err) {
      console.error("🔥 Erreur pendant le traitement final :", err);
      return res.status(500).send("Erreur serveur lors du traitement de la commande.");
    }
  } else {
    console.log("ℹ️ Événement ignoré :", event.type);
    return res.status(200).send("Événement ignoré");
  }
}
