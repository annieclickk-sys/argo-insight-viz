import React from 'react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

interface OceanRegion {
  name: string;
  coverage: number;
  floats: number;
  color: string;
}

const oceanRegions: OceanRegion[] = [
  { name: "Pacific Ocean", coverage: 92, floats: 1247, color: "bg-blue-500" },
  { name: "Atlantic Ocean", coverage: 88, floats: 1024, color: "bg-cyan-500" },
  { name: "Indian Ocean", coverage: 85, floats: 743, color: "bg-teal-500" },
  { name: "Arctic Ocean", coverage: 67, floats: 234, color: "bg-indigo-500" },
  { name: "Southern Ocean", coverage: 79, floats: 599, color: "bg-purple-500" }
];

export const OceanStats = () => {
  return (
    <motion.div 
      className="bg-card/40 backdrop-blur-md border border-border/30 rounded-xl p-6"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6 }}
    >
      <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
        Ocean Coverage Statistics
      </h3>
      
      <div className="space-y-4">
        {oceanRegions.map((region, index) => (
          <motion.div
            key={region.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + index * 0.1 }}
            className="space-y-2"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${region.color}`}></div>
                <span className="text-sm font-medium text-foreground">
                  {region.name}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-foreground">
                  {region.coverage}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {region.floats} floats
                </div>
              </div>
            </div>
            <Progress 
              value={region.coverage} 
              className="h-2 bg-background/50"
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};