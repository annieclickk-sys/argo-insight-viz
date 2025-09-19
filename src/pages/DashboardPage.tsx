import React from 'react';
import { DataDashboard } from '@/components/DataDashboard';
import { SidebarTrigger } from '@/components/ui/sidebar';

export const DashboardPage = () => {
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 border-b border-border/50 bg-background/50 backdrop-blur-md">
        <SidebarTrigger />
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground">Data Dashboard</h1>
        </div>
      </header>
      
      {/* Dashboard */}
      <div className="flex-1 overflow-hidden">
        <DataDashboard />
      </div>
    </div>
  );
};