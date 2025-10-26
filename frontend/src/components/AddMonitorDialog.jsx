import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Plus, Globe, Type, Zap, X } from 'lucide-react';

const AddMonitorDialog = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      url: ''
    }
  });

  const addMonitorMutation = useMutation({
    mutationFn: (data) => axios.post('/api/monitors', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
      setOpen(false);
      reset();
    },
    onError: (error) => {
      console.error('Error adding monitor:', error);
    },
  });

  const onSubmit = (data) => {
    addMonitorMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="md:w-auto w-auto">
          <Button 
            className="md:size-auto md:gap-2 md:px-6 md:py-2 md:h-10 h-10 w-10 md:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all flex md:flex items-center justify-center"
          >
            <Plus className="h-5 w-5" />
            <span className="font-semibold hidden md:inline ml-2">Add Monitor</span>
          </Button>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] gap-0 p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
          <DialogHeader className="border-0">
            <DialogTitle className="text-2xl text-white flex items-center gap-2">
              <Zap className="h-6 w-6" />
              Add Monitor
            </DialogTitle>
            <DialogDescription className="text-blue-100 mt-1">
              Start monitoring your website's uptime and performance instantly
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-6">
          <div className="space-y-3">
            <Label htmlFor="name" className="flex items-center gap-2 font-semibold">
              <Type className="h-4 w-4 text-primary" />
              Name
            </Label>
            <Input
              id="name"
              placeholder="My API Server"
              className="h-11 border-2 border-muted hover:border-primary transition-colors"
              {...register('name', { 
                required: 'Please give your monitor a name',
                minLength: {
                  value: 2,
                  message: 'Name should be at least 2 characters'
                }
              })}
            />
            {errors.name && (
              <p className="text-sm text-destructive font-medium">
                ⚠ {errors.name.message}
              </p>
            )}
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="url" className="flex items-center gap-2 font-semibold">
              <Globe className="h-4 w-4 text-primary" />
              URL to Monitor
            </Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              className="h-11 border-2 border-muted hover:border-primary transition-colors font-mono text-sm"
              {...register('url', { 
                required: 'Enter the URL you want to monitor',
                pattern: {
                  value: /^https?:\/\/.+\..+/,
                  message: 'Invalid URL - must start with http:// or https://'
                }
              })}
            />
            {errors.url && (
              <p className="text-sm text-destructive font-medium">
                ⚠ {errors.url.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              🔍 Checked every minute • Response time tracked • Auto status updates
            </p>
          </div>

          <DialogFooter className="gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setOpen(false);
                reset();
              }}
              className="px-6 h-10 border-2 border-muted-foreground/30 text-muted-foreground hover:bg-muted hover:text-foreground hover:border-muted-foreground/50 transition-all rounded-lg"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={addMonitorMutation.isPending}
              className="px-8 h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all font-semibold text-white rounded-lg"
            >
              {addMonitorMutation.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Monitor
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMonitorDialog;