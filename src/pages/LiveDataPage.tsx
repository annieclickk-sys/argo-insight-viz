import React from 'react';
import { LiveDataStream } from '@/components/LiveDataStream';
import { SidebarTrigger } from '@/components/ui/sidebar';

export const LiveDataPage = () => {
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 border-b border-border/50 bg-background/50 backdrop-blur-md">
        <SidebarTrigger />
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground">Live ARGO Data Stream</h1>
          <p className="text-sm text-muted-foreground">
            Real-time ocean data from ARGO floats worldwide - Updated
          </p>
        </div>
      </header>
      
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <LiveDataStream />
      </div>
    </div>
  );
};