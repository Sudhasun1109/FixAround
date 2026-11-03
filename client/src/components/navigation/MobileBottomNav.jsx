import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';
import {
  Home,
  Calendar,
  MessageSquare,
  User,
  Wrench,
  LayoutDashboard,
  Bell,
} from 'lucide-react';

export default function MobileBottomNav() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // If user is technician or admin, customize the tabs accordingly
  const isTechnician = user?.role === ROLES.TECHNICIAN;
  const isAdmin = user?.role === ROLES.ADMIN;

  const customerTabs = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      path: isAuthenticated ? '/customer/dashboard' : '/',
      exact: true,
    },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: Calendar,
      path: isAuthenticated ? '/customer/bookings' : '/services',
    },
    {
      id: 'notifications',
      label: 'Alerts',
      icon: Bell,
      path: isAuthenticated ? '/customer/notifications' : '/contact',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      path: isAuthenticated ? '/customer/profile' : '/login',
    },
  ];

  const technicianTabs = [
    {
      id: 'home',
      label: 'Home',
      icon: LayoutDashboard,
      path: '/technician/dashboard',
    },
    {
      id: 'requests',
      label: 'Requests',
      icon: Calendar,
      path: '/technician/requests',
    },
    {
      id: 'earnings',
      label: 'Earnings',
      icon: Wrench,
      path: '/technician/earnings',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      path: '/technician/profile',
    },
  ];

  const adminTabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/admin/dashboard',
    },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: Calendar,
      path: '/admin/bookings',
    },
    {
      id: 'approvals',
      label: 'Technicians',
      icon: Wrench,
      path: '/admin/technicians',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: User,
      path: '/admin/settings',
    },
  ];

  const tabs = isTechnician
    ? technicianTabs
    : isAdmin
    ? adminTabs
    : customerTabs;

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-3 pt-2 bg-gradient-to-t from-slate-900/10 via-transparent to-transparent pointer-events-none"
    >
      <div className="pointer-events-auto max-w-md mx-auto bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-xl shadow-slate-900/10 rounded-full px-3 py-2 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            location.pathname === tab.path ||
            (tab.path !== '/' && location.pathname.startsWith(tab.path));

          return (
            <NavLink
              key={tab.id}
              to={tab.path}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all duration-200 select-none ${
                isActive
                  ? 'text-fixblue-500 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div
                className={`p-1.5 rounded-full transition-colors ${
                  isActive ? 'bg-fixblue-50 text-fixblue-500' : ''
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-fixblue-500 animate-pulse" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
