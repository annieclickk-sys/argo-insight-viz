import React from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Thermometer, 
  Droplets, 
  Waves, 
  MapPin, 
  TrendingUp,
  Globe,
  Database
} from 'lucide-react';

interface DashboardCard {
  title: string;
  value: string;
  unit: string;
  trend: string;
  icon: React.ElementType;
  color: string;
}

const dashboardData: DashboardCard[] = [
  {
    title: "Active ARGO Floats",
    value: "3,847",
    unit: "units",
    trend: "+12%",
    icon: Activity,
    color: "text-primary"
  },
  {
    title: "Avg Temperature",
    value: "18.5",
    unit: "°C",
    trend: "+0.3°C",
    icon: Thermometer,
    color: "text-orange-400"
  },
  {
    title: "Salinity Level",
    value: "34.7",
    unit: "PSU",
    trend: "-0.1",
    icon: Droplets,
    color: "text-blue-400"
  },
  {
    title: "Ocean Depth",
    value: "2,847",
    unit: "meters",
    trend: "stable",
    icon: Waves,
    color: "text-cyan-400"
  },
  {
    title: "Data Points",
    value: "1.2M",
    unit: "records",
    trend: "+5.2K",
    icon: Database,
    color: "text-green-400"
  },
  {
    title: "Coverage Area",
    value: "89%",
    unit: "global",
    trend: "+2%",
    icon: Globe,
    color: "text-purple-400"
  }
];

export const DashboardCards = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {dashboardData.map((item, index) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-card/60 backdrop-blur-md border border-border/30 rounded-xl p-4 hover:bg-card/80 transition-all duration-300 hover:scale-105"
        >
          <div className="flex items-center justify-between mb-3">
            <item.icon className={`w-5 h-5 ${item.color}`} />
            <span className="text-xs text-green-400 font-medium">
              {item.trend}
            </span>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">
              {item.title}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground">
                {item.value}
              </span>
              <span className="text-xs text-muted-foreground">
                {item.unit}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};