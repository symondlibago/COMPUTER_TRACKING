import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../../context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import API_BASE_URL from '../Config';
import { apiGet, apiPost, apiPut, apiDelete } from '../../../utils/apiUtils';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  IdCard,
  Clock,
  Activity,
  UserCheck,
  UserX,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';

function StudentManagement() {
  const { state, dispatch, ActionTypes } = useApp();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorTitle, setErrorTitle] = useState('Error');
  const [successMessage, setSuccessMessage] = useState('');
  const [successTitle, setSuccessTitle] = useState('Success');
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    student_id: '',
    password: ''
  });

  // Show error modal
  const showError = (title, message) => {
    setErrorTitle(title);
    setErrorMessage(message);
    setIsErrorModalOpen(true);
  };

  // Show success modal
  const showSuccess = (title, message) => {
    setSuccessTitle(title);
    setSuccessMessage(message);
    setIsSuccessModalOpen(true);
  };

  // Fetch students from API
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await apiGet('/students');
      const data = await response.json();
      
      if (data.success) {
        setStudents(data.data);
      } else {
        console.error('Failed to fetch students:', data.message);
        showError('Failed to Load Students', data.message || 'Unable to fetch student data from the server.');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      showError('Connection Error', 'Unable to connect to the server. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddStudent = async () => {
    if (newStudent.name && newStudent.student_id && newStudent.password) {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/students`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newStudent)
        });
        
        const data = await response.json();
        
        if (data.success) {
          setNewStudent({ name: '', student_id: '', password: '' });
          setIsAddDialogOpen(false);
          fetchStudents(); // Refresh the list
          showSuccess('Student Registered', `${newStudent.name} has been successfully registered with Student ID: ${newStudent.student_id}`);
        } else {
          // Handle specific error cases
          if (data.errors && data.errors.student_id) {
            showError('Student Already Registered', `A student with ID "${newStudent.student_id}" is already registered in the system. Please use a different Student ID.`);
          } else {
            showError('Registration Failed', data.message || 'Failed to register student. Please try again.');
          }
        }
      } catch (error) {
        console.error('Error adding student:', error);
        showError('Connection Error', 'Unable to connect to the server. Please check your internet connection and try again.');
      } finally {
        setLoading(false);
      }
    } else {
      showError('Missing Information', 'Please fill in all required fields: Name, Student ID, and Password.');
    }
  };

  const handleEditStudent = async () => {
    if (editingStudent && editingStudent.name && editingStudent.student_id) {
      setLoading(true);
      try {
        const updateData = {
          name: editingStudent.name,
          student_id: editingStudent.student_id
        };
        
        // Only include password if it's been changed
        if (editingStudent.password && editingStudent.password.trim() !== '') {
          updateData.password = editingStudent.password;
        }

        const response = await fetch(`${API_BASE_URL}/students/${editingStudent.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData)
        });
        
        const data = await response.json();
        
        if (data.success) {
          setEditingStudent(null);
          setIsEditDialogOpen(false);
          fetchStudents(); // Refresh the list
          showSuccess('Student Updated', `${editingStudent.name}'s information has been successfully updated.`);
        } else {
          // Handle specific error cases
          if (data.errors && data.errors.student_id) {
            showError('Student Already Registered', `A student with ID "${editingStudent.student_id}" is already registered in the system. Please use a different Student ID.`);
          } else {
            showError('Update Failed', data.message || 'Failed to update student information. Please try again.');
          }
        }
      } catch (error) {
        console.error('Error updating student:', error);
        showError('Connection Error', 'Unable to connect to the server. Please check your internet connection and try again.');
      } finally {
        setLoading(false);
      }
    } else {
      showError('Missing Information', 'Please fill in all required fields: Name and Student ID.');
    }
  };

  const confirmDeleteStudent = (student) => {
    setStudentToDelete(student);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/students/${studentToDelete.id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsDeleteModalOpen(false);
        setStudentToDelete(null);
        fetchStudents(); // Refresh the list
        showSuccess('Student Deleted', `${studentToDelete.name} has been successfully removed from the system.`);
      } else {
        showError('Delete Failed', data.message || 'Failed to delete student. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      showError('Connection Error', 'Unable to connect to the server. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (student) => {
    setEditingStudent({ ...student, password: '' }); // Don't pre-fill password
    setIsEditDialogOpen(true);
  };

  const getStudentStatus = (student) => {
    // Check if student is currently using a PC
    const currentPC = state.pcs.find(pc => pc.currentUser?.student_id === student.student_id);
    if (currentPC) {
      return { status: 'active', pc: currentPC.name };
    }
    
    // Check if student is in queue
    const inQueue = state.queue.find(q => q.studentId === student.student_id);
    if (inQueue) {
      return { status: 'queued', position: state.queue.findIndex(q => q.id === inQueue.id) + 1 };
    }
    
    return { status: 'offline' };
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
          <h1 className="text-3xl font-bold">Student Management</h1>
          <p className="text-muted-foreground">
            Manage student registrations and accounts
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-energy" disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              Register Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New Student</DialogTitle>
              <DialogDescription>
                Add a new student to the computer lab system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="student-name">Full Name</Label>
                <Input
                  id="student-name"
                  placeholder="Enter student's full name"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="student-id">Student ID</Label>
                <Input
                  id="student-id"
                  placeholder="Enter student ID"
                  value={newStudent.student_id}
                  onChange={(e) => setNewStudent({...newStudent, student_id: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="student-password">Password</Label>
                <div className="relative">
                  <Input
                    id="student-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={newStudent.password}
                    onChange={(e) => setNewStudent({...newStudent, password: e.target.value})}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddStudent} className="flex-1 btn-energy" disabled={loading}>
                  {loading ? 'Adding...' : 'Register Student'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                <p className="text-2xl font-bold text-green-600">
                  {state.pcs.filter(pc => pc.currentUser).length}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Queue</p>
                <p className="text-2xl font-bold text-orange-600">
                  {state.queue.length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Student Directory</CardTitle>
          <CardDescription>
            Search and manage all registered students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or student ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Student List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading students...</p>
              </div>
            ) : filteredStudents.map((student) => {
              const studentStatus = getStudentStatus(student);
              return (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{student.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <IdCard className="h-4 w-4" />
                            {student.student_id}
                          </div>
                        </div>
                        
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {/* Status Badge */}
                      <div className="text-right">
                        {studentStatus.status === 'active' && (
                          <Badge className="bg-green-100 text-green-800">
                            <Activity className="h-3 w-3 mr-1" />
                            Using {studentStatus.pc}
                          </Badge>
                        )}
                        {studentStatus.status === 'queued' && (
                          <Badge className="bg-orange-100 text-orange-800">
                            <Clock className="h-3 w-3 mr-1" />
                            Queue #{studentStatus.position}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(student)}
                          disabled={loading}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => confirmDeleteStudent(student)}
                          className="text-destructive hover:text-destructive"
                          disabled={loading}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Info */}
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Registered</p>
                        <p className="font-medium">
                          {student.created_at ? 
                            new Date(student.created_at).toLocaleDateString() : 
                            'N/A'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Role</p>
                        <p className="font-medium">Student</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filteredStudents.length === 0 && !loading && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No students found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search terms.' : 'Register your first student to get started.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Student Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update student information
            </DialogDescription>
          </DialogHeader>
          {editingStudent && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-student-name">Full Name</Label>
                <Input
                  id="edit-student-name"
                  value={editingStudent.name}
                  onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-student-id">Student ID</Label>
                <Input
                  id="edit-student-id"
                  value={editingStudent.student_id}
                  onChange={(e) => setEditingStudent({...editingStudent, student_id: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-student-password">New Password (leave blank to keep current)</Label>
                <div className="relative">
                  <Input
                    id="edit-student-password"
                    type={showEditPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={editingStudent.password || ''}
                    onChange={(e) => setEditingStudent({...editingStudent, password: e.target.value})}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                  >
                    {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleEditStudent} className="flex-1 btn-energy" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Student'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-red-900">Delete Student</DialogTitle>
                <DialogDescription className="text-red-700">
                  This action cannot be undone
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 leading-relaxed">
              Are you sure you want to delete <strong>{studentToDelete?.name}</strong> (ID: {studentToDelete?.student_id})? 
              This will permanently remove the student from the system and cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteStudent}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Student'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Modal */}
      <Dialog open={isErrorModalOpen} onOpenChange={setIsErrorModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-red-900">{errorTitle}</DialogTitle>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 leading-relaxed">{errorMessage}</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              onClick={() => setIsErrorModalOpen(false)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-green-900">{successTitle}</DialogTitle>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 leading-relaxed">{successMessage}</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              onClick={() => setIsSuccessModalOpen(false)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export default StudentManagement;

