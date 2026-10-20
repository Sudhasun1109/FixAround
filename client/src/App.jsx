import React from 'react';
import { NotificationProvider } from './context/NotificationContext';
import AppRouter from './routes/AppRouter';
import { ToastContainer } from './components/common/Toast';
import ErrorBoundary from './components/common/ErrorBoundary';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';

export default function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <AppRouter />
        <PWAInstallPrompt />
        <ToastContainer />
      </NotificationProvider>
    </ErrorBoundary>
  );
}
