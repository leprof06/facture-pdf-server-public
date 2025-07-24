import dotenv from "dotenv";
dotenv.config();

export const BASE_ID = "app6t4WYTBZMEUC48";
export const TABLE_NAME = "Clients";
export const AIRTABLE_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;
