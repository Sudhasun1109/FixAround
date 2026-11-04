import React from 'react';
import { NotificationProvider } from './context/NotificationContext';
import { CallProvider } from './context/CallContext';
import CallModal from './components/call/CallModal';
import AppRouter from './routes/AppRouter';
import { ToastContainer } from './components/common/Toast';
import ErrorBoundary from './components/common/ErrorBoundary';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';

export default function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <CallProvider>
          <AppRouter />
          <CallModal />
          <PWAInstallPrompt />
          <ToastContainer />
        </CallProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}
