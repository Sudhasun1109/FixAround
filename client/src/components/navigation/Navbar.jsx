import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';
import NotificationBell from '../notification/NotificationBell';
import {
  Wrench,
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  AlertTriangle,
  LayoutDashboard,
  Calendar,
  Wallet,
  Settings,
  ShieldAlert,
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    if (user.role === ROLES.ADMIN) return '/admin/dashboard';
    if (user.role === ROLES.TECHNICIAN) return '/technician/dashboard';
    return '/customer/dashboard';
  };

  const getNavLinks = () => {
    if (!isAuthenticated) {
      return [
        { label: 'Home', path: '/' },
        { label: 'Services', path: '/services' },
        { label: 'How It Works', path: '/how-it-works' },
        { label: 'Emergency', path: '/emergency', emergency: true },
      ];
    }

    if (user?.role === ROLES.CUSTOMER) {
      return [
        { label: 'Dashboard', path: '/customer/dashboard' },
        { label: 'Find Services', path: '/services' },
        { label: 'My Bookings', path: '/customer/bookings' },
        { label: 'Emergency', path: '/customer/emergency', emergency: true },
      ];
    }

    if (user?.role === ROLES.TECHNICIAN) {
      return [
        { label: 'Dashboard', path: '/technician/dashboard' },
        { label: 'Incoming Requests', path: '/technician/requests' },
        { label: 'Earnings', path: '/technician/earnings' },
      ];
    }

    if (user?.role === ROLES.ADMIN) {
      return [
        { label: 'Dashboard', path: '/admin/dashboard' },
        { label: 'Users', path: '/admin/customers' },
        { label: 'Bookings', path: '/admin/bookings' },
        { label: 'Settings', path: '/admin/settings' },
      ];
    }

    return [];
  };

  const links = getNavLinks();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-fixblue-800 flex items-center justify-center text-white shadow-md group-hover:bg-fixblue-900 transition-colors">
              <Wrench className="w-5 h-5 text-fixteal-400 group-hover:rotate-12 transition-transform" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-fixblue-900">
                Fix<span className="text-fixteal-600">Around</span>
              </span>
              <span className="block text-[9px] font-bold tracking-widest text-slate-600 uppercase -mt-1">
                Local Repairs
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {links.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) => `
                  px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors
                  ${
                    link.emergency
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 flex items-center gap-1.5 border border-rose-200'
                      : isActive
                      ? 'text-fixblue-900 bg-slate-100'
                      : 'text-slate-600 hover:text-fixblue-900 hover:bg-slate-50'
                  }
                `}
              >
                {link.emergency && (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-bounce" />
                )}
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* User Section & Notifications */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <NotificationBell />

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-fixblue-800 text-white flex items-center justify-center font-bold text-xs uppercase overflow-hidden">
                      {user?.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.first_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>
                          {user?.first_name ? user.first_name[0] : 'U'}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-700 max-w-[120px] truncate">
                      {user?.first_name || 'My Account'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-slate-100 py-1.5 z-50">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-xs font-medium text-slate-500">Signed in as</p>
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {user?.email}
                        </p>
                        <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {user?.role}
                        </span>
                      </div>

                      <div className="py-1">
                        <Link
                          to={getDashboardPath()}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <LayoutDashboard className="w-4 h-4 text-slate-400" />
                          Dashboard
                        </Link>

                        <Link
                          to={`/${user?.role}/profile`}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          Profile & Settings
                        </Link>
                      </div>

                      <div className="border-t border-slate-100 py-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-fixblue-900 hover:text-fixblue-950 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-fixblue-800 hover:bg-fixblue-900 rounded-lg shadow-sm transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center gap-2">
            {isAuthenticated && <NotificationBell />}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-semibold ${
                link.emergency
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-4 border-t border-slate-100">
            {isAuthenticated ? (
              <div className="space-y-2">
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  Dashboard
                </Link>
                <Link
                  to={`/${user?.role}/profile`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  Profile Settings
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-lg"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 px-4 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 px-4 rounded-lg bg-fixblue-800 text-sm font-semibold text-white shadow-xs"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
