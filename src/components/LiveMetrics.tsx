import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface Metric {
  label: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: string;
}

export const LiveMetrics = () => {
  const [metrics, setMetrics] = useState<Metric[]>([
    { label: "Data Collection Rate", value: 847, unit: "/min", trend: "up", change: "+12%" },
    { label: "System Latency", value: 23, unit: "ms", trend: "down", change: "-8%" },
    { label: "Active Connections", value: 3847, unit: "live", trend: "up", change: "+5%" },
    { label: "Processing Queue", value: 156, unit: "jobs", trend: "stable", change: "0%" }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: metric.value + Math.floor(Math.random() * 10) - 5
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <Activity className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-400';
      case 'down': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  return (
    <motion.div 
      className="bg-card/40 backdrop-blur-md border border-border/30 rounded-xl p-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.8 }}
    >
      <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary animate-pulse" />
        Live System Metrics
      </h3>
      
      <div className="space-y-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 + index * 0.1 }}
            className="flex items-center justify-between p-3 rounded-lg bg-background/30 hover:bg-background/50 transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-foreground">
                {metric.label}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-bold text-foreground">
                  {metric.value.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">
                  {metric.unit}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {getTrendIcon(metric.trend)}
              <span className={`text-sm font-medium ${getTrendColor(metric.trend)}`}>
                {metric.change}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};