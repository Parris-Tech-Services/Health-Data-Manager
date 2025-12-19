import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { TrendingUp, Activity, Scale, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const stats = useLiveQuery(async () => {
    const hrvCount = await db.hrvMeasurements.count();
    const rrCount = await db.rrSessions.count();
    const weightCount = await db.weightMeasurements.count();
    const fileCount = await db.files.count();

    const lastHrv = await db.hrvMeasurements.orderBy('ts').last();
    const lastWeight = await db.weightMeasurements.orderBy('ts').last();

    return { hrvCount, rrCount, weightCount, fileCount, lastHrv, lastWeight };
  });

  return (
    <Shell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Health Overview</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, Josh. Here's your latest data snapshot.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           {/* HRV Card */}
           <Card className="hover:border-primary/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last HRV (RMSSD)</CardTitle>
                <Activity className="h-4 w-4 text-chart-2" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">
                    {stats?.lastHrv?.rmssd ? Math.round(stats.lastHrv.rmssd) : '--'}
                    <span className="text-sm font-sans font-normal text-muted-foreground ml-1">ms</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.lastHrv ? new Date(stats.lastHrv.ts).toLocaleDateString() : 'No data'}
                </p>
              </CardContent>
           </Card>

           {/* Weight Card */}
           <Card className="hover:border-primary/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Latest Weight</CardTitle>
                <Scale className="h-4 w-4 text-chart-3" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">
                    {stats?.lastWeight?.weightKg ? stats.lastWeight.weightKg.toFixed(1) : '--'}
                    <span className="text-sm font-sans font-normal text-muted-foreground ml-1">kg</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                   {stats?.lastWeight ? new Date(stats.lastWeight.ts).toLocaleDateString() : 'No data'}
                </p>
              </CardContent>
           </Card>

           {/* Data Volume */}
           <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Measurements</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">
                    {((stats?.hrvCount || 0) + (stats?.weightCount || 0)).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    {stats?.fileCount || 0} files imported
                </p>
              </CardContent>
           </Card>
           
           {/* Action Card */}
           <Link href="/import">
             <Card className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 transition-colors border-none shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white/90">Upload New Data</CardTitle>
                    <UploadIcon className="h-4 w-4 text-white/80" />
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-white/80 mt-2">
                        Drag & drop new CSV exports to update your trends.
                    </div>
                </CardContent>
             </Card>
           </Link>
        </div>

        {(!stats?.hrvCount && !stats?.weightCount) && (
            <div className="rounded-lg border border-dashed border-border p-12 text-center">
                <div className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4">
                    <AlertCircle className="h-full w-full" />
                </div>
                <h3 className="text-lg font-medium">No data found</h3>
                <p className="text-muted-foreground max-w-md mx-auto mt-2 mb-6">
                    This is a fresh database. Head over to the import page to upload your Welltory and Withings exports.
                </p>
                <Link href="/import">
                    <Button>Get Started</Button>
                </Link>
            </div>
        )}
      </div>
    </Shell>
  );
}

function UploadIcon(props: any) {
    return (
        <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
    )
}
