// src/pages/AuthPage.tsx — Avec vérification OTP email + code parrainage
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { NEIGHBORHOODS } from '@/types';

interface AuthPageProps { onNavigate: (page: string) => void; }

type Step = 'form' | 'otp';

export function AuthPage({ onNavigate }: AuthPageProps) {
  const { signIn, signUp, resetPassword, sendVerificationOTP, confirmOTP } = useAuth() as any;
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep]       = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isCustomNeighborhood, setIsCustomNeighborhood] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Form fields
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [name, setName]             = useState('');
  const [phone, setPhone]           = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showReferral, setShowReferral] = useState(false);

  // OTP
  const [otpInputs, setOtpInputs] = useState(['', '', '', '', '', '']);

  // Lire le code parrainage depuis l'URL au chargement
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) { setReferralCode(ref.toUpperCase()); setShowReferral(true); }
  }, []);

  // Countdown pour renvoyer l'OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Assembler le code OTP depuis les 6 inputs
  const fullOtp = otpInputs.join('');

  const handleOtpInput = (i: number, val: string): void => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otpInputs];
    next[i] = val.slice(-1);
    setOtpInputs(next);
    // Auto-focus suivant
    if (val && i < 5) {
      (document.getElementById(`otp-${i + 1}`) as HTMLInputElement)?.focus();
    }
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Backspace' && !otpInputs[i] && i > 0) {
      (document.getElementById(`otp-${i - 1}`) as HTMLInputElement)?.focus();
    }
  };

  // ── Étape 1 : envoyer OTP ──────────────────────────────────
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!acceptTerms) { setError("Tu dois accepter la politique de confidentialité."); return; }
    if (!name || !phone || !neighborhood) { setError('Remplis tous les champs.'); return; }
    setLoading(true);
    try {
      await sendVerificationOTP(email, name);
      setStep('otp');
      setResendCooldown(60);
      setOtpInputs(['', '', '', '', '', '']);
    } catch {
      setError('Erreur lors de l\'envoi du code. Vérifie ton email.');
    } finally { setLoading(false); }
  };

  // ── Étape 2 : confirmer OTP puis créer le compte ──────────
  const handleConfirmOTP = async () => {
    if (fullOtp.length !== 6) { setError('Saisis les 6 chiffres du code.'); return; }
    setError('');
    setLoading(true);
    try {
      const result = await confirmOTP(email, fullOtp);
      if (result === 'expired') { setError('Code expiré. Renvoie un nouveau code.'); setLoading(false); return; }
      if (result === 'invalid') { setError('Code incorrect. Vérifie et réessaie.'); setLoading(false); return; }
      // OTP valide → créer le compte Firebase
      await signUp(email, password, {
        name, phone, neighborhood, role: 'buyer',
        emailVerified: true,
        referredBy: referralCode || undefined,
      });
    } catch (err: any) {
      const msg =
        err?.code === 'auth/email-already-in-use' ? 'Cet email est déjà utilisé'
        : err?.code === 'auth/weak-password' ? 'Mot de passe trop court (6 min)'
        : 'Erreur lors de la création du compte.';
      setError(msg);
    } finally { setLoading(false); }
  };

  // ── Renvoyer l'OTP ─────────────────────────────────────────
  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setError(''); setLoading(true);
    try {
      await sendVerificationOTP(email, name);
      setOtpInputs(['', '', '', '', '', '']);
      setResendCooldown(60);
      setSuccessMsg('Nouveau code envoyé !');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch { setError('Erreur lors du renvoi.'); }
    finally { setLoading(false); }
  };

  // ── Connexion classique ────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err?.code === 'auth/invalid-credential' ? 'Email ou mot de passe incorrect' : 'Erreur de connexion.');
    } finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!email) { setError('Saisis ton adresse email.'); return; }
    setLoading(true);
    try { await resetPassword(email); setSuccessMsg('Lien envoyé ! Vérifie tes mails.'); }
    catch { setError('Aucun compte trouvé.'); }
    finally { setLoading(false); }
  };

  // ── OTP Screen ─────────────────────────────────────────────
  if (step === 'otp') {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        {/* Header avec fond vert */}
        <div className="relative overflow-hidden flex flex-col items-center justify-center pt-16 pb-14 px-6 text-center"
          style={{ background: 'linear-gradient(160deg,#16A34A 0%,#115E2E 100%)' }}>
          <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-white/10 blur-3xl"/>
          <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"/>
          <div className="relative z-10 w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center mb-4">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <h2 className="font-black text-white text-xl mb-1">Vérifie ton email</h2>
          <p className="text-green-100 text-[12px] font-medium">Code envoyé à</p>
          <p className="text-white font-black text-[13px] mt-0.5">{email}</p>
        </div>

        <div className="flex-1 px-6 pt-10 pb-12 bg-white rounded-t-[3.5rem] -mt-10 relative z-20 shadow-2xl">
          <p className="text-slate-400 text-[12px] text-center font-medium mb-8">
            Saisis le code à 6 chiffres reçu par email
          </p>

          {/* 6 inputs OTP */}
          <div className="flex gap-2 justify-center mb-8">
            {otpInputs.map((val, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={val}
                onChange={e => handleOtpInput(i, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(i, e)}
                className={`w-12 h-14 text-center text-xl font-black rounded-2xl border-2 outline-none transition-all ${
                  val ? 'border-green-500 bg-green-50 text-green-800' : 'border-slate-200 bg-slate-50 text-slate-900'
                } focus:border-green-500 focus:bg-green-50`}
              />
            ))}
          </div>

          {error && <div className="text-red-600 text-[11px] font-bold bg-red-50 p-4 rounded-2xl border border-red-100 mb-4">{error}</div>}
          {successMsg && <div className="text-green-600 text-[11px] font-bold bg-green-50 p-4 rounded-2xl border border-green-100 mb-4">✅ {successMsg}</div>}

          <button onClick={handleConfirmOTP} disabled={loading || fullOtp.length !== 6}
            className="w-full py-6 rounded-[2.5rem] font-extrabold uppercase tracking-[0.25em] text-[13px] text-white transition-all disabled:opacity-40 flex items-center justify-center gap-3 shadow-2xl active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg,#115E2E,#16A34A)', boxShadow: '0 20px 40px rgba(22,163,74,0.3)' }}>
            {loading
              ? <div className="w-6 h-6 border-3 border-white/40 border-t-white rounded-full animate-spin"/>
              : 'Confirmer et créer mon compte'
            }
          </button>

          <div className="mt-6 text-center">
            <p className="text-[11px] text-slate-400 mb-3">Tu n'as pas reçu le code ?</p>
            <button onClick={handleResendOTP} disabled={resendCooldown > 0 || loading}
              className={`font-black text-[11px] uppercase tracking-widest transition-all ${
                resendCooldown > 0 ? 'text-slate-300' : 'text-green-600 active:opacity-70'
              }`}>
              {resendCooldown > 0 ? `Renvoyer dans ${resendCooldown}s` : 'Renvoyer le code'}
            </button>
          </div>

          <button onClick={() => setStep('form')} className="w-full mt-4 py-3 text-slate-400 font-bold text-[11px] uppercase tracking-widest">
            ← Modifier mon email
          </button>
        </div>
      </div>
    );
  }

  // ── Formulaire principal ────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Hero */}
      <div className="relative overflow-hidden flex flex-col items-center justify-center pt-20 pb-16 px-6 text-center"
        style={{ background: 'linear-gradient(160deg,#16A34A 0%,#115E2E 100%)' }}>
        <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-white/10 blur-3xl"/>
        <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"/>
        <div className="relative z-10 flex flex-col items-center">
          <img src="/favicon.png" alt="Brumerie" className="w-24 h-24 object-contain drop-shadow-2xl mb-4"/>
          <p className="text-green-50 text-xs font-medium opacity-80 uppercase tracking-[0.1em]">Le commerce de quartier</p>
        </div>
      </div>

      {/* Formulaire */}
      <div className="flex-1 px-6 pt-10 pb-12 bg-white rounded-t-[3.5rem] -mt-10 relative z-20 shadow-2xl">

        {/* Tabs */}
        <div className="flex bg-slate-50 rounded-[2rem] p-2 mb-10 border border-slate-100">
          <button onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-4 rounded-[1.5rem] text-[11px] font-bold uppercase tracking-[0.15em] transition-all ${isLogin ? 'bg-white text-green-700 shadow-xl shadow-slate-200' : 'text-slate-400'}`}>
            Connexion
          </button>
          <button onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-4 rounded-[1.5rem] text-[11px] font-bold uppercase tracking-[0.15em] transition-all ${!isLogin ? 'bg-white text-green-700 shadow-xl shadow-slate-200' : 'text-slate-400'}`}>
            Inscription
          </button>
        </div>

        <form onSubmit={isLogin ? handleLogin : handleRequestOTP} className="space-y-6">
          {/* ── Champs inscription uniquement ── */}
          {!isLogin && (
            <div className="space-y-6 animate-fade-up">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 mb-2">Nom Complet</label>
                <input type="text" placeholder="ex: Aminata Diallo" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setName(e.target.value)} required
                  className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-sm focus:border-green-600 focus:bg-white outline-none transition-all"/>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 mb-2">WhatsApp</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-900 text-sm font-bold border-r border-slate-200 pr-3">🇨🇮</span>
                  <input type="tel" placeholder="07 00 00 00 00" value={phone} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setPhone(e.target.value)} required
                    className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-sm focus:border-green-600 focus:bg-white outline-none transition-all"/>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 mb-3">Ton Quartier (Abidjan)</label>
                {!isCustomNeighborhood ? (
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-[2rem]">
                    {NEIGHBORHOODS.slice(0, 5).map(n => (
                      <button key={n} type="button" onClick={() => setNeighborhood(n)}
                        className={`py-4 px-3 rounded-2xl border-2 text-[11px] font-bold transition-all ${
                          neighborhood === n ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-white text-slate-500 shadow-sm'
                        }`}>{n}</button>
                    ))}
                    <button type="button" onClick={() => { setIsCustomNeighborhood(true); setNeighborhood(''); }}
                      className="py-4 px-3 rounded-2xl border-2 border-dashed border-slate-300 text-[11px] font-bold text-slate-400 bg-white">
                      + Autre
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input type="text" placeholder="Ton quartier..." value={neighborhood} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNeighborhood(e.target.value)} autoFocus required
                      className="w-full px-6 py-5 bg-slate-50 border-2 border-green-600 rounded-[1.5rem] text-sm focus:bg-white outline-none transition-all"/>
                    <button onClick={() => { setIsCustomNeighborhood(false); setNeighborhood(''); }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-red-500 uppercase bg-red-50 px-3 py-1 rounded-full">
                      Annuler
                    </button>
                  </div>
                )}
              </div>

              {/* Code parrainage */}
              {!showReferral ? (
                <button type="button" onClick={() => setShowReferral(true)}
                  className="text-[10px] font-bold text-green-600 uppercase tracking-widest flex items-center gap-1.5 active:opacity-70">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  J'ai un code de parrainage
                </button>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 mb-2">Code parrainage (optionnel)</label>
                  <div className="relative">
                    <input type="text" placeholder="ex: KOFFI-X7K2" value={referralCode} onChange={e => setReferralCode(e.target.value.toUpperCase())}
                      className="w-full px-6 py-5 bg-green-50 border-2 border-green-200 rounded-[1.5rem] text-sm font-black text-green-800 tracking-widest focus:border-green-500 outline-none transition-all uppercase"
                      style={{ letterSpacing: '0.15em' }}/>
                    {referralCode && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 bg-green-600 rounded-xl flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Email + MDP — commun */}
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 mb-2">Email</label>
              <input type="email" placeholder="ton@email.com" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setEmail(e.target.value)} required
                className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-sm focus:border-green-600 focus:bg-white outline-none transition-all"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 mb-2">Mot de passe</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setPassword(e.target.value)} required minLength={6}
                  className="w-full px-6 pr-14 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-sm focus:border-green-600 focus:bg-white outline-none transition-all"/>
                <button type="button" onClick={() => setShowPassword((s: boolean) => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 p-2">
                  {showPassword
                    ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>
          </div>

          {/* Mot de passe oublié — connexion */}
          {isLogin && (
            <div className="text-right">
              <button type="button" onClick={handleForgotPassword}
                className="text-[10px] text-green-600 font-bold uppercase tracking-widest hover:opacity-70 transition-opacity">
                Mot de passe oublié ?
              </button>
            </div>
          )}

          {/* CGU — inscription */}
          {!isLogin && (
            <div className="flex items-start gap-4 px-1 py-2">
              <div onClick={() => setAcceptTerms((v: boolean) => !v)}
                className={`mt-1 w-7 h-7 rounded-xl flex items-center justify-center border-2 transition-all cursor-pointer ${acceptTerms ? 'bg-green-600 border-green-600 shadow-lg shadow-green-100' : 'bg-slate-50 border-slate-200'}`}>
                {acceptTerms && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
              <label className="text-[11px] text-slate-500 leading-snug cursor-pointer" onClick={() => setAcceptTerms((v: boolean) => !v)}>
                J'accepte la{' '}
                <button type="button" onClick={e => { e.stopPropagation(); onNavigate('privacy'); }}
                  className="text-slate-900 font-bold underline decoration-green-600/30">
                  Politique de Confidentialité
                </button>
              </label>
            </div>
          )}

          {/* Note OTP pour l'inscription */}
          {!isLogin && (
            <div className="flex items-center gap-3 bg-blue-50 rounded-2xl px-4 py-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D9BF0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <p className="text-[10px] text-blue-700 font-bold">Un code de vérification sera envoyé à ton email pour confirmer ton identité.</p>
            </div>
          )}

          {error && <div className="text-red-600 text-[11px] font-bold bg-red-50 p-4 rounded-2xl border border-red-100">{error}</div>}
          {successMsg && <div className="text-green-600 text-[11px] font-bold bg-green-50 p-4 rounded-2xl border border-green-100">✅ {successMsg}</div>}

          <button type="submit" disabled={loading || (!isLogin && !acceptTerms)}
            className="w-full py-6 rounded-[2.5rem] font-extrabold uppercase tracking-[0.25em] text-[13px] transition-all mt-4 disabled:opacity-30 flex items-center justify-center gap-3 shadow-2xl active:scale-[0.98]"
            style={{ background: loading ? '#f1f5f9' : 'linear-gradient(135deg,#115E2E,#16A34A)', color: loading ? '#94a3b8' : 'white', boxShadow: loading ? 'none' : '0 20px 40px rgba(22,163,74,0.3)' }}>
            {loading
              ? <div className="w-6 h-6 border-3 border-slate-300 border-t-slate-600 rounded-full animate-spin"/>
              : isLogin ? 'Se Connecter' : 'Recevoir le code →'
            }
          </button>
        </form>

        {!isLogin && (
          <div className="mt-14 pt-8 border-t border-slate-100 grid grid-cols-3 gap-2 opacity-50">
            <div className="text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-900">Gratuit</p>
              <p className="text-[8px] text-slate-400 mt-1">Zéro frais</p>
            </div>
            <div className="text-center border-x border-slate-100">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-900">Sécurisé</p>
              <p className="text-[8px] text-slate-400 mt-1">Email vérifié</p>
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
