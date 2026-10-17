import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/navigation/Navbar';
import Sidebar from '../components/navigation/Sidebar';
import { Menu, X, ShieldAlert } from 'lucide-react';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Navbar />

      {/* Admin Top Notification Strip */}
      <div className="bg-fixblue-900 text-slate-200 text-xs py-1.5 px-4 flex items-center justify-between border-b border-fixblue-950">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-semibold text-fixteal-300">
            <ShieldAlert className="w-3.5 h-3.5" />
            FixAround Administrator Portal — Full System Privileges
          </span>
          <span className="hidden sm:inline text-[11px] text-slate-400">
            Database: Connected &bull; Realtime Sync Active
          </span>
        </div>
      </div>

      {/* Mobile Drawer Toggle */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="inline-flex items-center gap-2 text-xs font-bold text-fixblue-900 px-3 py-1.5 rounded-lg border border-slate-200"
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span>Admin Navigation</span>
        </button>
      </div>

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar className="hidden md:flex border-r border-slate-200 shadow-2xs" />

        {/* Mobile Drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white z-50">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-800">Admin Controls</span>
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
