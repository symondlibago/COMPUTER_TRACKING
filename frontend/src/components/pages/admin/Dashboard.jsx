import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../../context/AppContext';
import { apiGet } from '../../../utils/apiUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Monitor, 
  Users, 
  Clock, 
  Activity,
  CheckCircle,
  Wrench,
  BarChart3,
  RefreshCw,
  Calendar,
  TrendingUp,
  TrendingDown,
  PieChart,
  Target,
  Zap,
  Computer
} from 'lucide-react';

function Dashboard() {
  const { state } = useApp();
  const [refreshTime, setRefreshTime] = useState(new Date());
  const [timeRange, setTimeRange] = useState('week');
  const [viewType, setViewType] = useState('overview');
  const [pcs, setPcs] = useState([]);
  const [pcPerformanceData, setPcPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [performanceLoading, setPerformanceLoading] = useState(true);

  const fetchPCs = async () => {
    try {
      setLoading(true);
      const response = await apiGet('/pcs');
      if (response.ok) {
        const data = await response.json();
        setPcs(data.data || []);
      } else {
        console.error('Failed to fetch PCs');
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPCPerformanceAnalytics = async () => {
    try {
      setPerformanceLoading(true);
      const response = await apiGet('/pc-usage/performance-analytics');
      if (response.ok) {
        const data = await response.json();
        setPcPerformanceData(data.data || []);
      } else {
        console.error('Failed to fetch PC performance analytics');
      }
    } catch (error) {
      console.error('Fetch PC performance analytics error:', error);
    } finally {
      setPerformanceLoading(false);
    }
  };

  useEffect(() => {
    fetchPCs();
    fetchPCPerformanceAnalytics();
    const interval = setInterval(() => {
      fetchPCs();
      fetchPCPerformanceAnalytics();
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);
  
  // Calculate statistics
  const stats = {
    totalPCs: pcs.length,
    activePCs: pcs.filter(pc => pc.status === 'active').length,
    inUsePCs: pcs.filter(pc => pc.status === 'in-use').length,
    maintenancePCs: pcs.filter(pc => pc.status === 'maintenance').length,
    totalStudents: state.students.length,
    queueLength: state.queue.length,
    utilizationRate: pcs.length > 0 ? Math.round((pcs.filter(pc => pc.status === 'in-use').length / pcs.length) * 100) : 0
  };

  const getUtilizationColor = (rate) => {
    if (rate >= 80) return 'text-red-600';
    if (rate >= 60) return 'text-orange-600';
    if (rate >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUtilizationBg = (rate) => {
    if (rate >= 80) return 'bg-red-100';
    if (rate >= 60) return 'bg-orange-100';
    if (rate >= 40) return 'bg-yellow-100';
    return 'bg-green-100';
  };

  const handleRefresh = () => {
    setRefreshTime(new Date());
    fetchPCs();
    fetchPCPerformanceAnalytics();
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
          <h1 className="text-3xl font-bold">Dashboard & Analytics</h1>
          <p className="text-muted-foreground">
            Computer lab monitoring, management overview and analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
              </SelectContent>
            </Select>
            <Select value={viewType} onValueChange={setViewType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
                <SelectItem value="trends">Trends</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.activePCs}</div>
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

      {/* Charts and Detailed Analytics */}
      <div className="grid lg:grid-cols-2 gap-6">



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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {pcs.map((pc) => (
              <div
                key={pc.id}
                className="p-3 border border-border rounded-lg hover:shadow-md transition-all flex flex-col items-center text-center"
              >
                <Monitor className={`h-8 w-8 mb-2 ${pc.status === 'active' ? 'text-green-500' : 'text-blue-500'}`} />
                <h4 className="font-medium text-sm">{pc.name}</h4>
                <p className="text-xs text-muted-foreground">Row: {pc.row}</p>
                <div className={`mt-2 text-xs px-2 py-1 rounded-full inline-block ${
                  pc.status === 'active' ? 'bg-green-100 text-green-800' :
                  pc.status === 'in-use' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {pc.status.charAt(0).toUpperCase() + pc.status.slice(1)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* PC Performance Analysis - Updated with Real Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            PC Performance Analysis
          </CardTitle>
          <CardDescription>
            Individual computer utilization and performance metrics based on real usage data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {performanceLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading performance data...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pcPerformanceData.map((pc) => (
                <motion.div
                  key={pc.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-4 border rounded-lg ${getUtilizationBg(pc.utilizationRate)}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{pc.name}</h4>
                    <div className={`text-sm font-bold ${getUtilizationColor(pc.utilizationRate)}`}>
                      {pc.utilizationRate}%
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Row:</span>
                      <span> {pc.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg Session:</span>
                      <span>{pc.avgSessionTime}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Sessions:</span>
                      <span>{pc.totalSessions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className={`capitalize ${
                        pc.status === 'active' ? 'text-green-600' :
                        pc.status === 'in-use' ? 'text-blue-600' :
                        'text-yellow-600'
                      }`}>
                        {pc.status}
                      </span>
                    </div>
                    {pc.isCurrentlyInUse && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Current Session:</span>
                        <span className="text-blue-600">{pc.currentSessionDuration}m</span>
                      </div>
                    )}
                    {pc.highestSessionTime > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Highest Session:</span>
                        <span className="text-orange-600">{pc.highestSessionTime}m</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between text-xs">
                      <span>Utilization Rate</span>
                      <span>{pc.utilizationRate}%</span>
                    </div>
                    <Progress value={pc.utilizationRate} className="h-1 mt-1" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          
          {!performanceLoading && pcPerformanceData.length === 0 && (
            <div className="text-center py-12">
              <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No performance data available</h3>
              <p className="text-muted-foreground">
                Performance analytics will appear once PCs have been used.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default Dashboard;

