import { useState, createContext, useContext, useEffect } from 'react';

const AuthContext = createContext<any>(null);

// Normalize backend user shape to what the app expects
const normalizeUser = (data: any) => {
  if (!data) return null;
  return {
    ...data,
    name: data.fullName || data.name || data.username,
    role: data.role || (Array.isArray(data.roles) ? data.roles[0] : (data.roles instanceof Object ? Object.values(data.roles)[0] : 'Viewer')),
  };
};

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then(data => {
        if (data.id) setUser(normalizeUser(data));
        else localStorage.removeItem('token');
      })
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) return false;

      const data = await res.json();
      if (!data.token) return false;

      localStorage.setItem('token', data.token);

      // Fetch user details after successful login
      const meRes = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${data.token}` }
      });
      if (meRes.ok) {
        const meData = await meRes.json();
        setUser(normalizeUser(meData));
      }

      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
