// src/services/referralService.ts — Système de parrainage Brumerie
import {
  doc, getDoc, updateDoc, collection, query, where, getDocs, increment
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { REFERRAL_REWARDS } from '@/types';

// ── Générer un code unique basé sur le nom + 4 chars aléatoires ──
export function generateReferralCode(name: string): string {
  const base = name
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 5) || 'USER';
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${base}-${rand}`;
}

// ── Assigner un code parrainage à l'user s'il n'en a pas encore ──
export async function ensureReferralCode(uid: string, name: string): Promise<string> {
  const userRef = doc(db, 'users', uid);
  const snap    = await getDoc(userRef);
  if (!snap.exists()) throw new Error('User not found');

  const data = snap.data();
  if (data.referralCode) return data.referralCode;

  // Générer un code et s'assurer de l'unicité
  let code = generateReferralCode(name);
  let attempts = 0;
  while (attempts < 10) {
    const q = query(collection(db, 'users'), where('referralCode', '==', code));
    const existing = await getDocs(q);
    if (existing.empty) break;
    code = generateReferralCode(name);
    attempts++;
  }

  await updateDoc(userRef, { referralCode: code });
  return code;
}

// ── Récupérer l'user propriétaire d'un code parrainage ──────────
export async function getUserByReferralCode(code: string): Promise<string | null> {
  if (!code.trim()) return null;
  const q    = query(collection(db, 'users'), where('referralCode', '==', code.toUpperCase()));
  const snap = await getDocs(q);
  return snap.empty ? null : snap.docs[0].id;
}

// ── Appliquer le parrainage lors de l'inscription ────────────────
export async function applyReferral(newUserId: string, referralCode: string): Promise<boolean> {
  const referrerId = await getUserByReferralCode(referralCode);
  if (!referrerId || referrerId === newUserId) return false;

  // Marquer le nouvel user comme parrainé
  await updateDoc(doc(db, 'users', newUserId), { referredBy: referrerId });

  // Incrémenter le compteur du parrain
  const referrerRef = doc(db, 'users', referrerId);
  const referrerSnap = await getDoc(referrerRef);
  if (!referrerSnap.exists()) return false;

  const referrerData = referrerSnap.data();
  const newCount = (referrerData.referralCount || 0) + 1;

  // Calculer les paliers débloqués
  const rewards = REFERRAL_REWARDS.filter(r => r.threshold <= newCount);
  const topReward = rewards[rewards.length - 1];

  const updateData: Record<string, any> = { referralCount: increment(1) };

  if (topReward) {
    updateData.referralBonusPublications = topReward.extraPublications;
    updateData.referralBonusChats        = topReward.extraChats;
    if (topReward.freeVerified && !referrerData.referralFreeVerifiedUntil) {
      // Offrir 30 jours de badge vérifié
      const until = new Date();
      until.setDate(until.getDate() + 30);
      updateData.referralFreeVerifiedUntil = until;
      updateData.isVerified = true; // activer temporairement
    }
  }

  await updateDoc(referrerRef, updateData);
  return true;
}

// ── Obtenir les stats parrainage d'un utilisateur ───────────────
export async function getReferralStats(uid: string) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    code:               data.referralCode   || '',
    count:              data.referralCount  || 0,
    bonusPublications:  data.referralBonusPublications || 0,
    bonusChats:         data.referralBonusChats        || 0,
    freeVerifiedUntil:  data.referralFreeVerifiedUntil || null,
  };
}

// ── Générer le lien de parrainage ───────────────────────────────
export function buildReferralLink(code: string): string {
  const base = window.location.origin;
  return `${base}?ref=${code}`;
}
