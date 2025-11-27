import { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { AdminDashboard } from './components/AdminDashboard';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './utils/supabase/info';

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session?.access_token) {
        setAccessToken(session.access_token);
        setAdminUser(session.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.log('Session check error:', error);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const { data: { session }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert('Login failed: ' + error.message);
        return;
      }

      if (session?.access_token) {
        setAccessToken(session.access_token);
        setAdminUser(session.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.log('Login error:', error);
      alert('Login failed');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setAccessToken(null);
      setAdminUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.log('Logout error:', error);
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <AdminDashboard
      accessToken={accessToken!}
      adminUser={adminUser}
      onLogout={handleLogout}
    />
  );
}
