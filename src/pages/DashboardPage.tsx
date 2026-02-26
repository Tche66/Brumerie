// src/pages/DashboardPage.tsx — Sprint 9 : Dashboard complet
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSellerProducts } from '@/services/productService';
import { subscribeSellerReviews } from '@/services/reviewService';
import { subscribeOrdersAsSeller } from '@/services/orderService';
import { Product, Order, PLAN_LIMITS, OrderStatus } from '@/types';

interface DashboardPageProps {
  onBack: () => void;
  onUpgrade?: () => void;
  onEditProduct?: (product: Product) => void;
  onOpenOrder?: (orderId: string) => void;
}

type Tab = 'stats' | 'articles' | 'commandes' | 'ventes';

function StatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, { label: string; bg: string; color: string }> = {
    initiated:  { label: 'En attente',       bg: '#FEF3C7', color: '#92400E' },
    proof_sent: { label: 'Preuve envoyée',    bg: '#DBEAFE', color: '#1D4ED8' },
    confirmed:  { label: 'Pmt confirmé',     bg: '#D1FAE5', color: '#065F46' },
    delivered:  { label: 'Livré ✓',          bg: '#DCFCE7', color: '#166534' },
    disputed:   { label: '⚠️ Litige',         bg: '#FFEDD5', color: '#9A3412' },
    cancelled:  { label: 'Annulé',            bg: '#F3F4F6', color: '#374151' },
  };
  const s = map[status] || map.initiated;
  return (
    <span className="px-2 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest flex-shrink-0"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

export function DashboardPage({ onBack, onUpgrade, onEditProduct, onOpenOrder }: DashboardPageProps) {
  const { userProfile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('stats');

  const tier = userProfile?.isPremium ? 'premium' : userProfile?.isVerified ? 'verified' : 'simple';
  const limits = PLAN_LIMITS[tier];

  useEffect(() => {
    if (!userProfile?.id) return;
    getSellerProducts(userProfile.id)
      .then(p => { setProducts(p); setLoading(false); })
      .catch(() => setLoading(false));
    const unsubReviews = subscribeSellerReviews(userProfile.id, (_r, avg, cnt) => {
      setAvgRating(avg); setReviewCount(cnt);
    });
    const unsubOrders = subscribeOrdersAsSeller(userProfile.id, setOrders);
    return () => { unsubReviews(); unsubOrders(); };
  }, [userProfile?.id]);

  const activeProducts  = products.filter(p => p.status === 'active');
  const soldProducts    = products.filter(p => p.status === 'sold');
  const totalViews      = products.reduce((sum, p) => sum + (p.viewCount || 0), 0);
  const totalContacts   = products.reduce((sum, p) => sum + (p.whatsappClickCount || 0), 0);
  const activeOrders    = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const completedSales  = orders.filter(o => o.status === 'delivered');
  const totalRevenue    = completedSales.reduce((sum, o) => sum + (o.sellerReceives || o.totalAmount || 0), 0);

  const dailyChatsUsed  = userProfile?.dailyChatCount || 0;
  const dailyChatsLimit = limits.dailyChats >= 999 ? '∞' : limits.dailyChats;
  const productLimit    = limits.products >= 999 ? '∞' : limits.products;

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: 'stats',     label: 'Stats' },
    { id: 'articles',  label: 'Articles',  badge: activeProducts.length },
    { id: 'commandes', label: 'Commandes', badge: activeOrders.length },
    { id: 'ventes',    label: 'Ventes',    badge: completedSales.length },
  ];

  const fmt = (ts: any) => {
    try {
      const d = ts?.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch { return '—'; }
  };

  return (
    <div className="min-h-screen pb-24 bg-slate-50 font-sans">

      {/* Header + Tabs */}
      <div className="bg-white px-5 pt-6 pb-0 border-b border-slate-100 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 flex items-center justify-center rounded-2xl bg-green-50 flex-shrink-0">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-black text-sm uppercase tracking-widest text-slate-900">Dashboard</h1>
            <p className="text-[9px] text-slate-400 font-bold truncate">{userProfile?.name}</p>
          </div>
          <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase flex-shrink-0"
            style={{ background: tier === 'premium' ? '#0F0F0F' : tier === 'verified' ? '#1D9BF0' : '#E2E8F0', color: tier === 'simple' ? '#64748B' : 'white' }}>
            {tier}
          </span>
        </div>
        <div className="flex gap-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-4 py-3 text-[10px] font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === tab.id ? 'border-green-600 text-green-700' : 'border-transparent text-slate-400'
              }`}>
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-5 space-y-4">

        {/* ── STATS ── */}
        {activeTab === 'stats' && (
          <>
            <div className="rounded-3xl p-5 text-white"
              style={{ background: tier === 'premium' ? '#0F0F0F' : tier === 'verified' ? '#1D9BF0' : '#475569' }}>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-3">Quotas plan {tier}</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="font-black text-xl">{activeProducts.length}<span className="text-white/50 text-sm">/{productLimit}</span></p>
                  <p className="text-[8px] uppercase font-bold opacity-60 mt-0.5">Articles</p>
                </div>
                <div>
                  <p className="font-black text-xl">{dailyChatsUsed}<span className="text-white/50 text-sm">/{dailyChatsLimit}</span></p>
                  <p className="text-[8px] uppercase font-bold opacity-60 mt-0.5">Chats/jour</p>
                </div>
                <div>
                  <p className="font-black text-xl">{limits.boost > 0 ? limits.boost : '—'}</p>
                  <p className="text-[8px] uppercase font-bold opacity-60 mt-0.5">Boosts</p>
                </div>
              </div>
              {tier === 'simple' && (
                <button onClick={onUpgrade}
                  className="mt-4 w-full bg-white/15 border border-white/20 text-white font-black text-[10px] uppercase px-4 py-3 rounded-2xl active:scale-95 transition-all">
                  ⚡ Passer Vérifié →
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Vues totales',    value: loading ? '…' : totalViews,    icon: '👁️',  bg: 'bg-blue-50',   text: 'text-blue-700' },
                { label: 'Contacts reçus',  value: loading ? '…' : totalContacts, icon: '💬',  bg: 'bg-green-50',  text: 'text-green-700' },
                { label: 'Vendus',          value: loading ? '…' : soldProducts.length, icon: '✅', bg: 'bg-purple-50', text: 'text-purple-700' },
                { label: 'Revenus',         value: loading ? '…' : `${totalRevenue.toLocaleString('fr-FR')} F`, icon: '💰', bg: 'bg-amber-50', text: 'text-amber-700' },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-3xl p-4 border border-slate-100`}>
                  <p className="text-xl mb-1">{s.icon}</p>
                  <p className={`font-black text-xl ${s.text} truncate`}>{s.value}</p>
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {activeOrders.length > 0 && (
              <div className="bg-white rounded-3xl p-5 border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-black text-slate-900 text-[11px] uppercase tracking-widest">Commandes en cours</p>
                  <button onClick={() => setActiveTab('commandes')} className="text-[9px] font-black text-green-600 uppercase">Voir tout →</button>
                </div>
                <div className="space-y-2">
                  {activeOrders.slice(0, 3).map(o => (
                    <button key={o.id} onClick={() => onOpenOrder?.(o.id)}
                      className="w-full flex items-center gap-3 py-2 active:opacity-70 transition-opacity text-left">
                      <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                        {o.productImage && <img src={o.productImage} alt="" className="w-full h-full object-cover"/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-900 text-[10px] truncate">{o.productTitle}</p>
                        <p className="text-[8px] text-slate-400">{o.buyerName} · {o.totalAmount?.toLocaleString('fr-FR')} FCFA</p>
                      </div>
                      <StatusBadge status={o.status}/>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {reviewCount > 0 && (
              <div className="bg-white rounded-3xl p-5 border border-slate-100">
                <p className="font-black text-slate-900 text-[11px] uppercase tracking-widest mb-3">Réputation</p>
                <div className="flex items-center gap-4">
                  <p className="text-5xl font-black text-slate-900">{avgRating.toFixed(1)}</p>
                  <div>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(s => (
                        <svg key={s} width="16" height="16" viewBox="0 0 24 24" fill={avgRating >= s ? '#FBBF24' : '#E2E8F0'} stroke="none">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">{reviewCount} avis reçus</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── ARTICLES ── */}
        {activeTab === 'articles' && (
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
            {loading ? (
              <div className="p-10 text-center">
                <div className="w-8 h-8 border-4 border-slate-100 border-t-green-600 rounded-full animate-spin mx-auto mb-3"/>
                <p className="text-[9px] text-slate-400 font-black uppercase">Chargement…</p>
              </div>
            ) : products.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-3xl mb-3">📦</p>
                <p className="font-black text-slate-400 text-[10px] uppercase">Aucun article publié</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {[...products].sort((a, b) => (b.whatsappClickCount || 0) - (a.whatsappClickCount || 0)).map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-4">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                      {p.images?.[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-900 text-[11px] truncate">{p.title}</p>
                      <p className="text-[9px] text-slate-500 font-bold">{p.price.toLocaleString('fr-FR')} FCFA
                        {p.originalPrice && p.originalPrice > p.price && (
                          <span className="ml-1 text-red-500">-{Math.round(((p.originalPrice - p.price)/p.originalPrice)*100)}%</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[8px] text-slate-400">👁️ {p.viewCount || 0} vues</span>
                        <span className="text-[8px] text-slate-400">💬 {p.whatsappClickCount || 0} contacts</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-[8px] font-black px-2 py-1 rounded-lg ${p.status === 'sold' ? 'bg-slate-100 text-slate-400' : p.status === 'paused' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-700'}`}>
                        {p.status === 'sold' ? 'Vendu' : p.status === 'paused' ? 'Pausé' : 'Actif'}
                      </span>
                      {onEditProduct && p.status !== 'sold' && (
                        <button onClick={() => onEditProduct(p)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 active:scale-90 transition-all">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── COMMANDES ── */}
        {activeTab === 'commandes' && (
          activeOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-100">
              <p className="text-3xl mb-3">📋</p>
              <p className="font-black text-slate-400 text-[10px] uppercase">Aucune commande en cours</p>
              <p className="text-slate-300 text-[9px] font-bold mt-1">Les nouvelles commandes apparaîtront ici</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
              <div className="divide-y divide-slate-50">
                {activeOrders.map(o => (
                  <button key={o.id} onClick={() => onOpenOrder?.(o.id)}
                    className="w-full flex items-center gap-3 p-4 active:bg-slate-50 transition-colors text-left">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                      {o.productImage && <img src={o.productImage} alt="" className="w-full h-full object-cover"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-900 text-[11px] truncate">{o.productTitle}</p>
                      <p className="text-[9px] text-slate-500 font-bold">Acheteur : {o.buyerName}</p>
                      <p className="text-[9px] text-slate-400">{o.totalAmount?.toLocaleString('fr-FR')} FCFA · {fmt(o.createdAt)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={o.status}/>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        )}

        {/* ── VENTES ── */}
        {activeTab === 'ventes' && (
          <>
            <div className="bg-slate-900 rounded-3xl p-5 text-white">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Revenus totaux</p>
              <p className="font-black text-3xl">{totalRevenue.toLocaleString('fr-FR')} <span className="text-lg opacity-60">FCFA</span></p>
              <div className="flex gap-4 mt-3">
                <div>
                  <p className="font-black text-lg">{completedSales.length}</p>
                  <p className="text-[8px] uppercase font-bold opacity-60">Ventes réalisées</p>
                </div>
                <div className="w-px bg-white/20"/>
                <div>
                  <p className="font-black text-lg">
                    {completedSales.length > 0 ? Math.round(totalRevenue / completedSales.length).toLocaleString('fr-FR') : '—'}
                  </p>
                  <p className="text-[8px] uppercase font-bold opacity-60">Panier moyen (FCFA)</p>
                </div>
              </div>
            </div>

            {completedSales.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-100">
                <p className="text-3xl mb-3">💸</p>
                <p className="font-black text-slate-400 text-[10px] uppercase">Aucune vente complétée</p>
                <p className="text-slate-300 text-[9px] font-bold mt-1">Tes ventes livrées apparaîtront ici</p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
                <div className="divide-y divide-slate-50">
                  {completedSales.map(o => (
                    <button key={o.id} onClick={() => onOpenOrder?.(o.id)}
                      className="w-full flex items-center gap-3 p-4 active:bg-slate-50 transition-colors text-left">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                        {o.productImage && <img src={o.productImage} alt="" className="w-full h-full object-cover"/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-900 text-[11px] truncate">{o.productTitle}</p>
                        <p className="text-[9px] text-slate-500 font-bold">{o.buyerName}</p>
                        <p className="text-[9px] text-slate-400">{fmt(o.createdAt)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-black text-green-700 text-[13px]">+{(o.sellerReceives || o.totalAmount || 0).toLocaleString('fr-FR')}</p>
                        <p className="text-[8px] text-slate-400 font-bold">FCFA</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
