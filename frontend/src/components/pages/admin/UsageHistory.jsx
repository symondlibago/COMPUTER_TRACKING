import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
import API_BASE_URL from '../Config';
import { apiGet } from '../../../utils/apiUtils';
import * as XLSX from "xlsx";

function UsageHistory() {
  const [usageHistory, setUsageHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPC, setFilterPC] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [pcs, setPcs] = useState([]);

  // Format time to Philippines timezone (UTC+8)
  const formatPhilippinesTime = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      // Convert to Philippines timezone (UTC+8)
      const philippinesTime = new Date(date.getTime() + (8 * 60 * 60 * 1000));
      
      return philippinesTime.toLocaleString('en-PH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Invalid Date';
    }
  };

  // Fetch PCs for filter dropdown
  const fetchPCs = async () => {
    try {
      const response = await apiGet('/pcs');
      
      if (response.ok) {
        const data = await response.json();
        setPcs(data.data || []);
      } else {
        console.error('Failed to fetch PCs');
      }
    } catch (error) {
      console.error('Fetch PCs error:', error);
    }
  };

  // Fetch usage history from backend
  const fetchUsageHistory = async () => {
    try {
      setLoading(true);
      
      // First get active usage
      const activeResponse = await apiGet('/pc-usage/active');

      let allUsageData = [];

      if (activeResponse.ok) {
        const activeData = await activeResponse.json();
        const activeUsage = (activeData.data || []).map(session => ({
          id: `active-${session.id}`,
          studentName: session.student_name,
          studentId: session.student_id,
          pcName: session.pc_name,
          pcLocation: session.pc_row,
          startTime: new Date(session.created_at), // Use created_at as start time
          endTime: null, // Active sessions don't have end time
          duration: Math.floor(session.actual_usage_duration / 60), // Convert seconds to minutes
          status: session.is_paused ? 'paused' : 'active',
          created_at: session.created_at,
          updated_at: session.created_at // For active sessions, updated_at is same as created_at
        }));
        allUsageData = [...allUsageData, ...activeUsage];
      }

      // Try to get completed usage history from all PCs
      for (const pc of pcs) {
        try {
          const historyResponse = await fetch(`${API_BASE_URL}/pc-usage/pc/${pc.id}/history`, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });

          if (historyResponse.ok) {
            const historyData = await historyResponse.json();
            const completedUsage = (historyData.data || []).map(session => ({
              id: `history-${session.id}`,
              studentName: session.student_name,
              studentId: session.student_id,
              pcName: pc.name,
              pcLocation: pc.row,
              startTime: new Date(session.created_at), // Use created_at as start time
              endTime: session.updated_at ? new Date(session.updated_at) : null, // Use updated_at as end time
              duration: Math.floor(session.actual_usage_duration / 60), // Convert seconds to minutes
              status: session.status,
              created_at: session.created_at,
              updated_at: session.updated_at
            }));
            allUsageData = [...allUsageData, ...completedUsage];
          }
        } catch (error) {
          console.error(`Error fetching history for PC ${pc.id}:`, error);
        }
      }

      // Remove duplicates based on session ID
      const uniqueUsage = allUsageData.filter((session, index, self) => 
        index === self.findIndex(s => s.id === session.id)
      );

      setUsageHistory(uniqueUsage);
    } catch (error) {
      console.error('Fetch usage history error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPCs();
  }, []);

  useEffect(() => {
    if (pcs.length > 0) {
      fetchUsageHistory();
    }
  }, [pcs]);

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
      activeSessions: usageHistory.filter(s => s.status === 'active' || s.status === 'paused').length
    };
  };

  const stats = calculateStats();

  const handleExportData = () => {
    if (sortedHistory.length === 0) {
      alert("No data available to export.");
      return;
    }
  
    // Prepare data for Excel
    const excelData = sortedHistory.map(session => ({
      "Student Name": session.studentName,
      "Student ID": session.studentId,
      "PC Name": session.pcName,
      "Location": session.pcLocation,
      "Start Time": formatPhilippinesTime(session.created_at),
      "End Time": session.updated_at ? formatPhilippinesTime(session.updated_at) : "Active",
      "Duration": formatDuration(session.duration),
      "Status": session.status
    }));
  
    // Create a new workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Usage History");
  
    // Trigger file download
    XLSX.writeFile(workbook, "Usage_History.xlsx");
  };
  

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading usage history...</p>
        </div>
      </div>
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
    <div className="grid grid-cols-1 lg:flex lg:items-end lg:gap-3">
      
      {/* Search */}
      <div className="flex-1 min-w-[250px]">
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

      {/* PC Filter */}
      <div>
        <Label>PC Filter</Label>
        <Select value={filterPC} onValueChange={setFilterPC}>
          <SelectTrigger className="min-w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All PCs</SelectItem>
            {pcs.map(pc => (
              <SelectItem key={pc.id} value={pc.name}>{pc.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Range */}
      <div>
        <Label>Date Range</Label>
        <Select value={filterDateRange} onValueChange={setFilterDateRange}>
          <SelectTrigger className="min-w-[140px]">
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

      {/* Sort By */}
      <div>
        <Label>Sort By</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="min-w-[140px]">
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

      {/* Clear Filters */}
      <div>
        <Button 
          variant="outline" 
          onClick={() => {
            setSearchTerm('');
            setFilterPC('all');
            setFilterDateRange('all');
            setSortBy('date');
          }}
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
                        className={
                          session.status === 'active' ? 'bg-green-100 text-green-800' :
                          session.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }
                      >
                        {session.status === 'active' ? 'Active' : 
                         session.status === 'paused' ? 'Paused' : 'Completed'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Start Time</p>
                        <p className="font-medium">
                          {formatPhilippinesTime(session.created_at)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">End Time</p>
                        <p className="font-medium">
                          {session.status === 'completed' && session.updated_at ? 
                            formatPhilippinesTime(session.updated_at) : 
                            (session.status === 'active' || session.status === 'paused' ? 'Active' : 'N/A')
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

