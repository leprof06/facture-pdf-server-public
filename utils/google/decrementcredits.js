// /utils/airtable/decrementCredits.js
import fetch from "node-fetch";
import dotenv from "dotenv";
import { AIRTABLE_URL } from "./constantes.js";

dotenv.config();

export async function decrementCredits(email) {
  const response = await fetch(`${AIRTABLE_URL}?filterByFormula={Email}='${email}'`, {
    headers: {
      Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Erreur lors de la lecture Airtable : ${errorData}`);
  }

  const data = await response.json();
  if (data.records && data.records.length === 0) return;

  const record = data.records[0];
  const id = record.id;
  const current = record.fields["Crédits restants"] || 0;
  const updated = current > 0 ? current - 1 : 0;

  await fetch(`${AIRTABLE_URL}/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        "Crédits restants": updated,
      },
    }),
  });

  console.log(`🔄 Crédit mis à jour : ${current} → ${updated}`);
}
