// 📁 api/check-updates.js
// Appelé par cron-job.org : GET https://<project>.vercel.app/api/check-updates?key=OPTIONNEL
// Clé optionnelle via env CRON_SECRET. Réponse JSON.

import verifierMisesAJourProduits from "../utils/produits/verifierMisesAJourProduits.js";

export default async function handler(req, res) {
  const allowed = ["GET", "POST", "HEAD"];
  if (!allowed.includes(req.method)) {
    res.statusCode = 405;
    res.setHeader("Allow", allowed.join(", "));
    res.end("Method Not Allowed");
    return;
  }

  // Sécurité optionnelle
  const { CRON_SECRET } = process.env;
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const providedKey = url.searchParams.get("key") || req.headers["x-cron-key"] || null;
  if (CRON_SECRET && providedKey !== CRON_SECRET) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "Unauthorized: invalid or missing key" }));
    return;
  }

  const startedAt = Date.now();
  try {
    const result = await verifierMisesAJourProduits();
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true, duration_ms: Date.now() - startedAt, result }));
  } catch (e) {
    console.error("[check-updates] error:", e);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: e?.message || String(e) }));
  }
}
