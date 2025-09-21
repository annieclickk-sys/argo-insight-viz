import React, { useState, useEffect } from 'react';
import { GeospatialMap } from '@/components/GeospatialMap';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, Filter } from 'lucide-react';

// Sample ARGO float data for demonstration
const generateSampleData = () => {
  const regions = ['North Atlantic', 'South Pacific', 'Indian Ocean', 'Arctic Ocean', 'Southern Ocean'];
  const platforms = ['APEX', 'NOVA', 'NAVIS', 'ARVOR', 'PROVOR'];
  
  return Array.from({ length: 150 }, (_, i) => ({
    latitude: (Math.random() - 0.5) * 160, // -80 to +80
    longitude: (Math.random() - 0.5) * 360, // -180 to +180
    temperature: 5 + Math.random() * 25, // 5-30°C
    salinity: 32 + Math.random() * 6, // 32-38 PSU
    platform: platforms[Math.floor(Math.random() * platforms.length)],
    region: regions[Math.floor(Math.random() * regions.length)]
  }));
};

export const GeospatialPage = () => {
  const [mapData, setMapData] = useState(generateSampleData());
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setMapData(generateSampleData());
    setIsLoading(false);
  };

  const avgTemp = mapData.reduce((sum, point) => sum + point.temperature, 0) / mapData.length;
  const avgSalinity = mapData.reduce((sum, point) => sum + point.salinity, 0) / mapData.length;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 border-b border-border/50 bg-background/50 backdrop-blur-md">
        <SidebarTrigger />
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground">Global ARGO Float Map</h1>
          <p className="text-sm text-muted-foreground">
            Interactive 3D visualization of ARGO float locations and ocean data
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshData}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Map */}
        <div className="flex-1">
          <GeospatialMap data={mapData} className="h-full" />
        </div>
        
        {/* Side Panel */}
        <div className="w-80 p-4 bg-card/50 backdrop-blur-sm border-l border-border/50 overflow-y-auto">
          <div className="space-y-4">
            {/* Stats Cards */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Global Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Floats</span>
                  <span className="text-sm font-medium">{mapData.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Avg Temperature</span>
                  <span className="text-sm font-medium">{avgTemp.toFixed(1)}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Avg Salinity</span>
                  <span className="text-sm font-medium">{avgSalinity.toFixed(1)} PSU</span>
                </div>
              </CardContent>
            </Card>

            {/* Platform Distribution */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Platform Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['APEX', 'NOVA', 'NAVIS', 'ARVOR', 'PROVOR'].map(platform => {
                    const count = mapData.filter(d => d.platform === platform).length;
                    const percentage = (count / mapData.length) * 100;
                    return (
                      <div key={platform} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{platform}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-300" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="font-medium min-w-[2rem] text-right">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Data */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Recent Measurements</CardTitle>
                <CardDescription className="text-xs">Latest 5 data points</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mapData.slice(0, 5).map((point, index) => (
                    <div key={index} className="p-2 rounded-md bg-muted/30 border border-border/30">
                      <div className="text-xs space-y-1">
                        <div className="font-medium">{point.platform} - {point.region}</div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Temp: {point.temperature.toFixed(1)}°C</span>
                          <span>Sal: {point.salinity.toFixed(1)} PSU</span>
                        </div>
                        <div className="text-muted-foreground">
                          {point.latitude.toFixed(2)}°, {point.longitude.toFixed(2)}°
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};