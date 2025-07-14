import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AgoraRTCProvider } from 'agora-rtc-react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { useThemeStore } from './store/themeStore';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ChatPage from './pages/chat/ChatPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import { motion } from 'framer-motion';
import type { IAgoraRTCClient } from 'agora-rtc-react';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loadingAuth, initializeAuth } = useAuthStore();

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [initializeAuth]);

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-text-primary text-lg">
        Loading authentication...
      </div>
    );
  }

  return currentUser ? <>{children}</> : <Navigate to="/" />;
};

const App: React.FC = () => {
  const { currentTheme } = useThemeStore();
  const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }) as unknown as IAgoraRTCClient;

  useEffect(() => {
    document.documentElement.className = '';
    document.documentElement.classList.add(`theme-${currentTheme}`);
  }, [currentTheme]);

  const getToastTheme = (theme: string): 'light' | 'dark' | 'colored' => {
    switch (theme) {
      case 'crystal-light':
        return 'light';
      case 'midnight-glow':
      case 'ocean-breeze':
      case 'sunset-glow':
      case 'slate-elegance':
        return 'dark';
      default:
        return 'light';
    }
  };

  return (
    <AgoraRTCProvider client={agoraClient}>
      <motion.div
        className="min-h-screen bg-background text-text-primary transition-colors duration-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Router>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/chat"
              element={
                <PrivateRoute>
                  <ChatPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <SettingsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={getToastTheme(currentTheme)}
        />
      </motion.div>
    </AgoraRTCProvider>
  );
};

export default App;