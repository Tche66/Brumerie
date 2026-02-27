// netlify/functions/send-email.js
// Gère TOUT l'OTP : génération, stockage en mémoire, envoi Brevo, vérification
// Aucune dépendance Firestore = aucun problème de règles Firebase

// Stockage OTP en mémoire (durée de vie de la Function instance ~15min)
// Format: { email → { code, expires, attempts } }
const otpStore = new Map();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function cleanExpired() {
  const now = Date.now();
  for (const [key, val] of otpStore.entries()) {
    if (val.expires < now) otpStore.delete(key);
  }
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'JSON invalide' }) }; }

  const { action } = body;

  // ── ACTION : send_otp — génère + stocke + envoie l'email ──────
  if (action === 'send_otp') {
    const { email, name } = body;
    if (!email || !name) return { statusCode: 400, headers, body: JSON.stringify({ error: 'email et name requis' }) };
    if (!process.env.BREVO_API_KEY) {
      console.error('BREVO_API_KEY manquante');
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Configuration manquante' }) };
    }

    cleanExpired();

    // Anti-spam : max 3 envois par email en 10 min
    const existing = otpStore.get(email.toLowerCase());
    if (existing && existing.sendCount >= 3 && existing.expires > Date.now()) {
      return { statusCode: 429, headers, body: JSON.stringify({ error: 'Trop de tentatives. Attends 10 minutes.' }) };
    }

    const code    = generateOTP();
    const expires = Date.now() + 10 * 60 * 1000; // 10 min
    otpStore.set(email.toLowerCase(), {
      code,
      expires,
      attempts:  0,
      sendCount: (existing?.sendCount || 0) + 1,
    });

    // Envoyer via Brevo
    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
  <tr><td align="center">
  <table width="100%" style="max-width:480px;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <tr><td style="background:linear-gradient(135deg,#16A34A,#115E2E);padding:40px 32px;text-align:center">
      <div style="width:72px;height:72px;background:rgba(255,255,255,0.2);border-radius:20px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
      </div>
      <h1 style="color:#fff;font-size:24px;font-weight:900;margin:0 0 4px">Brumerie</h1>
      <p style="color:rgba(255,255,255,0.75);font-size:11px;margin:0;text-transform:uppercase;letter-spacing:2px">Vérification email</p>
    </td></tr>
    <tr><td style="padding:40px 32px">
      <h2 style="color:#0f172a;font-size:20px;font-weight:900;margin:0 0 8px">Bienvenue, ${name} 👋</h2>
      <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 28px">
        Entre ce code dans l'application pour confirmer ton adresse email et créer ton compte.
      </p>
      <div style="background:#f8fafc;border:2px dashed #e2e8f0;border-radius:20px;padding:28px;text-align:center;margin:0 0 20px">
        <p style="font-size:54px;font-weight:900;letter-spacing:0.4em;color:#0f172a;margin:0;font-family:monospace">${code}</p>
        <p style="color:#94a3b8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:12px 0 0">⏱ Valable 10 minutes</p>
      </div>
      <div style="background:#fef9c3;border-radius:12px;padding:12px 16px;margin:0 0 20px">
        <p style="color:#713f12;font-size:11px;font-weight:700;margin:0;text-align:center">
          📬 Tu ne trouves pas cet email ? Vérifie ton dossier <strong>Spam / Courrier indésirable</strong>
        </p>
      </div>
      <p style="color:#94a3b8;font-size:11px;text-align:center;margin:0">
        Si tu n'es pas à l'origine de cette demande, ignore ce message.
      </p>
    </td></tr>
    <tr><td style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #f1f5f9">
      <p style="color:#cbd5e1;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0">
        Brumerie · Abidjan 🇨🇮 · contact.brumerie@gmail.com
      </p>
    </td></tr>
  </table>
  </td></tr>
</table>
</body>
</html>`;

    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method:  'POST',
        headers: { 'accept': 'application/json', 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json' },
        body: JSON.stringify({
          sender:      { name: "Brumerie côte d'ivoire", email: 'contact.brumerie@gmail.com' },
          to:          [{ email, name }],
          subject:     `${code} — Ton code de vérification Brumerie`,
          htmlContent,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error('Brevo error:', JSON.stringify(data));
        // On garde quand même le code stocké pour ne pas bloquer
        return { statusCode: 502, headers, body: JSON.stringify({ error: 'Erreur envoi email', detail: data.message || '' }) };
      }

      console.log(`OTP envoyé à ${email}, messageId: ${data.messageId}`);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };

    } catch (err) {
      console.error('Fetch Brevo failed:', err.message);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Erreur réseau Brevo' }) };
    }
  }

  // ── ACTION : verify_otp — vérifie le code ─────────────────────
  if (action === 'verify_otp') {
    const { email, code } = body;
    if (!email || !code) return { statusCode: 400, headers, body: JSON.stringify({ error: 'email et code requis' }) };

    const entry = otpStore.get(email.toLowerCase());

    if (!entry)                     return { statusCode: 200, headers, body: JSON.stringify({ result: 'invalid' }) };
    if (entry.expires < Date.now()) { otpStore.delete(email.toLowerCase()); return { statusCode: 200, headers, body: JSON.stringify({ result: 'expired' }) }; }

    // Anti-brute force : max 5 essais
    entry.attempts = (entry.attempts || 0) + 1;
    if (entry.attempts > 5) { otpStore.delete(email.toLowerCase()); return { statusCode: 200, headers, body: JSON.stringify({ result: 'invalid', reason: 'too_many_attempts' }) }; }

    if (entry.code !== code.trim()) return { statusCode: 200, headers, body: JSON.stringify({ result: 'invalid' }) };

    // ✅ Code valide → supprimer
    otpStore.delete(email.toLowerCase());
    return { statusCode: 200, headers, body: JSON.stringify({ result: 'valid' }) };
  }

  // ── ACTION : welcome — email de bienvenue ─────────────────────
  if (action === 'welcome') {
    const { email, name } = body;
    if (!email || !process.env.BREVO_API_KEY) return { statusCode: 200, headers, body: JSON.stringify({ skipped: true }) };

    const htmlWelcome = `
<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:0;background:#f8fafc;font-family:sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
<tr><td align="center"><table width="100%" style="max-width:480px;background:#fff;border-radius:24px;overflow:hidden">
<tr><td style="background:linear-gradient(135deg,#16A34A,#115E2E);padding:40px;text-align:center">
  <h1 style="color:#fff;font-size:26px;font-weight:900;margin:0">🎉 Bienvenue sur Brumerie !</h1>
</td></tr>
<tr><td style="padding:40px">
  <p style="color:#0f172a;font-size:16px;font-weight:700;margin:0 0 12px">Salut ${name || ''} 👋</p>
  <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 24px">
    Ton compte est créé et vérifié. Explore les articles près de chez toi, achète, vends et rejoins la communauté Brumerie d'Abidjan !
  </p>
  <a href="https://brumerie.netlify.app" style="display:inline-block;background:linear-gradient(135deg,#115E2E,#16A34A);color:#fff;font-weight:900;font-size:13px;text-transform:uppercase;letter-spacing:1px;padding:16px 32px;border-radius:16px;text-decoration:none">
    Ouvrir Brumerie →
  </a>
</td></tr>
<tr><td style="padding:20px;text-align:center;background:#f8fafc;border-top:1px solid #f1f5f9">
  <p style="color:#cbd5e1;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0">Brumerie · Abidjan 🇨🇮</p>
</td></tr>
</table></td></tr></table>
</body></html>`;

    fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'accept': 'application/json', 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({
        sender: { name: "Brumerie côte d'ivoire", email: 'contact.brumerie@gmail.com' },
        to: [{ email, name: name || email }],
        subject: `Bienvenue sur Brumerie, ${name || ''} 🎉`,
        htmlContent: htmlWelcome,
      }),
    }).catch(console.warn);

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  }

  return { statusCode: 400, headers, body: JSON.stringify({ error: `Action inconnue: ${action}` }) };
};
