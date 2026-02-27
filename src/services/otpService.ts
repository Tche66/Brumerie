// src/services/otpService.ts — Vérification email OTP à l'inscription
// Utilise Firebase Functions (ou EmailJS comme fallback sans backend)
import { doc, setDoc, getDoc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '@/config/firebase';

// ── Générer un code OTP à 6 chiffres ─────────────────────────
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── Stocker le code OTP dans Firestore (collection temporaire) ─
export async function storeOTP(email: string, code: string): Promise<void> {
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  await setDoc(doc(db, 'otp_verifications', email.toLowerCase()), {
    code,
    expires,
    createdAt: new Date(),
  });
}

// ── Vérifier le code OTP ──────────────────────────────────────
export async function verifyOTP(email: string, code: string): Promise<'valid' | 'expired' | 'invalid'> {
  const snap = await getDoc(doc(db, 'otp_verifications', email.toLowerCase()));
  if (!snap.exists()) return 'invalid';

  const data = snap.data();
  const expires = data.expires?.toDate ? data.expires.toDate() : new Date(data.expires);

  if (new Date() > expires) return 'expired';
  if (data.code !== code.trim()) return 'invalid';

  // Supprimer le code après validation
  await updateDoc(doc(db, 'otp_verifications', email.toLowerCase()), {
    code: deleteField(),
    verified: true,
    verifiedAt: new Date(),
  });

  return 'valid';
}

// ── Envoyer le code via EmailJS (sans backend) ────────────────
// Configure EmailJS sur https://www.emailjs.com (gratuit jusqu'à 200 emails/mois)
// Ou utilise Firebase Extensions "Trigger Email" avec SendGrid/Mailgun

export async function sendOTPEmail(email: string, code: string, name: string): Promise<void> {
  // Option 1 : EmailJS (sans backend)
  // const EMAILJS_SERVICE_ID  = 'service_XXXXXXX';
  // const EMAILJS_TEMPLATE_ID = 'template_XXXXXXX';
  // const EMAILJS_PUBLIC_KEY  = 'XXXXXXXXXXXXXXXXX';

  // Pour l'instant : stocker dans Firestore et utiliser Firebase Extension "Trigger Email"
  // qui envoie automatiquement les emails depuis la collection "mail"
  await setDoc(doc(db, 'mail', `${email}-${Date.now()}`), {
    to: email,
    message: {
      subject: `${code} — Ton code de vérification Brumerie`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 16px">
          <div style="text-align:center;margin-bottom:24px">
            <img src="https://brumerie.netlify.app/favicon.png" alt="Brumerie" width="80" height="80" style="border-radius:20px"/>
          </div>
          <h1 style="text-align:center;font-weight:900;color:#0f172a;font-size:22px;margin-bottom:8px">
            Bienvenue, ${name} 👋
          </h1>
          <p style="text-align:center;color:#64748b;font-size:14px;margin-bottom:32px">
            Entre ce code dans l'application pour confirmer ton email :
          </p>
          <div style="background:#f8fafc;border:2px dashed #e2e8f0;border-radius:20px;padding:24px;text-align:center;margin-bottom:24px">
            <p style="font-size:48px;font-weight:900;letter-spacing:0.3em;color:#0f172a;margin:0">
              ${code}
            </p>
            <p style="color:#94a3b8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-top:8px">
              Valable 10 minutes
            </p>
          </div>
          <p style="text-align:center;color:#94a3b8;font-size:11px">
            Si tu n'es pas à l'origine de cette inscription, ignore ce message.
          </p>
          <div style="text-align:center;margin-top:32px;padding-top:24px;border-top:1px solid #f1f5f9">
            <p style="color:#cbd5e1;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.2em">
              Brumerie · Abidjan 🇨🇮
            </p>
          </div>
        </div>
      `,
    },
  });
}
