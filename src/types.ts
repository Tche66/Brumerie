// src/types.ts — Sprint 7

// ─── QUARTIERS ───────────────────────────────────────────
export const NEIGHBORHOODS = [
  'Yopougon','Cocody','Abobo','Adjamé','Plateau','Marcory','Treichville',
  'Koumassi','Port-Bouët','Attécoubé','Bingerville','Songon','Jacqueville',
  'Braffedon','Deux-Plateaux','Riviera','Angré','Bonoumin',
  'Palmeraie','Sogefiha','Williamsville','Gbagba','Avocatier','Biabou',
  'Locodjro','Selmer','Belleville','Niangon','Sideci','Doukouré',
  'Wassakara','Sagbé','Ancien Agban','Banco','Baoulé','Belleville-Yop',
  'Dar-es-Salam','Doukouré Sud','Gesco',
];

export const CITIES = ['Abidjan','Bouaké','Yamoussoukro','San-Pédro','Korhogo'];
const MAX_CITIES = 3;
export { MAX_CITIES };

// ─── CATÉGORIES ──────────────────────────────────────────
export const CATEGORIES = [
  { id: 'fashion',      label: 'Mode & Prêt-à-porter',    icon: '👗' },
  { id: 'shoes',        label: 'Chaussures & Sneakers',   icon: '👟' },
  { id: 'beauty',       label: 'Beauté & Mèches',         icon: '💇‍♀️' },
  { id: 'phones',       label: 'High-Tech & Smartphones', icon: '📱' },
  { id: 'accessories',  label: 'Accessoires & Montres',   icon: '⌚' },
  { id: 'electronics',  label: 'Électroménager',          icon: '📺' },
  { id: 'food',         label: 'Alimentation & Épicerie', icon: '🧺' },
  { id: 'babies',       label: 'Univers Bébé',            icon: '🍼' },
  { id: 'furniture',    label: 'Maison & Déco',           icon: '🖼️' },
  { id: 'services',     label: 'Services & Prestations',  icon: '🛠️' },
];

// ─── PAIEMENT MOBILE ──────────────────────────────────────
export const MOBILE_PAYMENT_METHODS = [
  { id: 'wave',  name: 'Wave',             logo: '/assets/payments/wave.png',   color: '#1BA6F9' },
  { id: 'om',    name: 'Orange Money',     logo: '/assets/payments/orange.png', color: '#FF7900' },
  { id: 'mtn',   name: 'MTN Mobile Money', logo: '/assets/payments/mtn.jpg',    color: '#FFCC00' },
  { id: 'moov',  name: 'Moov Money',       logo: '/assets/payments/moov.png',   color: '#FF6B00' },
];

export const BRUMERIE_FEE_PERCENT = 0; // MVP — pas de commission
export const SUPPORT_EMAIL = 'support@brumerie.com';
export const SUPPORT_WHATSAPP = '2250586867693';
export const VERIFICATION_PRICE = 2000; // FCFA/mois — badge VÉRIFIÉ
export const PREMIUM_PRICE = 5000;      // FCFA/mois — badge PREMIUM (futur)

// Limites par plan
export const PLAN_LIMITS = {
  simple:   { products: 5,  dailyChats: 5,  boost: 0   },
  verified: { products: 20, dailyChats: 999, boost: 20  },
  premium:  { products: 999, dailyChats: 999, boost: 100 },
} as const;

