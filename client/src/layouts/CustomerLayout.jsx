import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/navigation/Navbar';
import Sidebar from '../components/navigation/Sidebar';
import MobileBottomNav from '../components/navigation/MobileBottomNav';
import { Menu, X } from 'lucide-react';

export default function CustomerLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FB] text-[#172033]">
      <Navbar />

      {/* Mobile Sidebar Toggle Header (for full dashboard options) */}
      <div className="md:hidden bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 py-2 flex items-center justify-between sticky top-16 z-20">
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="inline-flex items-center gap-2 text-xs font-bold text-fixblue-900 px-3 py-1.5 rounded-full border border-slate-200/90 bg-slate-50"
        >
          {sidebarOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
          <span>Full Menu</span>
        </button>
        <span className="text-xs font-medium text-slate-400">Customer Portal</span>
      </div>

      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-24 md:pb-8">
        {/* Desktop Sidebar */}
        <Sidebar className="hidden md:flex" />

        {/* Mobile Drawer Sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white z-50 shadow-2xl">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-800 text-sm">Navigation</span>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Sidebar className="w-full border-r-0" />
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {children || <Outlet />}
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}
