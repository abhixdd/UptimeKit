import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, Clock } from 'lucide-react';

const MonitorChartsDialog = ({ monitor, open, onOpenChange }) => {
  const { data: uptimeChartData = [] } = useQuery({
    queryKey: ['monitor-uptime-chart', monitor?.id],
    queryFn: () => axios.get(`/api/monitors/${monitor.id}/chart/uptime`).then(res => res.data),
    enabled: !!monitor && open,
    refetchInterval: 60000,
  });

  const { data: responseTimeChartData = [] } = useQuery({
    queryKey: ['monitor-response-time-chart', monitor?.id],
    queryFn: () => axios.get(`/api/monitors/${monitor.id}/chart/response-time`).then(res => res.data),
    enabled: !!monitor && open,
    refetchInterval: 60000,
  });

  if (!monitor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{monitor.name} - Performance Charts (24h)</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Uptime Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
                Uptime Percentage
              </CardTitle>
            </CardHeader>
            <CardContent>
              {uptimeChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={uptimeChartData}>
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
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      className="text-xs"
                      tick={{ fontSize: 10 }}
                    />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
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
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <p>Collecting uptime data...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Response Time Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-primary" />
                Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {responseTimeChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={responseTimeChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="time" 
                      className="text-xs"
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fontSize: 10 }}
                      label={{ value: 'ms', angle: -90, position: 'insideLeft' }}
                    />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value) => `${value.toFixed(0)}ms`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avgResponse" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <p>Collecting response time data...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MonitorChartsDialog;
