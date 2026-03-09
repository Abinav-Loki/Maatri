import Dexie from 'dexie';

export const db = new Dexie('MaatriShieldDB');

db.version(1).stores({
    vitals: '++id, user_email, timestamp, synced',
    messages: '++id, from_email, to_email, timestamp, synced',
    ai_chat: 'user_email, updatedAt, synced',
    clinical_reports: '++id, patient_email, timestamp, synced',
    notifications: '++id, user_email, type, timestamp, read'
});

export default db;
