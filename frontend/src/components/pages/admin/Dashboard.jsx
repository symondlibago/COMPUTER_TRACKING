import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../../context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Monitor, 
  Users, 
  Clock, 
  Activity,
  CheckCircle,
  Wrench,
  BarChart3,
  RefreshCw
} from 'lucide-react';

function Dashboard() {
  const { state } = useApp();
  const [refreshTime, setRefreshTime] = useState(new Date());
  
  // Calculate statistics
  const stats = {
    totalPCs: state.pcs.length,
    availablePCs: state.pcs.filter(pc => pc.status === 'available').length,
    inUsePCs: state.pcs.filter(pc => pc.status === 'in-use').length,
    maintenancePCs: state.pcs.filter(pc => pc.status === 'maintenance').length,
    totalStudents: state.students.length,
    queueLength: state.queue.length,
    utilizationRate: state.pcs.length > 0 ? Math.round((state.pcs.filter(pc => pc.status === 'in-use').length / state.pcs.length) * 100) : 0
  };

  const handleRefresh = () => {
    setRefreshTime(new Date());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Computer lab monitoring and management overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Last updated: {refreshTime.toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="btn-energy"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total PCs</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPCs}</div>
            <p className="text-xs text-muted-foreground">
              Computer workstations
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.availablePCs}</div>
            <p className="text-xs text-muted-foreground">
              Ready for use
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Use</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.inUsePCs}</div>
            <p className="text-xs text-muted-foreground">
              Currently occupied
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.queueLength}</div>
            <p className="text-xs text-muted-foreground">
              Students waiting
            </p>
          </CardContent>
        </Card>
      </div>

      {/* PC Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            PC Status Overview
          </CardTitle>
          <CardDescription>
            Real-time status of all computer workstations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.pcs.map((pc) => (
              <div
                key={pc.id}
                className="p-4 border border-border rounded-lg hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{pc.name}</h4>
                  <div className={`h-3 w-3 rounded-full ${
                    pc.status === 'available' ? 'bg-green-500' :
                    pc.status === 'in-use' ? 'bg-blue-500' :
                    'bg-yellow-500'
                  }`} />
                </div>
                <p className="text-sm text-muted-foreground mb-1">{pc.location}</p>
                <p className="text-xs text-muted-foreground mb-2">{pc.specs}</p>
                <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                  pc.status === 'available' ? 'bg-green-100 text-green-800' :
                  pc.status === 'in-use' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {pc.status === 'in-use' && pc.currentUser ? 
                    `${pc.currentUser.name}` : 
                    pc.status.charAt(0).toUpperCase() + pc.status.slice(1)
                  }
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Dashboard;

