/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserRole } from './types';
import { auth, db } from './lib/firebase';
import { useLanguage } from './LanguageContext';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

interface UserContextType {
  user: UserProfile | null;
  role: UserRole;
  isLoggedIn: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, role: UserRole) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // Listen to profile changes
        const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser({ id: docSnap.id, ...docSnap.data() } as UserProfile);
          } else {
            setUser({
              id: firebaseUser.uid,
              name: firebaseUser.displayName || '',
              email: firebaseUser.email || '',
              isNew: true 
            } as any);
          }
          setIsLoading(false);
        }, (error) => {
          console.error("Profile sync failed:", error);
          setIsLoading(false);
        });

        return () => unsubProfile();
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const getAuthErrorMessage = (error: any) => {
    const code = error.code || '';
    const message = error.message || '';
    const errs = t.authErrors;
    
    switch (code) {
      case 'auth/operation-not-allowed':
        return errs.operationNotAllowed;
      case 'auth/invalid-credential':
        // Specifically check for 'invalid-credential' which often replaces 'user-not-found' and 'wrong-password'
        // for security reasons. We guide the user to check both or sign up.
        return "Email atau password salah. Jika Anda belum punya akun, silakan daftar baru. Jika lupa password, gunakan fitur Lupa Sandi.";
      case 'auth/user-not-found':
        return errs.userNotFound;
      case 'auth/wrong-password':
        return errs.wrongPassword;
      case 'auth/invalid-email':
        return errs.invalidEmail;
      case 'auth/email-already-in-use':
        return errs.emailAlreadyInUse;
      case 'auth/weak-password':
        return errs.weakPassword;
      case 'auth/popup-closed-by-user':
        return errs.popupClosed;
      case 'auth/too-many-requests':
        return errs.tooManyRequests;
      case 'auth/network-request-failed':
        return errs.networkFailed;
      default:
        // Try to find known patterns in the raw message if code is default
        if (message.includes('user-not-found')) return errs.userNotFound;
        if (message.includes('wrong-password')) return errs.wrongPassword;
        return message || errs.default;
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Sign in failed", error);
      throw new Error(getAuthErrorMessage(error));
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      console.error("Sign in failed", error);
      throw new Error(getAuthErrorMessage(error));
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string, role: UserRole) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await firebaseUpdateProfile(cred.user, { displayName: name });
      
      // Create Firestore profile immediately
      const userDocRef = doc(db, 'users', cred.user.uid);
      const newProfile: UserProfile = {
        id: cred.user.uid,
        name,
        email,
        role,
        phone: ''
      };
      await setDoc(userDocRef, newProfile);
    } catch (error: any) {
      console.error("Sign up failed", error);
      throw new Error(getAuthErrorMessage(error));
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error("Password reset failed", error);
      throw new Error(getAuthErrorMessage(error));
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Sign out failed", error);
    }
  };

  const updateProfile = async (profileUpdate: Partial<UserProfile>) => {
    if (!user || !auth.currentUser) return;
    const userDocRef = doc(db, 'users', user.id);
    try {
      // Sync with Firebase Auth if name is updated
      if (profileUpdate.name) {
        await firebaseUpdateProfile(auth.currentUser, { displayName: profileUpdate.name });
      }

      // Create a clean data object for Firestore
      const { isNew, id, ...currentData } = user as any;
      const finalData = { ...currentData, ...profileUpdate };
      
      // Recursively remove undefined fields to prevent Firestore crashes
      const cleanObject = (obj: any): any => {
        const newObj: any = {};
        Object.keys(obj).forEach(key => {
          if (obj[key] !== undefined) {
             if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
                newObj[key] = cleanObject(obj[key]);
             } else {
                newObj[key] = obj[key];
             }
          }
        });
        return newObj;
      };

      const sanitizedData = cleanObject(finalData);
      // Ensure id is present for create/update logic in rules
      sanitizedData.id = user.id;
      // Remove internal flag
      delete sanitizedData.isNew;
      
      await setDoc(userDocRef, sanitizedData, { merge: true });
    } catch (error) {
      console.error("Profile update failed", error);
    }
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      role: user?.role as UserRole, // Don't default to 'driver'
      isLoggedIn: !!user, 
      isLoading,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      sendPasswordReset,
      signOut,
      updateProfile 
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
