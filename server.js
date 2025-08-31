// server.js
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

import webhookStripe from "./api/webhook-stripe.js";
import { verifierMisesAJourProduits } from "./utils/produits/verifierMisesAJourProduits.js"; // ✅ ajout

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// ✅ Middleware Stripe : raw body requis + accepte tout type de Content-Type
app.post("/api/webhook-stripe", express.raw({ type: "*/*" }), webhookStripe);

// Middleware JSON classique pour les autres routes
app.use(express.json());

// Routes de test pour vérifier le bon déploiement
app.get("/", (req, res) => {
  res.send("✅ Serveur opérationnel. Endpoint racine OK.");
});

app.get("/api/webhook-stripe", (req, res) => {
  res.send("🟢 GET webhook-stripe : OK");
});

app.put("/api/webhook-stripe", (req, res) => {
  res.send("🟡 PUT webhook-stripe : reçu mais non implémenté");
});

app.post("/api/webhook-stripe-test", (req, res) => {
  res.send("🔵 POST test reçu - ce n’est pas Stripe !");
});

// ✅ Route ping (existe déjà)
app.get("/ping", (req, res) => {
  res.send("✅ Ping OK - serveur réveillé !");
});

// ✅ Nouvelle route pour vérifier les mises à jour Drive
app.get("/check-updates", async (req, res) => {
  try {
    await verifierMisesAJourProduits();
    res.status(200).send("✅ Vérification des mises à jour terminée");
  } catch (error) {
    console.error("❌ Erreur lors de la vérification des mises à jour :", error);
    res.status(500).send("Erreur lors de la vérification des mises à jour");
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Serveur en ligne sur le port ${PORT}`);
});
