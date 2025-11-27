import { useState, useEffect, createContext, useContext } from 'react';
import { api } from '../utils/api';
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

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('kotaToken');
        if (token) {
          // Set the token in API client
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Verify token and get user data
          const response = await api.get('/user/profile');
          setUser(response.data);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear invalid token
        localStorage.removeItem('kotaToken');
        localStorage.removeItem('kotaUser');
        delete api.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: userData, token } = response.data;
      
      // Store auth data
      localStorage.setItem('kotaToken', token);
      localStorage.setItem('kotaUser', JSON.stringify(userData));
      
      // Set token in API client
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(userData);
      toast.success('Welcome back!');
      
      return userData;
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { user: newUser, token } = response.data;
      
      // Store auth data
      localStorage.setItem('kotaToken', token);
      localStorage.setItem('kotaUser', JSON.stringify(newUser));
      
      // Set token in API client
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(newUser);
      toast.success('Account created successfully!');
      
      return newUser;
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    // Clear auth data
    localStorage.removeItem('kotaToken');
    localStorage.removeItem('kotaUser');
    delete api.defaults.headers.common['Authorization'];
    
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = async (userData) => {
    try {
      const response = await api.put('/user/profile', userData);
      const updatedUser = response.data;
      
      // Update stored user data
      localStorage.setItem('kotaUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      toast.success('Profile updated successfully');
      return updatedUser;
    } catch (error) {
      const message = error.response?.data?.error || 'Update failed';
      toast.error(message);
      throw error;
    }
  };

  const value = {
    user,
    loading,
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
