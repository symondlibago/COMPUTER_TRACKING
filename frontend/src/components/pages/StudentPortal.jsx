import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Monitor, 
  Users, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Timer,
  LogIn,
  LogOut,
  User,
  MapPin,
  Cpu,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

function StudentPortal() {
  const { state, dispatch, ActionTypes } = useApp();
  const navigate = useNavigate();
  const [studentLogin, setStudentLogin] = useState({ name: '', studentId: '', hours: 2 });
  const [selectedPC, setSelectedPC] = useState(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // Timer for active session
  useEffect(() => {
    let interval = null;
    if (isActive && state.currentUser && state.userType === 'student') {
      interval = setInterval(() => {
        setSessionTime(time => time + 1);
      }, 1000);
    } else if (!isActive) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, state.currentUser, state.userType]);

  // Format time display
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle student login
  const handleStudentLogin = () => {
    if (studentLogin.name && studentLogin.studentId) {
      const student = state.students.find(s => s.studentId === studentLogin.studentId) || {
        id: Date.now(),
        name: studentLogin.name,
        studentId: studentLogin.studentId,
        email: `${studentLogin.studentId}@student.edu`
      };
      
      dispatch({
        type: ActionTypes.LOGIN,
        payload: {
          user: student,
          userType: 'student'
        }
      });
    }
  };

  // Handle PC selection and sign-in
  const handlePCSignIn = (pc) => {
    if (pc.status === 'available' && state.currentUser) {
      dispatch({
        type: ActionTypes.ASSIGN_PC,
        payload: {
          pcId: pc.id,
          user: {
            ...state.currentUser,
            startTime: new Date()
          }
        }
      });
      setSelectedPC(pc);
      setIsActive(true);
      setSessionTime(0);
    }
  };

  // Handle PC sign-out
  const handlePCSignOut = () => {
    if (selectedPC) {
      dispatch({
        type: ActionTypes.RELEASE_PC,
        payload: selectedPC.id
      });
      setSelectedPC(null);
      setIsActive(false);
      setSessionTime(0);
    }
  };

  // Join queue
  const handleJoinQueue = () => {
    if (state.currentUser && !state.queue.find(q => q.studentId === state.currentUser.id)) {
      dispatch({
        type: ActionTypes.JOIN_QUEUE,
        payload: {
          studentId: state.currentUser.id,
          studentName: state.currentUser.name,
          requestedHours: studentLogin.hours
        }
      });
    }
  };

  // Leave queue
  const handleLeaveQueue = () => {
    const queueItem = state.queue.find(q => q.studentId === state.currentUser?.id);
    if (queueItem) {
      dispatch({
        type: ActionTypes.REMOVE_FROM_QUEUE,
        payload: queueItem.id
      });
    }
  };


  // Check if user is in queue
  const userInQueue = state.queue.find(q => q.studentId === state.currentUser?.id);
  const queuePosition = userInQueue ? state.queue.findIndex(q => q.id === userInQueue.id) + 1 : 0;

  // Get available PCs
  const availablePCs = state.pcs.filter(pc => pc.status === 'available');
  const currentUserPC = state.pcs.find(pc => pc.currentUser?.id === state.currentUser?.id);

  if (!state.currentUser || state.userType !== 'student') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto mt-20"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Student Login
            </CardTitle>
            <CardDescription>
              Sign in to access computer lab resources
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={studentLogin.name}
                onChange={(e) => setStudentLogin({...studentLogin, name: e.target.value})}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                value={studentLogin.studentId}
                onChange={(e) => setStudentLogin({...studentLogin, studentId: e.target.value})}
                placeholder="Enter your student ID"
              />
            </div>
            <div>
              <Label htmlFor="hours">Requested Hours</Label>
              <Input
                id="hours"
                type="number"
                min="1"
                max="8"
                value={studentLogin.hours}
                onChange={(e) => setStudentLogin({...studentLogin, hours: parseInt(e.target.value)})}
              />
            </div>
            <Button 
              onClick={handleStudentLogin} 
              className="w-full btn-energy"
              disabled={!studentLogin.name || !studentLogin.studentId}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Student Portal</h1>
          <p className="text-muted-foreground">
            Welcome, {state.currentUser.name}
          </p>
        </div>

      </div>

      {/* Current Session Dashboard */}
      {currentUserPC && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8"
        >
          <Card className="border-primary bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Monitor className="h-5 w-5" />
                Active Session - {currentUserPC.name}
              </CardTitle>
              <CardDescription>
                {currentUserPC.location} • {currentUserPC.specs}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {formatTime(sessionTime)}
                  </div>
                  <p className="text-sm text-muted-foreground">Session Time</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500 mb-2">
                    {formatTime(studentLogin.hours * 3600 - sessionTime)}
                  </div>
                  <p className="text-sm text-muted-foreground">Time Remaining</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => setIsActive(!isActive)}
                    variant="outline"
                    className="btn-energy"
                  >
                    {isActive ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                    {isActive ? 'Pause' : 'Resume'}
                  </Button>
                  <Button
                    onClick={handlePCSignOut}
                    variant="destructive"
                    className="btn-energy"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    End Session
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Queue Status */}
      {userInQueue && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="border-orange-500 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <Clock className="h-5 w-5" />
                You're in the Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-medium">Position: #{queuePosition}</p>
                  <p className="text-sm text-muted-foreground">
                    Requested {userInQueue.requestedHours} hours • Joined at {new Date(userInQueue.queueTime).toLocaleTimeString()}
                  </p>
                </div>
                <Button
                  onClick={handleLeaveQueue}
                  variant="outline"
                  className="btn-energy"
                >
                  Leave Queue
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Available PCs */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Available Computers ({availablePCs.length})
              </CardTitle>
              <CardDescription>
                Select a computer to start your session
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availablePCs.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No PCs Available</h3>
                  <p className="text-muted-foreground mb-4">
                    All computers are currently in use. Join the queue to be notified when one becomes available.
                  </p>
                  {!userInQueue && !currentUserPC && (
                    <Button onClick={handleJoinQueue} className="btn-energy">
                      <Clock className="h-4 w-4 mr-2" />
                      Join Queue
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {availablePCs.map((pc) => (
                    <motion.div
                      key={pc.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-4 border border-border rounded-lg hover:shadow-md transition-all cursor-pointer"
                      onClick={() => !currentUserPC && handlePCSignIn(pc)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{pc.name}</h4>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {pc.location}
                        </div>
                        <div className="flex items-center gap-2">
                          <Cpu className="h-4 w-4" />
                          {pc.specs}
                        </div>
                      </div>
                      {!currentUserPC && (
                        <Button 
                          className="w-full mt-3 btn-energy" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePCSignIn(pc);
                          }}
                        >
                          <LogIn className="h-4 w-4 mr-2" />
                          Select This PC
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Lab Status & Queue Info */}
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
                  <span className="font-medium">{state.pcs.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-600">Available</span>
                  <span className="font-medium text-green-600">{availablePCs.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-600">In Use</span>
                  <span className="font-medium text-blue-600">
                    {state.pcs.filter(pc => pc.status === 'in-use').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-yellow-600">Maintenance</span>
                  <span className="font-medium text-yellow-600">
                    {state.pcs.filter(pc => pc.status === 'maintenance').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Queue Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Queue Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Students Waiting</span>
                  <span className="font-medium text-orange-500">{state.queue.length}</span>
                </div>
                {state.queue.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Next in line:</p>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">{state.queue[0].studentName}</p>
                      <p className="text-sm text-muted-foreground">
                        Waiting for {state.queue[0].requestedHours} hours
                      </p>
                    </div>
                  </div>
                )}
                {!userInQueue && !currentUserPC && availablePCs.length === 0 && (
                  <Button onClick={handleJoinQueue} className="w-full btn-energy">
                    <Clock className="h-4 w-4 mr-2" />
                    Join Queue
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Help & Information */}
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                <p>Select an available computer to start your session</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                <p>If no PCs are available, join the queue</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                <p>You'll have 5 minutes to sign in when notified</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                <p>End your session when finished</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default StudentPortal;

