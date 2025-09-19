import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Thermometer, Droplets, Activity, MapPin, TrendingUp, Waves } from 'lucide-react';

// Sample oceanographic data
const temperatureData = [
  { depth: 0, temp: 28.5, salinity: 34.8 },
  { depth: 50, temp: 26.2, salinity: 35.1 },
  { depth: 100, temp: 22.8, salinity: 35.4 },
  { depth: 200, temp: 18.5, salinity: 35.6 },
  { depth: 500, temp: 12.3, salinity: 35.8 },
  { depth: 1000, temp: 8.7, salinity: 35.9 },
  { depth: 2000, temp: 4.2, salinity: 36.0 },
];

const floatLocations = [
  { lat: 15.5, lon: 73.2, id: 'WMO5904567', status: 'active' },
  { lat: 12.8, lon: 75.1, id: 'WMO5904568', status: 'active' },
  { lat: 18.2, lon: 71.5, id: 'WMO5904569', status: 'inactive' },
  { lat: 14.1, lon: 74.8, id: 'WMO5904570', status: 'active' },
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

export const DataDashboard = () => {
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
          <p className="text-muted-foreground">Real-time ARGO float measurements and analysis</p>
        </div>
        <Badge variant="secondary" className="bg-accent/20 text-accent">
          Live Data
        </Badge>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Average Temperature"
          value="24.8"
          unit="°C"
          icon={Thermometer}
          trend="2.3"
          delay={0.1}
        />
        <MetricCard
          title="Salinity Level"
          value="35.2"
          unit="PSU"
          icon={Droplets}
          trend="0.1"
          delay={0.2}
        />
        <MetricCard
          title="Active Floats"
          value="3,847"
          unit="units"
          icon={Activity}
          trend="5.2"
          delay={0.3}
        />
        <MetricCard
          title="Coverage Area"
          value="2.8M"
          unit="km²"
          icon={MapPin}
          trend="1.8"
          delay={0.4}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temperature/Depth Profile */}
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
                Latest measurements from Arabian Sea ARGO float
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

        {/* BGC Parameters */}
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
      </div>

      {/* Float Locations Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="data-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Active ARGO Floats
            </CardTitle>
            <CardDescription>
              Current location and status of nearby floats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Float ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Latitude</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Longitude</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {floatLocations.map((float, index) => (
                    <motion.tr
                      key={float.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      className="border-b border-border/50 hover:bg-card/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-sm">{float.id}</td>
                      <td className="py-3 px-4 text-sm">{float.lat}°N</td>
                      <td className="py-3 px-4 text-sm">{float.lon}°E</td>
                      <td className="py-3 px-4">
                        <Badge 
                          variant={float.status === 'active' ? 'default' : 'secondary'}
                          className={float.status === 'active' 
                            ? 'bg-accent text-accent-foreground' 
                            : 'bg-muted text-muted-foreground'
                          }
                        >
                          {float.status}
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
    </div>
  );
};