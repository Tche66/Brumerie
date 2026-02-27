// src/services/otpService.ts — OTP via Netlify Function + Brevo
import { doc, setDoc, getDoc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '@/config/firebase';

// ── Générer un code OTP à 6 chiffres ──────────────────────────
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── Stocker le code OTP dans Firestore ─────────────────────────
export async function storeOTP(email: string, code: string): Promise<void> {
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  await setDoc(doc(db, 'otp_verifications', email.toLowerCase()), {
    code,
    expires,
    createdAt: new Date(),
  });
}

// ── Vérifier le code OTP ───────────────────────────────────────
export async function verifyOTP(
  email: string, code: string
): Promise<'valid' | 'expired' | 'invalid'> {
  const snap = await getDoc(doc(db, 'otp_verifications', email.toLowerCase()));
  if (!snap.exists()) return 'invalid';

  const data    = snap.data();
  const expires = data.expires?.toDate ? data.expires.toDate() : new Date(data.expires);

  if (new Date() > expires) return 'expired';
  if (data.code !== code.trim()) return 'invalid';

  // Invalider le code après usage
  await updateDoc(doc(db, 'otp_verifications', email.toLowerCase()), {
    code: deleteField(),
    verified: true,
    verifiedAt: new Date(),
  });

  return 'valid';
}

// ── Envoyer l'OTP via Netlify Function → Brevo ─────────────────
export async function sendOTPEmail(
  email: string, code: string, name: string
): Promise<void> {
  const endpoint = '/.netlify/functions/send-email';

  const res = await fetch(endpoint, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'otp',
      to:   email,
      name,
      otp:  code,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('[sendOTPEmail] Brevo error:', err);
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  const result = await res.json();
  console.log('[sendOTPEmail] Envoyé, messageId:', result.messageId);
}

// ── Envoyer un email de bienvenue (après inscription validée) ──
export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  await fetch('/.netlify/functions/send-email', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'welcome', to: email, name }),
  });
}
