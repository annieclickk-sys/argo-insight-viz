import React from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { FloatChatSidebar } from './FloatChatSidebar';
import { motion } from 'framer-motion';

interface FloatChatLayoutProps {
  children: React.ReactNode;
}

export const FloatChatLayout = ({ children }: FloatChatLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <FloatChatSidebar />
        <main className="flex-1 relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </SidebarProvider>
  );
};