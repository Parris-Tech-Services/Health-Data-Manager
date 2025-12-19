import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';

export default function TrendsPage() {
  const [dateRange, setDateRange] = useState<{from: Date, to: Date}>({
      from: subDays(new Date(), 90),
      to: new Date()
  });

  const data = useLiveQuery(async () => {
    // Fetch range
    const fromStr = dateRange.from.toISOString();
    const toStr = dateRange.to.toISOString();

    const hrv = await db.hrvMeasurements
        .where('ts')
        .between(fromStr, toStr)
        .toArray();

    const weight = await db.weightMeasurements
        .where('ts')
        .between(fromStr, toStr)
        .toArray();

    // Group by day for cleaner charting (taking average if multiple per day)
    const dailyMap = new Map<string, any>();

    hrv.forEach(h => {
        const key = format(new Date(h.ts), 'yyyy-MM-dd');
        if (!dailyMap.has(key)) dailyMap.set(key, { date: key, dateObj: new Date(h.ts) });
        const entry = dailyMap.get(key);
        
        // Simple accumulation for average
        if (!entry.rmssdSum) { entry.rmssdSum = 0; entry.rmssdCount = 0; }
        entry.rmssdSum += h.rmssd;
        entry.rmssdCount++;
    });

    weight.forEach(w => {
        const key = format(new Date(w.ts), 'yyyy-MM-dd');
        if (!dailyMap.has(key)) dailyMap.set(key, { date: key, dateObj: new Date(w.ts) });
        const entry = dailyMap.get(key);
        
        // Keep last weight of the day usually best? Or average? Let's do average.
        if (!entry.weightSum) { entry.weightSum = 0; entry.weightCount = 0; }
        entry.weightSum += w.weightKg;
        entry.weightCount++;
    });

    const chartData = Array.from(dailyMap.values()).map(d => ({
        ...d,
        rmssd: d.rmssdSum ? Math.round(d.rmssdSum / d.rmssdCount) : null,
        weight: d.weightSum ? Number((d.weightSum / d.weightCount).toFixed(1)) : null,
        formattedDate: format(d.dateObj, 'MMM d')
    })).sort((a, b) => a.date.localeCompare(b.date));

    return chartData;
  }, [dateRange]);

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Trends</h1>
          
          <div className="flex items-center gap-2">
             <Button 
                variant="outline" 
                size="sm"
                onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })}
             >
                Last 30 Days
             </Button>
             <Button 
                variant="outline" 
                size="sm"
                onClick={() => setDateRange({ from: subDays(new Date(), 90), to: new Date() })}
             >
                Last 90 Days
             </Button>
             <Button 
                variant="outline" 
                size="sm"
                onClick={() => setDateRange({ from: subDays(new Date(), 365), to: new Date() })}
             >
                1 Year
             </Button>
          </div>
        </div>

        {/* Charts */}
        <div className="grid gap-6">
            
            {/* HRV Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>HRV (RMSSD)</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] w-full">
                    {data && data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis 
                                    dataKey="formattedDate" 
                                    tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}} 
                                    tickLine={false}
                                    axisLine={false}
                                    minTickGap={30}
                                />
                                <YAxis 
                                    domain={['auto', 'auto']} 
                                    tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}} 
                                    tickLine={false}
                                    axisLine={false}
                                    width={30}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '3 3' }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="rmssd" 
                                    stroke="hsl(var(--chart-2))" 
                                    strokeWidth={2} 
                                    dot={false}
                                    activeDot={{ r: 4, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            No HRV data in this range
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Weight Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Weight Trend</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] w-full">
                     {data && data.filter(d => d.weight).length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.filter(d => d.weight)}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis 
                                    dataKey="formattedDate" 
                                    tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}} 
                                    tickLine={false}
                                    axisLine={false}
                                    minTickGap={30}
                                />
                                <YAxis 
                                    domain={['dataMin - 1', 'dataMax + 1']} 
                                    tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}} 
                                    tickLine={false}
                                    axisLine={false}
                                    width={30}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="weight" 
                                    stroke="hsl(var(--chart-3))" 
                                    strokeWidth={2} 
                                    dot={false}
                                    activeDot={{ r: 4, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            No weight data in this range
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>
      </div>
    </Shell>
  );
}
