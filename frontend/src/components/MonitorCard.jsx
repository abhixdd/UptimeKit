import { CheckCircle, AlertTriangle, XCircle, Clock, ExternalLink, Trash2, Activity, MoreVertical, Pause, Play, Edit, TrendingUp, History, Globe, Network, Wifi } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Progress } from './ui/progress';
import MonitorHistoryDialog from './MonitorHistoryDialog';
import EditMonitorDialog from './EditMonitorDialog';
import DeleteMonitorDialog from './DeleteMonitorDialog';
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { parseUTC } from '../lib/timezone';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const getStatusInfo = (status) => {
  switch (status) {
    case 'up':
      return { 
        bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20', 
        textColor: 'text-emerald-600 dark:text-emerald-400',
        icon: CheckCircle,
        label: 'Operational'
      };
    case 'slow':
      return { 
        bgColor: 'bg-amber-500/10 dark:bg-amber-500/20', 
        textColor: 'text-amber-600 dark:text-amber-400',
        icon: AlertTriangle,
        label: 'Degraded'
      };
    case 'down':
      return { 
        bgColor: 'bg-red-500/10 dark:bg-red-500/20', 
        textColor: 'text-red-600 dark:text-red-400',
        icon: XCircle,
        label: 'Down'
      };
    default:
      return { 
        bgColor: 'bg-blue-500/10 dark:bg-blue-500/20', 
        textColor: 'text-blue-600 dark:text-blue-400 animate-pulse',
        icon: Clock,
        label: 'Collecting data...'
      };
  }
};

