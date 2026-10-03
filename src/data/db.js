import { openDB } from 'idb';
import { initialState } from '../rules/planner.js';

// Everything she enters is stored only in this phone's browser storage (spec §7.3).
export const DB_NAME = 'kneecoach';

export function openKneeDb(name = DB_NAME) {
  return openDB(name, 1, {
    upgrade(db) {
      db.createObjectStore('kv'); // 'profile', 'planState'
      db.createObjectStore('days'); // key: 'YYYY-MM-DD'
      db.createObjectStore('modelChunks'); // key: piece number, value: Blob
    },
  });
}

export function emptyDay(date) {
  return { date, morning: null, decision: null, rounds: [], skippedToday: [], notes: '' };
}

export async function getProfile(db) {
  return (await db.get('kv', 'profile')) ?? null;
}

export async function saveProfile(db, profile) {
  await db.put('kv', profile, 'profile');
}

export async function getPlanState(db) {
  return (await db.get('kv', 'planState')) ?? initialState();
}

export async function savePlanState(db, state) {
  await db.put('kv', state, 'planState');
}

export async function getDay(db, date) {
  return (await db.get('days', date)) ?? emptyDay(date);
}

export async function saveDay(db, day) {
  await db.put('days', day, day.date);
}

export async function getDaysBetween(db, from, to) {
  return db.getAll('days', IDBKeyRange.bound(from, to));
}
