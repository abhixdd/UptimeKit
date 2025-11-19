import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import { TooltipProvider } from './components/ui/tooltip';
import './App.css';

const queryClient = new QueryClient();

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-midnight', 'theme-forest', 'theme-cosmic', 'theme-claude');
    
    if (theme !== 'light') {
      root.classList.add('dark');
      if (theme !== 'dark') {
        root.classList.add(theme);
      }
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Dashboard theme={theme} setTheme={setTheme} />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;