import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { NEIGHBORHOODS } from '@/types';

interface AuthPageProps {
  onNavigate: (page: string) => void;
}

export function AuthPage({ onNavigate }: AuthPageProps) {
  const { signIn, signUp, resetPassword } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [isCustomNeighborhood, setIsCustomNeighborhood] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!isLogin && !acceptTerms) {
      setError("Tu dois accepter la politique de confidentialité pour continuer.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        if (!name || !phone || !neighborhood) {
          setError('Veuillez remplir tous les champs');
          setLoading(false);
          return;
        }
        await signUp(email, password, { name, phone, neighborhood, role: 'buyer' });
      }
    } catch (err: any) {
      const msg =
        err?.code === 'auth/invalid-credential'
          ? 'Email ou mot de passe incorrect'
          : err?.code === 'auth/email-already-in-use'
          ? 'Cet email est déjà utilisé'
          : err?.code === 'auth/weak-password'
          ? 'Mot de passe trop court'
          : 'Erreur de connexion. Réessaie.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setSuccessMsg('');
    if (!email) {
      setError("Saisis ton adresse email.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      setSuccessMsg('Lien envoyé ! Vérifie tes mails.');
    } catch {
      setError('Aucun compte trouvé.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* ── Hero Section ── */}
      <div
        className="relative overflow-hidden flex flex-col items-center justify-center pt-20 pb-16 px-6 text-center"
        style={{ background: 'linear-gradient(160deg, #16A34A 0%, #115E2E 100%)' }}
      >
        <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-6">
            <img src="/favicon.png" alt="Brumerie" className="w-24 h-24 object-contain drop-shadow-2xl" />
          </div>
          <p className="text-green-50 text-xs font-medium opacity-80 uppercase tracking-[0.1em]">Le commerce de quartier</p>
        </div>
      </div>

      {/* ── Formulaire ── */}
      <div className="flex-1 px-6 pt-10 pb-12 bg-white rounded-t-[3.5rem] -mt-10 relative z-20 shadow-2xl">
        
        {/* Switcher Tab */}
        <div className="flex bg-slate-50 rounded-[2rem] p-2 mb-10 border border-slate-100">
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-4 rounded-[1.5rem] text-[11px] font-bold uppercase tracking-[0.15em] transition-all ${isLogin ? 'bg-white text-green-700 shadow-xl shadow-slate-200' : 'text-slate-400'}`}
          >
            Connexion
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-4 rounded-[1.5rem] text-[11px] font-bold uppercase tracking-[0.15em] transition-all ${!isLogin ? 'bg-white text-green-700 shadow-xl shadow-slate-200' : 'text-slate-400'}`}
          >
            Inscription
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div className="space-y-6 animate-fade-up">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 mb-2">Nom Complet</label>
                <input
                  type="text"
                  placeholder="ex: Aminata Diallo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-sm focus:border-green-600 focus:bg-white outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 mb-2">WhatsApp</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-900 text-sm font-bold border-r border-slate-200 pr-3">🇨🇮</span>
                  <input
                    type="tel"
                    placeholder="07 00 00 00 00"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-sm focus:border-green-600 focus:bg-white outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 mb-3">Ton Quartier (Abidjan)</label>
                {!isCustomNeighborhood ? (
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-[2rem]">
                    {NEIGHBORHOODS.slice(0, 5).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setNeighborhood(n)}
                        className={`py-4 px-3 rounded-2xl border-2 text-[11px] font-bold transition-all ${
                          neighborhood === n && !isCustomNeighborhood
                            ? 'bg-slate-900 border-slate-900 text-white shadow-lg'
                            : 'bg-white border-white text-slate-500 shadow-sm'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomNeighborhood(true);
                        setNeighborhood('');
                      }}
                      className="py-4 px-3 rounded-2xl border-2 border-dashed border-slate-300 text-[11px] font-bold text-slate-400 bg-white"
                    >
                      + Autre
                    </button>
                  </div>
                ) : (
                  <div className="relative animate-in fade-in slide-in-from-top-2">
                    <input
                      type="text"
                      placeholder="Tape le nom de ton quartier..."
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="w-full px-6 py-5 bg-slate-50 border-2 border-green-600 rounded-[1.5rem] text-sm focus:bg-white outline-none transition-all"
                      autoFocus
                      required
                    />
                    <button 
                      onClick={() => { setIsCustomNeighborhood(false); setNeighborhood(''); }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-red-500 uppercase bg-red-50 px-3 py-1 rounded-full"
                    >
                      Annuler
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 mb-2">Email</label>
              <input
                type="email"
                placeholder="ton@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-sm focus:border-green-600 focus:bg-white outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 mb-2">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 pr-14 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-sm focus:border-green-600 focus:bg-white outline-none transition-all"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 p-2"
                >
                  {showPassword ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {isLogin && (
            <div className="text-right">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-[10px] text-green-600 font-bold uppercase tracking-widest hover:opacity-70 transition-opacity"
              >
                Mot de passe oublié ?
              </button>
            </div>
          )}

          {!isLogin && (
            <div className="flex items-start gap-4 px-1 py-2">
              <div 
                onClick={() => setAcceptTerms(!acceptTerms)}
                className={`mt-1 w-7 h-7 rounded-xl flex items-center justify-center border-2 transition-all ${acceptTerms ? 'bg-green-600 border-green-600 shadow-lg shadow-green-100' : 'bg-slate-50 border-slate-200'}`}
              >
                {acceptTerms && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
              <label className="text-[11px] text-slate-500 leading-snug">
                J'accepte de respecter les règles et la{' '}
                <button 
                  type="button"
                  onClick={() => onNavigate('privacy')}
                  className="text-slate-900 font-bold underline decoration-green-600/30"
                >
                  Politique de Confidentialité
                </button>
              </label>
            </div>
          )}

          {error && <div className="text-red-600 text-[11px] font-bold bg-red-50 p-4 rounded-2xl border border-red-100 animate-shake">{error}</div>}
          {successMsg && <div className="text-green-600 text-[11px] font-bold bg-green-50 p-4 rounded-2xl border border-green-100">✅ {successMsg}</div>}

          {/* BOUTON XL PRINCIPAL */}
          <button
            type="submit"
            disabled={loading || (!isLogin && !acceptTerms)}
            className="w-full py-6 rounded-[2.5rem] font-extrabold uppercase tracking-[0.25em] text-[13px] transition-all mt-4 disabled:opacity-30 flex items-center justify-center gap-3 shadow-2xl active:scale-[0.98]"
            style={{
              background: loading ? '#f1f5f9' : 'linear-gradient(135deg, #115E2E, #16A34A)',
              color: loading ? '#94a3b8' : 'white',
              boxShadow: loading ? 'none' : '0 20px 40px rgba(22,163,74,0.3)',
            }}
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            ) : (
              isLogin ? 'Se Connecter' : 'Créer mon compte'
            )}
          </button>
        </form>

        {!isLogin && (
          <div className="mt-14 pt-8 border-t border-slate-100 grid grid-cols-3 gap-2 opacity-50">
            <div className="text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-900">Gratuit</p>
              <p className="text-[8px] text-slate-400 mt-1">Zéro frais</p>
            </div>
            <div className="text-center border-x border-slate-100">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-900">Direct</p>
              <p className="text-[8px] text-slate-400 mt-1">WhatsApp</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-900">Local</p>
              <p className="text-[8px] text-slate-400 mt-1">Quartier</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
