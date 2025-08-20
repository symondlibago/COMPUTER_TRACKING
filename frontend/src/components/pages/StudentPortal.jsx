import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Monitor,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Timer,
  Activity,
  Settings,
  RefreshCw,
  MapPin,
  StopCircle,
  LogOut,
  Pause,
  Play
} from 'lucide-react';
import API_BASE_URL from './Config';

function StudentPortal() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [pcs, setPcs] = useState([]);
  const [activeUsage, setActiveUsage] = useState([]);
  const [studentActiveUsage, setStudentActiveUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [lastUpdated, setLastUpdated] = useState(null);

  // Check for logged in user on component mount
  useEffect(() => {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const parsedUserData = JSON.parse(userData);
        if (parsedUserData.userType === 'student') {
          setCurrentUser(parsedUserData);
        } else {
          // Not a student, redirect to login
          navigate('/login');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        navigate('/login');
      }
    } else {
      // No user data, redirect to login
      navigate('/login');
    }
  }, [navigate]);

  // Real-time timer for updating usage duration
  useEffect(() => {
    let interval = null;
    if (studentActiveUsage && (studentActiveUsage.status === 'active' || studentActiveUsage.status === 'paused')) {
      interval = setInterval(() => {
        // Update student active usage every second for real-time tracking
        fetchStudentActiveUsage();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [studentActiveUsage]);

  // Fetch PC status for students with fallback
  const fetchPCStatus = async () => {
    try {
      let response = await fetch(`${API_BASE_URL}/pc-status/students`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.log('Student endpoint failed, trying regular PC endpoint...');
        response = await fetch(`${API_BASE_URL}/pcs`, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log('PC Status Data:', data.data); // Debug log
        
        let pcData = data.data || [];
        if (pcData.length > 0 && !pcData[0].hasOwnProperty('is_available')) {
          pcData = pcData.map(pc => ({
            ...pc,
            is_available: pc.status === 'active',
            is_in_use: pc.status === 'in-use',
            usage_duration: 0,
            formatted_usage_duration: '0s',
            is_paused: false,
            start_time: null
          }));
        }
        
        setPcs(pcData);
        setLastUpdated(new Date());
      } else {
        console.error('Failed to fetch PC status from both endpoints');
        showAlert('error', 'Failed to fetch PC status');
      }
    } catch (error) {
      console.error('Fetch PC status error:', error);
      showAlert('error', 'Error connecting to server');
    }
  };

  // Fetch active usage sessions
  const fetchActiveUsage = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pc-usage/active`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Active Usage Data:', data.data); // Debug log
        setActiveUsage(data.data || []);
      } else {
        console.error('Failed to fetch active usage');
      }
    } catch (error) {
      console.error('Fetch active usage error:', error);
    }
  };

  // Fetch student's active usage
  const fetchStudentActiveUsage = async () => {
    if (!currentUser || !currentUser.student_id) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/student/${currentUser.student_id}/active-usage`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Student Active Usage Data:', data.data); // Debug log
        setStudentActiveUsage(data.data);
      } else {
        console.error('Failed to fetch student active usage');
        setStudentActiveUsage(null);
      }
    } catch (error) {
      console.error('Fetch student active usage error:', error);
      setStudentActiveUsage(null);
    }
  };

  // Initial data fetch and setup interval
  useEffect(() => {
    if (currentUser) {
      const loadData = async () => {
        setLoading(true);
        await Promise.all([fetchPCStatus(), fetchActiveUsage(), fetchStudentActiveUsage()]);
        setLoading(false);
      };

      loadData();
      
      // Set up interval to refresh data every 30 seconds
      const interval = setInterval(() => {
        fetchPCStatus();
        fetchActiveUsage();
        fetchStudentActiveUsage();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4000);
  };

  // Handle end session
  const handleEndSession = async () => {
    if (!studentActiveUsage) {
      showAlert('error', 'No active session to end');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/pc-usage/${studentActiveUsage.id}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('success', 'Session ended successfully!');
        setStudentActiveUsage(null);
        // Refresh all data
        fetchPCStatus();
        fetchActiveUsage();
        fetchStudentActiveUsage();
      } else {
        showAlert('error', data.message || 'Failed to end session');
      }
    } catch (error) {
      console.error('End session error:', error);
      showAlert('error', 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh function
  const handleRefresh = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    await Promise.all([fetchPCStatus(), fetchActiveUsage(), fetchStudentActiveUsage()]);
    setLoading(false);
    showAlert('success', 'Data refreshed successfully');
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    navigate('/login');
  };

  // Get PC status icon
  const getStatusIcon = (pc) => {
    if (pc.is_available || pc.status === 'active') return CheckCircle;
    if (pc.is_in_use || pc.status === 'in-use') return Activity;
    return Settings;
  };

  // Get PC status color
  const getStatusColor = (pc) => {
    if (pc.is_available || pc.status === 'active') return 'text-green-600';
    if (pc.is_in_use || pc.status === 'in-use') return 'text-blue-600';
    return 'text-gray-600';
  };

  // Get PC status text
  const getStatusText = (pc) => {
    if (pc.is_available || pc.status === 'active') return 'Available';
    if (pc.is_in_use || pc.status === 'in-use') {
      if (pc.is_paused) return 'In Use (Paused)';
      return 'In Use';
    }
    return 'Unavailable';
  };

  // Get available and in-use PCs
  const availablePCs = pcs.filter(pc => pc.is_available || pc.status === 'active');
  const inUsePCs = pcs.filter(pc => pc.is_in_use || pc.status === 'in-use');

  // Show loading if no current user yet
  if (!currentUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center min-h-screen"
      >
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading user information...</p>
        </div>
      </motion.div>
    );
  }

  if (loading && pcs.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center min-h-screen"
      >
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading PC information...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Success/Error Alert */}
      <AnimatePresence>
        {alert.show && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 max-w-md"
          >
            <Alert className={`${
              alert.type === 'success' 
                ? 'border-green-500 bg-green-50 shadow-lg' 
                : 'border-red-500 bg-red-50 shadow-lg'
            }`}>
              {alert.type === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={`${
                alert.type === 'success' ? 'text-green-800' : 'text-red-800'
              } font-medium`}>
                {alert.message}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Student Portal</h1>
          <p className="text-muted-foreground">
            Welcome, {currentUser.user.name} ({currentUser.student_id})
          </p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Student Active Session or No Active Session */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-8"
      >
        {studentActiveUsage ? (
          <Card className="border-primary bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Monitor className="h-5 w-5" />
                Active Session - {studentActiveUsage.pc_name}
                {studentActiveUsage.is_paused && (
                  <span className="ml-2 text-orange-600 text-sm font-normal flex items-center">
                    <Pause className="h-4 w-4 mr-1" />
                    Paused
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Row {studentActiveUsage.pc_row} • Started at {new Date(studentActiveUsage.start_time).toLocaleTimeString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {studentActiveUsage.formatted_usage_duration}
                  </div>
                  <p className="text-sm text-muted-foreground">Active Duration</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-2 text-orange-500">
                    {studentActiveUsage.formatted_pause_duration}
                  </div>
                  <p className="text-sm text-muted-foreground">Pause Duration</p>
                  {studentActiveUsage.is_paused && studentActiveUsage.remaining_pause_time > 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      Auto-end in: {Math.floor(studentActiveUsage.remaining_pause_time / 60)}m {studentActiveUsage.remaining_pause_time % 60}s
                    </p>
                  )}
                  {studentActiveUsage.is_paused && studentActiveUsage.remaining_pause_time === 0 && (
                    <p className="text-xs text-red-500 mt-1">Session will end soon</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleEndSession}
                    variant="destructive"
                    disabled={loading}
                  >
                    <StopCircle className="h-4 w-4 mr-2" />
                    {loading ? 'Ending...' : 'End Session'}
                  </Button>
                  <div className="text-xs text-muted-foreground text-center">
                    Status: {studentActiveUsage.status === 'paused' ? 'Paused by Admin' : 'Active'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-gray-300 bg-gray-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-600">
                <Clock className="h-5 w-5" />
                No Active Session
              </CardTitle>
              <CardDescription>
                You don't have any active PC usage at the moment.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* All PCs Display */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                All Computers ({pcs.length})
              </CardTitle>
              <CardDescription>
                Current status of all computers in the lab
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pcs.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No PCs Found</h3>
                  <p className="text-muted-foreground mb-4">
                    No computers are currently registered in the system.
                  </p>
                  <Button onClick={handleRefresh} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {pcs.map((pc) => {
                    const StatusIcon = getStatusIcon(pc);
                    return (
                      <motion.div
                        key={pc.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{pc.name}</h3>
                          <StatusIcon className={`h-5 w-5 ${getStatusColor(pc)}`} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3 inline mr-1" />
                            {pc.row}
                          </p>
                          <p className={`text-sm font-medium ${getStatusColor(pc)}`}>
                            {getStatusText(pc)}
                          </p>
                          {pc.formatted_usage_duration && pc.formatted_usage_duration !== '0s' && (
                            <p className="text-xs text-muted-foreground">
                              Usage: {pc.formatted_usage_duration}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          {/* Available PCs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {availablePCs.length}
              </div>
              <p className="text-sm text-muted-foreground">
                Computers ready for use
              </p>
            </CardContent>
          </Card>

          {/* In Use PCs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                In Use
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {inUsePCs.length}
              </div>
              <p className="text-sm text-muted-foreground">
                Computers currently being used
              </p>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Active Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {activeUsage.length}
              </div>
              <p className="text-sm text-muted-foreground">
                Students currently using PCs
              </p>
            </CardContent>
          </Card>

          {/* Logout Button */}
          <Card>
            <CardContent className="pt-6">
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default StudentPortal;

