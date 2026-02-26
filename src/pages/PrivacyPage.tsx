// src/pages/PrivacyPage.tsx
import React from 'react';

interface PrivacyPageProps {
  onBack: () => void;
  isTerms?: boolean;
  isAbout?: boolean;
}

export function PrivacyPage({ onBack, isTerms, isAbout }: PrivacyPageProps) {
  // Titre dynamique basé sur la provenance
  const title = isAbout ? 'À propos de Brumerie' : isTerms ? "Conditions d'utilisation" : 'Politique de confidentialité';

  return (
    <div className="min-h-screen bg-white pb-12 animate-fade-in">
      {/* Header Premium & Fixé */}
      <div className="bg-white/90 backdrop-blur-md sticky top-0 z-[100] px-6 py-5 flex items-center gap-4 border-b border-slate-50">
        <button 
          onClick={onBack} 
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-900 active:scale-90 transition-all border border-slate-100"
        >
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="font-bold text-[11px] uppercase tracking-[0.2em] text-slate-900">
          {title}
        </h1>
      </div>

      {/* Contenu avec animations */}
      <div className="px-6 py-8 space-y-8 animate-fade-up">
        {isAbout && <AboutContent />}
        {isTerms && <TermsContent />}
        {!isTerms && !isAbout && <PrivacyContent />}
      </div>
    </div>
  );
}

// Composant de section réutilisable pour un design cohérent
function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100/50">
      <div className="flex items-center gap-4 mb-5">
        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm text-xl border border-slate-50">
          {icon}
        </div>
        <h2 className="font-bold text-[10px] uppercase tracking-[0.15em] text-green-700">{title}</h2>
      </div>
      <div className="text-sm text-slate-600 leading-relaxed space-y-4 font-medium">
        {children}
      </div>
    </div>
  );
}

function AboutContent() {
  return (
    <>
      {/* Hero Section - Correction Logo */}
      <div className="rounded-[3rem] p-10 text-center relative overflow-hidden shadow-2xl shadow-green-100 mb-10" 
           style={{ background: 'linear-gradient(135deg, #115E2E 0%, #16A34A 100%)' }}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        
        {/* Logo Fixé */}
        <div className="flex justify-center mb-6">
          <img src="/favicon.png" alt="Brumerie" className="w-24 h-24 object-contain drop-shadow-2xl" />
        </div>
        <p className="text-green-50 text-sm font-medium opacity-90">L'application de votre quartier.</p>
        
        <div className="bg-black/10 backdrop-blur-md rounded-2xl px-6 py-2.5 mt-8 inline-block border border-white/10">
          <p className="text-white text-[10px] font-bold uppercase tracking-[0.2em]">Abidjan • Version MVP 1.0</p>
        </div>
      </div>

      <Section title="Notre Mission" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>}>
        <p>
          Brumerie est la plateforme qui connecte les vendeurs locaux et les acheteurs de proximité. 
          Nous simplifions le commerce à Abidjan en digitalisant le bouche-à-oreille.
        </p>
      </Section>

      <Section title="Services" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/><path d="M8 17.5h7M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>}>
        <p>Nous facilitons l'accès à deux piliers essentiels :</p>
        <div className="space-y-3 mt-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center gap-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
            <div>
              <p className="text-xs font-bold text-slate-900">Vendeurs de Quartier</p>
              <p className="text-[11px] text-slate-400">Articles disponibles près de chez vous.</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center gap-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a9.956 9.956 0 01-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/><path d="M11.99 2C6.465 2 2.011 6.46 2.011 11.985a9.916 9.916 0 001.337 5.003L2 22l5.16-1.321a9.955 9.955 0 004.83 1.24c5.524 0 9.979-4.452 9.979-9.977A9.97 9.97 0 0011.99 2z"/></svg>
            <div>
              <p className="text-xs font-bold text-slate-900">Lien Direct WhatsApp</p>
              <p className="text-[11px] text-slate-400">Négociez et concluez en un clic.</p>
            </div>
          </div>
        </div>
      </Section>

      <div className="text-center pt-8 border-t border-slate-50">
        <p className="text-[10px] font-bold uppercase text-slate-300 tracking-widest mb-3">Contact Officiel</p>
        <p className="text-sm font-bold text-slate-900">brumerieciv.email@gmail.com</p>
        <p className="text-xs text-slate-500 mt-1">+225 05 86 86 76 93</p>
      </div>
    </>
  );
}

function PrivacyContent() {
  return (
    <>
      <div className="bg-green-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-green-100">
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Confidentialité</p>
        <h2 className="text-xl font-bold mt-2">Tes données sont en sécurité.</h2>
      </div>

      <Section title="Collecte" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}>
        <p>Nous ne collectons que ce qui est nécessaire :</p>
        <ul className="space-y-3 mt-4">
          {["Nom & Photo de profil", "Numéro WhatsApp", "Quartier de résidence"].map((item, i) => (
            <li key={i} className="bg-white p-4 rounded-2xl text-xs font-bold text-slate-700 flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full" /> {item}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Transparence" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>}>
        <p>Tes données ne sont jamais vendues. Elles servent uniquement à te montrer des articles proches de toi et à permettre aux acheteurs de te contacter.</p>
      </Section>
    </>
  );
}

function TermsContent() {
  return (
    <>
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Légalité</p>
        <h2 className="text-xl font-bold mt-2">Règles de la communauté.</h2>
      </div>

      <Section title="Responsabilité" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v19M5 12H2l3-9 3 9H5zM22 12h-3l3-9 3 9h-3zM5 21h14"/></svg>}>
        <p>
          Brumerie est une plateforme de mise en relation. Nous ne sommes pas responsables des transactions finales, qui s'effectuent entre l'acheteur et le vendeur sur WhatsApp ou en personne.
        </p>
      </Section>

      <Section title="Interdictions" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>}>
        <ul className="space-y-4 text-xs font-medium">
          <li className="flex gap-3"><span className="text-red-500">✕</span> Pas de produits illégaux ou dangereux.</li>
          <li className="flex gap-3"><span className="text-red-500">✕</span> Pas de fausses annonces ou arnaques.</li>
          <li className="flex gap-3"><span className="text-red-500">✕</span> Respect obligatoire entre membres.</li>
        </ul>
      </Section>
    </>
  );
}

