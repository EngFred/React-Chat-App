import React, { lazy } from 'react';
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

/**
 * PrivateRoute component acts as a route guard.
 * It renders its children only if a user is authenticated.
 * Otherwise, it navigates the user to the login page.
 */
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuthStore();
  return currentUser ? <>{children}</> : <Navigate to={AppRoutes.LOGIN} />;
};

/**
 * PublicRoute component acts as a route guard for public routes.
 * It renders its children only if no user is authenticated.
 * If a user is authenticated, it navigates them to the chat page.
 */
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuthStore();
  return currentUser ? <Navigate to={AppRoutes.CHAT} /> : <>{children}</>;
};

/**
 * AppRouter component defines all the application's routes and their corresponding components.
 * It uses PrivateRoute and PublicRoute to manage access control.
 */
const AppRouter: React.FC = () => {
  return (
    <Routes>
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
        path={AppRoutes.CALL}
        element={
          <PrivateRoute>
            <CallPage />
          </PrivateRoute>
        }
      />
      <Route path={AppRoutes.NOT_FOUND} element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRouter;