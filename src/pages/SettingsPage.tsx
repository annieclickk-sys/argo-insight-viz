import React, { useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Settings, 
  User, 
  Database, 
  Globe, 
  Bell, 
  Shield, 
  Palette, 
  Download,
  Upload,
  RefreshCw,
  Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    // General Settings
    refreshInterval: 30,
    autoRefresh: true,
    theme: 'system',
    language: 'en',
    
    // Data Settings
    defaultRegion: 'all',
    temperatureUnit: 'celsius',
    depthUnit: 'meters',
    maxDataPoints: 1000,
    dataRetention: 365,
    
    // Map Settings
    mapProvider: 'esri',
    showTrajectories: true,
    animateFloats: true,
    mapOpacity: 80,
    
    // Notifications
    emailNotifications: true,
    criticalAlerts: true,
    dataUpdates: false,
    systemMaintenance: true,
    
    // Performance
    cacheEnabled: true,
    compressionEnabled: true,
    preloadData: false,
    
    // Security
    sessionTimeout: 60,
    twoFactorAuth: false,
    apiKeyRotation: true
  });

  const { toast } = useToast();

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = () => {
    // In a real app, this would save to backend
    localStorage.setItem('argo-settings', JSON.stringify(settings));
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully."
    });
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'argo-settings.json';
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Settings exported",
      description: "Configuration file downloaded successfully."
    });
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 border-b border-border/50 bg-background/50 backdrop-blur-md">
        <SidebarTrigger />
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure system preferences and application behavior
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportSettings}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={saveSettings}>
            <Save className="mr-2 h-4 w-4" />
            Save All
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="px-4 pt-4">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="data">Data</TabsTrigger>
              <TabsTrigger value="visualization">Visualization</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto">
            <TabsContent value="general" className="m-0 p-4">
              <div className="space-y-6 max-w-2xl">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      General Preferences
                    </CardTitle>
                    <CardDescription>Configure basic application settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="theme">Theme</Label>
                      <Select value={settings.theme} onValueChange={(value) => handleSettingChange('theme', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select value={settings.language} onValueChange={(value) => handleSettingChange('language', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="de">Deutsch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label>Data Refresh Interval (seconds)</Label>
                      <Slider
                        value={[settings.refreshInterval]}
                        onValueChange={(value) => handleSettingChange('refreshInterval', value[0])}
                        min={10}
                        max={300}
                        step={10}
                        className="w-full"
                      />
                      <div className="text-sm text-muted-foreground">
                        Current: {settings.refreshInterval} seconds
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto Refresh</Label>
                        <div className="text-sm text-muted-foreground">
                          Automatically refresh data at set intervals
                        </div>
                      </div>
                      <Switch 
                        checked={settings.autoRefresh}
                        onCheckedChange={(checked) => handleSettingChange('autoRefresh', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="data" className="m-0 p-4">
              <div className="space-y-6 max-w-2xl">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Data Configuration
                    </CardTitle>
                    <CardDescription>Configure data processing and display options</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Default Region</Label>
                      <Select value={settings.defaultRegion} onValueChange={(value) => handleSettingChange('defaultRegion', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Regions</SelectItem>
                          <SelectItem value="north-atlantic">North Atlantic</SelectItem>
                          <SelectItem value="south-atlantic">South Atlantic</SelectItem>
                          <SelectItem value="pacific">Pacific</SelectItem>
                          <SelectItem value="indian">Indian Ocean</SelectItem>
                          <SelectItem value="southern">Southern Ocean</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Temperature Unit</Label>
                        <Select value={settings.temperatureUnit} onValueChange={(value) => handleSettingChange('temperatureUnit', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="celsius">Celsius (°C)</SelectItem>
                            <SelectItem value="fahrenheit">Fahrenheit (°F)</SelectItem>
                            <SelectItem value="kelvin">Kelvin (K)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Depth Unit</Label>
                        <Select value={settings.depthUnit} onValueChange={(value) => handleSettingChange('depthUnit', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="meters">Meters (m)</SelectItem>
                            <SelectItem value="feet">Feet (ft)</SelectItem>
                            <SelectItem value="fathoms">Fathoms</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxDataPoints">Maximum Data Points per Query</Label>
                      <Input
                        id="maxDataPoints"
                        type="number"
                        value={settings.maxDataPoints}
                        onChange={(e) => handleSettingChange('maxDataPoints', parseInt(e.target.value))}
                        min={100}
                        max={10000}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dataRetention">Data Retention (days)</Label>
                      <Input
                        id="dataRetention"
                        type="number"
                        value={settings.dataRetention}
                        onChange={(e) => handleSettingChange('dataRetention', parseInt(e.target.value))}
                        min={30}
                        max={3650}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="visualization" className="m-0 p-4">
              <div className="space-y-6 max-w-2xl">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Visualization Settings
                    </CardTitle>
                    <CardDescription>Configure map and chart display options</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Map Provider</Label>
                      <Select value={settings.mapProvider} onValueChange={(value) => handleSettingChange('mapProvider', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="esri">ESRI World Ocean</SelectItem>
                          <SelectItem value="openstreetmap">OpenStreetMap</SelectItem>
                          <SelectItem value="satellite">Satellite View</SelectItem>
                          <SelectItem value="terrain">Terrain</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label>Map Opacity (%)</Label>
                      <Slider
                        value={[settings.mapOpacity]}
                        onValueChange={(value) => handleSettingChange('mapOpacity', value[0])}
                        min={10}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                      <div className="text-sm text-muted-foreground">
                        Current: {settings.mapOpacity}%
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Float Trajectories</Label>
                        <div className="text-sm text-muted-foreground">
                          Display movement paths of ARGO floats
                        </div>
                      </div>
                      <Switch 
                        checked={settings.showTrajectories}
                        onCheckedChange={(checked) => handleSettingChange('showTrajectories', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Animate Float Movement</Label>
                        <div className="text-sm text-muted-foreground">
                          Show animated float movements on map
                        </div>
                      </div>
                      <Switch 
                        checked={settings.animateFloats}
                        onCheckedChange={(checked) => handleSettingChange('animateFloats', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="m-0 p-4">
              <div className="space-y-6 max-w-2xl">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Notification Preferences
                    </CardTitle>
                    <CardDescription>Configure when and how you receive notifications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email Notifications</Label>
                        <div className="text-sm text-muted-foreground">
                          Receive notifications via email
                        </div>
                      </div>
                      <Switch 
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Critical System Alerts</Label>
                        <div className="text-sm text-muted-foreground">
                          System failures and critical issues
                        </div>
                      </div>
                      <Switch 
                        checked={settings.criticalAlerts}
                        onCheckedChange={(checked) => handleSettingChange('criticalAlerts', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Data Updates</Label>
                        <div className="text-sm text-muted-foreground">
                          New ARGO data availability
                        </div>
                      </div>
                      <Switch 
                        checked={settings.dataUpdates}
                        onCheckedChange={(checked) => handleSettingChange('dataUpdates', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>System Maintenance</Label>
                        <div className="text-sm text-muted-foreground">
                          Scheduled maintenance notifications
                        </div>
                      </div>
                      <Switch 
                        checked={settings.systemMaintenance}
                        onCheckedChange={(checked) => handleSettingChange('systemMaintenance', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="m-0 p-4">
              <div className="space-y-6 max-w-2xl">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5" />
                      Performance Settings
                    </CardTitle>
                    <CardDescription>Optimize application performance and resource usage</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Enable Data Caching</Label>
                        <div className="text-sm text-muted-foreground">
                          Cache frequently accessed data locally
                        </div>
                      </div>
                      <Switch 
                        checked={settings.cacheEnabled}
                        onCheckedChange={(checked) => handleSettingChange('cacheEnabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Data Compression</Label>
                        <div className="text-sm text-muted-foreground">
                          Compress data transfers to improve speed
                        </div>
                      </div>
                      <Switch 
                        checked={settings.compressionEnabled}
                        onCheckedChange={(checked) => handleSettingChange('compressionEnabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Preload Chart Data</Label>
                        <div className="text-sm text-muted-foreground">
                          Preload visualization data for faster rendering
                        </div>
                      </div>
                      <Switch 
                        checked={settings.preloadData}
                        onCheckedChange={(checked) => handleSettingChange('preloadData', checked)}
                      />
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">Performance Impact</h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div>• Caching: Improves load times by up to 60%</div>
                        <div>• Compression: Reduces bandwidth usage by 40%</div>
                        <div>• Preloading: Faster chart rendering but higher memory usage</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="security" className="m-0 p-4">
              <div className="space-y-6 max-w-2xl">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Security Settings
                    </CardTitle>
                    <CardDescription>Configure security and authentication settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        value={settings.sessionTimeout}
                        onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                        min={15}
                        max={480}
                      />
                      <div className="text-sm text-muted-foreground">
                        Automatically log out after period of inactivity
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Two-Factor Authentication</Label>
                        <div className="text-sm text-muted-foreground">
                          Add extra security to your account
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={settings.twoFactorAuth ? "default" : "secondary"}>
                          {settings.twoFactorAuth ? "Enabled" : "Disabled"}
                        </Badge>
                        <Switch 
                          checked={settings.twoFactorAuth}
                          onCheckedChange={(checked) => handleSettingChange('twoFactorAuth', checked)}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Automatic API Key Rotation</Label>
                        <div className="text-sm text-muted-foreground">
                          Automatically rotate API keys monthly
                        </div>
                      </div>
                      <Switch 
                        checked={settings.apiKeyRotation}
                        onCheckedChange={(checked) => handleSettingChange('apiKeyRotation', checked)}
                      />
                    </div>

                    <Separator />

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2 text-amber-600">Security Recommendations</h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div>• Enable two-factor authentication for enhanced security</div>
                        <div>• Use session timeout of 60 minutes or less</div>
                        <div>• Keep API key rotation enabled</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};