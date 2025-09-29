import React, { useState, useEffect } from 'react';
import { apiGet } from '../../../utils/apiUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Monitor,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Activity,
  Settings,
  AlertCircle,
  Search,
  Filter,
  Clock,
  User,
  X,
  List,
  Timer,
  Pause,
  Play,
  StopCircle,
  Loader2,
  Computer,
  Users
} from 'lucide-react';
import API_BASE_URL from '../Config';

function PCManagement() {
  const [pcs, setPcs] = useState([]);
  const [activeUsage, setActiveUsage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState({ id: null, type: null });
  const [activeSection, setActiveSection] = useState('pcs');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSetInUseDialogOpen, setIsSetInUseDialogOpen] = useState(false);
  const [editingPC, setEditingPC] = useState(null);
  const [deletingPC, setDeletingPC] = useState(null);
  const [selectedPC, setSelectedPC] = useState(null);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionSearchQuery, setSessionSearchQuery] = useState('');
  const [newPC, setNewPC] = useState({
    name: '',
    row: '',
    status: 'active'
  });

  // Set PC in use form state (no time limit needed for open sessions)
  const [setInUseForm, setSetInUseForm] = useState({
    studentId: '',
    studentName: ''
  });
  const [studentSearchResults, setStudentSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
        setActiveUsage(prevUsages =>
            prevUsages.map(usage => {
                // Helper function to format seconds into a human-readable string (e.g., 1h 2m 3s)
                const formatDuration = (totalSeconds) => {
                    if (isNaN(totalSeconds) || totalSeconds < 0) totalSeconds = 0;
                    
                    const hours = Math.floor(totalSeconds / 3600);
                    const minutes = Math.floor((totalSeconds % 3600) / 60);
                    const seconds = Math.floor(totalSeconds % 60);
                    
                    let parts = [];
                    if (hours > 0) parts.push(`${hours}h`);
                    if (minutes > 0) parts.push(`${minutes}m`);
                    // Only show seconds if the total duration is less than a minute, or if there are no hours.
                    if (totalSeconds < 60 || (hours === 0 && seconds > 0)) {
                        parts.push(`${seconds}s`);
                    }
                    return parts.join(' ') || '0s';
                };

                // If the session is active and not paused, increment the usage duration.
                if (usage.status === 'active' && !usage.is_paused) {
                    const newUsageSeconds = (usage.actual_usage_duration || 0) + 1;
                    return {
                        ...usage,
                        actual_usage_duration: newUsageSeconds,
                        formatted_usage_duration: formatDuration(newUsageSeconds),
                    };
                }
                // If the session is paused, increment the pause duration and decrement the remaining time.
                else if (usage.status === 'paused' && usage.is_paused) {
                    const newPauseSeconds = (usage.total_pause_duration || 0) + 1;
                    const newRemainingTime = Math.max(0, (usage.remaining_pause_time || 0) - 1);
                    return {
                        ...usage,
                        total_pause_duration: newPauseSeconds,
                        formatted_pause_duration: formatDuration(newPauseSeconds),
                        remaining_pause_time: newRemainingTime,
                    };
                }

                return usage; // Return usage unchanged if not active or paused
            })
        );
    }, 1000); // This interval runs every second

    return () => clearInterval(timer); // Cleanup on component unmount
}, []); 

  // Fetch PCs from backend
  const fetchPCs = async () => {
    try {
      setLoading(true);
      const response = await apiGet('/pcs');
      
      if (response.ok) {
        const data = await response.json();
        setPcs(data.data || []);
      } else {
        const errorData = await response.json();
        showAlert('error', errorData.message || 'Failed to fetch PCs');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      showAlert('error', 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  // Fetch active PC usage
  const fetchActiveUsage = async () => {
    try {
      const response = await apiGet('/pc-usage/active');
      
      if (response.ok) {
        const data = await response.json();
        setActiveUsage(data.data || []);
      } else {
        console.error('Failed to fetch active usage');
      }
    } catch (error) {
      console.error('Fetch active usage error:', error);
    }
  };

  // Search students
  const searchStudents = async (query) => {
    if (!query.trim()) {
      setStudentSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`${API_BASE_URL}/students/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStudentSearchResults(data.data || []);
      }
    } catch (error) {
      console.error('Student search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchPCs();
    fetchActiveUsage();
    
    const interval = setInterval(() => {
      fetchActiveUsage();
      fetchPCs(); // Also refresh PCs to update status
    }, 360000);

    return () => clearInterval(interval);
  }, []);

  // Search students when student ID changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchStudents(setInUseForm.studentId);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [setInUseForm.studentId]);

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'in-use': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return CheckCircle;
      case 'in-use': return Activity;
      default: return Settings;
    }
  };

  // Calculate PC statistics
  const pcStats = {
    total: pcs.length,
    available: pcs.filter(pc => pc.status === 'active').length,
    inUse: pcs.filter(pc => pc.status === 'in-use').length
  };

  // Calculate session statistics
  const sessionStats = {
    active: activeUsage.filter(session => session.status === 'active' && !session.is_paused).length,
    paused: activeUsage.filter(session => session.status === 'paused' || session.is_paused).length
  };

  // Filter PCs based on status and search query
  const filteredPCs = pcs.filter(pc => {
    const matchesStatus = statusFilter === 'all' || pc.status === statusFilter;
    const matchesSearch = pc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pc.row.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Filter active sessions based on search query
  const filteredSessions = activeUsage.filter(session => {
    const matchesSearch = session.pc_name.toLowerCase().includes(sessionSearchQuery.toLowerCase()) ||
                         session.student_name.toLowerCase().includes(sessionSearchQuery.toLowerCase()) ||
                         session.student_id.toLowerCase().includes(sessionSearchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleAddPC = async () => {
    if (!newPC.name || !newPC.row) {
      showAlert("error", "Please fill in all required fields");
      return;
    }
  
    setLoading(true); // start loading
  
    try {
      const response = await fetch(`${API_BASE_URL}/pcs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(newPC),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        showAlert(
          "success",
          `PC "${newPC.name}" has been added successfully to ${newPC.row}!`
        );
        setNewPC({ name: "", row: "", status: "active" });
        setIsAddDialogOpen(false);
        fetchPCs();
      } else {
        console.error("Add PC error:", data);
        showAlert("error", data.message || "Failed to add PC");
      }
    } catch (error) {
      console.error("Add PC error:", error);
      showAlert("error", "Error connecting to server");
    } finally {
      setLoading(false); // stop loading
    }
  };

  const handleEditPC = async () => {
    if (!editingPC || !editingPC.name || !editingPC.row) {
      showAlert('error', 'Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/pcs/${editingPC.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: editingPC.name,
          row: editingPC.row,
          status: editingPC.status
        })
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('success', `PC "${editingPC.name}" has been updated successfully!`);
        setEditingPC(null);
        setIsEditDialogOpen(false);
        fetchPCs();
      } else {
        console.error('Update PC error:', data);
        showAlert('error', data.message || 'Failed to update PC');
      }
    } catch (error) {
      console.error('Update PC error:', error);
      showAlert('error', 'Error connecting to server');
    }
  };

  const handleDeletePC = async () => {
    if (!deletingPC) return;

    try {
      const response = await fetch(`${API_BASE_URL}/pcs/${deletingPC.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('success', `PC "${deletingPC.name}" has been deleted successfully!`);
        setDeletingPC(null);
        setIsDeleteDialogOpen(false);
        fetchPCs();
      } else {
        console.error('Delete PC error:', data);
        showAlert('error', data.message || 'Failed to delete PC');
      }
    } catch (error) {
      console.error('Delete PC error:', error);
      showAlert('error', 'Error connecting to server');
    }
  };

  const handleSetPCInUse = async () => {
    if (!setInUseForm.studentId || !selectedPC) {
      showAlert('error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true); // start loading
      const response = await fetch(`${API_BASE_URL}/pc-usage/set-in-use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          pc_id: selectedPC.id,
          student_id: setInUseForm.studentId
        })
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('success', `PC "${selectedPC.name}" session started for ${setInUseForm.studentName}!`);
        setSetInUseForm({ studentId: '', studentName: '' });
        setSelectedPC(null);
        setIsSetInUseDialogOpen(false);
        fetchPCs();
        fetchActiveUsage();
      } else {
        console.error('Set PC in use error:', data);
        showAlert('error', data.message || 'Failed to start PC session');
      }
    } catch (error) {
      console.error('Set PC in use error:', error);
      showAlert('error', 'Error connecting to server');
    } finally {
      setLoading(false); // stop loading
    }
  };

  const handlePauseUsage = async (usageId) => {
    setLoadingAction({ id: usageId, type: "pause" }); // start loading for this usage + action
    try {
      const response = await fetch(`${API_BASE_URL}/pc-usage/${usageId}/pause`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
  
      const data = await response.json();
  
      if (response.ok) {
        showAlert("success", "PC usage paused successfully!");
        fetchPCs();
        fetchActiveUsage();
      } else {
        console.error("Pause usage error:", data);
        showAlert("error", data.message || "Failed to pause usage");
      }
    } catch (error) {
      console.error("Pause usage error:", error);
      showAlert("error", "Error connecting to server");
    } finally {
      setLoadingAction({ id: null, type: null }); // reset loading
    }
  };

  const handleResumeUsage = async (usageId) => {
    setLoadingAction({ id: usageId, type: "resume" }); // start loading
  
    try {
      const response = await fetch(`${API_BASE_URL}/pc-usage/${usageId}/resume`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
  
      const data = await response.json();
  
      if (response.ok) {
        showAlert("success", "PC usage resumed successfully!");
        fetchPCs();
        fetchActiveUsage();
      } else {
        console.error("Resume usage error:", data);
        showAlert("error", data.message || "Failed to resume usage");
      }
    } catch (error) {
      console.error("Resume usage error:", error);
      showAlert("error", "Error connecting to server");
    } finally {
      setLoadingAction({ id: null, type: null }); // reset loading
    }
  };

  const handleCompleteUsage = async (usageId) => {
    setLoadingAction({ id: usageId, type: "complete" }); // start loading
    try {
      const response = await fetch(`${API_BASE_URL}/pc-usage/${usageId}/complete`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
  
      const data = await response.json();
  
      if (response.ok) {
        showAlert("success", "PC usage completed successfully!");
        fetchPCs();
        fetchActiveUsage();
      } else {
        console.error("Complete usage error:", data);
        showAlert("error", data.message || "Failed to complete usage");
      }
    } catch (error) {
      console.error("Complete usage error:", error);
      showAlert("error", "Error connecting to server");
    } finally {
      setLoadingAction({ id: null, type: null }); // reset loading
    }
  };
  
  const openSetInUseDialog = (pc) => {
    setSelectedPC(pc);
    setIsSetInUseDialogOpen(true);
  };

  const openEditDialog = (pc) => {
    setEditingPC({ ...pc });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (pc) => {
    setDeletingPC(pc);
    setIsDeleteDialogOpen(true);
  };

  const selectStudent = (student) => {
    setSetInUseForm({
      ...setInUseForm,
      studentId: student.student_id,
      studentName: student.name
    });
    setStudentSearchResults([]);
  };

  const generateNextPCName = () => {
    const pcNumbers = pcs
      .map(pc => {
        const match = pc.name.match(/PC-(\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(num => num > 0);
    
    const nextNumber = pcNumbers.length > 0 ? Math.max(...pcNumbers) + 1 : 1;
    return `PC-${String(nextNumber).padStart(3, '0')}`;
  };

  // Format time to Philippines timezone (UTC+8)
const formatPhilippinesTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    // Directly parse the ISO 8601 date string provided by the API
    const date = new Date(dateString);
    
    // Check if the parsed date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    // Format the date to a time string for the 'Asia/Manila' timezone
    return date.toLocaleTimeString('en-PH', { 
      hour: '2-digit',
      minute: '2-digit',
      hour12: true, // Use AM/PM format
      timeZone: 'Asia/Manila'
    });
  } catch (error) {
    console.error('Error formatting date:', error, dateString);
    return 'Invalid Date';
  }
};

  const getUsageStatusBadge = (usage) => {
    if (usage.status === 'paused') {
      return (
        <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
          <Pause className="h-3 w-3 mr-1" />
          Paused
        </Badge>
      );
    } else if (usage.status === 'active') {
      return (
        <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
          <Play className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    }
    return null;
  };

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
          <h1 className="text-3xl font-bold">PC Management</h1>
          <p className="text-muted-foreground">
            Manage computer workstations and their real-time usage
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle Button with Icons and Liquid Animation */}
          <div className="relative bg-gray-100 rounded-full p-1 w-[100px]">
            <motion.div
              className="absolute top-1 bottom-1 bg-white rounded-full shadow-md"
              initial={false}
              animate={{
                left: activeSection === 'pcs' ? '4px' : '52px',
                width: '44px'
              }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30
              }}
            />
            <div className="relative flex">
              <button
                onClick={() => setActiveSection('pcs')}
                className={`flex items-center justify-center w-12 h-10 rounded-full transition-colors relative z-10 ${
                  activeSection === 'pcs' 
                    ? 'text-blue-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                title="PC List"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setActiveSection('usage')}
                className={`flex items-center justify-center w-12 h-10 rounded-full transition-colors relative z-10 ${
                  activeSection === 'usage' 
                    ? 'text-blue-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                title="Active Usage"
              >
                <Timer className="h-4 w-4" />
              </button>
            </div>
          </div>

          {activeSection === 'pcs' && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setNewPC({ ...newPC, name: generateNextPCName() })}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add PC
                </Button>
              </DialogTrigger>
            </Dialog>
          )}
        </div>
      </div>

      {/* PC List Section */}
      {activeSection === 'pcs' && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* PC Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total PCs</p>
                    <p className="text-2xl font-bold">{pcStats.total}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Computer className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Available PCs</p>
                    <p className="text-2xl font-bold text-green-600">{pcStats.available}</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">In Use PCs</p>
                    <p className="text-2xl font-bold text-blue-600">{pcStats.inUse}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Search PCs</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="search"
                      placeholder="Search by name or row..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="sm:w-48">
                  <Label htmlFor="status-filter">Status Filter</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Available</SelectItem>
                      <SelectItem value="in-use">In Use</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PC Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Computers ({filteredPCs.length})
              </CardTitle>
              <CardDescription>
                Manage computer workstations and start sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredPCs.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No PCs Found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || statusFilter !== 'all' 
                      ? 'No computers match your current filters.' 
                      : 'No computers are currently registered in the system.'
                    }
                  </p>
                  {!searchQuery && statusFilter === 'all' && (
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First PC
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Row</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[200px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPCs.map((pc) => {
                        const StatusIcon = getStatusIcon(pc.status);
                        return (
                          <TableRow key={pc.id}>
                            <TableCell className="font-medium">{pc.name}</TableCell>
                            <TableCell>{pc.row}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(pc.status)}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {pc.status === 'active' ? 'Available' : 'In Use'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {pc.status === 'active' && (
                                  <Button
                                    size="sm"
                                    onClick={() => openSetInUseDialog(pc)}
                                    className="bg-blue-600 hover:bg-blue-700 text-xs px-2 py-1 h-7"
                                  >
                                    <User className="h-3 w-3 mr-1" />
                                    Start
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditDialog(pc)}
                                  className="text-xs px-2 py-1 h-7"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openDeleteDialog(pc)}
                                  className="text-red-600 hover:text-red-700 text-xs px-2 py-1 h-7"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Active Usage Section */}
      {activeSection === 'usage' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Session Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                    <p className="text-2xl font-bold text-green-600">{sessionStats.active}</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Play className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Paused Sessions</p>
                    <p className="text-2xl font-bold text-orange-600">{sessionStats.paused}</p>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Pause className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Session Search */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Search Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by PC name, student name, or student ID..."
                  value={sessionSearchQuery}
                  onChange={(e) => setSessionSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Active Sessions ({filteredSessions.length})
              </CardTitle>
              <CardDescription>
                Monitor and control active PC usage sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredSessions.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {sessionSearchQuery ? 'No Sessions Found' : 'No Active Sessions'}
                  </h3>
                  <p className="text-muted-foreground">
                    {sessionSearchQuery 
                      ? 'No sessions match your search criteria.'
                      : 'No computers are currently being used.'
                    }
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>PC</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead>Usage Duration</TableHead>
                        <TableHead>Pause Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[200px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSessions.map((usage) => (
                        <TableRow key={usage.id}>
                          <TableCell className="font-medium">
                            {usage.pc_name}
                            <div className="text-sm text-muted-foreground">
                              Row {usage.pc_row}
                            </div>
                          </TableCell>
                          <TableCell>
                            {usage.student_name}
                            <div className="text-sm text-muted-foreground">
                              {usage.student_id}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatPhilippinesTime(usage.created_at)}
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-sm">
                              {usage.formatted_usage_duration}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-sm">
                              {usage.formatted_pause_duration}
                              {usage.is_paused && usage.remaining_pause_time > 0 && (
                                <div className="text-xs text-orange-600">
                                  Auto-end in: {Math.floor(usage.remaining_pause_time / 60)}m {usage.remaining_pause_time % 60}s
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getUsageStatusBadge(usage)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {usage.status === 'active' && !usage.is_paused && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePauseUsage(usage.id)}
                                  disabled={loadingAction.id === usage.id && loadingAction.type === "pause"}
                                  className="text-orange-600 hover:text-orange-700 text-xs px-2 py-1 h-7"
                                >
                                  {loadingAction.id === usage.id && loadingAction.type === "pause" ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Pause className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                              {usage.status === 'paused' && usage.is_paused && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleResumeUsage(usage.id)}
                                  disabled={loadingAction.id === usage.id && loadingAction.type === "resume"}
                                  className="text-green-600 hover:text-green-700 text-xs px-2 py-1 h-7"
                                >
                                  {loadingAction.id === usage.id && loadingAction.type === "resume" ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Play className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCompleteUsage(usage.id)}
                                disabled={loadingAction.id === usage.id && loadingAction.type === "complete"}
                                className="text-red-600 hover:text-red-700 text-xs px-2 py-1 h-7"
                              >
                                {loadingAction.id === usage.id && loadingAction.type === "complete" ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <StopCircle className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}



      {/* Add PC Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New PC</DialogTitle>
            <DialogDescription>
              Add a new computer workstation to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="pc-name">PC Name</Label>
              <Input
                id="pc-name"
                placeholder="e.g., PC-001"
                value={newPC.name}
                onChange={(e) => setNewPC({ ...newPC, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="pc-row">Row</Label>
              <Input
                id="pc-row"
                placeholder="e.g., 1"
                value={newPC.row}
                onChange={(e) => setNewPC({ ...newPC, row: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="pc-status">Status</Label>
              <Select value={newPC.status} onValueChange={(value) => setNewPC({ ...newPC, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Available</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddPC} disabled={loading}>
                {loading ? "Adding..." : "Add PC"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit PC Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit PC</DialogTitle>
            <DialogDescription>
              Update the PC information.
            </DialogDescription>
          </DialogHeader>
          {editingPC && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-pc-name">PC Name</Label>
                <Input
                  id="edit-pc-name"
                  value={editingPC.name}
                  onChange={(e) => setEditingPC({ ...editingPC, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-pc-row">Row</Label>
                <Input
                  id="edit-pc-row"
                  value={editingPC.row}
                  onChange={(e) => setEditingPC({ ...editingPC, row: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-pc-status">Status</Label>
                <Select value={editingPC.status} onValueChange={(value) => setEditingPC({ ...editingPC, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Available</SelectItem>
                    <SelectItem value="in-use">In Use</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditPC}>
                  Update PC
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete PC Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete PC</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this PC? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deletingPC && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>PC Name:</strong> {deletingPC.name}<br />
                  <strong>Row:</strong> {deletingPC.row}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeletePC}>
                  Delete PC
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Set PC In Use Dialog */}
      <Dialog open={isSetInUseDialogOpen} onOpenChange={setIsSetInUseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start PC Session</DialogTitle>
            <DialogDescription>
              Start a new session for the selected PC. No time limit - session runs until manually ended.
            </DialogDescription>
          </DialogHeader>
          {selectedPC && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>PC:</strong> {selectedPC.name} (Row {selectedPC.row})
                </p>
              </div>
              <div>
                <Label htmlFor="student-search">Student ID or Name</Label>
                <div className="relative">
                  <Input
                    id="student-search"
                    placeholder="Search by student ID or name..."
                    value={setInUseForm.studentId}
                    onChange={(e) => setSetInUseForm({ ...setInUseForm, studentId: e.target.value, studentName: '' })}
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
                {studentSearchResults.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-md max-h-40 overflow-y-auto">
                    {studentSearchResults.map((student) => (
                      <button
                        key={student.student_id}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        onClick={() => selectStudent(student)}
                      >
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.student_id}</div>
                      </button>
                    ))}
                  </div>
                )}
                {setInUseForm.studentName && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">
                      Selected: <strong>{setInUseForm.studentName}</strong> ({setInUseForm.studentId})
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsSetInUseDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSetPCInUse} 
                  disabled={!setInUseForm.studentId || loading}
                >
                  {loading ? "Starting..." : "Start Session"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export default PCManagement;

