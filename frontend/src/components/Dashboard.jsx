import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';
import MonitorCard from './MonitorCard';
import AddMonitorDialog from './AddMonitorDialog';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Activity, Moon, Sun, RefreshCw, TrendingUp, TrendingDown, CheckCircle2, XCircle, AlertTriangle, Menu, X } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';

const Dashboard = ({ darkMode, setDarkMode }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: monitors = [], isLoading, error, refetch } = useQuery({
    queryKey: ['monitors'],
    queryFn: () => axios.get('/api/monitors').then(res => res.data),
    refetchInterval: 30000,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['monitor-uptime'] });
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const deleteMonitorMutation = useMutation({
    mutationFn: (id) => axios.delete(`/api/monitors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
    },
    onError: (error) => {
      console.error('Error deleting monitor:', error);
    },
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this monitor?')) {
      deleteMonitorMutation.mutate(id);
    }
  };

  // Aggregate statistics
  const stats = {
    total: monitors.length,
    up: monitors.filter(m => m.status === 'up').length,
    down: monitors.filter(m => m.status === 'down').length,
    slow: monitors.filter(m => m.status === 'slow').length,
    avgResponseTime: monitors.length > 0 
      ? Math.round(monitors.reduce((acc, m) => acc + m.response_time, 0) / monitors.length)
      : 0,
  };

  stats.issues = stats.down + stats.slow;

  const computePercentile = (arr, p) => {
    if (!arr || arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    if (lower === upper) return sorted[lower];
    const weight = idx - lower;
    return Math.round(sorted[lower] * (1 - weight) + sorted[upper] * weight);
  };

  const responseTimes = monitors.map(m => typeof m.response_time === 'number' ? m.response_time : 0).filter(x => x > 0);
  stats.p95Response = computePercentile(responseTimes, 95) || 0;
  const uptimePercent = monitors.length > 0 ? (stats.up / stats.total) * 100 : 0;
  const issuesPercent = monitors.length > 0 ? (stats.issues / stats.total) * 100 : 0;
  const maxLatency = 2000;
  const latencyNormalized = Math.max(0, Math.min(1, 1 - (stats.p95Response / maxLatency)));
  const weights = { uptime: 0.5, issues: 0.3, latency: 0.2 };
  const healthRaw = monitors.length > 0 ? (
    (uptimePercent / 100) * weights.uptime
    + (1 - (issuesPercent / 100)) * weights.issues
    + latencyNormalized * weights.latency
  ) : null;
  stats.healthScore = healthRaw === null ? null : Math.round(healthRaw * 100);

  const uptime = monitors.length > 0 ? ((stats.up / stats.total) * 100).toFixed(1) : 0;

  const getFilteredMonitors = () => {
    switch(activeTab) {
      case 'up':
        return monitors.filter(m => m.status === 'up');
      case 'down':
        return monitors.filter(m => m.status === 'down');
      case 'slow':
        return monitors.filter(m => m.status === 'slow');
      default:
        return monitors;
    }
  };

  const filteredMonitors = getFilteredMonitors();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading monitors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingDown className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Error Loading Monitors</h3>
              <p className="text-muted-foreground mb-4">Unable to connect to the backend server</p>
              <Button onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  UptimeKit
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Monitor your services in real-time</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh monitors</TooltipContent>
              </Tooltip>

              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                <Moon className="h-4 w-4" />
              </div>

              <AddMonitorDialog />
            </div>

            <div className="md:hidden flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh monitors</TooltipContent>
              </Tooltip>

              <AddMonitorDialog />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="h-9 w-9 p-0"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  <span className="text-sm font-medium">Dark Mode</span>
                </div>
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              </div>
            </div>
          )}
        </div>
      </div>

      {monitors.length > 0 && (
        <div className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Total Monitors</p>
                    <p className="text-3xl font-bold">{stats.total}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Operational</p>
                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.up}</p>
                    <Progress value={(stats.up / stats.total) * 100} className="mt-2 h-1.5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Down</p>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.down}</p>
                    <Progress value={(stats.down / stats.total) * 100} className="mt-2 h-1.5 bg-red-100 dark:bg-red-950 [&>div]:bg-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Uptime</p>
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-3xl font-bold">{uptime}%</p>
                      {uptime >= 99 ? (
                        <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <Progress value={parseFloat(uptime)} className="mt-2 h-1.5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Health Score</p>
                    {stats.healthScore === null ? (
                      <p className="text-3xl font-bold">—</p>
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <p className={`text-3xl font-bold ${stats.healthScore >= 90 ? 'text-emerald-600 dark:text-emerald-400' : stats.healthScore >= 75 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>{stats.healthScore}</p>
                        <p className="text-sm ml-1 align-baseline">/100</p>
                      </div>
                    )}
                    <div className="mt-2">
                      <Progress value={stats.healthScore || 0} className="h-1.5" />
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">{stats.healthScore === null ? 'No monitors' : `${uptimePercent.toFixed(1)}% uptime · ${stats.p95Response}ms P95 · ${stats.issues} issues`}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          Health Score = 50% uptime + 30% issue count + 20% latency (P95)
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {monitors.length === 0 ? (
          <div className="text-center py-16">
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-12 pb-12">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center">
                  <Activity className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold mb-3">No Monitors Yet</h2>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Start monitoring your websites and services by adding your first monitor.
                </p>
                <div className="flex justify-center">
                  <AddMonitorDialog />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-6">
              <TabsList className="grid w-full max-w-md grid-cols-4">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  All
                  <Badge variant="secondary" className="ml-1">{stats.total}</Badge>
                </TabsTrigger>
                <TabsTrigger value="up" className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Up
                  <Badge variant="secondary" className="ml-1 bg-emerald-100 dark:bg-emerald-950">{stats.up}</Badge>
                </TabsTrigger>
                <TabsTrigger value="slow" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Slow
                  <Badge variant="secondary" className="ml-1 bg-amber-100 dark:bg-amber-950">{stats.slow}</Badge>
                </TabsTrigger>
                <TabsTrigger value="down" className="flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Down
                  <Badge variant="secondary" className="ml-1 bg-red-100 dark:bg-red-950">{stats.down}</Badge>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-6">
              {filteredMonitors.length === 0 ? (
                <Card>
                  <CardContent className="pt-12 pb-12 text-center">
                    <p className="text-muted-foreground">No monitors in this category</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                  {filteredMonitors.map((monitor) => (
                    <MonitorCard 
                      key={monitor.id} 
                      monitor={monitor} 
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Dashboard;