// ─── USER ─────────────────────────────────────────────────
export interface User {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone?: string;
  neighborhood?: string;
  photoURL?: string;
  role: 'buyer' | 'seller';
  isVerified?: boolean;
  isPremium?: boolean;
  tier?: 'simple' | 'verified' | 'premium';   // Plan actuel du vendeur
  dailyChatCount?: number;    // Compteur chats du jour (reset à minuit)
  lastChatReset?: string;     // Date ISO du dernier reset
  productCount?: number;      // Nb d'articles actifs (pour limite)
  hasPhysicalShop?: boolean;
  managesDelivery?: boolean;
  bio?: string;
  rating?: number;
  reviewCount?: number;
  contactCount?: number;
  bookmarkedProductIds: string[];
  defaultPaymentMethods?: PaymentInfo[];
  deliveryPriceSameZone?: number;
  deliveryPriceOtherZone?: number;
  createdAt?: any;
  // Sprint 7 — Boutique personnalisable
  shopThemeColor?: string;   // ex: '#16A34A'
  shopBanner?: string;       // URL image bannière
  shopSlogan?: string;       // ex: "La mode à prix imbattable"
}

// ─── PRODUCT ──────────────────────────────────────────────
export type ProductStatus = 'active' | 'sold' | 'paused';

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;   // Prix avant réduction (optionnel)
  category: string;
  neighborhood: string;
  neighborhoods?: string[];
  images: string[];
  sellerId: string;
  sellerName: string;
  sellerPhone?: string;
  sellerPhoto?: string;
  sellerVerified?: boolean;
  sellerPremium?: boolean;
  status: ProductStatus;
  whatsappClickCount?: number;
  viewCount?: number;
  bookmarkCount?: number;
  priceHistory?: { price: number; date: string }[];
  createdAt?: any;
  paymentMethods?: PaymentInfo[];
}

// ─── MESSAGING ────────────────────────────────────────────
export type MessageType = 'text' | 'product_card' | 'system';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  type: MessageType;
  text?: string;
  productRef?: {
    id: string; title: string; price: number; image: string; sellerId: string;
  };
  readBy: string[];
  createdAt: any;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantsInfo: Record<string, { name: string; photo?: string; isVerified?: boolean }>;
  lastMessage?: string;
  lastMessageAt?: any;
  lastSenderId?: string;
  productRef?: { id: string; title: string; price: number; image: string; sellerId: string };
  unreadCount?: Record<string, number>;
  createdAt?: any;
}

// ─── NOTIFICATIONS ────────────────────────────────────────
export type NotificationType = 'message' | 'new_favorite' | 'system';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  data?: Record<string, any>;
  createdAt: any;
}

// ─── PAIEMENT ─────────────────────────────────────────────
export interface PaymentInfo {
  method: string;
  phone: string;
  holderName: string;
  waveLink?: string;
}

// ─── COMMANDES ────────────────────────────────────────────
export type OrderStatus = 'initiated' | 'proof_sent' | 'confirmed' | 'delivered' | 'disputed' | 'cancelled';

export interface OrderProof {
  screenshotUrl: string;
  transactionRef: string;
  submittedAt: any;
}

export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerPhoto?: string;
  sellerId: string;
  sellerName: string;
  sellerPhoto?: string;
  productId: string;
  productTitle: string;
  productImage: string;
  productPrice: number;
  deliveryFee: number;
  totalAmount: number;
  brumerieFee: number;
  sellerReceives: number;
  paymentInfo: PaymentInfo;
  proof?: OrderProof;
  status: OrderStatus;
  deliveryType: 'delivery' | 'in_person';
  reminderSentAt?: any;
  autoDisputeAt?: any;
  proofSentAt?: any;
  disputeReason?: string;
  sellerBlocked?: boolean;
  createdAt?: any;
  updatedAt?: any;
  // Sprint 7 — notation
  buyerReviewed?: boolean;
  sellerReviewed?: boolean;
}

// ─── NOTATION Sprint 7 ───────────────────────────────────
export type RatingRole = 'buyer_to_seller' | 'seller_to_buyer';

export interface Review {
  id: string;
  orderId: string;
  productId: string;
  productTitle: string;
  fromUserId: string;
  fromUserName: string;
  fromUserPhoto?: string;
  toUserId: string;
  role: RatingRole;
  rating: number;
  comment: string;
  createdAt: any;
}
