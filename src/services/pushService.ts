// src/services/pushService.ts
// Gestion Push PWA via Service Worker (sans Firebase Functions)
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

// VAPID public key (génère la tienne sur https://vapidkeys.com)
// Pour l'instant on utilise une clé de démonstration
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

// ── Demander permission + s'abonner ───────────────────────
export async function requestPushPermission(userId: string): Promise<boolean> {
  try {
    if (!('Notification' in window)) return false;
    if (!('serviceWorker' in navigator)) return false;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    if (!VAPID_PUBLIC_KEY) {
      // Pas de clé VAPID → on active juste les notifs in-app
      console.info('[Push] No VAPID key — in-app only mode');
      await updateDoc(doc(db, 'users', userId), { pushEnabled: true, pushToken: null });
      return true;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    // Sauvegarder l'abonnement dans Firestore pour le Sprint 4 (Cloud Functions)
    await updateDoc(doc(db, 'users', userId), {
      pushEnabled: true,
      pushSubscription: JSON.stringify(subscription),
      pushToken: null,
    });

    return true;
  } catch (e) {
    console.error('[Push] requestPermission error:', e);
    return false;
  }
}

// ── Afficher notification PWA locale ──────────────────────
// Fonctionne quand l'app est en arrière-plan (PWA installée)
export async function showLocalPushNotification(
  title: string,
  body: string,
  data?: { conversationId?: string; productId?: string; type?: string },
): Promise<void> {
  try {
    if (!('serviceWorker' in navigator)) return;
    if (Notification.permission !== 'granted') return;

    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      body,
      icon: '/favicon.png',
      badge: '/favicon.png',
      tag: data?.conversationId || data?.productId || 'brumerie',
      renotify: true,
      vibrate: [100, 50, 100],
      data: data || {},
    });
  } catch (e) {
    console.error('[Push] showLocalPush error:', e);
  }
}

// ── Désactiver notifications ───────────────────────────────
export async function disablePushNotifications(userId: string): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) await subscription.unsubscribe();
    await updateDoc(doc(db, 'users', userId), { pushEnabled: false, pushSubscription: null });
  } catch (e) { console.error('[Push] disable error:', e); }
}

// ── Vérifier si les notifs sont activées ──────────────────
export function isPushGranted(): boolean {
  return 'Notification' in window && Notification.permission === 'granted';
}
