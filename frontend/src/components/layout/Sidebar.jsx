import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Monitor,
  Users,
  History,
  Settings,
  BarChart3,
  Clock,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

function Sidebar() {
  const { state, dispatch, ActionTypes } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Only show sidebar for admin users
  if (!state.currentUser || state.userType !== 'admin') {
    return null;
  }
  
  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/admin/dashboard',
      description: 'Overview & Analytics'
    },
    {
      title: 'PC Management',
      icon: Monitor,
      path: '/admin/pc-management',
      description: 'Manage Computers'
    },
    {
      title: 'Student Management',
      icon: Users,
      path: '/admin/student-management',
      description: 'Manage Students'
    },
    {
      title: 'Queue Monitor',
      icon: Clock,
      path: '/admin/queue-monitor',
      description: 'Monitor Queue'
    },
    {
      title: 'Usage History',
      icon: History,
      path: '/admin/usage-history',
      description: 'Usage Reports'
    }
  ];

  const handleLogout = () => {
    dispatch({ type: ActionTypes.LOGOUT });
    navigate('/login');
  };

  const toggleSidebar = () => {
    dispatch({ type: ActionTypes.TOGGLE_SIDEBAR });
  };
  
  const sidebarVariants = {
    expanded: { width: '16rem' },
    collapsed: { width: '6rem' } // Changed from 4rem to 6rem
  };
  
  const itemVariants = {
    expanded: { opacity: 1, x: 0 },
    collapsed: { opacity: 0, x: -10 }
  };
  
  return (
    <motion.aside
      variants={sidebarVariants}
      animate={state.sidebarCollapsed ? 'collapsed' : 'expanded'}
      className="fixed left-0 top-16 h-[calc(100vh-4rem)] bg-sidebar border-r border-sidebar-border shadow-lg z-40"
    >
      <div className="flex flex-col h-full">
        {/* Toggle Button */}
        <div className="p-2 border-b border-sidebar-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="w-full justify-center hover:bg-sidebar-accent"
          >
            {state.sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4">
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-primary-foreground' : ''}`} />
                  
                  <AnimatePresence>
                    {!state.sidebarCollapsed && (
                      <motion.div
                        variants={itemVariants}
                        initial="collapsed"
                        animate="expanded"
                        exit="collapsed"
                        className="flex-1 min-w-0"
                      >
                        <div className="font-medium text-sm">{item.title}</div>
                        <div className="text-xs opacity-70 truncate">{item.description}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Tooltip for collapsed state */}
                  {state.sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.title}
                    </div>
                  )}
                  
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute right-0 top-0 bottom-0 w-1 bg-primary-foreground rounded-l-full"
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-sidebar-border">
          <AnimatePresence>
            {!state.sidebarCollapsed && (
              <motion.div
                variants={itemVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                className="mb-3 p-2 bg-sidebar-accent rounded-lg"
              >
                <div className="text-sm font-medium text-sidebar-accent-foreground">
                  {state.currentUser.name}
                </div>
                <div className="text-xs text-sidebar-accent-foreground/70">
                  Administrator
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {!state.sidebarCollapsed && 'Logout'}
          </Button>
        </div>
      </div>
    </motion.aside>
  );
}

export default Sidebar;

