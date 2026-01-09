import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // Backwards-compatible alias used by some components
  const currentUser = user;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token'); // raw token
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Verify token and get user info
      axios.get('/api/auth/user')
        .then(response => {
          setUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const credentials = {
    username: username, // the state value or input value
    password: password,
  };

    try {
      // console.log(axios.getUri)
      // const response = await axios.post('/api/auth/signin', {
      //   username,
      //   password
      // });
      const response = await authAPI.login(credentials)

      const { accessToken, tokenType, ...userData } = response.data;

      // Store only raw token
      localStorage.setItem('token', accessToken);

      // Always prepend Bearer when setting headers
      axios.defaults.headers.common['Authorization'] = `${tokenType} ${accessToken}`;

      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (userData) => {
    try {
      await axios.post('/api/auth/signup', userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const hasRole = (role) => {
    return user && user.roles && user.roles.includes(role);
  };

  const value = {
    user,
    currentUser,
    login,
    register,
    logout,
    hasRole,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
