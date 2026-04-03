/**
 * Dashboard sidebar navigation component.
 * Supports collapsed state for mobile, active link highlighting.
 */

import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  X,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onClose: () => void;
}

const navItems = [
  {
    to: '/seller',
    label: 'Overview',
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: '/seller/products',
    label: 'Products',
    icon: Package,
    end: false,
  },
  {
    to: '/seller/orders',
    label: 'Orders',
    icon: ShoppingCart,
    end: false,
  },
  {
    to: '/seller/settings',
    label: 'Settings',
    icon: Settings,
    end: false,
  },
];

export function Sidebar({ isCollapsed, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {!isCollapsed && (
        <div
          data-testid="sidebar-overlay"
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        data-testid="dashboard-sidebar"
        data-collapsed={isCollapsed}
        className={`
          fixed top-0 left-0 z-40 h-full w-64
          bg-white dark:bg-gray-900
          border-r border-gray-200 dark:border-gray-800
          transform transition-transform duration-standard ease-in-out
          flex flex-col
          ${isCollapsed ? '-translate-x-full' : 'translate-x-0'}
          lg:translate-x-0
        `}
      >
        {/* Logo section */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-burmese-ruby">Thi Thi</span>
            <span className="text-body-sm text-gray-500 dark:text-gray-400">Admin</span>
          </NavLink>

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation - takes remaining space */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
            >
              {({ isActive }) => (
                <span
                  data-active={isActive}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-md
                    text-body-sm font-medium
                    transition-colors duration-quick
                    ${
                      isActive
                        ? 'bg-burmese-ruby/10 text-burmese-ruby dark:bg-burmese-ruby/20'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="flex-1">{item.label}</span>
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section - fixed at bottom */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-800">
          <NavLink
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-md text-body-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-quick"
          >
            <span>Back to Store</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
}
