import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, googleProvider } from '../firebase';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  User as FirebaseUser,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
} from 'firebase/firestore';
import LoadingSpinner from '../components/LoadingSpinner';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<FirebaseUser | string | null>;
  signOut: () => Promise<void>;
  signInWithEmailAndPassword: (email: string, password: string) => Promise<FirebaseUser | string | null>;
  createUserWithEmailAndPassword: (email: string, password: string) => Promise<FirebaseUser | string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const db = getFirestore(auth.app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const createUserDocument = async (user: FirebaseUser) => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    try {
      await setDoc(userDocRef, {
        displayName: user.displayName || null,
        email: user.email || null,
        photoURL: user.photoURL || null,
        // Add any other user data you want to store here
      }, { merge: true });
      console.log("User document created/updated in Firestore.");
    } catch (error) {
      console.error("Error creating/updating user document:", error);
    }
  };

  const signInWithGoogle = async (): Promise<FirebaseUser | string | null> => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setCurrentUser(result.user);
      await createUserDocument(result.user);
      setIsLoading(false);
      return result.user;
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      setIsLoading(false);
      return error.message || "Google Sign-In failed.";
    }
  };

  const signInWithEmailAndPassword = async (email: string, password: string): Promise<FirebaseUser | string | null> => {
    setIsLoading(true);
    try {
      const userCredential = await firebaseSignInWithEmailAndPassword(auth, email, password);
      setCurrentUser(userCredential.user);
      await createUserDocument(userCredential.user);
      setIsLoading(false);
      return userCredential.user;
    } catch (error: any) {
      console.error("Email/Password Sign-In Error:", error);
      setIsLoading(false);
      return error.message || "Email/Password Sign-In failed.";
    }
  };

  const createUserWithEmailAndPassword = async (email: string, password: string): Promise<FirebaseUser | string | null> => {
    setIsLoading(true);
    try {
      const userCredential = await firebaseCreateUserWithEmailAndPassword(auth, email, password);
      setCurrentUser(userCredential.user);
      await createUserDocument(userCredential.user);
      setIsLoading(false);
      return userCredential.user;
    } catch (error: any) {
      console.error("Email/Password Registration Error:", error);
      setIsLoading(false);
      return error.message || "Email/Password Registration failed.";
    }
  };

  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
    } catch (error) {
      console.error("Sign Out Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F0E1D1]">
        <LoadingSpinner size="lg" />
        <p className="ml-3 text-slate-700">Authenticating...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      currentUser,
      isLoading,
      signInWithGoogle,
      signOut,
      signInWithEmailAndPassword,
      createUserWithEmailAndPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
