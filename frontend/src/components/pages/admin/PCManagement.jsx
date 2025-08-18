import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../../context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Monitor,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Wrench,
  Activity,
  MapPin,
  Cpu,
  Settings
} from 'lucide-react';

function PCManagement() {
  const { state, dispatch, ActionTypes } = useApp();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPC, setEditingPC] = useState(null);
  const [newPC, setNewPC] = useState({
    name: '',
    location: '',
    specs: '',
    status: 'available'
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'text-green-500 bg-green-100';
      case 'in-use': return 'text-blue-500 bg-blue-100';
      case 'maintenance': return 'text-yellow-500 bg-yellow-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available': return CheckCircle;
      case 'in-use': return Activity;
      case 'maintenance': return Wrench;
      default: return XCircle;
    }
  };

  const handleAddPC = () => {
    if (newPC.name && newPC.location && newPC.specs) {
      dispatch({
        type: ActionTypes.ADD_PC,
        payload: {
          id: `PC-${String(state.pcs.length + 1).padStart(3, '0')}`,
          ...newPC
        }
      });
      setNewPC({ name: '', location: '', specs: '', status: 'available' });
      setIsAddDialogOpen(false);
    }
  };

  const handleEditPC = () => {
    if (editingPC && editingPC.name && editingPC.location && editingPC.specs) {
      dispatch({
        type: ActionTypes.UPDATE_PC,
        payload: editingPC
      });
      setEditingPC(null);
      setIsEditDialogOpen(false);
    }
  };

  const handleDeletePC = (pcId) => {
    if (window.confirm('Are you sure you want to delete this PC?')) {
      dispatch({
        type: ActionTypes.REMOVE_PC,
        payload: pcId
      });
    }
  };

  const handleStatusChange = (pcId, newStatus) => {
    dispatch({
      type: ActionTypes.UPDATE_PC_STATUS,
      payload: { pcId, status: newStatus }
    });
  };

  const openEditDialog = (pc) => {
    setEditingPC({ ...pc });
    setIsEditDialogOpen(true);
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
          <h1 className="text-3xl font-bold">PC Management</h1>
          <p className="text-muted-foreground">
            Manage computer workstations and their configurations
          </p>
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
                  placeholder="e.g., PC-007"
                  value={newPC.name}
                  onChange={(e) => setNewPC({...newPC, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="pc-location">Location</Label>
                <Input
                  id="pc-location"
                  placeholder="e.g., Lab A"
                  value={newPC.location}
                  onChange={(e) => setNewPC({...newPC, location: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="pc-specs">Specifications</Label>
                <Input
                  id="pc-specs"
                  placeholder="e.g., Intel i7, 16GB RAM"
                  value={newPC.specs}
                  onChange={(e) => setNewPC({...newPC, specs: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="pc-status">Initial Status</Label>
                <Select value={newPC.status} onValueChange={(value) => setNewPC({...newPC, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total PCs</p>
                <p className="text-2xl font-bold">{state.pcs.length}</p>
              </div>
              <Monitor className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-green-600">
                  {state.pcs.filter(pc => pc.status === 'available').length}
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
                  {state.pcs.filter(pc => pc.status === 'in-use').length}
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
                <p className="text-sm font-medium text-muted-foreground">Maintenance</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {state.pcs.filter(pc => pc.status === 'maintenance').length}
                </p>
              </div>
              <Wrench className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PC List */}
      <Card>
        <CardHeader>
          <CardTitle>Computer Workstations</CardTitle>
          <CardDescription>
            Manage all computer workstations in the lab
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.pcs.map((pc) => {
              const StatusIcon = getStatusIcon(pc.status);
              return (
                <motion.div
                  key={pc.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  className="border border-border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{pc.name}</h3>
                    <StatusIcon className={`h-5 w-5 ${getStatusColor(pc.status).split(' ')[0]}`} />
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{pc.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-muted-foreground" />
                      <span>{pc.specs}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(pc.status)}`}>
                      {pc.status === 'in-use' && pc.currentUser ? 
                        `${pc.currentUser.name}` : 
                        pc.status.charAt(0).toUpperCase() + pc.status.slice(1)
                      }
                    </span>
                    
                    <div className="flex gap-1">
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
                        onClick={() => handleDeletePC(pc.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {pc.status !== 'in-use' && (
                    <div className="pt-2 border-t">
                      <Label className="text-xs">Change Status:</Label>
                      <Select 
                        value={pc.status} 
                        onValueChange={(value) => handleStatusChange(pc.id, value)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

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
                <Label htmlFor="edit-pc-location">Location</Label>
                <Input
                  id="edit-pc-location"
                  value={editingPC.location}
                  onChange={(e) => setEditingPC({...editingPC, location: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-pc-specs">Specifications</Label>
                <Input
                  id="edit-pc-specs"
                  value={editingPC.specs}
                  onChange={(e) => setEditingPC({...editingPC, specs: e.target.value})}
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
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    {editingPC.status === 'in-use' && (
                      <SelectItem value="in-use">In Use</SelectItem>
                    )}
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
    </motion.div>
  );
}

export default PCManagement;

