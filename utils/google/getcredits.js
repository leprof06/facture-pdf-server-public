// /utils/airtable/getCredits.js
import fetch from "node-fetch";
import dotenv from "dotenv";
import { AIRTABLE_URL } from "./constantes.js";

dotenv.config();

export async function getCredits(email) {
  const response = await fetch(`${AIRTABLE_URL}?filterByFormula={Email}='${email}'`, {
    headers: {
      Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Erreur lors de la récupération des crédits : ${errorData}`);
  }

  const data = await response.json();
  if (data.records && data.records.length === 0) return 0;
  const record = data.records[0];
  return record.fields["Crédits restants"] || 0;
}
