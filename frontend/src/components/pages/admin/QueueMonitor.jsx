import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Timer,
  User,
  RefreshCw,
  UserCheck,
  UserX,
  Hourglass,
  Monitor,
  ListOrdered,
  Activity
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'; 
import API_BASE_URL from '../Config';
import { apiGet } from '../../../utils/apiUtils';

function QueueMonitor() {
  const [queueData, setQueueData] = useState(null);
  const [queueStats, setQueueStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelingAssignment, setCancelingAssignment] = useState(null);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch queue monitor data
  const fetchQueueMonitor = async () => {
    try {
      const response = await apiGet('/pc-queue/monitor');
      
      if (response.ok) {
        const data = await response.json();
        console.log('Queue Monitor Data:', data.data);
        setQueueData(data.data);
      } else {
        console.error('Failed to fetch queue monitor data');
        showAlert('error', 'Failed to fetch queue monitor data');
      }
    } catch (error) {
      console.error('Fetch queue monitor error:', error);
      showAlert('error', 'Error connecting to server');
    }
  };

  // Fetch queue statistics
  const fetchQueueStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pc-queue/statistics`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Queue Statistics:', data.data);
        setQueueStats(data.data);
      } else {
        console.error('Failed to fetch queue statistics');
      }
    } catch (error) {
      console.error('Fetch queue statistics error:', error);
    }
  };

  // Initial data fetch and setup interval
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchQueueMonitor(), fetchQueueStats()]);
      setLoading(false);
    };

    loadData();
    
    // Set up interval to refresh data every 5 seconds for real-time updates
    const interval = setInterval(() => {
      fetchQueueMonitor();
      fetchQueueStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4000);
  };

  // Handle check in student
  const handleCheckInStudent = async (queueEntryId) => {
    setActionLoading(prev => ({ ...prev, [queueEntryId]: true }));
    
    try {
      const response = await fetch(`${API_BASE_URL}/pc-queue/${queueEntryId}/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('success', `${data.data.student_name} checked in successfully and PC usage started!`);
        // Refresh data
        fetchQueueMonitor();
        fetchQueueStats();
      } else {
        showAlert('error', data.message || 'Failed to check in student');
      }
    } catch (error) {
      console.error('Check in student error:', error);
      showAlert('error', 'Error connecting to server');
    } finally {
      setActionLoading(prev => ({ ...prev, [queueEntryId]: false }));
    }
  };

  const openCancelDialog = (entry) => {
    setCancelingAssignment(entry);
    setIsCancelDialogOpen(true);
  };

  // Handle expire queue entry
  // QueueMonitor.jsx -> handleCancelAssignment

  const handleCancelAssignment = async (studentId, queueEntryId) => {
    // The confirmation is now handled by the modal, so we remove window.confirm
    setActionLoading(prev => ({ ...prev, [`cancel_${queueEntryId}`]: true }));
    
    try {
      const response = await fetch(`${API_BASE_URL}/pc-queue/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ student_id: studentId })
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('success', 'Assignment cancelled and student removed from queue.');
        fetchQueueMonitor();
        fetchQueueStats();
      } else {
        showAlert('error', data.message || 'Failed to cancel assignment');
      }
    } catch (error) {
      console.error('Cancel assignment error:', error);
      showAlert('error', 'Error connecting to server');
    } finally {
      setActionLoading(prev => ({ ...prev, [`cancel_${queueEntryId}`]: false }));
      // CLOSE THE MODAL after the action
      setIsCancelDialogOpen(false);
      setCancelingAssignment(null);
    }
  };

  // Manual refresh function
  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([fetchQueueMonitor(), fetchQueueStats()]);
    setLoading(false);
    showAlert('success', 'Data refreshed successfully');
  };

  // Process queue manually
  const handleProcessQueue = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/pc-queue/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('success', 'Queue processed successfully');
        // Refresh data
        fetchQueueMonitor();
        fetchQueueStats();
      } else {
        showAlert('error', data.message || 'Failed to process queue');
      }
    } catch (error) {
      console.error('Process queue error:', error);
      showAlert('error', 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  // Cleanup expired assignments
  const handleCleanupExpired = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/pc-queue/cleanup-expired`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('success', `Cleaned up ${data.data.expired_count} expired assignments`);
        // Refresh data
        fetchQueueMonitor();
        fetchQueueStats();
      } else {
        showAlert('error', data.message || 'Failed to cleanup expired assignments');
      }
    } catch (error) {
      console.error('Cleanup expired error:', error);
      showAlert('error', 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const getWaitTime = (queuedAt) => {
    const waitMinutes = Math.floor((currentTime - new Date(queuedAt)) / (1000 * 60));
    if (waitMinutes < 1) return 'Just now';
    if (waitMinutes < 60) return `${waitMinutes}m`;
    const hours = Math.floor(waitMinutes / 60);
    const minutes = waitMinutes % 60;
    return `${hours}h ${minutes}m`;
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

  // INSIDE if (loading && !queueData) { ... }
const renderCancelDialog = () => (
  <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <AlertCircle className="h-6 w-6 text-red-600" />
          Confirm Assignment Cancellation
        </DialogTitle>
        <DialogDescription>
          Are you sure you want to cancel this assignment? This action cannot be undone and the student will be removed from the queue entirely.
        </DialogDescription>
      </DialogHeader>
      {cancelingAssignment && (
        <div className="my-4 p-4 bg-muted border rounded-lg">
          <p><strong>Student:</strong> {cancelingAssignment.student_name}</p>
          <p><strong>PC:</strong> {cancelingAssignment.assigned_pc_name}</p>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
          Go Back
        </Button>
        <Button
          variant="destructive"
          onClick={() => handleCancelAssignment(cancelingAssignment.student_id, cancelingAssignment.id)}
          disabled={actionLoading[`cancel_${cancelingAssignment?.id}`]}
        >
          {actionLoading[`cancel_${cancelingAssignment?.id}`] ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Cancelling...
            </>
          ) : (
            'Yes, Cancel Assignment'
          )}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

  if (loading && !queueData) {

    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center min-h-screen"
      >
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading queue monitor...</p>
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
    {renderCancelDialog()}
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
          <h1 className="text-3xl font-bold">Queue Monitor</h1>
          <p className="text-muted-foreground">
            Monitor and manage the auto queue system
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <div className="text-sm text-muted-foreground flex items-center">
            Last updated: {currentTime.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Waiting in Queue</p>
                <p className="text-2xl font-bold text-orange-600">
                  {queueStats?.queue_stats?.waiting || 0}
                </p>
              </div>
              <ListOrdered className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assigned PCs</p>
                <p className="text-2xl font-bold text-blue-600">
                  {queueStats?.queue_stats?.assigned || 0}
                </p>
              </div>
              <Hourglass className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available PCs</p>
                <p className="text-2xl font-bold text-green-600">
                  {queueStats?.pc_stats?.available || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Use PCs</p>
                <p className="text-2xl font-bold text-purple-600">
                  {queueStats?.pc_stats?.in_use || 0}
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Assigned Students (Need Check-in) */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Students with Assigned PCs
              </CardTitle>
              <CardDescription>
                Students who have been assigned PCs and need to check in within 2 minutes and 30 seconds
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!queueData?.assigned_entries || queueData.assigned_entries.length === 0 ? (
                <div className="text-center py-12">
                  <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Assigned Students</h3>
                  <p className="text-muted-foreground">
                    No students currently have assigned PCs waiting for check-in.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {queueData.assigned_entries.map((entry, index) => {
                    const countdown = getRealTimeCountdown(entry.expires_at);
                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 border border-primary bg-primary/5 rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
                              <User className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{entry.student_name}</h4>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>ID: {entry.student_id}</span>
                                <span>PC: {entry.assigned_pc_name}</span>
                                <span>Row: {entry.assigned_pc_row}</span>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-muted-foreground">
                                  Assigned: {new Date(entry.assigned_at).toLocaleTimeString()}
                                </span>
                                <div className="flex items-center gap-2">
                                  <Timer className="h-4 w-4" />
                                  <span className={`font-bold text-lg ${
                                    countdown.isExpired ? 'text-red-600' : 
                                    countdown.seconds <= 60 ? 'text-red-600' : 
                                    countdown.seconds <= 180 ? 'text-orange-600' : 'text-green-600'
                                  }`}>
                                    {countdown.formatted}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge className={`${
                              countdown.isExpired ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {countdown.isExpired ? 'Expired' : 'Assigned'}
                            </Badge>
                            
                            <Button
                              size="sm"
                              onClick={() => handleCheckInStudent(entry.id)}
                              disabled={actionLoading[entry.id]}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <UserCheck className="h-3 w-3 mr-1" />
                              {actionLoading[entry.id] ? 'Checking...' : 'Check In'}
                            </Button>
                            
                            <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openCancelDialog(entry)}
                            disabled={actionLoading[`cancel_${entry.id}`]}
                            className="text-red-600 hover:text-red-700"
                          >
                            <UserX className="h-3 w-3 mr-1" />
                            {actionLoading[`cancel_${entry.id}`] ? 'Cancelling...' : 'Cancel'}
                          </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Waiting Queue */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Waiting Queue
              </CardTitle>
              <CardDescription>
                Students waiting for PC assignment (FIFO order)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!queueData?.waiting_entries || queueData.waiting_entries.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Students Waiting</h3>
                  <p className="text-muted-foreground">
                    The waiting queue is currently empty.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {queueData.waiting_entries.map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                          <div>
                            <h4 className="font-semibold">{entry.student_name}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>ID: {entry.student_id}</span>
                              <span>Joined: {new Date(entry.queued_at).toLocaleTimeString()}</span>
                              <span>Wait time: {getWaitTime(entry.queued_at)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <Badge variant="outline">
                          Waiting
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Queue Management & Controls */}
        <div className="space-y-6">
          {/* Queue Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Queue Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Waiting</span>
                <span className="font-medium text-orange-600">
                  {queueData?.total_waiting || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Assigned</span>
                <span className="font-medium text-blue-600">
                  {queueData?.total_assigned || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Completed Today</span>
                <span className="font-medium text-green-600">
                  {queueStats?.queue_stats?.completed || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Expired Today</span>
                <span className="font-medium text-red-600">
                  {queueStats?.queue_stats?.expired || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* PC Status */}
          <Card>
            <CardHeader>
              <CardTitle>PC Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Available</p>
                  <p className="text-sm text-muted-foreground">
                    {queueStats?.pc_stats?.available || 0} PCs ready
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Hourglass className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium">Reserved</p>
                  <p className="text-sm text-muted-foreground">
                    {queueStats?.pc_stats?.reserved || 0} PCs reserved
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="font-medium">In Use</p>
                  <p className="text-sm text-muted-foreground">
                    {queueStats?.pc_stats?.in_use || 0} PCs active
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        
        </div>
      </div>
    </motion.div>
  );
}

export default QueueMonitor;

