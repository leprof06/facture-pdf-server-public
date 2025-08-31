// ✅ /api/webhook-stripe.js — Version Vercel serverless (sans Express), RAW body + signature OK
// - Conserve ta logique : facture PDF, emails, Google Sheets, serveur de licences (x-api-key)
// - Sélection automatique des clés TEST/LIVE après vérification de signature
// - Réponses HTTP au format Node (pas Express)

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
import {
  ajouterClientSiNouveau,
  ajouterLigneAchat,
  mettreAJourCreditsRestants,
} from "../utils/google/gestion_clients.js";
import { upsertLicenseRow } from "../utils/google/licenses_sheets.js"; // si présent

const { LICENSE_SERVER_URL, LICENSE_SERVER_TOKEN } = process.env;

// --- Utilitaires bas niveau (Vercel / Node) ---

async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function sendJSON(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function sendText(res, status, text) {
  res.statusCode = status;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end(text);
}

function getStripeForLivemode(livemode) {
  const apiKey = livemode
    ? process.env.STRIPE_SECRET_KEY_LIVE
    : process.env.STRIPE_SECRET_KEY_TEST;
  if (!apiKey) throw new Error("Stripe API key manquante pour l'environnement détecté.");
  return new Stripe(apiKey, { apiVersion: "2024-12-18.acacia" });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendText(res, 405, "Méthode non autorisée");
  }

  // 1) Lire le body brut et l’en-tête de signature
  const sig = req.headers["stripe-signature"];
  if (!sig) {
    return sendJSON(res, 400, { ok: false, error: "Missing stripe-signature header" });
  }

  const rawBody = await getRawBody(req).catch((e) => {
    console.error("[webhook] raw body read error:", e);
    return null;
  });
  if (!rawBody) {
    return sendJSON(res, 400, { ok: false, error: "Unable to read raw body" });
  }

  // 2) Vérifier la signature avec les secrets possibles (test & live)
  const webhookSecrets = [
    process.env.STRIPE_WEBHOOK_SECRET_LIVE,
    process.env.STRIPE_WEBHOOK_SECRET_TEST,
  ].filter(Boolean);

  if (webhookSecrets.length === 0) {
    return sendJSON(res, 500, { ok: false, error: "Missing webhook secrets env vars" });
  }

  let event = null;
  let verifyError = null;

  // Pour vérifier la signature, on peut instancier Stripe avec n’importe quelle clé valide (test ou live)
  const verifyStripe = new Stripe(
    process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY_LIVE || "sk_test_dummy",
    { apiVersion: "2024-12-18.acacia" }
  );

  for (const secret of webhookSecrets) {
    try {
      event = verifyStripe.webhooks.constructEvent(rawBody, sig, secret);
      verifyError = null;
      break; // vérification OK
    } catch (err) {
      verifyError = err;
    }
  }

  if (!event) {
    console.error("❌ Erreur de signature Stripe :", verifyError?.message || verifyError);
    return sendJSON(res, 400, { ok: false, error: "Bad Request: invalid signature" });
  }

  // 3) Router l’événement
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const stripe = getStripeForLivemode(event.livemode);

        // Récupération line item pour déduire le produit + quantité
        let produit = "Cours";
        let quantity = 1;
        try {
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
          produit = lineItems.data[0]?.description || "Cours";
          quantity = lineItems.data[0]?.quantity || 1;
          console.log("✅ Produit détecté :", produit, "| Qty:", quantity);
        } catch (err) {
          console.warn("⚠️ Impossible de récupérer les line items :", err.message);
        }

        try {
          // Génération + envoi facture
          console.log("🧾 Génération des données de facture…");
          const facture = await genererDonneesFacture(session, produit);
          facture.credits = await getCreditsParMontant(facture.prix);

          console.log("📤 Envoi de la facture PDF…");
          await envoyerFacturePDF(facture);

          const auth = await authorizeGoogle();

          console.log("📦 Traitement du produit…");
          await traiterProduit({
            auth,
            nom: facture.client_nom,
            email: facture.client_email,
            produit: facture.description,
            montant: facture.prix,
          });

          console.log("🔍 Lecture des infos produit depuis Google Sheets…");
          const infoProduit = await getProduitSpecial(auth, facture.description);
          const action = infoProduit?.action || "";
          const valeur =
            infoProduit?.valeur && infoProduit.valeur.startsWith("http")
              ? infoProduit.valeur
              : infoProduit?.valeur || null;

          // ---- Intégration serveur de licences (optionnelle) ----
          let licenseResponse = null;
          const isProgramme = (facture.description || "").toLowerCase().includes("programme");
          if (isProgramme && LICENSE_SERVER_URL && LICENSE_SERVER_TOKEN) {
            try {
              const url = `${LICENSE_SERVER_URL.replace(/\/$/, "")}/licenses/issue`;
              const payload = {
                customer_email: facture.client_email,
                product_ref: facture.description,
                order_ref: session.id,
                seats: quantity,
              };
              console.log("🔑 Demande de licence ->", url, payload);
              const resp = await fetch(url, {
                method: "POST",
                headers: {
                  "x-api-key": LICENSE_SERVER_TOKEN,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
              });
              if (!resp.ok) {
                const txt = await resp.text().catch(() => "");
                throw new Error(`HTTP ${resp.status} - ${txt}`);
              }
              licenseResponse = await resp.json();
              console.log("✅ Licence générée :", licenseResponse?.license_key || "(clé reçue)");

              if (typeof upsertLicenseRow === "function") {
                await upsertLicenseRow({
                  auth,
                  data: {
                    license_id: String(licenseResponse.license_id || ""),
                    license_key: String(licenseResponse.license_key || ""),
                    product_ref: facture.description,
                    customer_email: facture.client_email,
                    company: facture.client_nom,
                    plan: infoProduit?.plan || "",
                    status: "active",
                    seats: quantity,
                    device_limit: licenseResponse.device_limit || "",
                    valid_from: licenseResponse.valid_from || "",
                    valid_until: licenseResponse.valid_until || "",
                    order_ref: session.id,
                    issued_at: new Date().toISOString(),
                  },
                });
              }
            } catch (e) {
              console.error("⚠️ Échec génération/écriture licence :", e?.message || e);
              // On n'interrompt pas le flux Stripe
            }
          }
          // ---- Fin intégration licence ----

          console.log("✉️ Envoi de l’email client…");
          await envoyerEmailClient({
            nom: facture.client_nom,
            email: facture.client_email,
            produit: facture.description,
            lien:
              action === "envoyer_programme"
                ? valeur
                : valeur && valeur.startsWith("http")
                ? valeur
                : null,
            motdepasse: action === "envoyer_mot_de_passe" ? valeur : null,
            licence: licenseResponse?.license_key || null,
          });

          console.log("📇 Mise à jour CRM Google Sheets…");
          await ajouterClientSiNouveau(facture.client_nom, facture.client_email);
          await ajouterLigneAchat({
            nom: facture.client_nom,
            email: facture.client_email,
            produit: facture.description,
            date: facture.date_emission,
            quantite: facture.quantite,
            prixUnitaire: facture.prixUnitaire,
            prixTotal: facture.prix,
            credits: facture.credits || "",
          });

          if (action === "ajouter_credit") {
            await mettreAJourCreditsRestants(
              facture.client_email,
              facture.client_nom,
              facture.credits || 0
            );
          }

          await envoyerEmailNotificationAdmin(
            facture.client_email,
            facture.client_nom,
            facture.credits || facture.quantite,
            facture.credits || facture.quantite,
            facture.description,
            facture.prix,
            licenseResponse?.license_key || null
          );

          console.log("📊 Ajout ou mise à jour client dans Google Sheets…");
          await ajouterOuMettreAJour({
            nom: facture.client_nom,
            email: facture.client_email,
            produit: facture.description,
            quantite: facture.quantite,
            prixUnitaire: facture.prixUnitaire,
            prix: facture.prix,
          });

          console.log("✅ Traitement complet terminé pour :", facture.client_nom);
          return sendJSON(res, 200, { received: true });
        } catch (err) {
          console.error("🔥 Erreur pendant le traitement final :", err);
          return sendJSON(res, 500, { ok: false, error: "Erreur serveur lors du traitement" });
        }
      }

      default:
        console.log("ℹ️ Événement ignoré :", event.type);
        return sendJSON(res, 200, { received: true, ignored: event.type });
    }
  } catch (err) {
    console.error("[webhook] handler error:", err);
    return sendJSON(res, 500, { ok: false, error: err?.message || String(err) });
  }
}
