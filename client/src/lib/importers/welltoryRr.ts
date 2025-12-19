import Papa from 'papaparse';
import { db, type RrSession } from '../db';
import { generateId, DEFAULT_PERSON } from '../normalize';

export async function parseAndImportWelltoryRr(file: File, fileId: number) {
  return new Promise<{ imported: number; errors: number }>((resolve) => {
    Papa.parse(file, {
      header: true, // The headers ARE the timestamps in this specific format
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: async (results) => {
        let imported = 0;
        let errors = 0;
        
        // Structure:
        // Header: "2025-07-25 21:37:00", "2025-07-26 08:00:00", ...
        // Row 1: 800, 810, ...
        // Row 2: 805, 812, ...
        
        const timestamps = results.meta.fields || [];
        const data = results.data as any[];
        
        const sessions: RrSession[] = [];

        for (const tsRaw of timestamps) {
           try {
             // Parse the timestamp from the header
             // Format example: "25 Jul 2025, 9_37 PM" or standard ISO depending on export
             // The filename suggests "25 Jul 2025, 9_37 PM" style headers sometimes, 
             // but let's assume standard Date parsing works or try to fix it.
             
             let cleanTs = tsRaw.replace(/_/g, ':'); // Fix "9_37" to "9:37"
             const date = new Date(cleanTs);
             if (isNaN(date.getTime())) {
                 console.warn('Invalid date header:', tsRaw);
                 errors++;
                 continue;
             }
             const ts = date.toISOString();

             // Collect all RR intervals for this column
             const rrIntervalsMs: number[] = [];
             for (const row of data) {
                 const val = row[tsRaw];
                 if (typeof val === 'number' && val > 0) {
                     rrIntervalsMs.push(val);
                 }
             }

             if (rrIntervalsMs.length === 0) {
                 continue;
             }

             // Calculate stats
             const sum = rrIntervalsMs.reduce((a, b) => a + b, 0);
             const meanRR = sum / rrIntervalsMs.length;
             const sorted = [...rrIntervalsMs].sort((a, b) => a - b);
             const medianRR = sorted[Math.floor(sorted.length / 2)];
             const approxHR = 60000 / meanRR;

             const record: RrSession = {
                 id: generateId('WelltoryRR', DEFAULT_PERSON, ts),
                 source: 'WelltoryRR',
                 person: DEFAULT_PERSON,
                 ts,
                 rrIntervalsMs,
                 meanRR,
                 medianRR,
                 count: rrIntervalsMs.length,
                 approxHR
             };
             
             sessions.push(record);
             imported++;
           } catch (e) {
               console.error('Column parse error', e);
               errors++;
           }
        }

        if (sessions.length > 0) {
            await db.rrSessions.bulkPut(sessions);
        }

        resolve({ imported, errors });
      },
      error: (err) => {
          console.error('CSV parse error', err);
          resolve({ imported: 0, errors: 1 });
      }
    });
  });
}
