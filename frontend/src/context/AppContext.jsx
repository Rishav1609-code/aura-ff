import React, { createContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('aura_rfc_session');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [token, setToken] = useState(() => localStorage.getItem('aura_auth_token'));
  const [socket, setSocket] = useState(null);
  const [peer, setPeer] = useState(null);
  const [globalOnlineCount, setGlobalOnlineCount] = useState("...");
  const [isAdminView, setIsAdminView] = useState(() => {
    return localStorage.getItem('aura_is_admin_view') === 'true';
  });
  
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:10000';

  useEffect(() => {
    localStorage.setItem('aura_is_admin_view', isAdminView);
  }, [isAdminView]);

  useEffect(() => {
    if (token) {
      fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          const userObj = {
            id: data.user.id,
            fullName: data.user.full_name || data.user.email,
            username: data.user.username || data.user.email,
            role: data.user.role || 'Student',
            societyId: data.user.society_id || '',
            status: data.user.status,
            verified: data.user.status === 'verified',
            email: data.user.email
          };
          localStorage.setItem('aura_rfc_session', JSON.stringify(userObj));
          localStorage.setItem('aura_auth_token', data.token);
          setCurrentUser(userObj);
          setToken(data.token);
        } else {
          // Token invalid or user removed
          localStorage.removeItem('aura_auth_token');
          localStorage.removeItem('aura_rfc_session');
          setToken(null);
          setCurrentUser(null);
        }
      })
      .catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (token && currentUser?.status === 'verified') {
      const newSocket = io(BACKEND_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000
      });
      
      newSocket.on('connect', () => {
        newSocket.emit('authenticate', {
          token: token,
          user: currentUser,
          peerId: null // We will handle peerId later
        });
      });

      newSocket.on('online_count', (count) => {
        setGlobalOnlineCount(count);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [token, currentUser, BACKEND_URL]);

  return (
    <AppContext.Provider value={{ currentUser, setCurrentUser, token, setToken, socket, peer, setPeer, BACKEND_URL, isAdminView, setIsAdminView, globalOnlineCount }}>
      {children}
    </AppContext.Provider>
  );
};
