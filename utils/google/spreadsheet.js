// /utils/google/spreadsheet.js
import { google } from "googleapis";
import { authorizeGoogle } from "../../config/auth.js";

const SPREADSHEET_ID = "1EDW7_34dnjCHBtqd4jXrYgOB8HovgPdXcuod1k3_i4A"; // Remplace par ton ID correct
const RANGE = "Clients!A2:G";

export async function findClientByEmail(email) {
  const auth = await authorizeGoogle();
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
  });

  const rows = res.data.values;
  if (!rows) return null;

  const index = rows.findIndex((row) => row[1]?.split(',').map(e => e.trim()).includes(email));
  return index !== -1 ? { rowIndex: index + 2, data: rows[index] } : null;
}

export async function updateClient(rowIndex, updatedData) {
  const auth = await authorizeGoogle();
  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Clients!A${rowIndex}:G${rowIndex}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [updatedData],
    },
  });
}

export async function addNewClient(data) {
  const auth = await authorizeGoogle();
  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
    valueInputOption: "RAW",
    requestBody: {
      values: [data],
    },
  });
}
