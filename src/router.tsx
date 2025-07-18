import React, { lazy } from 'react'; // Added lazy import
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './shared/store/authStore';
import { AppRoutes } from './shared/constants/routes';

const LoginPage = lazy(() => import('./features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('./features/auth/pages/RegisterPage'));
const ChatPage = lazy(() => import('./features/chat/pages/ChatPage'));
const SettingsPage = lazy(() => import('./features/settings/pages/SettingsPage'));
const ProfilePage = lazy(() => import('./features/profile/pages/ProfilePage'));
const NotFoundPage = lazy(() => import('./shared/pages/NotFoundPage'));
const CallPage = lazy(() => import('./features/call/pages/CallPage'));

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuthStore();
  // If `currentUser` exists, render children; otherwise, navigate to the login page.
  return currentUser ? <>{children}</> : <Navigate to={AppRoutes.LOGIN} />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuthStore();
  // If `currentUser` exists, navigate to chat; otherwise, render children.
  return currentUser ? <Navigate to={AppRoutes.CHAT} /> : <>{children}</>;
};

const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes: Accessible to unauthenticated users, redirects authenticated users */}
      <Route
        path={AppRoutes.LOGIN}
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path={AppRoutes.REGISTER}
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* Private Routes: Accessible only to authenticated users, redirects unauthenticated users */}
      <Route
        path={AppRoutes.CHAT}
        element={
          <PrivateRoute>
            <ChatPage />
          </PrivateRoute>
        }
      />
      <Route
        path={AppRoutes.SETTINGS}
        element={
          <PrivateRoute>
            <SettingsPage />
          </PrivateRoute>
        }
      />
      <Route
        path={AppRoutes.PROFILE}
        element={
          <PrivateRoute>
            <ProfilePage />
          </PrivateRoute>
        }
      />
      <Route
        path={AppRoutes.CALL} // Route for audio/video calls with dynamic parameters
        element={
          <PrivateRoute>
            <CallPage />
          </PrivateRoute>
        }
      />

      {/* Fallback Route for Not Found Pages: Catches any undefined paths */}
      <Route path={AppRoutes.NOT_FOUND} element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRouter;