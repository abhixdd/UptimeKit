import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import { TooltipProvider } from './components/ui/tooltip';
import './App.css';

const queryClient = new QueryClient();

function App() {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Dashboard darkMode={darkMode} setDarkMode={setDarkMode} />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;