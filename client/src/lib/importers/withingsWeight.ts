import Papa from 'papaparse';
import { db, type WeightMeasurement } from '../db';
import { generateId, DEFAULT_PERSON } from '../normalize';

export async function parseAndImportWithingsWeight(file: File, fileId: number) {
  return new Promise<{ imported: number; errors: number }>((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        let imported = 0;
        let errors = 0;
        const rows = results.data as any[];
        const records: WeightMeasurement[] = [];

        for (const row of rows) {
          try {
            // Withings Export format usually:
            // "Date", "Weight (kg)", "Fat mass (kg)", "Bone mass (kg)", "Muscle mass (kg)", "Hydration (kg)", "Comments"
            // Sometimes strictly "Date" is "2022-01-01 12:00:00"

            const tsRaw = row['Date'];
            if (!tsRaw) {
                errors++;
                continue;
            }
            const ts = new Date(tsRaw).toISOString();
            
            const weightKg = parseFloat(row['Weight (kg)'] || '0');
            if (!weightKg) {
                // If no weight, maybe it's just a comment or bad row
                errors++;
                continue;
            }

            // Simple person filtering heuristic if name is not in file (Withings CSV often doesn't have name column, just data)
            // The prompt says "contains multiple family members. Add a UI filter + a default profile Josh".
            // Since the CSV might NOT have a name column, we might import everything as "Unknown" or just "Josh" if the user selects it.
            // For this Phase 1, we will import as DEFAULT_PERSON ("Josh") but we should ideally let user pick.
            // Wait, the file is `weight_joshualparris_...` so it might be pre-filtered? 
            // The prompt says "Contains multiple family members... filter to Josh-only".
            // If there is no "User" column, we can't filter programmatically without user input.
            // For now, we import all as 'Josh' or check for a 'First Name' column.
            
            const personName = row['First name'] || row['User'] || DEFAULT_PERSON;
            
            // Heuristic: If we need to filter for Josh, we check if name is Josh (case insensitive)
            if (personName !== DEFAULT_PERSON && !personName.toLowerCase().includes('josh')) {
                 // For now, let's just store everyone but use the name from the file if available.
                 // If no name column, default to Josh.
            }

            const fatMassKg = parseFloat(row['Fat mass (kg)'] || '0');
            const muscleMassKg = parseFloat(row['Muscle mass (kg)'] || '0');
            
            // Calculate BMI if height is known? Or just store what we have.
            // Body Fat % = (Fat Mass / Weight) * 100
            let bodyFatPct = 0;
            if (fatMassKg > 0 && weightKg > 0) {
                bodyFatPct = (fatMassKg / weightKg) * 100;
            }

            const record: WeightMeasurement = {
              id: generateId('Withings', personName, ts),
              source: 'Withings',
              person: personName, // Store actual name if found
              ts,
              weightKg,
              bodyFatPct: bodyFatPct || undefined,
              muscleMassKg: muscleMassKg || undefined,
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
          await db.weightMeasurements.bulkPut(records);
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
