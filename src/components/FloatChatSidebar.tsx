import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Globe,
  MessageSquare,
  BarChart3,
  Map,
  Settings,
  Database,
  Waves,
  Activity
} from "lucide-react";

const navigationItems = [
  { title: "Ocean Globe", url: "/", icon: Globe },
  { title: "Chat Interface", url: "/chat", icon: MessageSquare },
  { title: "Data Dashboard", url: "/dashboard", icon: BarChart3 },
  { title: "Geospatial Map", url: "/map", icon: Map },
  { title: "ARGO Floats", url: "/floats", icon: Waves },
  { title: "Live Data", url: "/live", icon: Activity },
  { title: "Database", url: "/database", icon: Database },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function FloatChatSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    `${isActive 
      ? "bg-primary/20 text-primary border-r-2 border-primary" 
      : "hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
    } transition-smooth`;

  return (
    <Sidebar className={`${collapsed ? "w-16" : "w-64"} border-r border-border/50 bg-sidebar shadow-deep`}>
      <SidebarContent className="p-2">
        {/* Logo Section */}
        <motion.div 
          className="flex items-center gap-3 p-4 mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center glow-primary">
            <Waves className="w-6 h-6 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-foreground">FloatChat</h1>
              <p className="text-xs text-muted-foreground">Ocean AI Assistant</p>
            </div>
          )}
        </motion.div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-accent font-semibold mb-4">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navigationItems.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end 
                        className={getNavCls}
                      >
                        <div className="flex items-center gap-3 p-3 rounded-lg w-full">
                          <item.icon className={`w-5 h-5 ${isActive(item.url) ? 'text-primary' : ''}`} />
                          {!collapsed && (
                            <span className="font-medium">{item.title}</span>
                          )}
                        </div>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </motion.div>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Status Section */}
        {!collapsed && (
          <motion.div 
            className="mt-auto p-4 rounded-xl bg-card/50 border border-border/50 m-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-foreground">System Status</span>
            </div>
            <p className="text-xs text-muted-foreground">
              ARGO Database: Active
            </p>
            <p className="text-xs text-muted-foreground">
              AI Model: Online
            </p>
          </motion.div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}