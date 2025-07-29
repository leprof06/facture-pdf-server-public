# Guide d'installation – Facture PDF Server

Ce guide explique pas à pas comment configurer ce projet pour une utilisation personnelle ou professionnelle. Vous apprendrez à :

- créer les fichiers requis sur Google Sheets,
- configurer les accès API (Google, Stripe, Gmail),
- et adapter les fichiers `.env` pour un déploiement réussi.

---

## 1. Créer et configurer un Google Sheets

### a. Créer un fichier Google Sheets

1. Allez sur [Google Sheets](https://sheets.google.com).
2. Créez un nouveau fichier.
3. Créez plusieurs feuilles dans ce document :
   - `Clients`
   - `Achats`
   - `Crédits`
   - `Produits spéciaux`
   - `Tarifs`

### b. Partager le fichier

1. Cliquez sur "Partager".
2. Donnez un accès **"Éditeur"** à l'adresse e-mail du service Google (visible dans le JSON du compte de service).

---

## 2. Activer les APIs Google (Sheets, Drive, Calendar)

### a. Accéder à Google Cloud Console

- [https://console.cloud.google.com](https://console.cloud.google.com)

### b. Créer un projet

1. Cliquez sur "Créer un projet".
2. Donnez-lui un nom (ex. `facture-serveur`).

### c. Activer les API suivantes

Dans "API & Services > Bibliothèque" :

- **Google Sheets API**
- **Google Drive API**
- **Google Calendar API**

### d. Créer un compte de service

1. Allez dans "Identifiants" > "Créer des identifiants" > "Compte de service".
2. Une fois créé, allez dans ce compte et créez une **clé JSON**.
3. Téléchargez le fichier `.json` et placez-le dans le projet (⚠️ ne pas inclure dans GitHub public).

---

## 3. Configuration Stripe

### a. Créer un compte Stripe

- [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)

### b. Créer un produit + lien de paiement

1. Créez un **produit** avec nom, tarif, etc.
2. Créez un **lien de paiement**.
3. Dans les paramètres de webhook, ajoutez l'URL de votre serveur, ex. :
   ```
   ```

[https://votre-serveur.vercel.app/api/webhook-stripe\`\`\`](https://votre-serveur.vercel.app/api/webhook-stripe```) avec l’événement `checkout.session.completed`.

### c. Récupérer les clés API Stripe

1. Dans "Développeurs > Clés API" :
   - STRIPE\_SECRET\_KEY\_LIVE
   - STRIPE\_SECRET\_KEY\_TEST
   - STRIPE\_WEBHOOK\_SECRET

---

## 4. Configuration Gmail (envoi de mails)

### a. Activer l'accès à Gmail

- Créez un mot de passe d’application dans les paramètres de votre compte Google (sécurité > mot de passe application).
- Utilisez ce mot de passe comme `GMAIL_PASS` dans le `.env`

---

## 5. Créer le fichier `.env`

```
# Stripe
STRIPE_SECRET_KEY_LIVE=sk_live_***
STRIPE_SECRET_KEY_TEST=sk_test_***
STRIPE_WEBHOOK_SECRET=whsec_***

# Gmail
GMAIL_USER=votre.email@gmail.com
GMAIL_PASS=motdepasseapplication

# Google
SPREADSHEET_ID=ID_de_votre_fichier_Google_Sheets
CALENDAR_ID=id_google_calendar@group.calendar.google.com
GOOGLE_APPLICATION_CREDENTIALS=chemin/vers/votre/clé.json
```

---

## 6. Déploiement

- Vous pouvez utiliser [Vercel](https://vercel.com), [Render](https://render.com) ou tout autre hébergeur Node.js.
- Assurez-vous d’ajouter les variables d’environnement dans le dashboard de votre hébergeur.

---

## 7. Facultatif : adaptation du modèle de facture

Le fichier `facture_template.html` contient le design de la facture.

- Remplacez les informations par défaut (ex. : SIREN, adresse, logo) par vos propres données.
- Ne jamais inclure ce fichier personnalisé dans un dépôt public sans modification.

---

## 8. Test et validation

1. Lancez le serveur localement :

```bash
npm install
npm run dev
```

2. Effectuez un achat test via Stripe.
3. Vérifiez :
   - que la facture PDF est bien envoyée,
   - que l’entrée est bien créée dans Google Sheets,
   - que l’email est reçu.

---

> 💡 En cas de problème, vérifiez :
>
> - que le fichier JSON est correct et bien utilisé,
> - que le service Google a les droits d’édition sur le fichier Google Sheets,
> - que toutes les APIs sont activées dans Google Cloud Console.

