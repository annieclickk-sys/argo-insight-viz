import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Activity, 
  Thermometer, 
  Droplets, 
  Battery, 
  Calendar,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Waves,
  Ship,
  Settings,
  Play,
  Pause,
  Plus,
  Edit,
  Trash2,
  Navigation
} from 'lucide-react';

interface ArgoFloat {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'maintenance' | 'deployed';
  location: {
    lat: number;
    lng: number;
  };
  lastUpdate: string;
  batteryLevel: number;
  profilesCollected: number;
  temperature: number;
  salinity: number;
  depth: number;
  deploymentDate: string;
}

const mockFloats: ArgoFloat[] = [
  {
    id: 'ARG001',
    name: 'Pacific Explorer',
    status: 'active',
    location: { lat: -25.2744, lng: 133.7751 },
    lastUpdate: '2024-01-15T10:30:00Z',
    batteryLevel: 87,
    profilesCollected: 342,
    temperature: 18.5,
    salinity: 35.2,
    depth: 2000,
    deploymentDate: '2023-06-15'
  },
  {
    id: 'ARG002',
    name: 'Atlantic Drifter',
    status: 'active',
    location: { lat: 40.7128, lng: -74.0060 },
    lastUpdate: '2024-01-15T09:45:00Z',
    batteryLevel: 92,
    profilesCollected: 287,
    temperature: 22.1,
    salinity: 36.8,
    depth: 1800,
    deploymentDate: '2023-07-20'
  },
  {
    id: 'ARG003',
    name: 'Arctic Sentinel',
    status: 'maintenance',
    location: { lat: 71.0, lng: -8.0 },
    lastUpdate: '2024-01-14T16:20:00Z',
    batteryLevel: 34,
    profilesCollected: 198,
    temperature: -1.2,
    salinity: 34.7,
    depth: 1500,
    deploymentDate: '2023-08-10'
  },
  {
    id: 'ARG004',
    name: 'Indian Ocean Scout',
    status: 'deployed',
    location: { lat: -20.0, lng: 85.0 },
    lastUpdate: '2024-01-15T11:15:00Z',
    batteryLevel: 98,
    profilesCollected: 156,
    temperature: 26.8,
    salinity: 35.5,
    depth: 2200,
    deploymentDate: '2023-12-01'
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-500/20 text-green-700 border-green-500/30';
    case 'inactive':
      return 'bg-red-500/20 text-red-700 border-red-500/30';
    case 'maintenance':
      return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
    case 'deployed':
      return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
    default:
      return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active':
      return <CheckCircle className="h-4 w-4" />;
    case 'inactive':
      return <AlertTriangle className="h-4 w-4" />;
    case 'maintenance':
      return <Clock className="h-4 w-4" />;
    case 'deployed':
      return <Activity className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

export const ArgoFloatsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredFloats = mockFloats.filter(float => {
    const matchesSearch = float.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         float.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || float.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeFloats = mockFloats.filter(f => f.status === 'active').length;
  const totalProfiles = mockFloats.reduce((sum, f) => sum + f.profilesCollected, 0);
  const avgBattery = Math.round(mockFloats.reduce((sum, f) => sum + f.batteryLevel, 0) / mockFloats.length);

  return (
    <div className="h-full overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">ARGO Floats</h1>
            <p className="text-muted-foreground">Monitor and manage autonomous oceanographic floats</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Floats</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeFloats}</div>
              <p className="text-xs text-muted-foreground">of {mockFloats.length} total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profiles Collected</CardTitle>
              <Droplets className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProfiles.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total data profiles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Battery</CardTitle>
              <Battery className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgBattery}%</div>
              <p className="text-xs text-muted-foreground">Fleet average</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Coverage Area</CardTitle>
              <MapPin className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground">Ocean regions</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Fleet Overview</TabsTrigger>
            <TabsTrigger value="monitoring">Real-time Monitoring</TabsTrigger>
            <TabsTrigger value="deployment">Deployment Management</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search floats by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
                <option value="deployed">Deployed</option>
              </select>
            </div>

            {/* Float Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredFloats.map((float) => (
                <Card key={float.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{float.name}</CardTitle>
                        <CardDescription>ID: {float.id}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(float.status)}>
                        {getStatusIcon(float.status)}
                        <span className="ml-1 capitalize">{float.status}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Location and Last Update */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{float.location.lat.toFixed(2)}°, {float.location.lng.toFixed(2)}°</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(float.lastUpdate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <Battery className="h-3 w-3" />
                            Battery
                          </span>
                          <span className="font-medium">{float.batteryLevel}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <Droplets className="h-3 w-3" />
                            Profiles
                          </span>
                          <span className="font-medium">{float.profilesCollected}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <Thermometer className="h-3 w-3" />
                            Temp
                          </span>
                          <span className="font-medium">{float.temperature}°C</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Depth</span>
                          <span className="font-medium">{float.depth}m</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Track Location
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-4">
            {/* Live Status Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Floats Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-500" />
                    Live Float Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockFloats.filter(f => f.status === 'active').map(float => (
                    <div key={float.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <div>
                          <p className="font-medium">{float.name}</p>
                          <p className="text-sm text-muted-foreground">{float.id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{float.temperature}°C</p>
                        <p className="text-xs text-muted-foreground">{float.batteryLevel}% battery</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Real-time Data Stream */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Waves className="h-5 w-5 text-blue-500" />
                    Data Stream
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 border-l-2 border-primary/30 bg-muted/30 rounded-r">
                        <div className="text-xs text-muted-foreground">
                          {new Date(Date.now() - i * 30000).toLocaleTimeString()}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">ARG00{(i % 4) + 1}</span>: 
                          <span className="ml-1">
                            T: {(18 + Math.random() * 10).toFixed(1)}°C, 
                            S: {(34 + Math.random() * 2).toFixed(1)} PSU
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Control Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Monitoring Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Start Monitoring
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Pause className="h-4 w-4" />
                    Pause All
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export Live Data
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh Status
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deployment" className="space-y-4">
            {/* Deployment Planning */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Deploy */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5 text-blue-500" />
                    Quick Deploy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Float Name</label>
                      <Input placeholder="Enter float name" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-sm font-medium">Latitude</label>
                        <Input placeholder="0.00" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Longitude</label>
                        <Input placeholder="0.00" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Deployment Date</label>
                      <Input type="date" />
                    </div>
                    <Button className="w-full">
                      <Ship className="h-4 w-4 mr-2" />
                      Schedule Deployment
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Deployment Queue */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-orange-500" />
                    Deployment Queue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {[
                      { name: 'Southern Explorer', date: '2024-02-15', location: 'Antarctic Circle' },
                      { name: 'Equatorial Monitor', date: '2024-02-20', location: 'Pacific Equator' },
                      { name: 'Arctic Tracker', date: '2024-03-01', location: 'Bering Sea' }
                    ].map((deployment, i) => (
                      <div key={i} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-sm">{deployment.name}</p>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">📅 {deployment.date}</p>
                        <p className="text-xs text-muted-foreground">📍 {deployment.location}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Fleet Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Navigation className="h-5 w-5 text-purple-500" />
                    Fleet Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{activeFloats}</p>
                      <p className="text-xs text-green-600">Active</p>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">3</p>
                      <p className="text-xs text-blue-600">Scheduled</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full">
                      <MapPin className="h-4 w-4 mr-2" />
                      View Deployment Map
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Export Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Deployments */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Deployments</CardTitle>
                <CardDescription>Successfully deployed floats in the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockFloats.filter(f => f.status === 'deployed').map(float => (
                    <div key={float.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center">
                          <Ship className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{float.name}</p>
                          <p className="text-sm text-muted-foreground">ID: {float.id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{float.deploymentDate}</p>
                        <p className="text-xs text-muted-foreground">
                          {float.location.lat.toFixed(2)}°, {float.location.lng.toFixed(2)}°
                        </p>
                      </div>
                      <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30">
                        <Activity className="h-3 w-3 mr-1" />
                        Deployed
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};