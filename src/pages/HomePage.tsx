import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { OceanGlobe } from '@/components/OceanGlobe';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { MessageSquare, BarChart3, Map } from 'lucide-react';

export const HomePage = () => {
  const navigate = useNavigate();
  return (
    <div className="h-screen relative overflow-hidden">
      {/* Header with sidebar trigger */}
      <motion.header 
        className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-background/10 backdrop-blur-md border-b border-border/20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <SidebarTrigger className="text-foreground hover:bg-background/20 transition-smooth" />
        <div className="flex items-center gap-4">
          <ThemeSwitcher />
          <motion.div 
            className="text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Last updated: {new Date().toLocaleTimeString()}
          </motion.div>
        </div>
      </motion.header>

      {/* Main Ocean Globe */}
      <div className="h-full pt-16">
        <OceanGlobe />
      </div>

      {/* Floating Action Panel */}
      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 data-card"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/chat')}
            className="ocean-button flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Start Chat
          </button>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 rounded-lg bg-card hover:bg-card/80 border border-border/50 text-foreground transition-smooth flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            View Dashboard
          </button>
          <button 
            onClick={() => navigate('/map')}
            className="px-4 py-2 rounded-lg bg-card hover:bg-card/80 border border-border/50 text-foreground transition-smooth flex items-center gap-2"
          >
            <Map className="w-4 h-4" />
            Explore Map
          </button>
        </div>
      </motion.div>
    </div>
  );
};