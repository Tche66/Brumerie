// src/types.ts

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'buyer' | 'seller';
  neighborhood: string;
  photoURL?: string;
  isVerified: boolean;
  salesCount: number;
  createdAt: Date;
  publicationCount: number;
  publicationLimit: number;
  lastPublicationReset: Date;
  hasPhysicalShop?: boolean;
  managesDelivery?: boolean;
  bio?: string;
  // Favoris — stockés directement dans le profil utilisateur
  bookmarkedProductIds?: string[];
  // Paiement mobile — coordonnées par défaut
  defaultPaymentMethods?: PaymentInfo[];
  // Notation silencieuse — prêt pour Sprint 4
  rating?: number;
  reviewCount?: number;
}

export interface Product {
  id: string;
  title: string;
  price: number;
  description: string;
  category: string;
  neighborhood: string;
  images: string[];
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  sellerPhoto?: string;
  sellerVerified: boolean;
  whatsappClickCount: number;
  status: 'active' | 'sold' | 'deleted';
  neighborhoods?: string[]; // multi-ville vendeur
  paymentMethods?: PaymentInfo[]; // Wave/OM/MTN/Moov du vendeur pour ce produit
  // Notation produit — fondations silencieuses Sprint 4
  sellerRating?: number;
  sellerReviewCount?: number;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export const CATEGORIES: Category[] = [
  { id: 'phones', name: 'Téléphones', icon: '📱' },
  { id: 'electronics', name: 'Électronique', icon: '💻' },
  { id: 'fashion', name: 'Mode', icon: '👕' },
  { id: 'accessories', name: 'Accessoires', icon: '👜' },
  { id: 'friperie', name: 'Friperie', icon: '🧥' },
  { id: 'resale', name: 'Revente perso', icon: '🔄' },
  { id: 'home', name: 'Maison', icon: '🏠' },
  { id: 'beauty', name: 'Beauté', icon: '💄' },
  { id: 'sports', name: 'Sport', icon: '⚽' },
  { id: 'other', name: 'Autre', icon: '📦' },
];

export const NEIGHBORHOODS = [
  'Yopougon',
  'Cocody',
  'Plateau',
  'Adjamé',
  'Abobo',
  'Marcory',
  'Koumassi',
  'Port-Bouët',
  'Attécoubé',
  'Treichville',
  'Bingerville',
  'Songon',
  'Anyama',
  'Dabou',
  'Grand-Lahou',
  'Jacqueville',
  'Williamsville',
  'Vridi',
  'Zone 4',
  'Zone industrielle',
  'Riviera',
  'Angré',
  'Deux Plateaux',
  'Blockhaus',
  'Bonoumin',
  'Palmeraie',
  'Adiopodoumé',
  'Niangon',
  'Selmer',
  'Locodjoro',
  'Gbagba',
  'Toits Rouges',
  'Siporex',
  'Wassakara',
  'Sagbé',
  'Doukouré',
  'Anono',
  'Djibi',
  'Akouédo',
  'Banco',
];

export interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  paymentConfirmed: boolean;
}

export interface Feedback {
  id: string;
  userId: string;
  userName: string;
  type: 'bug' | 'suggestion' | 'question' | 'complaint';
  message: string;
  email: string;
  createdAt: Date;
}

export const VERIFICATION_PRICE = 2000;
export const VERIFICATION_WHATSAPP = '22586867693';
export const SUPPORT_EMAIL = 'brumerieciv.email@gmail.com';
export const SUPPORT_WHATSAPP = '22586867693';

// ─── MESSAGERIE ────────────────────────────────────────────

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  text: string;
  type: 'text' | 'product_card' | 'system';
  // Pour type='product_card' — fiche produit partagée
  productRef?: {
    id: string;
    title: string;
    price: number;
    image: string;
    neighborhood: string;
  };
  readBy: string[];       // UIDs qui ont lu
  createdAt: any;         // Firestore Timestamp
  reported?: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];               // [buyerId, sellerId]
  participantNames: Record<string, string>;
  participantPhotos: Record<string, string>;
  productId: string;
  productTitle: string;
  productImage: string;
  productPrice: number;
  lastMessage: string;
  lastMessageAt: any;                   // Firestore Timestamp
  lastSenderId: string;
  unreadCount: Record<string, number>;  // { uid: count }
  createdAt: any;
}

// ─── PAIEMENT MOBILE CI ────────────────────────────────────

export const BRUMERIE_FEE_PERCENT = 5; // 5% sur montant brut

export const MOBILE_PAYMENT_METHODS = [
  { id: 'wave',   name: 'Wave',            color: '#1BA7FF', icon: '💙' },
  { id: 'orange', name: 'Orange Money',    color: '#FF6600', icon: '🧡' },
  { id: 'mtn',    name: 'MTN Mobile Money',color: '#FFCC00', icon: '💛' },
  { id: 'moov',   name: 'Moov Money',      color: '#0066CC', icon: '💙' },
];

export type OrderStatus =
  | 'initiated'   // acheteur a cliqué "Finaliser" — intention d'achat
  | 'proof_sent'  // acheteur a uploadé preuve + ID transaction
  | 'confirmed'   // vendeur a cliqué "J'ai reçu ✓"
  | 'delivered'   // acheteur a confirmé réception physique
  | 'disputed'    // litige ouvert — vendeur bloqué
  | 'cancelled';  // annulé

export interface PaymentInfo {
  method: string;       // 'wave' | 'orange' | 'mtn' | 'moov'
  phone: string;        // numéro du vendeur pour cet article
  holderName: string;   // nom du titulaire
}

export interface OrderProof {
  screenshotUrl: string;   // Cloudinary URL
  transactionRef: string;  // ID saisi manuellement
  submittedAt: any;
}

export interface Order {
  id: string;
  // ── Parties ─────────────────────────────────────────────
  buyerId: string;
  buyerName: string;
  buyerPhoto?: string;
  sellerId: string;
  sellerName: string;
  sellerPhoto?: string;
  // ── Produit ─────────────────────────────────────────────
  productId: string;
  productTitle: string;
  productImage: string;
  productPrice: number;
  // ── Montants ─────────────────────────────────────────────
  brumerieFee: number;       // 5% → revenu Brumerie
  sellerReceives: number;    // 95% → vendeur
  // ── Paiement Mobile ─────────────────────────────────────
  paymentInfo: PaymentInfo;  // coordonnées paiement vendeur
  proof?: OrderProof;        // preuve uploadée par l'acheteur
  // ── Statut & Timers ──────────────────────────────────────
  status: OrderStatus;
  reminderSentAt?: any;      // rappel 6h envoyé
  autoDisputeAt?: any;       // deadline 24h → signalement auto
  disputeReason?: string;
  sellerBlocked?: boolean;
  // ── Timestamps ───────────────────────────────────────────
  createdAt: any;
  proofSentAt?: any;
  confirmedAt?: any;
  deliveredAt?: any;
  disputedAt?: any;
  cancelledAt?: any;
  // ── Type de remise ───────────────────────────────────────
  deliveryType?: 'delivery' | 'in_person'; // livraison ou main propre
}
