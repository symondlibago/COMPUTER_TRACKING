import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../../context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  History,
  Download,
  Filter,
  Clock,
  Monitor,
  User,
  Calendar,
  Search,
  BarChart3,
  TrendingUp,
  Activity
} from 'lucide-react';

function UsageHistory() {
  const { state } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPC, setFilterPC] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  // Generate mock usage history data (in a real app, this would come from the backend)
  const generateUsageHistory = () => {
    const history = [];
    const now = new Date();
    
    // Add current active sessions
    state.pcs.forEach(pc => {
      if (pc.currentUser) {
        history.push({
          id: `current-${pc.id}`,
          studentName: pc.currentUser.name,
          studentId: pc.currentUser.studentId || 'N/A',
          pcName: pc.name,
          pcLocation: pc.location,
          startTime: new Date(pc.currentUser.startTime),
          endTime: null,
          duration: Math.floor((now - new Date(pc.currentUser.startTime)) / (1000 * 60)),
          status: 'active'
        });
      }
    });

    // Add some mock completed sessions
    const mockSessions = [
      {
        id: 'session-1',
        studentName: 'Alice Cooper',
        studentId: 'STU001',
        pcName: 'PC-001',
        pcLocation: 'Lab A',
        startTime: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
        endTime: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
        duration: 120,
        status: 'completed'
      },
      {
        id: 'session-2',
        studentName: 'Bob Wilson',
        studentId: 'STU002',
        pcName: 'PC-003',
        pcLocation: 'Lab B',
        startTime: new Date(now.getTime() - 5 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() - 3.5 * 60 * 60 * 1000),
        duration: 90,
        status: 'completed'
      },
      {
        id: 'session-3',
        studentName: 'Carol Davis',
        studentId: 'STU003',
        pcName: 'PC-002',
        pcLocation: 'Lab A',
        startTime: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Yesterday
        endTime: new Date(now.getTime() - 22 * 60 * 60 * 1000),
        duration: 120,
        status: 'completed'
      },
      {
        id: 'session-4',
        studentName: 'David Brown',
        studentId: 'STU004',
        pcName: 'PC-005',
        pcLocation: 'Lab C',
        startTime: new Date(now.getTime() - 48 * 60 * 60 * 1000), // 2 days ago
        endTime: new Date(now.getTime() - 46 * 60 * 60 * 1000),
        duration: 120,
        status: 'completed'
      }
    ];

    return [...history, ...mockSessions];
  };

  const usageHistory = generateUsageHistory();

  // Filter and search logic
  const filteredHistory = usageHistory.filter(session => {
    const matchesSearch =
      session.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.pcName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPC = filterPC === 'all' || session.pcName === filterPC;
    
    const matchesDate = filterDateRange === 'all' || (() => {
      const sessionDate = session.startTime;
      const now = new Date();
      switch (filterDateRange) {
        case 'today':
          return sessionDate.toDateString() === now.toDateString();
        case 'week':
          return sessionDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case 'month':
          return sessionDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesPC && matchesDate;
  });

  // Sort logic
  const sortedHistory = [...filteredHistory].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.startTime) - new Date(a.startTime);
      case 'duration':
        return b.duration - a.duration;
      case 'student':
        return a.studentName.localeCompare(b.studentName);
      case 'pc':
        return a.pcName.localeCompare(b.pcName);
      default:
        return 0;
    }
  });

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const calculateStats = () => {
    const completed = usageHistory.filter(s => s.status === 'completed');
    const totalSessions = completed.length;
    const totalMinutes = completed.reduce((sum, s) => sum + s.duration, 0);
    const avgDuration = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;
    
    return {
      totalSessions,
      totalHours: Math.round(totalMinutes / 60),
      avgDuration,
      activeSessions: usageHistory.filter(s => s.status === 'active').length
    };
  };

  const stats = calculateStats();

  const handleExportData = () => {
    // In a real app, this would generate and download a CSV/Excel file
    const csvData = sortedHistory.map(session => ({
      'Student Name': session.studentName,
      'Student ID': session.studentId,
      'PC Name': session.pcName,
      'Location': session.pcLocation,
      'Start Time': session.startTime.toLocaleString(),
      'End Time': session.endTime ? session.endTime.toLocaleString() : 'Active',
      'Duration': formatDuration(session.duration),
      'Status': session.status
    }));
    
    console.log('Exporting data:', csvData);
    alert('Export functionality would be implemented here');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Usage History</h1>
          <p className="text-muted-foreground">
            Track and analyze computer lab usage patterns
          </p>
        </div>
        <Button onClick={handleExportData} className="btn-energy">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">{stats.totalSessions}</p>
              </div>
              <History className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalHours}h</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Duration</p>
                <p className="text-2xl font-bold text-green-600">{formatDuration(stats.avgDuration)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Now</p>
                <p className="text-2xl font-bold text-orange-600">{stats.activeSessions}</p>
              </div>
              <Activity className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Student, PC, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>PC Filter</Label>
              <Select value={filterPC} onValueChange={setFilterPC}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All PCs</SelectItem>
                  {state.pcs.map(pc => (
                    <SelectItem key={pc.id} value={pc.name}>{pc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date Range</Label>
              <Select value={filterDateRange} onValueChange={setFilterDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="pc">PC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setFilterPC('all');
                  setFilterDateRange('all');
                  setSortBy('date');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
          <CardDescription>
            Detailed log of all computer lab sessions ({sortedHistory.length} records)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedHistory.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No sessions found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search terms.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedHistory.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{session.studentName}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>ID: {session.studentId}</span>
                          <div className="flex items-center gap-1">
                            <Monitor className="h-3 w-3" />
                            {session.pcName} ({session.pcLocation})
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Badge 
                        className={session.status === 'active' ? 
                          'bg-green-100 text-green-800' : 
                          'bg-gray-100 text-gray-800'
                        }
                      >
                        {session.status === 'active' ? 'Active' : 'Completed'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Start Time</p>
                        <p className="font-medium">
                          {session.startTime.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">End Time</p>
                        <p className="font-medium">
                          {session.endTime ? 
                            session.endTime.toLocaleString() : 
                            'Active'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Duration</p>
                        <p className="font-medium">
                          {formatDuration(session.duration)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Date</p>
                        <p className="font-medium">
                          {session.startTime.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default UsageHistory;

