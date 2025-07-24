// /utils/genererdonneesfacture.js
import { generatePDFBuffer } from "./pdf.js";

export async function genererDonneesFacture(session, produit = "Cours") {
  const clientName = session.customer_details?.name || "Client";
  const clientEmail = session.customer_details?.email;
  const clientAdresse = session.customer_details?.address?.line1 || "";

  const quantite = Number(session.metadata?.quantite || 1);
  const prixTotal = session.amount_total / 100;
  const prixUnitaire = (prixTotal / quantite).toFixed(2);

  const facture = {
    numero: session.id,
    date_emission: new Date().toISOString().split("T")[0],
    date_echeance: session.metadata?.date_echeance || "2025-06-21",
    client_nom: clientName,
    client_email: clientEmail,
    client_adresse: clientAdresse,
    prix: prixTotal.toFixed(2),
    prixUnitaire,
    quantite,
    description: produit,
  };

  facture.pdfBuffer = await generatePDFBuffer(facture);
  console.log("🧾 Données pour PDF :", {
  numero: session.id,
  date_emission: new Date().toISOString().split("T")[0],
  date_echeance: session.metadata?.date_echeance || "2025-06-21",
  client_nom: clientName,
  client_adresse: clientAdresse,
  prix: prixTotal.toFixed(2),
  prixUnitaire,
  quantite,
  description: produit, // ← c'est la clé ici
});

  return facture;
}
