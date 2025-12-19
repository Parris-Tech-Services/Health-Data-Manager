import Papa from 'papaparse';
import { db, type HrvMeasurement } from '../db';
import { generateId, normalizeTimestamp, DEFAULT_PERSON } from '../normalize';

export async function parseAndImportWelltoryHrv(file: File, fileId: number) {
  return new Promise<{ imported: number; errors: number }>((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        let imported = 0;
        let errors = 0;
        const rows = results.data as any[];

        const records: HrvMeasurement[] = [];

        for (const row of rows) {
          try {
            // Welltory CSV fields usually look like:
            // "Day", "Time", "RMSSD", "SDNN", "Mean RR", "Score", etc.
            // Or sometimes they are just one timestamp field.
            // Let's look for standard Welltory export columns.
            
            // Note: Welltory exports can vary. We'll try to detect the timestamp.
            // Often it's in a column named "Time" or "Date" or combined.
            // Based on user prompt: "measurement timestamp, HR, RMSSD, SDNN"
            
            // Common keys in Welltory export: "Date" (e.g. 25.07.2025 00:00:00) or separate Day/Time
            // Let's assume a standard format or robustly search for it.
            
            const tsRaw = row['Date'] || row['Time'] || row['timestamp'];
            if (!tsRaw) {
              errors++;
              continue;
            }

            // Parse timestamp - Welltory often uses DD.MM.YYYY HH:mm:ss
            // We might need custom parsing if Date.parse fails
            let ts: string;
            if (tsRaw.includes('.')) {
                // simple hack for DD.MM.YYYY
                const [datePart, timePart] = tsRaw.split(' ');
                const [d, m, y] = datePart.split('.');
                ts = new Date(`${y}-${m}-${d}T${timePart || '00:00:00'}`).toISOString();
            } else {
                ts = new Date(tsRaw).toISOString();
            }
            
            const hr = parseFloat(row['Heart Rate'] || row['HR'] || '0');
            const rmssd = parseFloat(row['RMSSD'] || '0');
            const sdnn = parseFloat(row['SDNN'] || '0');
            const lfhf = parseFloat(row['LF/HF'] || '0');

            if (!rmssd && !sdnn) {
                 // skip empty or meaningless rows
                 errors++;
                 continue;
            }

            const record: HrvMeasurement = {
              id: generateId('Welltory', DEFAULT_PERSON, ts),
              source: 'Welltory',
              person: DEFAULT_PERSON,
              ts,
              hr,
              rmssd,
              sdnn,
              lfhf,
              rawJson: row
            };

            records.push(record);
            imported++;
          } catch (e) {
            console.error('Row parse error', e);
            errors++;
          }
        }

        if (records.length > 0) {
          await db.hrvMeasurements.bulkPut(records);
        }
        
        // Update file record stats if needed (skipped for now for speed)
        resolve({ imported, errors });
      },
      error: (err) => {
        console.error('CSV parse error', err);
        resolve({ imported: 0, errors: 1 });
      }
    });
  });
}
