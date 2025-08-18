import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../../context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Monitor,
  Calendar,
  PieChart,
  Activity,
  Target,
  Zap
} from 'lucide-react';

function Analytics() {
  const { state } = useApp();
  const [timeRange, setTimeRange] = useState('week');
  const [viewType, setViewType] = useState('overview');

  // Generate mock analytics data (in a real app, this would come from the backend)
  const generateAnalyticsData = () => {
    const now = new Date();
    const data = {
      utilization: {
        current: Math.round((state.pcs.filter(pc => pc.status === 'in-use').length / state.pcs.length) * 100),
        trend: '+12%',
        isPositive: true
      },
      peakHours: [
        { hour: '9:00', usage: 85 },
        { hour: '10:00', usage: 92 },
        { hour: '11:00', usage: 88 },
        { hour: '12:00', usage: 45 },
        { hour: '13:00', usage: 78 },
        { hour: '14:00', usage: 95 },
        { hour: '15:00', usage: 89 },
        { hour: '16:00', usage: 82 }
      ],
      weeklyUsage: [
        { day: 'Mon', sessions: 45, hours: 180 },
        { day: 'Tue', sessions: 52, hours: 208 },
        { day: 'Wed', sessions: 48, hours: 192 },
        { day: 'Thu', sessions: 55, hours: 220 },
        { day: 'Fri', sessions: 42, hours: 168 },
        { day: 'Sat', sessions: 28, hours: 112 },
        { day: 'Sun', sessions: 15, hours: 60 }
      ],
      pcPerformance: state.pcs.map(pc => ({
        ...pc,
        utilizationRate: Math.floor(Math.random() * 100),
        avgSessionTime: Math.floor(Math.random() * 120) + 30,
        totalSessions: Math.floor(Math.random() * 50) + 10
      })),
      studentMetrics: {
        totalActive: state.students.length,
        newThisWeek: 8,
        avgSessionTime: 95,
        repeatUsers: 75
      }
    };
    
    return data;
  };

  const analytics = generateAnalyticsData();

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Insights and performance metrics for your computer lab
          </p>
        </div>
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
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lab Utilization</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{analytics.utilization.current}%</p>
                  <div className={`flex items-center text-sm ${
                    analytics.utilization.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {analytics.utilization.isPositive ? 
                      <TrendingUp className="h-3 w-3 mr-1" /> : 
                      <TrendingDown className="h-3 w-3 mr-1" />
                    }
                    {analytics.utilization.trend}
                  </div>
                </div>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Students</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{analytics.studentMetrics.totalActive}</p>
                  <div className="flex items-center text-sm text-green-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{analytics.studentMetrics.newThisWeek}
                  </div>
                </div>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Session</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{analytics.studentMetrics.avgSessionTime}m</p>
                  <div className="flex items-center text-sm text-blue-600">
                    <Clock className="h-3 w-3 mr-1" />
                    Optimal
                  </div>
                </div>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Queue Efficiency</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">94%</p>
                  <div className="flex items-center text-sm text-green-600">
                    <Target className="h-3 w-3 mr-1" />
                    Excellent
                  </div>
                </div>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Peak Hours Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Peak Usage Hours
            </CardTitle>
            <CardDescription>
              Lab utilization throughout the day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.peakHours.map((hour) => (
                <div key={hour.hour} className="flex items-center gap-4">
                  <div className="w-12 text-sm font-medium">{hour.hour}</div>
                  <div className="flex-1">
                    <Progress value={hour.usage} className="h-2" />
                  </div>
                  <div className="w-12 text-sm text-muted-foreground">{hour.usage}%</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Usage Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Weekly Usage Trends
            </CardTitle>
            <CardDescription>
              Sessions and hours by day of week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.weeklyUsage.map((day) => (
                <div key={day.day} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="font-medium">{day.day}</div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <p className="font-semibold">{day.sessions}</p>
                      <p className="text-muted-foreground">Sessions</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">{day.hours}h</p>
                      <p className="text-muted-foreground">Total</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PC Performance Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            PC Performance Analysis
          </CardTitle>
          <CardDescription>
            Individual computer utilization and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.pcPerformance.map((pc) => (
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
                    <span className="text-muted-foreground">Location:</span>
                    <span>{pc.location}</span>
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
                      pc.status === 'available' ? 'text-green-600' :
                      pc.status === 'in-use' ? 'text-blue-600' :
                      'text-yellow-600'
                    }`}>
                      {pc.status}
                    </span>
                  </div>
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
        </CardContent>
      </Card>

      {/* Insights and Recommendations */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Peak Usage Detected</p>
                <p className="text-sm text-blue-700">
                  Highest demand between 2-3 PM. Consider adding more PCs during this time.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <Target className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Efficient Queue Management</p>
                <p className="text-sm text-green-700">
                  Average wait time is under 15 minutes. Queue system is working effectively.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium text-orange-900">Session Length Optimization</p>
                <p className="text-sm text-orange-700">
                  Some sessions exceed 2 hours. Consider implementing time limits during peak hours.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Usage Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Lab A</span>
                  <span className="text-sm font-medium">45%</span>
                </div>
                <Progress value={45} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Lab B</span>
                  <span className="text-sm font-medium">35%</span>
                </div>
                <Progress value={35} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Lab C</span>
                  <span className="text-sm font-medium">20%</span>
                </div>
                <Progress value={20} className="h-2" />
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-medium mb-3">Recommendations</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Lab A shows highest utilization - monitor for overcrowding</li>
                <li>• Lab C has capacity for more students during peak hours</li>
                <li>• Consider redistributing resources based on usage patterns</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

export default Analytics;

