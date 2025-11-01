import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertTriangle, Clock, Calendar } from 'lucide-react';
import axios from 'axios';
import { parseUTC } from '../lib/timezone';
import { formatDistanceToNow } from 'date-fns';

const DowntimeDialog = ({ monitorId, isOpen, onClose }) => {
  const [downtimes, setDowntimes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    
    setLoading(true);
    axios
      .get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/monitors/${monitorId}/downtime`)
      .then((res) => setDowntimes(res.data.downtimes || []))
      .catch((err) => console.error('Error fetching downtime:', err))
      .finally(() => setLoading(false));
  }, [isOpen, monitorId]);

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
    return `${Math.floor(seconds / 86400)} days`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Downtime History
          </DialogTitle>
          <DialogDescription>
            Last {downtimes.length} downtime periods
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : downtimes && downtimes.length > 0 ? (
          <div className="space-y-3">
            {downtimes.map((downtime, index) => (
              <div key={index} className="p-4 bg-muted rounded-lg border border-border">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">From</p>
                        <p className="text-sm">
                          {parseUTC(downtime.start).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Duration</p>
                        <p className="text-sm font-semibold text-foreground">
                          {formatDuration(downtime.duration)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      Ended {formatDistanceToNow(parseUTC(downtime.end), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No downtime recorded yet</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DowntimeDialog;
