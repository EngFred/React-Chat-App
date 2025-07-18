import React, { useEffect, useMemo, Suspense, useRef } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion';
import { useThemeStore } from './shared/store/themeStore';
import { useAuthStore } from './shared/store/authStore';
import AppRouter from './router';
import LoadingSpinner from './shared/components/LoadingSpinner';

const App: React.FC = () => {
  const { currentTheme } = useThemeStore();
  const { loadingAuth, currentUser, initializeAuthListener, setOnlineStatus } = useAuthStore();

  const currentUserIdRef = useRef(currentUser?.id);

  const authListenerInitializedRef = useRef(false);

  useEffect(() => {
    currentUserIdRef.current = currentUser?.id;
  }, [currentUser?.id]);

  useEffect(() => {
    if (!authListenerInitializedRef.current) {
      initializeAuthListener();
      authListenerInitializedRef.current = true;
    }

    const handleVisibilityChange = () => {
      if (currentUserIdRef.current) {
        if (document.visibilityState === 'visible') {
          console.log('[App] Tab visible, setting user online.');
          setOnlineStatus(true);
        } else {
          console.log('[App] Tab hidden, setting user offline.');
          setOnlineStatus(false);
        }
      }
    };

    const handleBeforeUnload = () => {
      if (currentUserIdRef.current) {
        console.log('[App] Before unload, setting user offline.');
        // Call directly without the debouncing timeout from the store's setOnlineStatus
        useAuthStore.getState().setOnlineStatus(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      console.log('[App] Online status listeners cleaned up.');
    };
  }, [initializeAuthListener, setOnlineStatus]);

  useEffect(() => {
    document.documentElement.className = `theme-${currentTheme}`;
  }, [currentTheme]);

  const toastTheme = useMemo((): 'light' | 'dark' | 'colored' => {
    switch (currentTheme) {
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
  }, [currentTheme]);

  // Only show the full-page spinner if `loadingAuth` is true.
  if (loadingAuth) {
    console.log('[App] App is loading auth state, showing full-page spinner.');
    return (
      <motion.div
        className="fixed inset-0 flex flex-col items-center justify-center bg-background text-text-secondary z-[9999]" // Added flex, items-center, justify-center, and fixed/inset-0
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <LoadingSpinner size={24} thickness={4} color="text-primary" /> {/* Example props */}
        <p className="mt-4 text-lg font-medium">Initializing application...</p>
      </motion.div>
    );
  }

  console.log('[App] Auth loading complete, rendering AppRouter.');
  return (
    <motion.div
      className="min-h-screen transition-colors duration-300"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Router>
        <Suspense fallback={<LoadingSpinner size={16} thickness={3} color="text-primary" />}> {/* Spinner for Suspense */}
          <AppRouter />
        </Suspense>
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
        theme={toastTheme}
        className="text-sm"
      />
    </motion.div>
  );
};

export default App;