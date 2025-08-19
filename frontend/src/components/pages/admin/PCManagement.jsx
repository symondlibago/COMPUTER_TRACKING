import React, { useState, useEffect } from 'react';
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
  Timer
} from 'lucide-react';
import API_BASE_URL from '../Config';

function PCManagement() {
  const [pcs, setPcs] = useState([]);
  const [activeUsage, setActiveUsage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('pcs'); // 'pcs' or 'usage'
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
  const [newPC, setNewPC] = useState({
    name: '',
    row: '',
    status: 'active'
  });

  // Set PC in use form state with minutes support
  const [setInUseForm, setSetInUseForm] = useState({
    studentId: '',
    studentName: '',
    hours: 0,
    minutes: 5 // Default to 5 minutes
  });
  const [studentSearchResults, setStudentSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch PCs from backend
  const fetchPCs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/pcs`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
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
      const response = await fetch(`${API_BASE_URL}/pc-usage/active`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
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
    
    // Set up interval to refresh active usage every 30 seconds
    const interval = setInterval(() => {
      fetchActiveUsage();
      fetchPCs(); // Also refresh PCs to update status
    }, 30000);

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

  // Filter PCs based on status and search query
  const filteredPCs = pcs.filter(pc => {
    const matchesStatus = statusFilter === 'all' || pc.status === statusFilter;
    const matchesSearch = pc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pc.row.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleAddPC = async () => {
    if (!newPC.name || !newPC.row) {
      showAlert('error', 'Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/pcs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(newPC)
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('success', `PC "${newPC.name}" has been added successfully to ${newPC.row}!`);
        setNewPC({ name: '', row: '', status: 'active' });
        setIsAddDialogOpen(false);
        fetchPCs();
      } else {
        console.error('Add PC error:', data);
        showAlert('error', data.message || 'Failed to add PC');
      }
    } catch (error) {
      console.error('Add PC error:', error);
      showAlert('error', 'Error connecting to server');
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
    const totalMinutes = (setInUseForm.hours * 60) + setInUseForm.minutes;
    
    if (!setInUseForm.studentId || totalMinutes <= 0 || !selectedPC) {
      showAlert('error', 'Please fill in all required fields and set a valid time');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/pc-usage/set-in-use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          pc_id: selectedPC.id,
          student_id: setInUseForm.studentId,
          minutes: totalMinutes // Send total minutes instead of hours
        })
      });

      const data = await response.json();

      if (response.ok) {
        const timeDisplay = totalMinutes >= 60 
          ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
          : `${totalMinutes}m`;
        showAlert('success', `PC "${selectedPC.name}" has been set in use for ${setInUseForm.studentName} for ${timeDisplay}!`);
        setSetInUseForm({ studentId: '', studentName: '', hours: 0, minutes: 5 });
        setSelectedPC(null);
        setIsSetInUseDialogOpen(false);
        fetchPCs();
        fetchActiveUsage();
      } else {
        console.error('Set PC in use error:', data);
        showAlert('error', data.message || 'Failed to set PC in use');
      }
    } catch (error) {
      console.error('Set PC in use error:', error);
      showAlert('error', 'Error connecting to server');
    }
  };

  const handleCompleteUsage = async (usageId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/pc-usage/${usageId}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('success', 'PC usage completed successfully!');
        fetchPCs();
        fetchActiveUsage();
      } else {
        console.error('Complete usage error:', data);
        showAlert('error', data.message || 'Failed to complete usage');
      }
    } catch (error) {
      console.error('Complete usage error:', error);
      showAlert('error', 'Error connecting to server');
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

  const formatTime = (minutes) => {
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

  // Format time to Philippines timezone (UTC+8)
  const formatPhilippinesTime = (dateString) => {
    const date = new Date(dateString);
    // Convert to Philippines time (UTC+8)
    const philippinesTime = new Date(date.getTime() + (8 * 60 * 60 * 1000));
    return philippinesTime.toLocaleTimeString('en-PH', { 
      hour12: false, // Use 24-hour format
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Manila'
    });
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
            Manage computer workstations and their usage
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Fixed Toggle Button with Icons and Liquid Animation */}
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

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-energy">
                <Plus className="h-4 w-4 mr-2" />
                Add New PC
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Computer</DialogTitle>
                <DialogDescription>
                  Add a new computer workstation to the lab
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="pc-name">PC Name</Label>
                  <Input
                    id="pc-name"
                    placeholder={generateNextPCName()}
                    value={newPC.name}
                    onChange={(e) => setNewPC({...newPC, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="pc-row">Row</Label>
                  <Input
                    id="pc-row"
                    placeholder="e.g., Row 1, Row 2"
                    value={newPC.row}
                    onChange={(e) => setNewPC({...newPC, row: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="pc-status">Initial Status</Label>
                  <Select value={newPC.status} onValueChange={(value) => setNewPC({...newPC, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="in-use">In Use</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleAddPC} className="flex-1 btn-energy">
                    Add PC
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total PCs</p>
                <p className="text-2xl font-bold">{pcs.length}</p>
              </div>
              <Monitor className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {pcs.filter(pc => pc.status === 'active').length}
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
                <p className="text-sm font-medium text-muted-foreground">In Use</p>
                <p className="text-2xl font-bold text-blue-600">
                  {pcs.filter(pc => pc.status === 'in-use').length}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                <p className="text-2xl font-bold text-purple-600">
                  {activeUsage.length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section Content */}
      <AnimatePresence mode="wait">
        {activeSection === 'pcs' ? (
          <motion.div
            key="pcs"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* PC Management Section */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle>Computer Workstations</CardTitle>
                    <CardDescription>
                      Manage all computer workstations in the lab
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search PCs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="in-use">In Use</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16"></TableHead>
                        <TableHead>PC Name</TableHead>
                        <TableHead>Row</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPCs.map((pc) => {
                        const StatusIcon = getStatusIcon(pc.status);
                        return (
                          <TableRow key={pc.id}>
                            <TableCell>
                              <Monitor className="h-6 w-6 text-blue-600" />
                            </TableCell>
                            <TableCell className="font-medium">{pc.name}</TableCell>
                            <TableCell>{pc.row}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <StatusIcon className={`h-4 w-4 ${getStatusColor(pc.status).split(' ')[0]}`} />
                                <Badge variant="secondary" className={getStatusColor(pc.status)}>
                                  {pc.status === 'active' ? 'Active' : 'In Use'}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              {pc.created_at ? new Date(pc.created_at).toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {pc.status === 'active' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openSetInUseDialog(pc)}
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    Set In Use
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(pc)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openDeleteDialog(pc)}
                                  className="text-destructive hover:text-destructive"
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
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="usage"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Active Usage Section */}
            <Card>
              <CardHeader>
                <CardTitle>Active PC Usage</CardTitle>
                <CardDescription>
                  Monitor currently active PC usage sessions with real-time timers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeUsage.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No active PC usage sessions</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>PC</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead>Remaining Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeUsage.map((usage) => (
                        <TableRow key={usage.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Monitor className="h-4 w-4 text-blue-600" />
                              <div>
                                <p className="font-medium">{usage.pc_name}</p>
                                <p className="text-sm text-gray-500">{usage.pc_row}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-600" />
                              <div>
                                <p className="font-medium">{usage.student_name}</p>
                                <p className="text-sm text-gray-500">{usage.student_id}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatTime(usage.minutes_requested || (usage.hours_requested * 60))}
                          </TableCell>
                          <TableCell>
                            {formatPhilippinesTime(usage.start_time)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span className={usage.is_expired ? 'text-red-600 font-medium' : 'text-green-600'}>
                                {usage.is_expired ? 'Expired' : formatTime(usage.remaining_minutes)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={usage.is_expired ? 'destructive' : 'default'}
                              className={usage.is_expired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}
                            >
                              {usage.is_expired ? 'Expired' : 'Active'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCompleteUsage(usage.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              Complete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Set PC In Use Dialog with Minutes Support */}
      <Dialog open={isSetInUseDialogOpen} onOpenChange={setIsSetInUseDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set PC In Use</DialogTitle>
            <DialogDescription>
              Assign {selectedPC?.name} to a student
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="student-id">Student ID</Label>
              <div className="relative">
                <Input
                  id="student-id"
                  placeholder="Enter student ID"
                  value={setInUseForm.studentId}
                  onChange={(e) => setSetInUseForm({...setInUseForm, studentId: e.target.value, studentName: ''})}
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
              {/* Student Search Results */}
              {studentSearchResults.length > 0 && (
                <div className="mt-2 border rounded-md bg-white shadow-lg max-h-40 overflow-y-auto">
                  {studentSearchResults.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => selectStudent(student)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b last:border-b-0"
                    >
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-gray-500">{student.student_id}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="student-name">Student Name</Label>
              <Input
                id="student-name"
                placeholder="Student name will be auto-filled"
                value={setInUseForm.studentName}
                readOnly
                className="bg-gray-50"
              />
            </div>
            
            {/* Time Selection with Hours and Minutes */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hours">Hours</Label>
                <Select 
                  value={setInUseForm.hours.toString()} 
                  onValueChange={(value) => setSetInUseForm({...setInUseForm, hours: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(hour => (
                      <SelectItem key={hour} value={hour.toString()}>
                        {hour} hour{hour !== 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="minutes">Minutes</Label>
                <Select 
                  value={setInUseForm.minutes.toString()} 
                  onValueChange={(value) => setSetInUseForm({...setInUseForm, minutes: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(minute => (
                      <SelectItem key={minute} value={minute.toString()}>
                        {minute} min{minute !== 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Display total time */}
            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              Total time: {formatTime((setInUseForm.hours * 60) + setInUseForm.minutes)}
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSetPCInUse} className="flex-1 btn-energy">
                Set PC In Use
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsSetInUseDialogOpen(false);
                  setSetInUseForm({ studentId: '', studentName: '', hours: 0, minutes: 5 });
                  setStudentSearchResults([]);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit PC Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Computer</DialogTitle>
            <DialogDescription>
              Update computer workstation details
            </DialogDescription>
          </DialogHeader>
          {editingPC && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-pc-name">PC Name</Label>
                <Input
                  id="edit-pc-name"
                  value={editingPC.name}
                  onChange={(e) => setEditingPC({...editingPC, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-pc-row">Row</Label>
                <Input
                  id="edit-pc-row"
                  value={editingPC.row}
                  onChange={(e) => setEditingPC({...editingPC, row: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-pc-status">Status</Label>
                <Select 
                  value={editingPC.status} 
                  onValueChange={(value) => setEditingPC({...editingPC, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="in-use">In Use</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleEditPC} className="flex-1 btn-energy">
                  Update PC
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Computer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this computer? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deletingPC && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Monitor className="h-6 w-6 text-red-600" />
                  <div>
                    <p className="font-medium text-red-900">{deletingPC.name}</p>
                    <p className="text-sm text-red-700">{deletingPC.row}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleDeletePC} 
                  variant="destructive"
                  className="flex-1"
                >
                  Delete PC
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
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

