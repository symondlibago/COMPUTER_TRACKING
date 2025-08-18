import React from 'react';
import { Outlet } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

function Layout() {
  const { state } = useApp();
  
  return (
    <div className={`min-h-screen bg-background text-foreground ${state.theme === 'dark' ? 'dark' : ''}`}>
      <Navbar />
      <div className="flex">
        {state.userType === 'admin' && <Sidebar />}
        <main className={`flex-1 transition-all duration-300 ${
          state.userType === 'admin' && !state.sidebarCollapsed ? 'ml-64' : 
          state.userType === 'admin' && state.sidebarCollapsed ? 'ml-16' : 'ml-0'
        }`}>
          <div className="container-responsive py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;

