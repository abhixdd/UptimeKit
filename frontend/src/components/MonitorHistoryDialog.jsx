import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow, formatDate } from 'date-fns';
import axios from 'axios';

const getStatusBadge = (status) => {
  switch (status) {
    case 'up':
      return { icon: CheckCircle, label: 'Up', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' };
    case 'down':
      return { icon: XCircle, label: 'Down', color: 'bg-red-500/10 text-red-600 dark:text-red-400' };
    case 'slow':
      return { icon: AlertTriangle, label: 'Slow', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' };
    default:
      return { icon: AlertTriangle, label: 'Unknown', color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400' };
  }
};

const MonitorHistoryDialog = ({ open, onOpenChange, monitor }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && monitor) {
      fetchHistory();
    }
  }, [open, monitor]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/monitors/${monitor.id}/history`);
      setHistory(Array.isArray(response.data) ? response.data : response.data.history || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'up':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      case 'slow':
        return 'text-amber-600 dark:text-amber-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (!monitor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-500 scrollbar-track-muted">
        <style>{`
          .scrollbar-thin::-webkit-scrollbar {
            width: 8px;
          }
          .scrollbar-thin::-webkit-scrollbar-track {
            background: hsl(var(--muted));
            border-radius: 10px;
          }
          .scrollbar-thin::-webkit-scrollbar-thumb {
            background: #10b981;
            border-radius: 10px;
            transition: background 0.3s;
          }
          .scrollbar-thin::-webkit-scrollbar-thumb:hover {
            background: #059669;
          }
        `}</style>
        <DialogHeader>
          <DialogTitle>{monitor.name} - Monitoring History</DialogTitle>
          <DialogDescription>
            Last 30 checks for {monitor.url}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-muted-foreground animate-pulse">Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-muted-foreground">No monitoring history yet. Check back soon!</p>
            </div>
          ) : (
            history.map((entry, index) => {
              const { icon: StatusIcon, label, color } = getStatusBadge(entry.status);
              return (
                <Card key={index} className="border-l-4" style={{ borderLeftColor: entry.status === 'up' ? '#10b981' : entry.status === 'slow' ? '#f59e0b' : '#ef4444' }}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Badge className={color}>
                          <StatusIcon className="h-4 w-4 mr-1" />
                          {label}
                        </Badge>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {formatDistanceToNow(new Date(entry.checked_at), { addSuffix: true })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.checked_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${getStatusColor(entry.status)}`}>
                          {entry.response_time}ms
                        </p>
                        {entry.status === 'down' && entry.error_message && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            {entry.error_message.substring(0, 40)}...
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <div className="flex justify-end mt-4">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MonitorHistoryDialog;
