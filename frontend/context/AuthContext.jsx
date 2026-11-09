import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const DEFAULT_USERS = [
  {
    id: 1,
    username: 'arao',
    full_name: 'Dr. Ananya Rao',
    email: 'arao@clinova-health.org',
    role: 'Researcher',
    role_id: 2,
    department: 'Clinical Outcomes & Predictive Modeling',
  },
  {
    id: 2,
    username: 'evance',
    full_name: 'Dr. Elena Vance',
    email: 'elena.vance@clinova-health.org',
    role: 'Administrator',
    role_id: 1,
    department: 'Clinical Informatics & Data Science',
  },
  {
    id: 3,
    username: 'mreid',
    full_name: 'Dr. Marcus Reid',
    email: 'marcus.reid@clinova-health.org',
    role: 'Researcher',
    role_id: 2,
    department: 'Cardiovascular Outcomes Research',
  },
  {
    id: 4,
    username: 'schen',
    full_name: 'Sarah Chen, RN',
    email: 'sarah.chen@clinova-health.org',
    role: 'Viewer',
    role_id: 3,
    department: 'Clinical Quality & Safety Directorate',
  },
];

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('clinova_user');
    return saved ? JSON.parse(saved) : DEFAULT_USERS[0];
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('clinova_token') || 'clinova_dev_token';
  });

  const [selectedProjectId, setSelectedProjectId] = useState(1);

  const switchUser = (user) => {
    setCurrentUser(user);
    localStorage.setItem('clinova_user', JSON.stringify(user));
  };

  const login = async (usernameOrEmail, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameOrEmail, password }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Authentication failed');
      }
      const data = await res.json();
      setToken(data.token);
      setCurrentUser(data.user);
      localStorage.setItem('clinova_token', data.token);
      localStorage.setItem('clinova_user', JSON.stringify(data.user));
      return data;
    } catch (e) {
      console.warn('Backend login fallback to local user switch:', e);
      const match = DEFAULT_USERS.find(
        (u) => u.username === usernameOrEmail || u.email === usernameOrEmail
      );
      if (match) {
        switchUser(match);
        return { user: match };
      }
      throw e;
    }
  };

  const logout = () => {
    localStorage.removeItem('clinova_token');
    localStorage.removeItem('clinova_user');
    setCurrentUser(DEFAULT_USERS[0]);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        selectedProjectId,
        setSelectedProjectId,
        switchUser,
        login,
        logout,
        isAdmin: currentUser.role === 'Administrator',
        isResearcher: currentUser.role === 'Researcher' || currentUser.role === 'Administrator',
        isViewer: currentUser.role === 'Viewer',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
