import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { OceanGlobe } from '@/components/OceanGlobe';
import { DashboardCards } from '@/components/DashboardCards';
import { OceanStats } from '@/components/OceanStats';
import { LiveMetrics } from '@/components/LiveMetrics';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { 
  MessageSquare, 
  BarChart3, 
  Map, 
  Play,
  RefreshCw,
  Settings,
  Bell
} from 'lucide-react';

export const HomePage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-accent/15 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{ 
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>

      {/* Header */}
      <motion.header 
        className="relative z-10 p-4 lg:p-6 flex items-center justify-between bg-background/10 backdrop-blur-md border-b border-border/20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          <SidebarTrigger className="text-foreground hover:bg-background/20 transition-smooth" />
          <motion.div 
            className="hidden sm:block"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-xl lg:text-2xl font-bold text-foreground">
              ARGO Ocean Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Real-time oceanographic monitoring system
            </p>
          </motion.div>
        </div>
        
        <div className="flex items-center gap-3">
          <motion.button
            className="p-2 rounded-lg bg-card/50 hover:bg-card border border-border/30 text-muted-foreground hover:text-foreground transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell className="w-4 h-4" />
          </motion.button>
          <motion.button
            className="p-2 rounded-lg bg-card/50 hover:bg-card border border-border/30 text-muted-foreground hover:text-foreground transition-all"
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className="w-4 h-4" />
          </motion.button>
          <ThemeSwitcher />
          <motion.div 
            className="hidden md:block text-sm text-muted-foreground px-3 py-1 rounded-lg bg-card/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Last updated: {new Date().toLocaleTimeString()}
          </motion.div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="relative z-10 p-4 lg:p-6 space-y-6">
        {/* Dashboard Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <DashboardCards />
        </motion.div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Ocean Globe - Takes up 2 columns on large screens */}
          <motion.div 
            className="xl:col-span-2 bg-card/20 backdrop-blur-md border border-border/30 rounded-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="h-[500px] lg:h-[600px] relative">
              <OceanGlobe />
              
              {/* Floating Controls */}
              <motion.div 
                className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
              >
                <div className="flex flex-wrap gap-2">
                  <motion.button 
                    onClick={() => navigate('/chat')}
                    className="ocean-button flex items-center gap-2 text-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="hidden sm:inline">AI Chat</span>
                  </motion.button>
                  <motion.button 
                    onClick={() => navigate('/dashboard')}
                    className="px-3 py-2 rounded-lg bg-card/80 hover:bg-card border border-border/50 text-foreground transition-smooth flex items-center gap-2 text-sm backdrop-blur-md"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Analytics</span>
                  </motion.button>
                  <motion.button 
                    onClick={() => navigate('/map')}
                    className="px-3 py-2 rounded-lg bg-card/80 hover:bg-card border border-border/50 text-foreground transition-smooth flex items-center gap-2 text-sm backdrop-blur-md"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Map className="w-4 h-4" />
                    <span className="hidden sm:inline">Map</span>
                  </motion.button>
                </div>
                
                <motion.button 
                  className="px-4 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary transition-all flex items-center gap-2 text-sm backdrop-blur-md"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Play className="w-4 h-4" />
                  <span className="hidden sm:inline">Start Tour</span>
                </motion.button>
              </motion.div>
            </div>
          </motion.div>

          {/* Side Panel */}
          <div className="space-y-6">
            <OceanStats />
            <LiveMetrics />
          </div>
        </div>

        {/* Quick Actions */}
        <motion.div 
          className="bg-card/20 backdrop-blur-md border border-border/30 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <h3 className="text-lg font-bold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { icon: MessageSquare, label: "Chat AI", path: "/chat" },
              { icon: BarChart3, label: "Dashboard", path: "/dashboard" },
              { icon: Map, label: "Map View", path: "/map" },
              { icon: Settings, label: "Settings", path: "/settings" },
              { icon: RefreshCw, label: "Live Data", path: "/live" },
              { icon: Play, label: "ARGO Floats", path: "/floats" }
            ].map((action, index) => (
              <motion.button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="p-4 rounded-lg bg-background/30 hover:bg-background/50 border border-border/30 transition-all text-center group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <action.icon className="w-6 h-6 mx-auto mb-2 text-primary group-hover:text-accent transition-colors" />
                <span className="text-sm font-medium text-foreground">
                  {action.label}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};