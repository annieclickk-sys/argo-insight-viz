import React, { useState, useEffect } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, Activity, Search, Settings, BarChart3, Users, FileText, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DatabaseStats {
  totalConnections: number;
  activeQueries: number;
  dataSize: string;
  uptime: string;
}

interface QueryResult {
  rows: any[];
  columns: string[];
  duration: number;
}

export const DatabasePage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sqlQuery, setSqlQuery] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<DatabaseStats>({
    totalConnections: 12,
    activeQueries: 3,
    dataSize: '2.4 GB',
    uptime: '15d 8h 42m'
  });
  const { toast } = useToast();

  const executeQuery = async () => {
    if (!sqlQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a SQL query",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    const startTime = Date.now();

    try {
      // For now, we'll simulate query execution with sample data
      // In a real implementation, you'd use a stored procedure or direct database access
      const duration = Date.now() - startTime;
      
      // Sample response based on query type
      let sampleData = [];
      if (sqlQuery.toLowerCase().includes('argo_data')) {
        sampleData = [
          { id: 1, platform_id: 'ARGO_001', temperature: 15.2, salinity: 35.1, region: 'North Atlantic' },
          { id: 2, platform_id: 'ARGO_002', temperature: 18.7, salinity: 34.8, region: 'Pacific' },
          { id: 3, platform_id: 'ARGO_003', temperature: 12.4, salinity: 35.5, region: 'Southern Ocean' }
        ];
      } else if (sqlQuery.toLowerCase().includes('region')) {
        sampleData = [
          { region: 'North Atlantic', avg_temp: 15.2, measurements: 1247 },
          { region: 'Pacific', avg_temp: 18.7, measurements: 2156 },
          { region: 'Southern Ocean', avg_temp: 12.4, measurements: 987 }
        ];
      }
      
      if (sampleData.length > 0) {
        const columns = Object.keys(sampleData[0]);
        setQueryResult({
          rows: sampleData,
          columns,
          duration
        });
      } else {
        setQueryResult({
          rows: [],
          columns: [],
          duration
        });
      }

      toast({
        title: "Query executed successfully",
        description: `Completed in ${duration}ms`
      });
    } catch (error: any) {
      toast({
        title: "Query failed",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sampleQueries = [
    {
      name: "Recent ARGO Data",
      query: "SELECT * FROM argo_data ORDER BY timestamp DESC LIMIT 10;"
    },
    {
      name: "Temperature Statistics",
      query: "SELECT region, AVG(temperature) as avg_temp, COUNT(*) as measurements FROM argo_data GROUP BY region;"
    },
    {
      name: "Platform Status",
      query: "SELECT platform_id, COUNT(*) as total_measurements, MAX(timestamp) as last_seen FROM argo_data GROUP BY platform_id;"
    }
  ];

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 border-b border-border/50 bg-background/50 backdrop-blur-md">
        <SidebarTrigger />
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor and manage your ARGO oceanographic database
          </p>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="px-4 pt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="query">SQL Query</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="overview" className="h-full m-0 p-4">
              <div className="grid gap-6 h-full">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Connections</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalConnections}</div>
                      <p className="text-xs text-muted-foreground">Active database connections</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Queries</CardTitle>
                      <Search className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.activeQueries}</div>
                      <p className="text-xs text-muted-foreground">Running queries</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Data Size</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.dataSize}</div>
                      <p className="text-xs text-muted-foreground">Total database size</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.uptime}</div>
                      <p className="text-xs text-muted-foreground">System uptime</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Tables Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                  <Card>
                    <CardHeader>
                      <CardTitle>Database Tables</CardTitle>
                      <CardDescription>Overview of database schema</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[300px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Table</TableHead>
                              <TableHead>Rows</TableHead>
                              <TableHead>Size</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>argo_data</TableCell>
                              <TableCell>125,438</TableCell>
                              <TableCell>1.8 GB</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>platforms</TableCell>
                              <TableCell>1,247</TableCell>
                              <TableCell>12 MB</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>regions</TableCell>
                              <TableCell>45</TableCell>
                              <TableCell>2 MB</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>metadata</TableCell>
                              <TableCell>3,421</TableCell>
                              <TableCell>156 MB</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>Latest database operations</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">INSERT</Badge>
                            <span className="text-sm">New ARGO data batch inserted</span>
                            <span className="text-xs text-muted-foreground ml-auto">2 min ago</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">SELECT</Badge>
                            <span className="text-sm">Temperature query executed</span>
                            <span className="text-xs text-muted-foreground ml-auto">5 min ago</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">UPDATE</Badge>
                            <span className="text-sm">Platform metadata updated</span>
                            <span className="text-xs text-muted-foreground ml-auto">12 min ago</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">SELECT</Badge>
                            <span className="text-sm">Regional analysis query</span>
                            <span className="text-xs text-muted-foreground ml-auto">18 min ago</span>
                          </div>
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="query" className="h-full m-0 p-4">
              <div className="grid gap-6 h-full">
                <Card>
                  <CardHeader>
                    <CardTitle>SQL Query Editor</CardTitle>
                    <CardDescription>Execute custom SQL queries against the database</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {sampleQueries.map((sample, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => setSqlQuery(sample.query)}
                        >
                          {sample.name}
                        </Button>
                      ))}
                    </div>
                    
                    <Textarea
                      placeholder="Enter your SQL query here..."
                      value={sqlQuery}
                      onChange={(e) => setSqlQuery(e.target.value)}
                      className="min-h-[120px] font-mono"
                    />
                    
                    <Button 
                      onClick={executeQuery} 
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Executing...
                        </>
                      ) : (
                        'Execute Query'
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {queryResult && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Query Results</CardTitle>
                      <CardDescription>
                        {queryResult.rows.length} rows returned in {queryResult.duration}ms
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {queryResult.columns.map((column) => (
                                <TableHead key={column}>{column}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {queryResult.rows.map((row, index) => (
                              <TableRow key={index}>
                                {queryResult.columns.map((column) => (
                                  <TableCell key={column}>
                                    {String(row[column] || '')}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="monitoring" className="h-full m-0 p-4">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Monitoring</CardTitle>
                    <CardDescription>Real-time database performance metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                      Performance monitoring charts coming soon...
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="h-full m-0 p-4">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Database Configuration</CardTitle>
                    <CardDescription>Manage database settings and preferences</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                      Database configuration panel coming soon...
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