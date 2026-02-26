// src/App.tsx — Sprint 2 : Messagerie intégrée
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { updateUserProfile } from '@/services/userService';
import { subscribeTotalUnread } from '@/services/messagingService';
import { AuthPage } from '@/pages/AuthPage';
import { HomePage } from '@/pages/HomePage';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { SellPage } from '@/pages/SellPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { BuyerProfilePage } from '@/pages/BuyerProfilePage';
import { SellerProfilePage } from '@/pages/SellerProfilePage';
import { EditProfilePage } from '@/pages/EditProfilePage';
import { VerificationPage } from '@/pages/VerificationPage';
import { SupportPage } from '@/pages/SupportPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { PrivacyPage } from '@/pages/PrivacyPage';
import { RoleSelectPage } from '@/pages/RoleSelectPage';
import { ConversationsListPage } from '@/pages/ConversationsListPage';
import { ChatPage } from '@/pages/ChatPage';
import { BottomNav } from '@/components/BottomNav';
import { Product, Conversation } from '@/types';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { ShopCustomizePage } from '@/pages/ShopCustomizePage';
import { DashboardPage } from '@/pages/DashboardPage';
import { EditProductPage } from '@/pages/EditProductPage';
import { OrderFlowPage } from '@/pages/OrderFlowPage';
import { OrderStatusPage } from '@/pages/OrderStatusPage';
import { ToastContainer } from '@/components/ToastNotification';
import { useToast } from '@/hooks/useToast';
import { subscribeToNotifications } from '@/services/notificationService';

type Page =
  | 'home' | 'profile' | 'sell' | 'messages'
  | 'product-detail' | 'seller-profile' | 'chat'
  | 'edit-profile' | 'verification' | 'support'
  | 'settings' | 'privacy' | 'terms' | 'about' | 'notifications'
  | 'order-flow' | 'order-status' | 'shop-customize' | 'dashboard' | 'edit-product';

// ── AuthGate ─────────────────────────────────────────────────
function AuthGate() {
  const { userProfile, currentUser } = useAuth();
  const [showPrivacy, setShowPrivacy] = React.useState(false);
  const [privacyMode, setPrivacyMode] = React.useState<'privacy' | 'terms'>('privacy');

  const handleNavigate = (page: string) => {
    if (page === 'privacy') { setPrivacyMode('privacy'); setShowPrivacy(true); }
    else if (page === 'terms') { setPrivacyMode('terms'); setShowPrivacy(true); }
  };

  if (showPrivacy) return <PrivacyPage onBack={() => setShowPrivacy(false)} isTerms={privacyMode === 'terms'} />;

  if (currentUser && userProfile && !userProfile.role) {
    return (
      <RoleSelectPage
        userName={userProfile.name}
        onSelect={async (role) => { await updateUserProfile(currentUser.uid, { role }); window.location.reload(); }}
      />
    );
  }
  return <AuthPage onNavigate={handleNavigate} />;
}

