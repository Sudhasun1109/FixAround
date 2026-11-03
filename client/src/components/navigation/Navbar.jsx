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
  Download,
  MapPin,
  Sparkles,
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
        { label: 'Wallet & Points', path: '/customer/wallet' },
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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-fixblue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-[#172033]">
                  Fix<span className="text-fixblue-500">Around</span>
                </span>
                <span className="block text-[9px] font-bold tracking-widest text-slate-400 uppercase -mt-1">
                  Smart Local Service
                </span>
              </div>
            </Link>

            {/* Location Pill Selector */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-fixblue-500" />
              <span>Tiruppur, India</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5">
            {links.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) => `
                  px-4 py-2 rounded-full text-xs font-bold transition-all
                  ${
                    link.emergency
                      ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center gap-1.5 border border-rose-200 shadow-xs'
                      : isActive
                      ? 'text-fixblue-600 bg-blue-50/80 shadow-2xs'
                      : 'text-slate-600 hover:text-fixblue-600 hover:bg-slate-50'
                  }
                `}
              >
                {link.emergency && (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                )}
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* User Section & Notifications */}
          <div className="hidden md:flex items-center gap-3">
            {/* PWA Install Trigger */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('fixaround:open-pwa-install'))}
              className="p-2 rounded-full text-slate-500 hover:text-fixblue-600 hover:bg-slate-50 transition-colors"
              title="Install FixAround App"
            >
              <Download className="w-4 h-4" />
            </button>

            {isAuthenticated ? (
              <>
                <NotificationBell />

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-slate-200/90 hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    <div className="w-7 h-7 rounded-full bg-fixblue-500 text-white flex items-center justify-center font-bold text-xs uppercase overflow-hidden shadow-xs">
                      {user?.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.first_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{user?.first_name ? user.first_name[0] : 'U'}</span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-700 max-w-[120px] truncate">
                      {user?.first_name || 'Account'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-3xl bg-white shadow-card border border-slate-100 py-2 z-50">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Signed in as
                        </p>
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {user?.email}
                        </p>
                        <span className="inline-block mt-1 text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-fixblue-600">
                          {user?.role}
                        </span>
                      </div>

                      <div className="py-1 text-xs">
                        <Link
                          to={getDashboardPath()}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-semibold"
                        >
                          <LayoutDashboard className="w-4 h-4 text-slate-400" />
                          <span>Dashboard</span>
                        </Link>

                        {user?.role === ROLES.CUSTOMER && (
                          <>
                            <Link
                              to="/customer/bookings"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-semibold"
                            >
                              <Calendar className="w-4 h-4 text-slate-400" />
                              <span>My Bookings</span>
                            </Link>
                            <Link
                              to="/customer/wallet"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-semibold"
                            >
                              <Wallet className="w-4 h-4 text-fixblue-500" />
                              <span>Wallet & Rewards</span>
                            </Link>
                          </>
                        )}

                        <Link
                          to={`/${user?.role}/profile`}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-semibold"
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                          <span>Profile Settings</span>
                        </Link>
                      </div>

                      <div className="pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
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
                  className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 rounded-full bg-fixblue-500 hover:bg-fixblue-600 text-white text-xs font-bold shadow-md shadow-blue-500/25 active:scale-95 transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right Controls: Bell & Menu Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            {isAuthenticated && <NotificationBell />}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full text-slate-700 hover:bg-slate-100"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-5 pt-3 pb-6 space-y-2 shadow-xl">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2.5 rounded-full text-xs font-bold ${
                link.emergency
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-3 border-t border-slate-100">
            {isAuthenticated ? (
              <div className="space-y-1">
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 text-xs font-bold text-slate-700"
                >
                  Dashboard
                </Link>
                <Link
                  to={`/${user?.role}/profile`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 text-xs font-bold text-slate-700"
                >
                  Profile Settings
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 px-4 rounded-full border border-slate-200 text-xs font-bold text-slate-700"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 px-4 rounded-full bg-fixblue-500 text-xs font-bold text-white shadow-xs"
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
