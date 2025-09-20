import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Waves, Thermometer, Droplets, MapPin, Clock, Satellite } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LiveDataPoint {
  id: string;
  time: string;
  latitude: string;
  longitude: string;
  temperature: string;
  salinity: string;
  platform: string;
  region: string;
  isNew?: boolean;
}

interface LiveDataStreamProps {
  className?: string;
  onDataUpdate?: (data: LiveDataPoint[]) => void;
}

export const LiveDataStream: React.FC<LiveDataStreamProps> = ({ 
  className = "", 
  onDataUpdate 
}) => {
  const [liveData, setLiveData] = useState<LiveDataPoint[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Simulate live data stream
  useEffect(() => {
    const generateLiveData = () => {
      const regions = ['Arabian Sea', 'Bay of Bengal', 'Indian Ocean', 'Pacific Ocean'];
      const newPoint: LiveDataPoint = {
        id: `live_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        time: new Date().toISOString(),
        latitude: ((Math.random() - 0.5) * 60).toFixed(5),
        longitude: ((Math.random() - 0.5) * 120 + 60).toFixed(5),
        temperature: (15 + Math.random() * 20).toFixed(2),
        salinity: (34 + Math.random() * 3).toFixed(2),
        platform: `${6900000 + Math.floor(Math.random() * 99999)}`,
        region: regions[Math.floor(Math.random() * regions.length)],
        isNew: true
      };

      setLiveData(prev => {
        const updated = [newPoint, ...prev.slice(0, 19)].map((item, index) => ({
          ...item,
          isNew: index === 0
        }));
        return updated;
      });

      setLastUpdate(new Date());
      onDataUpdate?.([newPoint, ...liveData.slice(0, 19)]);
    };

    // Initial connection
    setConnectionStatus('connecting');
    setTimeout(() => {
      setConnectionStatus('connected');
      generateLiveData();
    }, 1000);

    // Generate new data every 3-8 seconds
    const interval = setInterval(() => {
      if (connectionStatus === 'connected') {
        generateLiveData();
      }
    }, 3000 + Math.random() * 5000);

    return () => clearInterval(interval);
  }, [connectionStatus, onDataUpdate]);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Live';
      case 'connecting': return 'Connecting';
      case 'disconnected': return 'Offline';
    }
  };

  return (
    <Card className={`data-card ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Waves className="w-5 h-5 text-primary" />
            Live Data Stream
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`}></div>
            <Badge variant="outline" className="text-xs">
              {getStatusText()}
            </Badge>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Last update: {lastUpdate.toLocaleTimeString()}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          <AnimatePresence mode="popLayout">
            {liveData.map((point, index) => (
              <motion.div
                key={point.id}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ 
                  opacity: 1, 
                  x: 0, 
                  scale: 1,
                  backgroundColor: point.isNew ? 'hsl(var(--accent) / 0.1)' : 'transparent'
                }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ 
                  duration: 0.3,
                  delay: index * 0.05
                }}
                className={`p-4 border-b border-border/50 hover:bg-accent/5 transition-colors ${
                  point.isNew ? 'border-l-4 border-l-accent' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Satellite className="w-3 h-3 text-primary" />
                      <span className="text-sm font-mono text-foreground">
                        {point.platform}
                      </span>
                      {point.isNew && (
                        <Badge variant="secondary" className="text-xs bg-accent/20 text-accent">
                          NEW
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {parseFloat(point.latitude).toFixed(2)}°, {parseFloat(point.longitude).toFixed(2)}°
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {new Date(point.time).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Thermometer className="w-3 h-3 text-primary" />
                        <span className="text-sm font-medium text-foreground">
                          {point.temperature}°C
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-accent" />
                        <span className="text-sm font-medium text-foreground">
                          {point.salinity} PSU
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {point.region}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {liveData.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center space-y-2">
                <Waves className="w-8 h-8 mx-auto opacity-50" />
                <div className="text-sm">Connecting to data stream...</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};