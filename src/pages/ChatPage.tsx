import React from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { SidebarTrigger } from '@/components/ui/sidebar';

export const ChatPage = () => {
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 border-b border-border/50 bg-background/50 backdrop-blur-md">
        <SidebarTrigger />
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground">AI Chat Interface</h1>
        </div>
      </header>
      
      {/* Chat Interface */}
      <div className="flex-1">
        <ChatInterface />
      </div>
    </div>
  );
};