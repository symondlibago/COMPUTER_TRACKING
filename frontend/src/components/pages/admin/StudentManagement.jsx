import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../../context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  Mail,
  IdCard,
  Clock,
  Activity,
  UserCheck,
  UserX
} from 'lucide-react';

function StudentManagement() {
  const { state, dispatch, ActionTypes } = useApp();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newStudent, setNewStudent] = useState({
    name: '',
    studentId: '',
    email: '',
    phone: ''
  });

  const filteredStudents = state.students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddStudent = () => {
    if (newStudent.name && newStudent.studentId && newStudent.email) {
      dispatch({
        type: ActionTypes.ADD_STUDENT,
        payload: {
          id: Date.now(),
          ...newStudent,
          registeredAt: new Date().toISOString(),
          totalSessions: 0,
          totalHours: 0
        }
      });
      setNewStudent({ name: '', studentId: '', email: '', phone: '' });
      setIsAddDialogOpen(false);
    }
  };

  const handleEditStudent = () => {
    if (editingStudent && editingStudent.name && editingStudent.studentId && editingStudent.email) {
      dispatch({
        type: ActionTypes.UPDATE_STUDENT,
        payload: editingStudent
      });
      setEditingStudent(null);
      setIsEditDialogOpen(false);
    }
  };

  const handleDeleteStudent = (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      dispatch({
        type: ActionTypes.REMOVE_STUDENT,
        payload: studentId
      });
    }
  };

  const openEditDialog = (student) => {
    setEditingStudent({ ...student });
    setIsEditDialogOpen(true);
  };

  const getStudentStatus = (student) => {
    // Check if student is currently using a PC
    const currentPC = state.pcs.find(pc => pc.currentUser?.id === student.id);
    if (currentPC) {
      return { status: 'active', pc: currentPC.name };
    }
    
    // Check if student is in queue
    const inQueue = state.queue.find(q => q.studentId === student.id);
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
            <Button className="btn-energy">
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
                  value={newStudent.studentId}
                  onChange={(e) => setNewStudent({...newStudent, studentId: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="student-email">Email Address</Label>
                <Input
                  id="student-email"
                  type="email"
                  placeholder="Enter email address"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="student-phone">Phone Number (Optional)</Label>
                <Input
                  id="student-phone"
                  placeholder="Enter phone number"
                  value={newStudent.phone}
                  onChange={(e) => setNewStudent({...newStudent, phone: e.target.value})}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddStudent} className="flex-1 btn-energy">
                  Register Student
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{state.students.length}</p>
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
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Offline</p>
                <p className="text-2xl font-bold text-gray-600">
                  {state.students.length - state.pcs.filter(pc => pc.currentUser).length - state.queue.length}
                </p>
              </div>
              <UserX className="h-8 w-8 text-gray-500" />
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
                placeholder="Search by name, student ID, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Student List */}
          <div className="space-y-4">
            {filteredStudents.map((student) => {
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
                            {student.studentId}
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {student.email}
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
                        {studentStatus.status === 'offline' && (
                          <Badge variant="secondary">
                            <UserX className="h-3 w-3 mr-1" />
                            Offline
                          </Badge>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(student)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteStudent(student.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Info */}
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Registered</p>
                        <p className="font-medium">
                          {student.registeredAt ? 
                            new Date(student.registeredAt).toLocaleDateString() : 
                            'N/A'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Sessions</p>
                        <p className="font-medium">{student.totalSessions || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Hours</p>
                        <p className="font-medium">{student.totalHours || 0}h</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Phone</p>
                        <p className="font-medium">{student.phone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filteredStudents.length === 0 && (
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
                  value={editingStudent.studentId}
                  onChange={(e) => setEditingStudent({...editingStudent, studentId: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-student-email">Email Address</Label>
                <Input
                  id="edit-student-email"
                  type="email"
                  value={editingStudent.email}
                  onChange={(e) => setEditingStudent({...editingStudent, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-student-phone">Phone Number</Label>
                <Input
                  id="edit-student-phone"
                  value={editingStudent.phone || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, phone: e.target.value})}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleEditStudent} className="flex-1 btn-energy">
                  Update Student
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
    </motion.div>
  );
}

export default StudentManagement;

