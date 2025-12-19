import Dexie, { type EntityTable } from 'dexie';

export interface FileRecord {
  id?: number;
  name: string;
  source: string;
  sha256: string;
  importedAt: string;
  rowCount: number;
  errorCount: number;
}

export interface HrvMeasurement {
  id: string; // source + person + ts
  source: string;
  person: string;
  ts: string; // ISO string
  hr: number;
  rmssd: number;
  sdnn: number;
  lfhf?: number;
  rawJson: any;
}

export interface RrSession {
  id: string; // source + person + ts
  source: string;
  person: string;
  ts: string; // ISO string
  rrIntervalsMs: number[];
  meanRR: number;
  medianRR: number;
  count: number;
  approxHR: number;
  linkedHrvId?: string;
}

export interface WeightMeasurement {
  id: string; // source + person + ts
  source: string;
  person: string;
  ts: string; // ISO string
  weightKg: number;
  bmi?: number;
  bodyFatPct?: number;
  muscleMassKg?: number;
  rawJson: any;
}

export interface DailyTags {
  id: string; // dateKey + person
  person: string;
  dateKey: string; // YYYY-MM-DD
  tags: string[]; // e.g. ["sick", "alcohol", "late_meal"]
  notes?: string;
}

const db = new Dexie('JoshHealthHubDB') as Dexie & {
  files: EntityTable<FileRecord, 'id'>;
  hrvMeasurements: EntityTable<HrvMeasurement, 'id'>;
  rrSessions: EntityTable<RrSession, 'id'>;
  weightMeasurements: EntityTable<WeightMeasurement, 'id'>;
  dailyTags: EntityTable<DailyTags, 'id'>;
};

db.version(1).stores({
  files: '++id, sha256, source, importedAt',
  hrvMeasurements: 'id, source, person, ts, [person+ts]',
  rrSessions: 'id, source, person, ts, linkedHrvId',
  weightMeasurements: 'id, source, person, ts, [person+ts]',
  dailyTags: 'id, person, dateKey, [person+dateKey]'
});

export { db };
