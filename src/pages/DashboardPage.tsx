import React, { useState, useEffect } from 'react';
import { DataDashboard } from '@/components/DataDashboard';
import { SidebarTrigger } from '@/components/ui/sidebar';

export const DashboardPage = () => {
  const [queryData, setQueryData] = useState(null);
  const [lastQuery, setLastQuery] = useState('');

  // Listen for data from chat interface
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'argo-query-data') {
        const data = JSON.parse(e.newValue || 'null');
        setQueryData(data);
      }
      if (e.key === 'last-argo-query') {
        setLastQuery(e.newValue || '');
      }
    };

    // Check for existing data
    const existingData = localStorage.getItem('argo-query-data');
    const existingQuery = localStorage.getItem('last-argo-query');
    
    if (existingData) {
      setQueryData(JSON.parse(existingData));
    }
    if (existingQuery) {
      setLastQuery(existingQuery);
    }

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 border-b border-border/50 bg-background/50 backdrop-blur-md">
        <SidebarTrigger />
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground">ARGO Data Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Comprehensive ocean data visualization and analysis
          </p>
        </div>
      </header>
      
      {/* Dashboard */}
      <div className="flex-1 overflow-hidden">
        <DataDashboard 
          selectedData={queryData} 
          chatQuery={lastQuery}
        />
      </div>
    </div>
  );
};