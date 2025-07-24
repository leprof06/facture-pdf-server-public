export const factureTemplate = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Facture {{numero}}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    header, footer { margin-bottom: 30px; }
    .flex { display: flex; justify-content: space-between; }
    .table { width: 100%; border-collapse: collapse; margin-top: 30px; }
    .table th, .table td { border: 1px solid #ccc; padding: 8px; text-align: right; }
    .table th:first-child, .table td:first-child { text-align: left; }
    .logo { height: 70px; }
    .bold { font-weight: bold; }
    .footer-note { font-size: 12px; margin-top: 40px; }
  </style>
</head>
<body>
  <header class="flex">
    <div>
      <h1>Facture</h1>
      <p><strong>Numéro de facture :</strong> {{numero}}<br/>
         <strong>Date d'émission :</strong> {{date_emission}}<br/>
         <strong>Date d'échéance :</strong> {{date_echeance}}</p>
    </div>
    <div>
      <img src="https://facturestripe.vercel.app/logo-facture.jpg" alt="logo" class="logo"/>
    </div>
  </header>

  <section>
    <p><strong>Support & Learn with Yann</strong><br/>
    Résidence du château bâtiment 3 escalier 6<br/>
    06730 SAINT-ANDRÉ-DE-LA-ROCHE<br/>
    France<br/>
    +33 6 50 55 61 03</p>

    <p><strong>Facturé à :</strong><br/>
    {{client_nom}}<br/>
    {{client_adresse}}</p>

    <p class="bold">{{prix}} € dus le {{date_echeance}}</p>
  </section>

  <table class="table">
    <tr>
      <th>Description</th>
      <th>Qté</th>
      <th>Prix unitaire</th>
      <th>Montant</th>
    </tr>
    <tr>
      <td>{{description}}</td>
      <td>{{quantite}}</td>
      <td>{{prixUnitaire}} €</td>
      <td>{{prix}} €</td>
    </tr>
    <tr>
      <td colspan="3"><strong>Montant dû</strong></td>
      <td><strong>{{prix}} €</strong></td>
    </tr>
  </table>

  <footer class="footer-note">
    SIREN 829 343 029 – TVA non applicable, art. 293 B du CGI
  </footer>
</body>
</html>
`;
