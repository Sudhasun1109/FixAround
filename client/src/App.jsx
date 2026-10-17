import React from 'react';
import { NotificationProvider } from './context/NotificationContext';
import AppRouter from './routes/AppRouter';
import { ToastContainer } from './components/common/Toast';

export default function App() {
  return (
    <NotificationProvider>
      <AppRouter />
      <ToastContainer />
    </NotificationProvider>
  );
}
