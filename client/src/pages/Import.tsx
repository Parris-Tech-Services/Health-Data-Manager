import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { UploadCloud, CheckCircle, AlertTriangle, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { computeSha256 } from '@/lib/normalize';
import { db } from '@/lib/db';
import { parseAndImportWelltoryHrv } from '@/lib/importers/welltoryHrv';
import { parseAndImportWelltoryRr } from '@/lib/importers/welltoryRr';
import { parseAndImportWithingsWeight } from '@/lib/importers/withingsWeight';
import { cn } from '@/lib/utils';

export default function ImportPage() {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<Array<{ name: string; imported: number; errors: number; status: 'success' | 'error' | 'skipped' }>>([]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setProcessing(true);
    setResults([]);

    const newResults = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const sha256 = await computeSha256(file);
        
        // Check duplication
        const existing = await db.files.where('sha256').equals(sha256).first();
        if (existing) {
           newResults.push({ name: file.name, imported: 0, errors: 0, status: 'skipped' as const });
           continue;
        }

        let importResult = { imported: 0, errors: 0 };
        let source = 'Unknown';

        // Detect file type by name
        if (file.name.toLowerCase().includes('hrv_data_export')) {
           source = 'Welltory HRV';
           importResult = await parseAndImportWelltoryHrv(file, 0);
        } else if (file.name.toLowerCase().includes('rr_export')) {
           source = 'Welltory RR';
           importResult = await parseAndImportWelltoryRr(file, 0);
        } else if (file.name.toLowerCase().includes('weight')) {
           source = 'Withings Weight';
           importResult = await parseAndImportWithingsWeight(file, 0);
        } else {
           // Fallback or unknown
           newResults.push({ name: file.name, imported: 0, errors: 1, status: 'error' as const });
           continue;
        }

        // Record file in DB
        await db.files.add({
            name: file.name,
            source,
            sha256,
            importedAt: new Date().toISOString(),
            rowCount: importResult.imported,
            errorCount: importResult.errors
        });

        newResults.push({ 
            name: file.name, 
            imported: importResult.imported, 
            errors: importResult.errors, 
            status: 'success' as const 
        });

      } catch (e) {
        console.error(e);
        newResults.push({ name: file.name, imported: 0, errors: 1, status: 'error' as const });
      }
    }

    setResults(newResults);
    setProcessing(false);
    toast({ title: "Import complete", description: `Processed ${files.length} files.` });
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    await processFiles(e.dataTransfer.files);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await processFiles(e.target.files);
  };

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Import Data</h1>
          <p className="text-muted-foreground mt-2">
            Drag and drop your exports here. Currently supporting: Welltory (CSV), Withings (CSV).
          </p>
        </div>

        <Card 
          className={cn(
            "border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center justify-center p-12 text-center",
            isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
            processing ? "opacity-50 pointer-events-none" : ""
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <input 
            type="file" 
            id="file-upload" 
            multiple 
            className="hidden" 
            accept=".csv,.json"
            onChange={handleFileSelect}
          />
          
          {processing ? (
            <div className="flex flex-col items-center animate-pulse">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-lg font-medium">Processing files...</p>
                <p className="text-sm text-muted-foreground">Parsing records into local database</p>
            </div>
          ) : (
            <>
                <div className="h-16 w-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                    <UploadCloud className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Click to upload or drag and drop</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Supports Welltory HRV/RR exports and Withings Weight exports. 
                    Files are processed entirely in your browser.
                </p>
            </>
          )}
        </Card>

        {results.length > 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="font-semibold text-lg">Import Results</h3>
                <div className="grid gap-3">
                    {results.map((res, i) => (
                        <Alert key={i} variant={res.status === 'error' ? 'destructive' : 'default'} className={cn(res.status === 'success' ? 'border-primary/20 bg-primary/5' : '')}>
                            {res.status === 'success' && <CheckCircle className="h-4 w-4 text-primary" />}
                            {res.status === 'skipped' && <FileText className="h-4 w-4 text-muted-foreground" />}
                            {res.status === 'error' && <AlertTriangle className="h-4 w-4" />}
                            <AlertTitle className="flex items-center gap-2">
                                {res.name}
                                {res.status === 'skipped' && <span className="text-xs font-normal text-muted-foreground">(Duplicate)</span>}
                            </AlertTitle>
                            <AlertDescription>
                                {res.status === 'success' ? (
                                    <span>Successfully imported <strong>{res.imported}</strong> records.</span>
                                ) : res.status === 'skipped' ? (
                                    <span>File has already been imported. No new records added.</span>
                                ) : (
                                    <span>Failed to parse file.</span>
                                )}
                            </AlertDescription>
                        </Alert>
                    ))}
                </div>
            </div>
        )}
      </div>
    </Shell>
  );
}
