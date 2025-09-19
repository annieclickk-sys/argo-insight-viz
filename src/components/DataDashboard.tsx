import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, BarChart, Bar, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Thermometer, Droplets, Activity, MapPin, TrendingUp, Waves, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ArgoDataPoint {
  time: string;
  latitude: string;
  longitude: string;
  temperature: string;
  salinity: string;
  platform: string;
  region: string;
  cycle?: number;
  depth?: number;
}

interface DashboardProps {
  selectedData?: ArgoDataPoint[];
  onRefresh?: () => void;
}

// Sample oceanographic data for when no real data is available
const temperatureData = [
  { depth: 0, temp: 28.5, salinity: 34.8 },
  { depth: 50, temp: 26.2, salinity: 35.1 },
  { depth: 100, temp: 22.8, salinity: 35.4 },
  { depth: 200, temp: 18.5, salinity: 35.6 },
  { depth: 500, temp: 12.3, salinity: 35.8 },
  { depth: 1000, temp: 8.7, salinity: 35.9 },
  { depth: 2000, temp: 4.2, salinity: 36.0 },
];

const bgcData = [
  { date: '2023-01', oxygen: 4.2, chlorophyll: 0.15, ph: 8.1 },
  { date: '2023-02', oxygen: 4.5, chlorophyll: 0.18, ph: 8.0 },
  { date: '2023-03', oxygen: 4.8, chlorophyll: 0.22, ph: 7.9 },
  { date: '2023-04', oxygen: 5.1, chlorophyll: 0.28, ph: 7.8 },
  { date: '2023-05', oxygen: 4.9, chlorophyll: 0.31, ph: 7.9 },
  { date: '2023-06', oxygen: 4.6, chlorophyll: 0.25, ph: 8.0 },
];

