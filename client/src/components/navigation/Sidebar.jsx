import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';
import {
  LayoutDashboard,
  Calendar,
  AlertTriangle,
  Star,
  ShieldCheck,
  User,
  Bell,
  Wrench,
  DollarSign,
  Award,
  Clock,
  Users,
  CheckCircle,
  FolderTree,
  Tag,
  CreditCard,
  Settings,
  FileText,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

export default function Sidebar({ className = '' }) {
  const { user } = useAuth();
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const toggleGroup = (title) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const getNavigationGroups = () => {
    if (user?.role === ROLES.ADMIN) {
      return [
        {
          title: 'Overview',
          items: [
            { label: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
          ],
        },
        {
          title: 'User Management',
          items: [
            { label: 'Customers', path: '/admin/customers', icon: Users },
            { label: 'Technician Approvals', path: '/admin/technicians', icon: CheckCircle },
          ],
        },
        {
          title: 'Services & Rates',
          items: [
            { label: 'Category Management', path: '/admin/categories', icon: FolderTree },
            { label: 'Price Management', path: '/admin/pricing', icon: Tag },
          ],
        },
        {
          title: 'Operations',
          items: [
            { label: 'All Bookings', path: '/admin/bookings', icon: Calendar },
            { label: 'Emergency Center', path: '/admin/emergency', icon: AlertTriangle, badge: 'Live', badgeColor: 'bg-rose-500 text-white' },
            { label: 'Payment Reports', path: '/admin/payments', icon: CreditCard },
            { label: 'Warranty Claims', path: '/admin/claims', icon: ShieldCheck },
            { label: 'Review Moderation', path: '/admin/reviews', icon: Star },
          ],
        },
        {
          title: 'System',
          items: [
            { label: 'Platform Settings', path: '/admin/settings', icon: Settings },
            { label: 'Audit Logs', path: '/admin/audit-logs', icon: FileText },
          ],
        },
      ];
    }

    if (user?.role === ROLES.TECHNICIAN) {
      return [
        {
          title: 'Workspace',
          items: [
            { label: 'Dashboard', path: '/technician/dashboard', icon: LayoutDashboard },
            { label: 'Incoming Requests', path: '/technician/requests', icon: Clock },
            { label: 'Earnings & Payouts', path: '/technician/earnings', icon: DollarSign },
            { label: 'Client Reviews', path: '/technician/reviews', icon: Star },
          ],
        },
        {
          title: 'Professional Profile',
          items: [
            { label: 'Profile Information', path: '/technician/profile', icon: User },
            { label: 'My Skills & Services', path: '/technician/skills', icon: Wrench },
            { label: 'Working Availability', path: '/technician/availability', icon: Clock },
            { label: 'KYC & Verification', path: '/technician/verification', icon: Award },
          ],
        },
      ];
    }

    // Customer
    return [
      {
        title: 'Bookings & Orders',
        items: [
          { label: 'Dashboard', path: '/customer/dashboard', icon: LayoutDashboard },
          { label: 'Book a Service', path: '/customer/book', icon: Calendar },
          { label: 'Emergency Request', path: '/customer/emergency', icon: AlertTriangle, emergency: true },
          { label: 'My Bookings History', path: '/customer/bookings', icon: Calendar },
        ],
      },
      {
        title: 'Account & Claims',
        items: [
          { label: 'My Reviews', path: '/customer/reviews', icon: Star },
          { label: 'Warranty Claims', path: '/customer/claims', icon: ShieldCheck },
          { label: 'Saved Addresses & Profile', path: '/customer/profile', icon: User },
          { label: 'Notifications', path: '/customer/notifications', icon: Bell },
        ],
      },
    ];
  };

  const groups = getNavigationGroups();

  return (
    <aside
      className={`w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] p-4 ${className}`}
    >
      <div className="space-y-6 flex-1">
        {groups.map((group) => {
          const isCollapsed = collapsedGroups[group.title];
          return (
            <div key={group.title}>
              <button
                type="button"
                onClick={() => toggleGroup(group.title)}
                className="flex items-center justify-between w-full text-left px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors"
              >
                <span>{group.title}</span>
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {!isCollapsed && (
                <div className="mt-1.5 space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/admin/dashboard' || item.path === '/technician/dashboard' || item.path === '/customer/dashboard'}
                        className={({ isActive }) => `
                          flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all
                          ${
                            isActive
                              ? 'bg-fixblue-800 text-white shadow-xs'
                              : item.emergency
                              ? 'text-rose-600 hover:bg-rose-50'
                              : 'text-slate-600 hover:text-fixblue-900 hover:bg-slate-50'
                          }
                        `}
                      >
                        {({ isActive }) => (
                          <>
                            <div className="flex items-center gap-3">
                              <Icon
                                className={`w-4 h-4 ${
                                  isActive
                                    ? 'text-white'
                                    : item.emergency
                                    ? 'text-rose-600'
                                    : 'text-slate-400'
                                }`}
                              />
                              <span>{item.label}</span>
                            </div>

                            {item.badge && (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-100 text-slate-600'}`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
