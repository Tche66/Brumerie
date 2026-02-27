// netlify/functions/send-email.js
// Fonction Netlify serverless pour l'envoi d'emails via Brevo
// La clé API est stockée dans les variables d'environnement Netlify (JAMAIS dans le code)

exports.handler = async (event) => {
  // CORS headers — permettre les appels depuis le frontend
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Répondre aux preflight OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Vérifier que la clé API est configurée
  if (!process.env.BREVO_API_KEY) {
    console.error('BREVO_API_KEY manquante dans les variables d\'environnement Netlify');
    return {
      statusCode: 500, headers,
      body: JSON.stringify({ error: 'Configuration serveur manquante. Contacte le support.' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Corps de requête invalide' }) };
  }

  const { type, to, name, otp, subject } = body;

  // Valider les champs obligatoires
  if (!to || !type) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Champs manquants : to, type' }) };
  }

  // ── Construire le contenu selon le type d'email ─────────────
  let emailSubject = subject || 'Message de Brumerie';
  let htmlContent  = '';

  if (type === 'otp') {
    if (!otp) return { statusCode: 400, headers, body: JSON.stringify({ error: 'OTP manquant' }) };

    emailSubject = `${otp} — Ton code de vérification Brumerie`;
    htmlContent  = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06)">

        <!-- Header vert -->
        <tr><td style="background:linear-gradient(135deg,#16A34A,#115E2E);padding:40px 32px;text-align:center">
          <img src="https://brumerie.netlify.app/favicon.png" width="72" height="72"
            style="border-radius:18px;margin-bottom:16px;display:block;margin-left:auto;margin-right:auto" alt="Brumerie"/>
          <h1 style="color:#fff;font-size:22px;font-weight:900;margin:0;letter-spacing:-0.5px">Brumerie</h1>
          <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:4px 0 0;font-weight:600;text-transform:uppercase;letter-spacing:1px">
            Le commerce de quartier
          </p>
        </td></tr>

        <!-- Corps -->
        <tr><td style="padding:40px 32px">
          <h2 style="color:#0f172a;font-size:20px;font-weight:900;margin:0 0 8px">
            Bienvenue${name ? ', ' + name : ''} 👋
          </h2>
          <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 28px">
            Pour confirmer ton inscription, entre le code ci-dessous dans l'application Brumerie.
          </p>

          <!-- Bloc OTP -->
          <div style="background:#f8fafc;border:2px dashed #e2e8f0;border-radius:20px;padding:28px 24px;text-align:center;margin-bottom:28px">
            <p style="font-size:52px;font-weight:900;letter-spacing:0.35em;color:#0f172a;margin:0;font-family:monospace">
              ${otp}
            </p>
            <p style="color:#94a3b8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:12px 0 0">
              ⏱ Valable 10 minutes
            </p>
          </div>

          <div style="background:#fef3c7;border-radius:12px;padding:12px 16px;margin-bottom:28px">
            <p style="color:#92400e;font-size:11px;font-weight:700;margin:0;text-align:center">
              🔒 Ne partage jamais ce code. Brumerie ne te le demandera jamais.
            </p>
          </div>

          <p style="color:#94a3b8;font-size:11px;text-align:center;margin:0">
            Si tu n'es pas à l'origine de cette demande, ignore simplement ce message.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #f1f5f9">
          <p style="color:#cbd5e1;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0">
            Brumerie · Abidjan 🇨🇮 · 2025
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
  } else if (type === 'welcome') {
    emailSubject = `Bienvenue sur Brumerie, ${name || ''} 🎉`;
    htmlContent  = `
<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#fff;border-radius:24px;overflow:hidden">
        <tr><td style="background:linear-gradient(135deg,#16A34A,#115E2E);padding:40px;text-align:center">
          <img src="https://brumerie.netlify.app/favicon.png" width="80" height="80"
            style="border-radius:20px;display:block;margin:0 auto 16px" alt="Brumerie"/>
          <h1 style="color:#fff;font-size:24px;font-weight:900;margin:0">Bienvenue !</h1>
        </td></tr>
        <tr><td style="padding:40px">
          <p style="color:#0f172a;font-size:16px;font-weight:700">Salut ${name || 'toi'} 👋</p>
          <p style="color:#64748b;font-size:14px;line-height:1.6">
            Ton compte Brumerie est prêt. Tu peux maintenant explorer les articles de ton quartier,
            acheter, vendre, et rejoindre la communauté commerçante d'Abidjan.
          </p>
          <a href="https://brumerie.netlify.app" 
            style="display:inline-block;background:linear-gradient(135deg,#115E2E,#16A34A);color:#fff;
            font-weight:900;font-size:13px;text-transform:uppercase;letter-spacing:1px;
            padding:16px 32px;border-radius:16px;text-decoration:none;margin-top:16px">
            Ouvrir Brumerie →
          </a>
        </td></tr>
        <tr><td style="padding:20px;text-align:center;background:#f8fafc">
          <p style="color:#cbd5e1;font-size:10px;margin:0;font-weight:700;text-transform:uppercase;letter-spacing:2px">
            Brumerie · Abidjan 🇨🇮
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  } else {
    return { statusCode: 400, headers, body: JSON.stringify({ error: `Type inconnu : ${type}` }) };
  }

  // ── Appel API Brevo ──────────────────────────────────────────
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept':       'application/json',
        'api-key':      process.env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name:  'Brumerie côte d\'ivoire',
          email: 'contact.brumerie@gmail.com',
        },
        to: [{ email: to, name: name || to }],
        subject: emailSubject,
        htmlContent,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Brevo error:', result);
      return {
        statusCode: 502, headers,
        body: JSON.stringify({ error: 'Erreur Brevo', detail: result }),
      };
    }

    console.log('Email envoyé avec succès à', to, '| type:', type, '| messageId:', result.messageId);
    return {
      statusCode: 200, headers,
      body: JSON.stringify({ success: true, messageId: result.messageId }),
    };

  } catch (err) {
    console.error('Erreur fetch Brevo:', err);
    return {
      statusCode: 500, headers,
      body: JSON.stringify({ error: 'Erreur réseau lors de l\'envoi' }),
    };
  }
};
