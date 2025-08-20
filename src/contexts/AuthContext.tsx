import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  display_name: string;
  bio?: string;
  company?: string;
  role?: string;
  created_at: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ppt-maker-ezzr.onrender.com/api';

  // Check if user is already authenticated on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');
      
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      // If we have a stored user, set it immediately for better UX
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setToken(storedToken);
        } catch (e) {
          console.warn('Failed to parse stored user data:', e);
        }
      }

      // Try to validate with backend (but don't fail completely if it doesn't work)
      try {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setToken(storedToken);
          // Update localStorage with fresh user data
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          // Only remove token if we get a specific auth error
          if (response.status === 401 || response.status === 403) {
            console.log('Token validation failed, removing auth data');
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            setUser(null);
            setToken(null);
          }
          // For other errors (like network issues), keep the stored data
        }
      } catch (error) {
        console.warn('Backend validation failed, keeping stored auth data:', error);
        // Don't remove stored data on network errors
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Only clear on critical errors
      if (error instanceof Error && error.message.includes('JSON')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    updateUser,
    checkAuthStatus
  };

  // Debug token state
  useEffect(() => {
    console.log('🔐 AuthContext token state changed:', { token, hasToken: !!token });
  }, [token]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
