import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/navigation/Navbar';
import Sidebar from '../components/navigation/Sidebar';
import { Menu, X } from 'lucide-react';

export default function TechnicianLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Mobile Drawer Toggle */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="inline-flex items-center gap-2 text-xs font-bold text-fixblue-900 px-3 py-1.5 rounded-lg border border-slate-200"
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span>Technician Menu</span>
        </button>
      </div>

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar className="hidden md:flex" />

        {/* Mobile Drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white z-50">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-800">Technician Menu</span>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
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
    </div>
  );
}
