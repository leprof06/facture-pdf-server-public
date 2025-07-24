# 🧾 Projet personnel – Automatisation factures + réservations (Yann)

Ce projet privé regroupe tous les scripts et intégrations nécessaires pour gérer automatiquement :
- la facturation après paiement Stripe,
- la génération de factures PDF,
- l’envoi de mails aux clients,
- l’attribution et la consommation de crédits de cours,
- la réservation des cours via Google Calendar,
- la gestion spécifique pour les formations (accès sécurisé sans réservation),
- les ebooks (envoi de lien sécurisé),
- les relances automatiques (crédits à zéro, notification admin).

---

## 🔁 Fonctionnement général

1. 🧾 Un client effectue un paiement via **Stripe Checkout**
2. 📄 Une **facture PDF** est générée automatiquement
3. 📧 Le client reçoit :
   - la facture
   - le lien de réservation (si cours)
   - ou le mot de passe / lien ebook (si formation ou produit numérique)
4. 📊 Les crédits sont enregistrés dans **Google Sheets**
5. 🗓️ Le lien Google Calendar permet au client de réserver ses créneaux, et décrémente les crédits automatiquement
6. 📩 Si le client n’a plus de crédit → il reçoit une alerte, l’admin aussi
7. 🧠 Toutes les données clients (email, produits, crédits restants) sont stockées sur Google Sheets

---

## 📦 Architecture des dossiers (privée)

```
utils/
├── email/                  → envoi des mails, factures, alertes
├── google/                 → auth + gestion Sheets + Calendar
├── produits/               → logique formation / ebook / cours
api/                        → Webhook Stripe (point d’entrée principal)
config/                     → credentials + token oauth
```

---

## 🔒 Fichiers sensibles à ne pas publier :

- `.env`
- `tokens/`
- `config/credentials.json`
- `render.yaml`

➡️ Tous déjà listés dans `.gitignore`

---

## ✅ Déploiement actuel

- Déployé sur Vercel (projet privé)
- Variables d’environnement désormais toutes renseignées dans Vercel
- Stripe + Google APIs fonctionnels
- Fichier `webhook-orchestrateur.js` = point d’entrée principal

---

📁 Ce dépôt contient toute la logique complète, non allégée. Il sert de **sauvegarde de référence personnelle**.
Tu peux le dupliquer pour mise à jour, archivage, ou création d’une version publique allégée.

---

© Yann Martinez – Support & Learn