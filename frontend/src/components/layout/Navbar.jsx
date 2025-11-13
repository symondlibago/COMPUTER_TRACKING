import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Button } from '@/components/ui/button';
import { 
  Monitor, 
  Users, 
  Settings, 
  LogOut, 
  Moon, 
  Sun,
  Menu,
  X,
  User
} from 'lucide-react';
import { motion } from 'framer-motion';

function Navbar() {
  const { state, dispatch, ActionTypes } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogout = () => {
    dispatch({ type: ActionTypes.LOGOUT });
    navigate('/login');
  };
  
  const toggleTheme = () => {
    dispatch({ 
      type: ActionTypes.SET_THEME, 
      payload: state.theme === 'light' ? 'dark' : 'light' 
    });
  };
  
  const toggleSidebar = () => {
    dispatch({ type: ActionTypes.TOGGLE_SIDEBAR });
  };

  // Don't show navbar on login page
  if (location.pathname === '/login') {
    return null;
  }
  
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-card border-b border-border shadow-lg sticky top-0 z-50"
    >
      <div className="container-responsive">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            {state.userType === 'admin' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="p-2"
              >
                {state.sidebarCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
              </Button>
            )}
            <Link to="/" className="flex items-center space-x-2">
              <div className="relative">
                <Monitor className="h-8 w-8 text-primary" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full pulse-red"></div>
              </div>
              <div>
                <h1 className="text-xl font-black gradient-text">E-Lib Online Queuing</h1>
              </div>
            </Link>
          </div>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            {!state.currentUser && (
              <>
                <Link 
                  to="/" 
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location.pathname === '/' ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  Home
                </Link>
              </>
            )}
          </div>
          
          {/* User Actions */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2"
            >
              {state.theme === 'light' ? 
                <Moon className="h-4 w-4" /> : 
                <Sun className="h-4 w-4" />
              }
            </Button>
            
            {!state.currentUser ? (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/login')}
                  className="btn-energy"
                >
                  <User className="h-4 w-4 mr-2" />
                  Login
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium">{state.currentUser.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{state.userType}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="p-2 text-destructive hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

export default Navbar;

