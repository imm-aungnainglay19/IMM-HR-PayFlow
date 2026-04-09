import React, { createContext, useContext, useEffect, useState } from 'react';
import pb from './lib/pocketbase';
import { AuthModel } from 'pocketbase';

interface AuthContextType {
  user: AuthModel | null;
  isAdmin: boolean;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthModel | null>(pb.authStore.model);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((token, model) => {
      setUser(model);
    });

    // Initial check
    setIsLoading(false);

    return () => unsubscribe();
  }, []);

  const logout = () => {
    pb.authStore.clear();
    setUser(null);
  };

  const isAdmin = user?.collectionName === 'admins' || user?.email === 'admin@example.com'; // Adjust based on your logic

  return (
    <AuthContext.Provider value={{ user, isAdmin, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
