// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { User } from '@/types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Inscription
  async function signUp(email: string, password: string, userData: Partial<User>) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    const newUser: User = {
      id: uid,
      email,
      name: userData.name || '',
      phone: userData.phone || '',
      role: userData.role || 'buyer',
      neighborhood: userData.neighborhood || '',
      isVerified: false,
      salesCount: 0,
      createdAt: new Date(),
      publicationCount: 0,
      publicationLimit: 50,
      lastPublicationReset: new Date(),
    };

    await setDoc(doc(db, 'users', uid), newUser);
    setUserProfile(newUser);
  }

  // Connexion
  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  // Déconnexion
  async function signOut() {
    await firebaseSignOut(auth);
    setUserProfile(null);
  }

  // Réinitialisation mot de passe
  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  }

  // Charger profil utilisateur
  async function loadUserProfile(uid: string) {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      // Convertir Timestamp Firebase en Date si nécessaire
      setUserProfile({
        ...data,
        bookmarkedProductIds: data.bookmarkedProductIds || [],
        defaultPaymentMethods: data.defaultPaymentMethods || [],
        deliveryPriceSameZone: data.deliveryPriceSameZone || 0,
        deliveryPriceOtherZone: data.deliveryPriceOtherZone || 0,
        managesDelivery: data.managesDelivery || false,
        contactCount: data.contactCount || 0,
      } as User);
    }
  }

  // Rafraîchir le profil après modification (favoris, etc.)
  async function refreshUserProfile() {
    if (currentUser) await loadUserProfile(currentUser.uid);
  }

  // Observer changements auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await loadUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}