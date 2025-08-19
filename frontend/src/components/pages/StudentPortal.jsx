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
  LogOut
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
  const [remainingTime, setRemainingTime] = useState(0);

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

  // Real-time timer for remaining time
  useEffect(() => {
    let interval = null;
    if (studentActiveUsage && remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime(prevTime => {
          const newTime = Math.max(0, prevTime - 1);
          if (newTime === 0) {
            // Time expired, refresh data
            fetchStudentActiveUsage();
          }
          return newTime;
        });
      }, 60000); // Update every minute
    }
    return () => clearInterval(interval);
  }, [studentActiveUsage, remainingTime]);

  // Update remaining time when studentActiveUsage changes
  useEffect(() => {
    if (studentActiveUsage && studentActiveUsage.remaining_minutes > 0) {
      setRemainingTime(studentActiveUsage.remaining_minutes);
    } else {
      setRemainingTime(0);
    }
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
            remaining_minutes: 0,
            elapsed_minutes: 0,
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

  // Format minutes to readable time
  const formatMinutes = (minutes) => {
    if (!minutes || minutes <= 0) return '0m';
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${mins}m`;
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
        setRemainingTime(0);
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
    if (pc.is_in_use || pc.status === 'in-use') return 'In Use';
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
              </CardTitle>
              <CardDescription>
                Row {studentActiveUsage.pc_row} • Started at {new Date(studentActiveUsage.start_time).toLocaleTimeString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {formatMinutes(studentActiveUsage.elapsed_minutes)}
                  </div>
                  <p className="text-sm text-muted-foreground">Active Duration</p>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold mb-2 ${
                    remainingTime <= 10 ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {formatMinutes(remainingTime)}
                  </div>
                  <p className="text-sm text-muted-foreground">Time Remaining</p>
                  {remainingTime <= 10 && remainingTime > 0 && (
                    <p className="text-xs text-red-500 mt-1">Session ending soon!</p>
                  )}
                  {remainingTime === 0 && (
                    <p className="text-xs text-red-500 mt-1">Session expired</p>
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
                    Total: {formatMinutes(studentActiveUsage.minutes_requested)}
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
                    const isAvailable = pc.is_available || pc.status === 'active';
                    const isInUse = pc.is_in_use || pc.status === 'in-use';
                    
                    return (
                      <motion.div
                        key={pc.id}
                        whileHover={{ scale: 1.02 }}
                        className={`p-4 border rounded-lg transition-all ${
                          isAvailable 
                            ? 'border-green-200 bg-green-50 hover:shadow-md' 
                            : isInUse 
                            ? 'border-blue-200 bg-blue-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{pc.name}</h4>
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`h-5 w-5 ${getStatusColor(pc)}`} />
                            <span className={`text-sm font-medium ${getStatusColor(pc)}`}>
                              {getStatusText(pc)}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {pc.row}
                          </div>
                          {isInUse && pc.remaining_minutes > 0 && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {formatMinutes(pc.remaining_minutes)} remaining
                            </div>
                          )}
                          {isInUse && pc.elapsed_minutes > 0 && (
                            <div className="flex items-center gap-2">
                              <Timer className="h-4 w-4" />
                              {formatMinutes(pc.elapsed_minutes)} elapsed
                            </div>
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

        {/* Lab Status & Statistics */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Lab Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Lab Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total PCs</span>
                  <span className="font-medium">{pcs.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-600">Available</span>
                  <span className="font-medium text-green-600">{availablePCs.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-600">In Use</span>
                  <span className="font-medium text-blue-600">{inUsePCs.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Unavailable</span>
                  <span className="font-medium text-gray-600">
                    {pcs.length - availablePCs.length - inUsePCs.length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          {activeUsage.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Active Sessions ({activeUsage.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeUsage.map((usage) => (
                    <div key={usage.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-blue-900">{usage.pc_name}</h4>
                        <Activity className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="text-sm text-blue-700">
                        <div className="flex justify-between">
                          <span>{usage.pc_row}</span>
                          <span>{formatMinutes(usage.remaining_minutes)} left</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Elapsed: {formatMinutes(usage.elapsed_minutes)}</span>
                          <span>Total: {formatMinutes(usage.minutes_requested)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Utilization Rate</span>
                  <span className="font-medium">
                    {pcs.length > 0 ? Math.round((inUsePCs.length / pcs.length) * 100) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Available Rate</span>
                  <span className="font-medium text-green-600">
                    {pcs.length > 0 ? Math.round((availablePCs.length / pcs.length) * 100) : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default StudentPortal;

