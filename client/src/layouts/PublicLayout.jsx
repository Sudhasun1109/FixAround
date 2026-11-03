import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/navigation/Navbar';
import Footer from '../components/navigation/Footer';
import MobileBottomNav from '../components/navigation/MobileBottomNav';

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FB] text-[#172033]">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        {children || <Outlet />}
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
