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

// Helper function to ensure user has required properties
function ensureAuthUser(firebaseUser: User, userData?: any): AuthUser {
  const authUser: AuthUser = {
    ...firebaseUser,
    role: userData?.role || 'admin', // Default to admin if not specified
    isActive: userData?.isActive !== false, // Default to true if not explicitly false
    locationIds: userData?.locationIds || [],
    name: userData?.name || firebaseUser.displayName || 'User',
    mobile: userData?.mobile || ''
  };
  
  console.log('ensureAuthUser: Created AuthUser:', {
    uid: authUser.uid,
    email: authUser.email,
    role: authUser.role,
    isActive: authUser.isActive,
    name: authUser.name
  });
  
  return authUser;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('AuthContext: onAuthStateChanged triggered', {
        firebaseUser: firebaseUser ? {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified
        } : null
      });

      if (firebaseUser) {
        try {
          // Get user data from Firestore
          console.log('AuthContext: Fetching user data from Firestore for UID:', firebaseUser.uid);
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.data();
          
          console.log('AuthContext: Firestore user data:', {
            exists: userDoc.exists(),
            userData: userData
          });
          
          if (!userDoc.exists()) {
            console.error('AuthContext: User document not found in Firestore for UID:', firebaseUser.uid);
            // Create basic user document if it doesn't exist
            const basicUserData = {
              email: firebaseUser.email,
              name: firebaseUser.displayName || 'Admin User',
              role: 'admin',
              isActive: true,
              locationIds: [],
              createdAt: serverTimestamp(),
              createdBy: firebaseUser.uid,
              lastLogin: serverTimestamp()
            };
            
            console.log('AuthContext: Creating basic user document:', basicUserData);
            await setDoc(doc(db, 'users', firebaseUser.uid), basicUserData);
            
            const authUser = ensureAuthUser(firebaseUser, basicUserData);
            setUser(authUser);
            
          } else {
            const authUser = ensureAuthUser(firebaseUser, userData);
            setUser(authUser);
          }
        } catch (error) {
          console.error('AuthContext: Error fetching user data:', error);
          // Still set the basic Firebase user even if Firestore fails
          const fallbackUser = ensureAuthUser(firebaseUser);
          setUser(fallbackUser);
          console.log('AuthContext: Fallback AuthUser created');
        }
      } else {
        console.log('AuthContext: No Firebase user, setting user to null');
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email: string, password: string, name: string, mobile: string, role: 'admin' | 'operator' = 'operator') => {
    try {
      console.log('Signup attempt:', { email, name, mobile, role });
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      console.log('Firebase user created:', firebaseUser.uid);
      
      // Send email verification
      await sendEmailVerification(firebaseUser);
      
      // Create user document in Firestore
      // Admin users are active by default, operators need approval
      const userData = {
        email,
        name,
        mobile,
        role,
        isActive: role === 'admin', // Admin users are active immediately, operators need approval
        locationIds: [],
        createdAt: serverTimestamp(),
        createdBy: firebaseUser.uid,
        lastLogin: serverTimestamp()
      };
      
      console.log('Creating user document in Firestore:', userData);
      
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      console.log('User document created successfully');
      
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