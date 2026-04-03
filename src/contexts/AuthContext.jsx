import React, { createContext, useState, useContext, useEffect } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        try {
          const adminDoc = await getDoc(doc(db, 'admins', user.email));
          setIsAdmin(adminDoc.exists());
        } catch { setIsAdmin(false); }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signUp = async (email, password, name) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', result.user.uid), { name, email, createdAt: new Date().toISOString(), role: 'user' });
      toast.success('Account created! Welcome to Ambaji Temple');
      return result;
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const signIn = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      toast.success('Welcome to Ambaji Temple!');
      return result;
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await setDoc(doc(db, 'users', result.user.uid), { name: result.user.displayName, email: result.user.email, createdAt: new Date().toISOString(), role: 'user' }, { merge: true });
      toast.success('Logged in with Google!');
      return result;
    } catch (error) {
      toast.error('Google sign in failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signUp, signIn, signInWithGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};