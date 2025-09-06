'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  db 
} from '@/lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User,
  sendEmailVerification
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthUser extends User {
  role?: 'admin' | 'operator';
  isActive?: boolean;
  locationIds?: string[];
  name?: string;
  mobile?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signup: (email: string, password: string, name: string, mobile: string, role?: 'admin' | 'operator') => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const userData = userDoc.data();
        
        const authUser: AuthUser = {
          ...firebaseUser,
          role: userData?.role,
          isActive: userData?.isActive,
          locationIds: userData?.locationIds,
          name: userData?.name,
          mobile: userData?.mobile
        };
        
        setUser(authUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email: string, password: string, name: string, mobile: string, role: 'admin' | 'operator' = 'operator') => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Send email verification
      await sendEmailVerification(firebaseUser);
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        email,
        name,
        mobile,
        role,
        isActive: false, // Default to false, needs admin approval
        locationIds: [],
        createdAt: serverTimestamp(),
        createdBy: firebaseUser.uid,
        lastLogin: serverTimestamp()
      });
      
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Update last login
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        lastLogin: serverTimestamp()
      }, { merge: true });
      
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const sendVerificationEmail = async () => {
    if (user) {
      await sendEmailVerification(user);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signup,
    login,
    logout,
    sendVerificationEmail
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}