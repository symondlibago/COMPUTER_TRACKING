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
  Play,
  UserPlus,
  UserMinus,
  ListOrdered, // Changed from Queue
  Hourglass
} from 'lucide-react';
import API_BASE_URL from './Config';

function StudentPortal() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [pcs, setPcs] = useState([]);
  const [activeUsage, setActiveUsage] = useState([]);
  const [studentActiveUsage, setStudentActiveUsage] = useState(null);
  const [queueStatus, setQueueStatus] = useState(null);
  const [studentQueueStatus, setStudentQueueStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [queueLoading, setQueueLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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

  // Real-time timer for updating usage duration and queue status
  useEffect(() => {
    let interval = null;
    if (currentUser) {
      interval = setInterval(() => {
        // Update student active usage and queue status every second for real-time tracking
        if (studentActiveUsage && (studentActiveUsage.status === 'active' || studentActiveUsage.status === 'paused')) {
          fetchStudentActiveUsage();
        }
        if (studentQueueStatus && studentQueueStatus.status === 'assigned') {
          fetchStudentQueueStatus();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentUser, studentActiveUsage, studentQueueStatus]);

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

  // Fetch queue status
  const fetchQueueStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pc-queue/status`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Queue Status Data:', data.data); // Debug log
        setQueueStatus(data.data);
      } else {
        console.error('Failed to fetch queue status');
        setQueueStatus(null);
      }
    } catch (error) {
      console.error('Fetch queue status error:', error);
      setQueueStatus(null);
    }
  };

  // Fetch student's queue status
  const fetchStudentQueueStatus = async () => {
    if (!currentUser || !currentUser.student_id) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/pc-queue/student/${currentUser.student_id}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Student Queue Status Data:', data.data); // Debug log
        setStudentQueueStatus(data.data);
      } else {
        console.error('Failed to fetch student queue status');
        setStudentQueueStatus(null);
      }
    } catch (error) {
      console.error('Fetch student queue status error:', error);
      setStudentQueueStatus(null);
    }
  };

  // Initial data fetch and setup interval
  useEffect(() => {
    if (currentUser) {
      const loadData = async () => {
        setLoading(true);
        await Promise.all([
          fetchPCStatus(), 
          fetchActiveUsage(), 
          fetchStudentActiveUsage(),
          fetchQueueStatus(),
          fetchStudentQueueStatus()
        ]);
        setLoading(false);
      };

      loadData();
      
      // Set up interval to refresh data every 30 seconds
      const interval = setInterval(() => {
        fetchPCStatus();
        fetchActiveUsage();
        fetchStudentActiveUsage();
        fetchQueueStatus();
        fetchStudentQueueStatus();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4000);
  };

  // Handle join queue
  const handleJoinQueue = async () => {
    if (!currentUser || !currentUser.student_id) {
      showAlert('error', 'User information not available');
      return;
    }

    setQueueLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/pc-queue/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          student_id: currentUser.student_id
        })
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('success', 'Successfully joined the auto queue!');
        // Refresh queue data
        fetchQueueStatus();
        fetchStudentQueueStatus();
      } else {
        showAlert('error', data.message || 'Failed to join queue');
      }
    } catch (error) {
      console.error('Join queue error:', error);
      showAlert('error', 'Error connecting to server');
    } finally {
      setQueueLoading(false);
    }
  };

  // Handle leave queue
  const handleLeaveQueue = async () => {
    if (!currentUser || !currentUser.student_id) {
      showAlert('error', 'User information not available');
      return;
    }

    setQueueLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/pc-queue/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          student_id: currentUser.student_id
        })
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('success', 'Successfully left the queue');
        // Refresh queue data
        fetchQueueStatus();
        fetchStudentQueueStatus();
      } else {
        showAlert('error', data.message || 'Failed to leave queue');
      }
    } catch (error) {
      console.error('Leave queue error:', error);
      showAlert('error', 'Error connecting to server');
    } finally {
      setQueueLoading(false);
    }
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
        fetchQueueStatus();
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
    await Promise.all([
      fetchPCStatus(), 
      fetchActiveUsage(), 
      fetchStudentActiveUsage(),
      fetchQueueStatus(),
      fetchStudentQueueStatus()
    ]);
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
    if (pc.status === 'reserved') return Hourglass;
    return Settings;
  };

  // Get PC status color
  const getStatusColor = (pc) => {
    if (pc.is_available || pc.status === 'active') return 'text-green-600';
    if (pc.is_in_use || pc.status === 'in-use') return 'text-blue-600';
    if (pc.status === 'reserved') return 'text-orange-600';
    return 'text-gray-600';
  };

  // Get PC status text
  const getStatusText = (pc) => {
    if (pc.is_available || pc.status === 'active') return 'Available';
    if (pc.is_in_use || pc.status === 'in-use') {
      if (pc.is_paused) return 'In Use (Paused)';
      return 'In Use';
    }
    if (pc.status === 'reserved') return 'Reserved';
    return 'Unavailable';
  };

  // Calculate real-time countdown for assigned entries
  const getRealTimeCountdown = (expiresAt) => {
    if (!expiresAt) return { seconds: 0, formatted: 'Expired', isExpired: true };
    
    const expireTime = new Date(expiresAt);
    const remainingMs = expireTime.getTime() - currentTime.getTime();
    const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
    
    if (remainingSeconds <= 0) {
      return { seconds: 0, formatted: 'Expired', isExpired: true };
    }
    
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    
    return {
      seconds: remainingSeconds,
      formatted: minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`,
      isExpired: false
    };
  };

  // Get available and in-use PCs
  const availablePCs = pcs.filter(pc => pc.is_available || pc.status === 'active');
  const inUsePCs = pcs.filter(pc => pc.is_in_use || pc.status === 'in-use');
  const reservedPCs = pcs.filter(pc => pc.status === 'reserved');

  // Check if auto queue should be shown (all PCs are in use or reserved)
  const shouldShowAutoQueue = availablePCs.length === 0 && pcs.length > 0;

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

      {/* Auto Queue Section */}
      {shouldShowAutoQueue && !studentActiveUsage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8"
        >
          <Card className="border-orange-300 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <ListOrdered className="h-5 w-5" /> {/* Changed from Queue */}
                Auto Queue Available
              </CardTitle>
              <CardDescription>
                All PCs are currently in use. Join the auto queue to be notified when a PC becomes available.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {studentQueueStatus ? (
                <div className="space-y-4">
                  {studentQueueStatus.status === 'waiting' && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-orange-700">You are in the queue</p>
                        <p className="text-sm text-muted-foreground">
                          Position: #{studentQueueStatus.queue_position} • 
                          Joined at {new Date(studentQueueStatus.queued_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <Button 
                        onClick={handleLeaveQueue} 
                        variant="outline" 
                        disabled={queueLoading}
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        {queueLoading ? 'Leaving...' : 'Leave Queue'}
                      </Button>
                    </div>
                  )}
                  {studentQueueStatus.status === 'assigned' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-green-700">PC Assigned!</p>
                          <p className="text-sm text-muted-foreground">
                            {studentQueueStatus.assigned_pc_name} • 
                            Assigned at {new Date(studentQueueStatus.assigned_at).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="text-right">
                          {(() => {
                            const countdown = getRealTimeCountdown(studentQueueStatus.expires_at);
                            return (
                              <div className="flex items-center gap-2">
                                <Timer className="h-5 w-5" />
                                <div>
                                  <p className={`text-2xl font-bold ${
                                    countdown.isExpired ? 'text-red-600' : 
                                    countdown.seconds <= 60 ? 'text-red-600' : 
                                    countdown.seconds <= 180 ? 'text-orange-600' : 'text-green-600'
                                  }`}>
                                    {countdown.formatted}
                                  </p>
                                  <p className="text-xs text-muted-foreground">Time remaining</p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      <Alert className="border-green-500 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          <strong>Go to the admin now!</strong> You have 5 minutes to check in with the admin 
                          to start using {studentQueueStatus.assigned_pc_name}. If you don't check in within 
                          the time limit, you'll be moved to the end of the queue.
                        </AlertDescription>
                      </Alert>
                      <Button 
                        onClick={handleLeaveQueue} 
                        variant="outline" 
                        disabled={queueLoading}
                        className="w-full"
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        {queueLoading ? 'Leaving...' : 'Cancel Assignment'}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Join the auto queue</p>
                    <p className="text-sm text-muted-foreground">
                      {queueStatus ? `${queueStatus.total_in_queue} students currently in queue` : 'Get notified when a PC becomes available'}
                    </p>
                  </div>
                  <Button 
                    onClick={handleJoinQueue} 
                    disabled={queueLoading}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {queueLoading ? 'Joining...' : 'Join Queue'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

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
                {shouldShowAutoQueue && ' Join the auto queue above to get notified when a PC becomes available.'}
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

          {/* Reserved PCs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Hourglass className="h-5 w-5 text-orange-600" />
                Reserved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {reservedPCs.length}
              </div>
              <p className="text-sm text-muted-foreground">
                Computers reserved for queue
              </p>
            </CardContent>
          </Card>

          {/* Queue Status */}
          {queueStatus && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ListOrdered className="h-5 w-5" /> {/* Changed from Queue */}
                  Queue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {queueStatus.total_in_queue}
                </div>
                <p className="text-sm text-muted-foreground">
                  Students in auto queue
                </p>
              </CardContent>
            </Card>
          )}

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

