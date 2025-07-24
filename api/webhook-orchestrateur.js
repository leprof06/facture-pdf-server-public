// webhook-orchestrateur.js
import Stripe from "stripe";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { envoyerFacturePDF } from "../utils/email/envoyerfacture.js";
import { envoyerEmailNotificationAdmin } from "../utils/email/sendadmin.js";
import { ajouterOuMettreAJour } from "../utils/google/ajouterOuMettreAJour.js";
import { genererDonneesFacture } from "../utils/genererdonneesfacture.js";

dotenv.config();

function getStripeInstance(sessionId) {
  const isTest = sessionId?.startsWith("cs_test_");
  const apiKey = isTest ? process.env.STRIPE_SECRET_KEY_TEST : process.env.STRIPE_SECRET_KEY_LIVE;
  return new Stripe(apiKey, { apiVersion: "2023-08-16" });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function webhookStripe(req, res) {
  const sig = req.headers["stripe-signature"];
  const body = req.body;

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
      event = stripe.webhooks.constructEvent(body, sig, secret);
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
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        limit: 1,
      });
      produit = lineItems.data[0]?.description || "Cours";
    } catch (err) {
      console.warn("⚠️ Impossible de récupérer les line items :", err.message);
    }

    try {
      const facture = await genererDonneesFacture(session, produit);
      console.log("📄 Données de la facture générées pour :", facture.client_nom);

      await envoyerFacturePDF(facture);
      console.log("📧 Facture envoyée par email à :", facture.client_email);

      await envoyerEmailNotificationAdmin(
        facture.client_email,
        facture.client_nom,
        facture.credits || facture.quantite,
        facture.credits || facture.quantite, // total simulé
        facture.description,
        facture.prix
      );

      await ajouterOuMettreAJour({
        nom: facture.client_nom,
        email: facture.client_email,
        produit: facture.description,
        quantite: facture.quantite,
        prixUnitaire: facture.prixUnitaire,
        prix: facture.prix
      });

      console.log("✅ Traitement Google Sheets/Emails terminé pour :", facture.client_nom);

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
