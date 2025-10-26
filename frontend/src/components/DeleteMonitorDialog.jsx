import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const DeleteMonitorDialog = ({ open, onOpenChange, monitor }) => {
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => axios.delete(`/api/monitors/${monitor?.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
      onOpenChange(false);
      setError('');
    },
    onError: (error) => {
      setError(error.response?.data?.error || 'Failed to delete monitor');
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  if (!monitor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-xl">Delete Monitor?</DialogTitle>
              <DialogDescription className="text-sm mt-1">
                This action cannot be undone
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-4">
            <p className="text-sm text-red-700 dark:text-red-300 font-semibold mb-2">
              You are about to delete:
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-xs text-red-600 dark:text-red-400 font-medium flex-shrink-0 mt-0.5">Name:</span>
                <p className="text-sm font-semibold text-red-900 dark:text-red-200 break-words">
                  {monitor.name}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs text-red-600 dark:text-red-400 font-medium flex-shrink-0 mt-0.5">URL:</span>
                <p className="text-sm font-semibold text-red-900 dark:text-red-200 break-words">
                  {monitor.url}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            All monitoring data and history for this monitor will be permanently deleted.
          </p>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={deleteMutation.isPending}
              className="px-8 py-3 h-12 text-base font-semibold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="px-8 py-3 h-12 text-base font-semibold bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-600/30"
            >
              {deleteMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="h-5 w-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </span>
              ) : (
                <>
                  <Trash2 className="h-5 w-5 mr-2" />
                  Delete Monitor
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteMonitorDialog;
