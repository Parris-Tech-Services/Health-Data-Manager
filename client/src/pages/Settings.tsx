import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Database, Download } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';

export default function SettingsPage() {
  const { toast } = useToast();
  
  const stats = useLiveQuery(async () => {
      const fileCount = await db.files.count();
      const recordCount = (await db.hrvMeasurements.count()) + (await db.weightMeasurements.count()) + (await db.rrSessions.count());
      return { fileCount, recordCount };
  });

  const handleReset = async () => {
    if (confirm("Are you sure? This will delete all local data. This cannot be undone.")) {
      await db.delete();
      await db.open();
      toast({ title: "Database reset", description: "All local data has been cleared." });
      window.location.reload();
    }
  };

  const handleExport = async () => {
      // Simple JSON export of all tables
      const data = {
          files: await db.files.toArray(),
          hrv: await db.hrvMeasurements.toArray(),
          rr: await db.rrSessions.toArray(),
          weight: await db.weightMeasurements.toArray(),
          tags: await db.dailyTags.toArray(),
          exportedAt: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `joshhealthhub-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      toast({ title: "Export ready", description: "Download started." });
  };

  return (
    <Shell>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your local database and preferences.
          </p>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Data Management
                </CardTitle>
                <CardDescription>
                    Your data is stored locally in your browser (IndexedDB).
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                    <div>
                        <div className="font-medium">Storage Stats</div>
                        <div className="text-sm text-muted-foreground">
                            {stats?.fileCount || 0} files imported, {stats?.recordCount || 0} total records.
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-4 pt-4">
                    <Button variant="outline" onClick={handleExport} className="flex-1">
                        <Download className="mr-2 h-4 w-4" />
                        Export JSON Backup
                    </Button>
                    <Button variant="destructive" onClick={handleReset} className="flex-1">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Reset Database
                    </Button>
                </div>
            </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
