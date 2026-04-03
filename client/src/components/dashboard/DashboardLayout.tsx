/**
 * Dashboard layout shell with sidebar and top bar.
 * Handles responsive sidebar state.
 */

import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { DashboardTopBar } from './DashboardTopBar';

export function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  // Auto-expand sidebar on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarCollapsed(false);
      } else {
        setSidebarCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  const closeSidebar = () => {
    if (window.innerWidth < 1024) {
      setSidebarCollapsed(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <Sidebar isCollapsed={sidebarCollapsed} onClose={closeSidebar} />

      {/* Main content area - always takes full width, has left padding on desktop */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64 transition-all duration-standard">
        <DashboardTopBar onMenuClick={toggleSidebar} />

        <main className="flex-1 p-4 lg:p-6 bg-gray-50 dark:bg-gray-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
