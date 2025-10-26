import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const EditMonitorDialog = ({ open, onOpenChange, monitor }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (monitor) {
      setName(monitor.name);
      setUrl(monitor.url);
      setError('');
    }
  }, [monitor, open]);

  const updateMutation = useMutation({
    mutationFn: () => axios.put(`/api/monitors/${monitor.id}`, { name, url }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
      onOpenChange(false);
      setError('');
    },
    onError: (error) => {
      setError(error.response?.data?.error || 'Failed to update monitor');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!name.trim() || !url.trim()) {
      setError('Name and URL are required');
      return;
    }

    if (!url.includes('http')) {
      setError('URL must start with http:// or https://');
      return;
    }

    updateMutation.mutate();
  };

  if (!monitor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Monitor</DialogTitle>
          <DialogDescription className="text-base mt-2">
            Update the monitor name and URL
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-6">
          <div className="space-y-3">
            <Label htmlFor="monitor-name" className="text-base font-semibold">Monitor Name</Label>
            <Input
              id="monitor-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My API Server"
              className="w-full h-11"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="monitor-url" className="text-base font-semibold">Monitor URL</Label>
            <Input
              id="monitor-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g., https://example.com"
              className="w-full h-11"
              type="url"
            />
          </div>

          {error && (
            <Card className="bg-red-500/10 border-red-500/20">
              <CardContent className="p-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3 justify-end pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
              className="px-8 py-3 h-10 text-base font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-8 py-3 h-10 text-base font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-emerald-500/50"
            >
              {updateMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="h-5 w-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  Updating...
                </span>
              ) : (
                'Update Monitor'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditMonitorDialog;