// ── Modal switch rôle ─────────────────────────────────────────
function RoleSwitchModal({ currentRole, onConfirm, onCancel }: {
  currentRole: 'buyer' | 'seller'; onConfirm: () => void; onCancel: () => void;
}) {
  const newRole = currentRole === 'buyer' ? 'seller' : 'buyer';
  const isGoingSeller = newRole === 'seller';
  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[200] flex items-end justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[3rem] p-8">
        <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-6" />
        <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center mx-auto mb-6 ${isGoingSeller ? 'bg-green-50' : 'bg-blue-50'}`}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke={isGoingSeller ? '#16A34A' : '#3B82F6'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isGoingSeller
              ? <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></>
              : <><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></>}
          </svg>
        </div>
        <h3 className="text-xl font-black text-slate-900 text-center uppercase tracking-tight mb-2">
          Passer en mode {isGoingSeller ? 'Vendeur' : 'Acheteur'}
        </h3>
        <p className="text-slate-400 text-[11px] text-center font-medium mb-8 leading-relaxed">
          {isGoingSeller ? 'Tu pourras publier des articles et gérer ta boutique.' : 'Tu passeras en mode exploration.'}
        </p>
        <div className="flex flex-col gap-3">
          <button onClick={onConfirm}
            className={`w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all text-white shadow-xl ${isGoingSeller ? 'bg-green-600 shadow-green-200' : 'bg-blue-500 shadow-blue-200'}`}>
            Confirmer le changement
          </button>
          <button onClick={onCancel} className="w-full py-4 text-slate-400 font-bold text-[11px] uppercase tracking-widest">Annuler</button>
        </div>
      </div>
    </div>
  );
}

// ── AppContent ────────────────────────────────────────────────
function AppContent() {
  const { currentUser, userProfile } = useAuth();
  const [activePage, setActivePage] = useState<Page>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productHistory, setProductHistory] = useState<Product[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [orderFlowProduct, setOrderFlowProduct] = useState<any>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [navigationHistory, setNavigationHistory] = useState<Page[]>(['home']);
  const [showRoleSwitch, setShowRoleSwitch] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { toasts, showToast, dismissToast } = useToast();
  const prevNotifsRef = React.useRef<Set<string>>(new Set());

  useEffect(() => { window.scrollTo(0, 0); }, [activePage, selectedProduct]);

  // Abonnement total messages non-lus → badge BottomNav
  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeTotalUnread(currentUser.uid, setUnreadMessages);
    return unsub;
  }, [currentUser]);

  // Abonnement notifications → toast in-app quand nouvelle notif
  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeToNotifications(currentUser.uid, (notifs) => {
      notifs.filter(n => !n.read).forEach(notif => {
        if (!prevNotifsRef.current.has(notif.id)) {
          prevNotifsRef.current.add(notif.id);
          // Afficher le toast seulement pour les nouvelles notifs
          if (prevNotifsRef.current.size > 1) {
            showToast({
              type: notif.type as any,
              title: notif.title,
              body: notif.body,
              onClick: notif.data?.conversationId
                ? () => handleStartChat(notif.data!.conversationId!)
                : undefined,
            });
          } else {
            // Premier chargement — juste initialiser la ref
          }
        }
      });
    });
    return unsub;
  }, [currentUser]);

  if (!currentUser) return <AuthGate />;

  if (userProfile && !userProfile.role) {
    return (
      <RoleSelectPage userName={userProfile.name}
        onSelect={async (role) => { await updateUserProfile(currentUser.uid, { role }); window.location.reload(); }} />
    );
  }

  const role = userProfile?.role || 'buyer';
  const isBuyer = role === 'buyer';
  const MAIN_PAGES: Page[] = ['home', 'messages', 'profile', 'order-status', 'dashboard', ...(isBuyer ? [] : ['sell' as Page])];

  const navigate = (page: Page) => {
    setNavigationHistory(prev => [...prev, page]);
    setActivePage(page);
  };

  const goBack = () => {
    if (navigationHistory.length > 1) {
      const h = [...navigationHistory]; h.pop();
      const prevPage = h[h.length - 1];
      // Si on revient sur product-detail, restaurer le produit précédent
      if (prevPage === 'product-detail' && productHistory.length > 0) {
        const stack = [...productHistory];
        const prevProduct = stack.pop()!;
        setProductHistory(stack);
        setSelectedProduct(prevProduct);
      }
      setNavigationHistory(h);
      setActivePage(prevPage);
    } else { setActivePage('home'); }
  };

  const handleProductClick = (product: Product) => {
    // Empiler le produit actuel si on est déjà sur product-detail
    if (activePage === 'product-detail' && selectedProduct) {
      setProductHistory(prev => [...prev, selectedProduct]);
    }
    setSelectedProduct(product);
    navigate('product-detail');
  };
  const handleSellerClick = (sellerId: string) => { setSelectedSellerId(sellerId); navigate('seller-profile'); };
  const handleBottomNavNavigate = (page: string) => {
    setSelectedProduct(null); setSelectedSellerId(null); setSelectedConversation(null);
    setProductHistory([]); // vider la pile produit
    const target = page === 'orders' ? 'order-status' : page === 'tableau' ? 'dashboard' : page;
    setSelectedOrderId('');
    setNavigationHistory([target as Page]);
    setActivePage(target as Page);
  };

  // Ouvrir une conversation depuis liste ou depuis produit
  const handleOpenConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    navigate('chat');
  };

  // Depuis ProductDetailPage → créer/ouvrir conv par ID
  const handleStartChat = async (convId: string) => {
    // On charge la conversation depuis son ID pour ouvrir le ChatPage
    const { getDoc, doc } = await import('firebase/firestore');
    const { db } = await import('@/config/firebase');
    const snap = await getDoc(doc(db, 'conversations', convId));
    if (snap.exists()) {
      setSelectedConversation({ id: snap.id, ...snap.data() } as Conversation);
      navigate('chat');
    }
  };

  const handleNavigate = (p: string) => {
    if (p === 'switch-to-seller' || p === 'switch-to-buyer') { setShowRoleSwitch(true); return; }
    if (p === 'orders') { setSelectedOrderId(''); navigate('order-status'); return; }
    navigate(p as Page);
  };

  const handleRoleSwitch = async () => {
    if (!currentUser || !userProfile) return;
    const newRole = role === 'buyer' ? 'seller' : 'buyer';
    await updateUserProfile(currentUser.uid, { role: newRole });
    setShowRoleSwitch(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-white">
      <main>
        {activePage === 'home' && (
          <HomePage
            onProductClick={handleProductClick}
            onProfileClick={() => navigate('profile')}
            onNotificationsClick={() => navigate('notifications')}
          />
        )}
        {activePage === 'product-detail' && selectedProduct && (
          <ProductDetailPage
            product={selectedProduct} onBack={goBack}
            onSellerClick={handleSellerClick}
            onStartChat={handleStartChat}
            onProductClick={handleProductClick}
            onBuyClick={(product) => {
              setOrderFlowProduct(product);
              navigate('order-flow');
            }}
          />
        )}
        {activePage === 'seller-profile' && selectedSellerId && (
          <SellerProfilePage sellerId={selectedSellerId} onBack={goBack} onProductClick={handleProductClick} />
        )}
        {activePage === 'profile' && isBuyer && (
          <BuyerProfilePage onProductClick={handleProductClick} onNavigate={handleNavigate} />
        )}
        {activePage === 'profile' && !isBuyer && (
          <ProfilePage onProductClick={handleProductClick} onNavigate={handleNavigate} />
        )}
        {activePage === 'messages' && (
          <ConversationsListPage onOpenConversation={handleOpenConversation} />
        )}
        {activePage === 'chat' && selectedConversation && (
          <ChatPage conversation={selectedConversation} onBack={goBack} onProductClick={handleProductClick} />
        )}
        {activePage === 'edit-profile' && <EditProfilePage onBack={goBack} onSaved={goBack} />}
        {activePage === 'settings' && <SettingsPage onBack={goBack} onNavigate={handleNavigate} role={role} />}
        {activePage === 'verification' && <VerificationPage onBack={goBack} />}
        {activePage === 'support' && <SupportPage onBack={goBack} />}
        {activePage === 'privacy' && <PrivacyPage onBack={goBack} />}
        {activePage === 'terms' && <PrivacyPage onBack={goBack} isTerms />}
        {activePage === 'about' && <PrivacyPage onBack={goBack} isAbout />}
        {activePage === 'shop-customize' && (
          <ShopCustomizePage onBack={goBack} onSaved={goBack} />
        )}
        {activePage === 'dashboard' && (
          <DashboardPage
            onBack={goBack}
            onEditProduct={(product: Product) => { setProductToEdit(product); navigate('edit-product'); }}
            onOpenOrder={(orderId: string) => { setSelectedOrderId(orderId); navigate('order-status'); }}
          />
        )}
        {activePage === 'sell' && !isBuyer && (
          <SellPage onClose={() => handleBottomNavNavigate('home')} onSuccess={() => handleBottomNavNavigate('home')} />
        )}
        {activePage === 'notifications' && (
          <NotificationsPage
            onBack={goBack}
            onOpenConversation={async (convId) => {
              await handleStartChat(convId);
            }}
            onOpenOrder={(orderId) => {
              setSelectedOrderId(orderId);
              handleBottomNavNavigate('orders');
            }}
          />
        )}
        {activePage === 'order-flow' && orderFlowProduct && (
          <OrderFlowPage
            product={orderFlowProduct}
            onBack={goBack}
            onOrderCreated={(orderId) => {
              setSelectedOrderId(orderId);
              navigate('order-status');
            }}
          />
        )}
        {activePage === 'edit-product' && productToEdit && (
          <EditProductPage
            product={productToEdit}
            onBack={goBack}
            onSaved={() => { setProductToEdit(null); goBack(); }}
          />
        )}
        {activePage === 'order-status' && (
          <OrderStatusPage
            orderId={selectedOrderId || undefined}
            onBack={goBack}
          />
        )}
      </main>

      {MAIN_PAGES.includes(activePage) && (
        <BottomNav
          activePage={activePage}
          onNavigate={handleBottomNavNavigate}
          role={role}
          unreadMessages={unreadMessages}
        />
      )}

      {showRoleSwitch && userProfile && (
        <RoleSwitchModal currentRole={role} onConfirm={handleRoleSwitch} onCancel={() => setShowRoleSwitch(false)} />
      )}

      {/* Toast In-App */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}
