// server.js
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

import webhookStripe from "./api/webhook-orchestrateur.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware Stripe : raw body requis uniquement pour le webhook Stripe
app.post("/api/webhook-stripe", express.raw({ type: "application/json" }), webhookStripe);

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

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Serveur en ligne sur le port ${PORT}`);
});

