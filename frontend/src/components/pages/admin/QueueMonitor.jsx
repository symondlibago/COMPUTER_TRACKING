import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../../context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Users,
  ArrowUp,
  ArrowDown,
  X,
  Play,
  Pause,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Timer,
  User
} from 'lucide-react';

function QueueMonitor() {
  const { state, dispatch, ActionTypes } = useApp();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleMoveUp = (queueId) => {
    dispatch({
      type: ActionTypes.MOVE_QUEUE_UP,
      payload: queueId
    });
  };

  const handleMoveDown = (queueId) => {
    dispatch({
      type: ActionTypes.MOVE_QUEUE_DOWN,
      payload: queueId
    });
  };

  const handleRemoveFromQueue = (queueId) => {
    if (window.confirm('Are you sure you want to remove this student from the queue?')) {
      dispatch({
        type: ActionTypes.REMOVE_FROM_QUEUE,
        payload: queueId
      });
    }
  };

  const handleAssignToPC = (queueItem) => {
    const availablePC = state.pcs.find(pc => pc.status === 'available');
    if (availablePC) {
      // Find the student
      const student = state.students.find(s => s.id === queueItem.studentId) || {
        id: queueItem.studentId,
        name: queueItem.studentName
      };

      // Assign PC
      dispatch({
        type: ActionTypes.ASSIGN_PC,
        payload: {
          pcId: availablePC.id,
          user: {
            ...student,
            startTime: new Date()
          }
        }
      });

      // Remove from queue
      dispatch({
        type: ActionTypes.REMOVE_FROM_QUEUE,
        payload: queueItem.id
      });
    }
  };

  const getWaitTime = (queueTime) => {
    const waitMinutes = Math.floor((currentTime - new Date(queueTime)) / (1000 * 60));
    if (waitMinutes < 1) return 'Just now';
    if (waitMinutes < 60) return `${waitMinutes}m`;
    const hours = Math.floor(waitMinutes / 60);
    const minutes = waitMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const getEstimatedWaitTime = (position) => {
    // Rough estimate: 30 minutes per person ahead
    const estimatedMinutes = position * 30;
    if (estimatedMinutes < 60) return `~${estimatedMinutes}m`;
    const hours = Math.floor(estimatedMinutes / 60);
    const minutes = estimatedMinutes % 60;
    return `~${hours}h ${minutes}m`;
  };

  const availablePCs = state.pcs.filter(pc => pc.status === 'available').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Queue Monitor</h1>
          <p className="text-muted-foreground">
            Monitor and manage the student queue system
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Last updated: {currentTime.toLocaleTimeString()}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Queue Length</p>
                <p className="text-2xl font-bold">{state.queue.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available PCs</p>
                <p className="text-2xl font-bold text-green-600">{availablePCs}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Wait Time</p>
                <p className="text-2xl font-bold text-orange-600">
                  {state.queue.length > 0 ? 
                    getWaitTime(state.queue[Math.floor(state.queue.length / 2)]?.queueTime || Date.now()) : 
                    '0m'
                  }
                </p>
              </div>
              <Timer className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Next Assignment</p>
                <p className="text-2xl font-bold text-blue-600">
                  {availablePCs > 0 && state.queue.length > 0 ? 'Ready' : 'Waiting'}
                </p>
              </div>
              <Play className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Management */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Queue List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Current Queue
              </CardTitle>
              <CardDescription>
                Students waiting for computer access (FIFO order)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {state.queue.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Queue is Empty</h3>
                  <p className="text-muted-foreground">
                    No students are currently waiting for computer access.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {state.queue.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 border border-border rounded-lg ${
                        index === 0 ? 'border-primary bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold">{item.studentName}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Requested: {item.requestedHours}h</span>
                              <span>Wait time: {getWaitTime(item.queueTime)}</span>
                              <span>ETA: {getEstimatedWaitTime(index)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {index === 0 && (
                            <Badge className="bg-green-100 text-green-800">
                              Next in line
                            </Badge>
                          )}
                          
                          {/* Quick assign if PC available and first in queue */}
                          {index === 0 && availablePCs > 0 && (
                            <Button
                              size="sm"
                              onClick={() => handleAssignToPC(item)}
                              className="btn-energy"
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Assign PC
                            </Button>
                          )}
                          
                          {/* Queue management buttons */}
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMoveUp(item.id)}
                              disabled={index === 0}
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMoveDown(item.id)}
                              disabled={index === state.queue.length - 1}
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveFromQueue(item.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Queue Analytics & Controls */}
        <div className="space-y-6">
          {/* Queue Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Queue Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Longest Wait</span>
                <span className="font-medium">
                  {state.queue.length > 0 ? 
                    getWaitTime(Math.min(...state.queue.map(q => new Date(q.queueTime)))) : 
                    '0m'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Average Request</span>
                <span className="font-medium">
                  {state.queue.length > 0 ? 
                    Math.round(state.queue.reduce((sum, q) => sum + q.requestedHours, 0) / state.queue.length) : 
                    0
                  }h
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Hours Requested</span>
                <span className="font-medium">
                  {state.queue.reduce((sum, q) => sum + q.requestedHours, 0)}h
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Queue Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                {availablePCs > 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                )}
                <div>
                  <p className="font-medium">
                    {availablePCs > 0 ? 'PCs Available' : 'All PCs Occupied'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {availablePCs} of {state.pcs.length} computers ready
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {state.queue.length === 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Clock className="h-5 w-5 text-orange-500" />
                )}
                <div>
                  <p className="font-medium">
                    {state.queue.length === 0 ? 'No Queue' : `${state.queue.length} in Queue`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {state.queue.length === 0 ? 'All students served' : 'Students waiting'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full btn-energy" 
                variant="outline"
                disabled={state.queue.length === 0 || availablePCs === 0}
                onClick={() => state.queue.length > 0 && handleAssignToPC(state.queue[0])}
              >
                <Play className="h-4 w-4 mr-2" />
                Assign Next Student
              </Button>
              <Button 
                className="w-full btn-energy" 
                variant="outline"
                disabled={state.queue.length === 0}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Queue Order
              </Button>
              <Button 
                className="w-full btn-energy" 
                variant="outline"
              >
                <Timer className="h-4 w-4 mr-2" />
                Queue Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

export default QueueMonitor;

