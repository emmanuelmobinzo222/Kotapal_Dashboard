import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { api } from '../utils/api';
import { firebaseAuth, firebaseDB, offlineManager } from '../firebase';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Listen for online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online!');
      // Sync any pending changes
      offlineManager.processPendingQueue();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast('You are offline. Changes will sync when back online.', {
        icon: '📴',
        duration: 4000
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // First, check for cached user data for offline support
        const cachedUser = offlineManager.getCachedData('currentUser');
        
        // Check localStorage token for existing session
        const token = localStorage.getItem('kotaToken');
        
        if (token) {
          // Set the token in API client
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          if (navigator.onLine) {
            // Online: Verify token and get fresh user data
            try {
              const response = await api.get('/user/profile');
              const userData = response.data;
              setUser(userData);
              // Cache user data for offline use
              offlineManager.cacheUserData('currentUser', userData);
            } catch (error) {
              console.error('Token verification failed:', error);
              // If token verification fails but we have cached data, use it
              if (cachedUser?.data) {
                setUser(cachedUser.data);
                toast('Using cached data - you may be offline', { icon: '📴' });
              } else {
                // Clear invalid token
                localStorage.removeItem('kotaToken');
                localStorage.removeItem('kotaUser');
                delete api.defaults.headers.common['Authorization'];
              }
            }
          } else {
            // Offline: Use cached user data
            if (cachedUser?.data) {
              setUser(cachedUser.data);
              console.log('Using cached user data (offline)');
            }
          }
        } else if (cachedUser?.data && !navigator.onLine) {
          // No token but have cached data and offline
          setUser(cachedUser.data);
          console.log('Using cached user data (offline, no token)');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Try to use cached data on error
        const cachedUser = offlineManager.getCachedData('currentUser');
        if (cachedUser?.data) {
          setUser(cachedUser.data);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    if (!navigator.onLine) {
      // Offline login - check cached credentials
      const cachedUser = offlineManager.getCachedData('currentUser');
      if (cachedUser?.data && cachedUser.data.email === email) {
        setUser(cachedUser.data);
        toast.success('Logged in with cached data (offline)');
        return cachedUser.data;
      }
      throw new Error('Cannot login while offline. Please connect to the internet.');
    }

    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: userData, token } = response.data;
      
      // Store auth data
      localStorage.setItem('kotaToken', token);
      localStorage.setItem('kotaUser', JSON.stringify(userData));
      
      // Set token in API client
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Cache user data for offline use
      offlineManager.cacheUserData('currentUser', userData);
      
      setUser(userData);
      toast.success('Welcome back!');
      
      return userData;
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      throw error;
    }
  }, []);

  const register = useCallback(async (userData) => {
    if (!navigator.onLine) {
      throw new Error('Cannot register while offline. Please connect to the internet.');
    }

    try {
      const response = await api.post('/auth/register', userData);
      const { user: newUser, token } = response.data;
      
      // Store auth data
      localStorage.setItem('kotaToken', token);
      localStorage.setItem('kotaUser', JSON.stringify(newUser));
      
      // Set token in API client
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Cache user data for offline use
      offlineManager.cacheUserData('currentUser', newUser);
      
      // Also save to Firebase Auth for password reset functionality
      try {
        await firebaseAuth.signUp(userData.email, userData.password, userData.name);
      } catch (firebaseError) {
        console.warn('Firebase auth registration failed (non-critical):', firebaseError);
      }
      
      setUser(newUser);
      toast.success('Account created successfully!');
      
      return newUser;
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      toast.error(message);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    // Clear auth data
    localStorage.removeItem('kotaToken');
    localStorage.removeItem('kotaUser');
    delete api.defaults.headers.common['Authorization'];
    
    // Don't clear cache on logout - keep for offline access
    // But mark as logged out
    offlineManager.cacheUserData('currentUser', null);
    
    // Sign out from Firebase
    firebaseAuth.signOut();
    
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  const updateUser = useCallback(async (userData) => {
    if (!navigator.onLine) {
      // Queue update for when back online
      offlineManager.addToPendingQueue({
        type: 'updateProfile',
        userId: user.id,
        data: userData
      });
      
      // Update local state and cache
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      offlineManager.cacheUserData('currentUser', updatedUser);
      
      toast.success('Profile updated locally. Will sync when online.');
      return updatedUser;
    }

    try {
      const response = await api.put('/user/profile', userData);
      const updatedUser = response.data;
      
      // Update stored user data
      localStorage.setItem('kotaUser', JSON.stringify(updatedUser));
      
      // Update cache
      offlineManager.cacheUserData('currentUser', updatedUser);
      
      // Also update in Firebase
      try {
        await firebaseDB.updateUserProfile(user.id, userData);
      } catch (firebaseError) {
        console.warn('Firebase profile update failed (non-critical):', firebaseError);
      }
      
      setUser(updatedUser);
      
      toast.success('Profile updated successfully');
      return updatedUser;
    } catch (error) {
      const message = error.response?.data?.error || 'Update failed';
      toast.error(message);
      throw error;
    }
  }, [user]);

  const value = {
    user,
    loading,
    isOnline,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
