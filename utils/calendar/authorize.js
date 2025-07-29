// ✅ utils/calendar/authorize.js — ancienne version avec lecture directe supprimée
// 🔁 Version actuelle : tout est centralisé dans config/auth.js

import { authorizeGoogle } from "../../config/auth.js";

// 🧼 Cette fonction remplace entièrement l'ancienne logique manuelle
// de lecture des fichiers token.json et credential.json avec fs/promises
// Elle garantit que les appels Google utilisent l'authentification JWT unique

export default authorizeGoogle;