const MonitorCard = ({ monitor, onDelete }) => {
  const [uptimePercentage, setUptimePercentage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUptime = async () => {
      try {
        const response = await axios.get(`/api/monitors/${monitor.id}/uptime`);
        setUptimePercentage(response.data.uptime);
      } catch (error) {
        console.error('Error fetching uptime:', error);
        setUptimePercentage(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUptime();
  }, [monitor.id]);

  const { data: uptimeChartData = [] } = useQuery({
    queryKey: ['monitor-uptime-chart', monitor.id],
    queryFn: () => axios.get(`/api/monitors/${monitor.id}/chart/uptime`).then(res => res.data),
    refetchInterval: 60000,
  });

  const { data: responseTimeChartData = [] } = useQuery({
    queryKey: ['monitor-response-time-chart', monitor.id],
    queryFn: () => axios.get(`/api/monitors/${monitor.id}/chart/response-time`).then(res => res.data),
    refetchInterval: 60000,
  });

  const pauseMutation = useMutation({
    mutationFn: (paused) => axios.patch(`/api/monitors/${monitor.id}/pause`, { paused }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
    },
  });

  const handleTogglePause = () => {
    pauseMutation.mutate(!monitor.paused);
  };

  const { bgColor, textColor, icon: StatusIcon, label } = getStatusInfo(monitor.status);

  const getResponseTimeColor = (time) => {
    if (time < 500) return 'text-emerald-600 dark:text-emerald-400';
    if (time < 2000) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const truncateText = (text, maxWords = 8) => {
    const words = text.split(/\s+/);
    if (words.length > maxWords) {
      return words.slice(0, maxWords).join(' ') + '...';
    }
    return text;
  };

  return (
    <Card className={`group relative hover:shadow-xl transition-all duration-300 border-l-4 ${monitor.paused === 1 ? 'opacity-60' : ''}`} style={{ borderLeftColor: monitor.status === 'up' ? '#10b981' : monitor.status === 'slow' ? '#f59e0b' : '#ef4444' }}>
      <CardHeader className="p-4 pb-0">
        <div className="flex items-start justify-between w-full">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-primary flex-shrink-0" />
              <h3 className="font-semibold text-lg truncate">{truncateText(monitor.name)}</h3>
              <Badge variant="outline" className="flex-shrink-0 gap-1">
                {(monitor.type === 'dns' || monitor.type?.toLowerCase() === 'dns') ? (
                  <>
                    <Network className="h-3 w-3" />
                    DNS
                  </>
                ) : (monitor.type === 'icmp' || monitor.type?.toLowerCase() === 'icmp') ? (
                  <>
                    <Wifi className="h-3 w-3" />
                    ICMP
                  </>
                ) : (
                  <>
                    <Globe className="h-3 w-3" />
                    HTTP
                  </>
                )}
              </Badge>
              {monitor.paused === 1 && (
                <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 dark:text-amber-300 ml-auto flex-shrink-0">Paused</Badge>
              )}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <a 
                  href={monitor.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 truncate group/link"
                >
                  <span className="truncate">{truncateText(monitor.url)}</span>
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity flex-shrink-0" />
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p>{monitor.url}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 transition-opacity flex-shrink-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="cursor-pointer" onClick={() => setHistoryOpen(true)}>
                <History className="h-4 w-4 mr-2" />
                View History
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => setEditOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Monitor
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={handleTogglePause}>
                {monitor.paused ? (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Resume Monitoring
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause Monitoring
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Monitor
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-3">
        <div className={`flex items-center justify-between p-3 rounded-lg ${bgColor}`}>
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${textColor}`} />
            <span className={`font-semibold ${textColor}`}>{label}</span>
          </div>
          <Badge className={`${bgColor} ${textColor} border-0`}>
            {monitor.status === 'unknown' ? '⏳ WAITING' : monitor.status.toUpperCase()}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-medium">Uptime</span>
            {loading ? (
              <span className="text-xs text-muted-foreground animate-pulse">Loading...</span>
            ) : uptimePercentage !== null ? (
              <span className={`font-bold ${uptimePercentage >= 99 ? 'text-emerald-600 dark:text-emerald-400' : uptimePercentage >= 95 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                {uptimePercentage}%
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">No data</span>
            )}
          </div>
          <Progress 
            value={uptimePercentage || 0} 
            className="h-2" 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Response Time</p>
            <p className={`text-2xl font-bold ${getResponseTimeColor(monitor.response_time)}`}>
              {monitor.response_time}<span className="text-sm ml-1">ms</span>
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Last Check</p>
            <p className="text-sm font-semibold text-foreground">
              {formatDistanceToNow(parseUTC(monitor.last_checked), { addSuffix: true })}
            </p>
          </div>
        </div>

        {/* Average Stats */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-muted/20 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-muted-foreground font-medium">Avg Response</p>
            <p className="text-sm font-bold text-primary mt-1">
              {responseTimeChartData.length > 0 
                ? Math.round(responseTimeChartData.reduce((acc, d) => acc + d.avgResponse, 0) / responseTimeChartData.length)
                : monitor.response_time
              }ms
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground font-medium">Min Response</p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {responseTimeChartData.length > 0 
                ? Math.min(...responseTimeChartData.map(d => d.avgResponse)).toFixed(0)
                : monitor.response_time
              }ms
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground font-medium">Max Response</p>
            <p className="text-sm font-bold text-red-600 dark:text-red-400 mt-1">
              {responseTimeChartData.length > 0 
                ? Math.max(...responseTimeChartData.map(d => d.avgResponse)).toFixed(0)
                : monitor.response_time
              }ms
            </p>
          </div>
        </div>

        {/* Uptime Chart */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-3">24-Hour Uptime</p>
          {uptimeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart 
                data={uptimeChartData}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id={`uptimeGradient-${monitor.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="time" 
                  className="text-xs" 
                  tick={{ fontSize: 9 }}
                  interval="preserveStartEnd"
                  minTickGap={30}
                />
                <YAxis 
                  domain={[0, 100]} 
                  className="text-xs"
                  tick={{ fontSize: 10 }}
                  width={35}
                />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                  formatter={(value) => `${value.toFixed(1)}%`}
                />
                <Area 
                  type="monotone" 
                  dataKey="uptime" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fill={`url(#uptimeGradient-${monitor.id})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
              <p>Collecting data...</p>
            </div>
          )}
        </div>
      </CardContent>
      <EditMonitorDialog open={editOpen} onOpenChange={setEditOpen} monitor={monitor} />
      <MonitorHistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} monitor={monitor} />
      <DeleteMonitorDialog open={deleteOpen} onOpenChange={setDeleteOpen} monitor={monitor} />
    </Card>
  );
};

export default MonitorCard;