const MetricCard = ({ title, value, unit, icon: Icon, trend, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
  >
    <Card className="data-card hover:shadow-lg transition-smooth">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <span className="text-sm text-muted-foreground">{unit}</span>
            </div>
            {trend && (
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-accent" />
                <span className="text-xs text-accent">+{trend}%</span>
              </div>
            )}
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export const DataDashboard = ({ selectedData, onRefresh }: DashboardProps) => {
  const [argoData, setArgoData] = useState<ArgoDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Use selectedData if provided, otherwise fetch Indian Ocean sample data
  const displayData = selectedData || argoData;

  const fetchSampleData = async () => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('argo-ai-query', {
        body: { 
          query: 'Show me recent ARGO data from the Indian Ocean',
          type: 'parse_query'
        }
      });

      if (response.data) {
        const { params } = response.data;
        
        const dataResponse = await supabase.functions.invoke('argo-ai-query', {
          body: { params, type: 'get_data' }
        });

        if (dataResponse.data?.data) {
          setArgoData(dataResponse.data.data);
          setLastUpdated(new Date());
        }
      }
    } catch (error) {
      console.error('Error fetching ARGO data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedData) {
      fetchSampleData();
    }
  }, [selectedData]);

  // Process data for visualizations
  const regionalData = React.useMemo(() => {
    if (!displayData.length) return [];
    
    const regionMap = new Map();
    displayData.forEach(point => {
      const region = point.region || 'Unknown';
      if (!regionMap.has(region)) {
        regionMap.set(region, {
          region,
          temperatures: [],
          salinities: [],
          count: 0
        });
      }
      const regionData = regionMap.get(region);
      regionData.temperatures.push(parseFloat(point.temperature));
      regionData.salinities.push(parseFloat(point.salinity));
      regionData.count++;
    });

    return Array.from(regionMap.values()).map(data => ({
      region: data.region,
      temperature: (data.temperatures.reduce((a, b) => a + b, 0) / data.temperatures.length).toFixed(1),
      salinity: (data.salinities.reduce((a, b) => a + b, 0) / data.salinities.length).toFixed(1),
      count: data.count
    }));
  }, [displayData]);

  const scatterData = React.useMemo(() => {
    return displayData.map(point => ({
      temperature: parseFloat(point.temperature),
      salinity: parseFloat(point.salinity),
      region: point.region,
      platform: point.platform
    }));
  }, [displayData]);

  // Calculate metrics
  const avgTemp = displayData.length > 0 
    ? (displayData.reduce((sum, d) => sum + parseFloat(d.temperature), 0) / displayData.length).toFixed(1)
    : '24.8';
  
  const avgSalinity = displayData.length > 0 
    ? (displayData.reduce((sum, d) => sum + parseFloat(d.salinity), 0) / displayData.length).toFixed(1)
    : '35.2';

  const uniquePlatforms = new Set(displayData.map(d => d.platform)).size;

  return (
    <div className="p-6 space-y-6 h-full overflow-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ocean Data Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time ARGO float measurements • {displayData.length} data points
          </p>
          <p className="text-xs text-muted-foreground">
            Last updated: {lastUpdated.toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh || fetchSampleData}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Badge variant="secondary" className="bg-accent/20 text-accent">
            {selectedData ? 'Query Results' : 'Live Data'}
          </Badge>
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Average Temperature"
          value={avgTemp}
          unit="°C"
          icon={Thermometer}
          trend="2.3"
          delay={0.1}
        />
        <MetricCard
          title="Salinity Level"
          value={avgSalinity}
          unit="PSU"
          icon={Droplets}
          trend="0.1"
          delay={0.2}
        />
        <MetricCard
          title="Active Platforms"
          value={uniquePlatforms || displayData.length}
          unit="floats"
          icon={Activity}
          trend="5.2"
          delay={0.3}
        />
        <MetricCard
          title="Regions Covered"
          value={regionalData.length || 1}
          unit="areas"
          icon={MapPin}
          trend="1.8"
          delay={0.4}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Analysis */}
        {regionalData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="data-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Regional Analysis
                </CardTitle>
                <CardDescription>
                  Temperature and salinity by ocean region
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={regionalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="region" 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value, name) => [
                        `${value}${String(name).includes('temperature') ? '°C' : ' PSU'}`,
                        String(name) === 'temperature' ? 'Temperature' : 'Salinity'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="temperature" fill="hsl(var(--primary))" name="Temperature (°C)" />
                    <Bar dataKey="salinity" fill="hsl(var(--accent))" name="Salinity (PSU)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Temperature vs Salinity Scatter */}
        {scatterData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="data-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Waves className="w-5 h-5 text-accent" />
                  Temperature vs Salinity
                </CardTitle>
                <CardDescription>
                  Correlation between temperature and salinity measurements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={scatterData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      type="number" 
                      dataKey="temperature" 
                      name="Temperature" 
                      unit="°C"
                      stroke="hsl(var(--muted-foreground))"
                      domain={['dataMin - 1', 'dataMax + 1']}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="salinity" 
                      name="Salinity" 
                      unit=" PSU"
                      stroke="hsl(var(--muted-foreground))"
                      domain={['dataMin - 0.5', 'dataMax + 0.5']}
                    />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value, name) => [
                        `${value}${name === 'temperature' ? '°C' : ' PSU'}`,
                        name === 'temperature' ? 'Temperature' : 'Salinity'
                      ]}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          return `Platform: ${payload[0].payload.platform} | Region: ${payload[0].payload.region}`;
                        }
                        return '';
                      }}
                    />
                    <Scatter 
                      name="ARGO Measurements" 
                      data={scatterData} 
                      fill="hsl(var(--primary))"
                      fillOpacity={0.7}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Fallback: Temperature/Depth Profile when no real data */}
        {!selectedData && displayData.length === 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="data-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Thermometer className="w-5 h-5 text-primary" />
                  Temperature vs Depth Profile
                </CardTitle>
                <CardDescription>
                  Sample measurements from Arabian Sea ARGO float
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={temperatureData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="temp" 
                      stroke="hsl(var(--muted-foreground))"
                      label={{ value: 'Temperature (°C)', position: 'insideBottom', offset: -10 }}
                    />
                    <YAxis 
                      dataKey="depth" 
                      reversed 
                      stroke="hsl(var(--muted-foreground))"
                      label={{ value: 'Depth (m)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="temp" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* BGC Parameters - fallback */}
        {!selectedData && displayData.length === 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="data-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Waves className="w-5 h-5 text-accent" />
                  Biogeochemical Parameters
                </CardTitle>
                <CardDescription>
                  6-month trend in Arabian Sea region
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={bgcData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="oxygen" 
                      stackId="1"
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary) / 0.3)"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="chlorophyll" 
                      stackId="2"
                      stroke="hsl(var(--accent))" 
                      fill="hsl(var(--accent) / 0.3)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Data Summary Table */}
      {displayData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="data-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Recent ARGO Measurements
              </CardTitle>
              <CardDescription>
                Latest data points from active floats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Platform</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Location</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Temperature</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Salinity</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Region</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayData.slice(0, 6).map((point, index) => (
                      <motion.tr
                        key={`${point.platform}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                        className="border-b border-border/50 hover:bg-card/30 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-sm">{point.platform}</td>
                        <td className="py-3 px-4 text-sm">
                          {parseFloat(point.latitude).toFixed(2)}°, {parseFloat(point.longitude).toFixed(2)}°
                        </td>
                        <td className="py-3 px-4 text-sm">{point.temperature}°C</td>
                        <td className="py-3 px-4 text-sm">{point.salinity} PSU</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-xs">
                            {point.region}
                          </Badge>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};