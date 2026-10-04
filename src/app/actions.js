import { addDays } from '../rules/dates.js';
import { morningCheck, afterRound, buildPlan, isGoodDay } from '../rules/planner.js';
import { sixWeekCheck } from '../rules/sixWeek.js';
import { doctorStats } from '../stats/doctorStats.js';
import { getDay, saveDay, getPlanState, savePlanState, getProfile, saveProfile, getDaysBetween } from '../data/db.js';

// Glue between the screens, the rules and storage. Each function loads what it
// needs, calls the pure rules, saves the result, and returns what the screen shows.

export async function loadToday(db, today) {
  const [profile, state, day, yesterdayLog] = await Promise.all([
    getProfile(db), getPlanState(db), getDay(db, today), getDay(db, addDays(today, -1)),
  ]);
  const yesterday = { exercised: yesterdayLog.rounds.length > 0, good: isGoodDay(yesterdayLog) };
  const plan = profile && day.decision?.type === 'EXERCISE' ? buildPlan(state, profile, { skipToday: day.skippedToday }) : [];
  return { profile, state, day, yesterday, plan };
}

export async function completeSetup(db, { knee, exerciseTime }, today) {
  const profile = { knee, exerciseTime, disabled: [], createdAt: today };
  await saveProfile(db, profile);
  return profile;
}

export async function submitMorning(db, answers, today) {
  const { state, day, yesterday, profile } = await loadToday(db, today);
  const result = morningCheck(state, answers, { today, yesterday });
  const history = await getDaysBetween(db, '0000-01-01', today);
  const mornings = Object.fromEntries(history.filter((d) => d.morning).map((d) => [d.date, d.morning.pain]));
  mornings[today] = answers.pain;
  const six = sixWeekCheck(result.state, mornings, today);
  const decision = six.show ? { ...result.decision, sixWeekMessage: true } : result.decision;
  const newDay = { ...day, morning: answers, decision };
  await Promise.all([savePlanState(db, six.state), saveDay(db, newDay)]);
  const plan = decision.type === 'EXERCISE' ? buildPlan(six.state, profile, { skipToday: newDay.skippedToday }) : [];
  return { state: six.state, day: newDay, decision, plan };
}

export async function finishRound(db, { completed, tooPainful, afterPain }, today) {
  const [state, day] = await Promise.all([getPlanState(db), getDay(db, today)]);
  const { state: newState, outcome } = afterRound(state, { afterPain, tooPainful }, today);
  const newDay = {
    ...day,
    rounds: [...day.rounds, { completed, tooPainful, afterPain }],
    skippedToday: [...new Set([...day.skippedToday, ...tooPainful])],
  };
  await Promise.all([savePlanState(db, newState), saveDay(db, newDay)]);
  return { state: newState, day: newDay, outcome };
}

export async function setExerciseEnabled(db, exerciseId, enabled) {
  const profile = await getProfile(db);
  const disabled = enabled
    ? profile.disabled.filter((id) => id !== exerciseId)
    : [...new Set([...profile.disabled, exerciseId])];
  const updated = { ...profile, disabled };
  await saveProfile(db, updated);
  return updated;
}

export async function saveNotes(db, today, notes) {
  const day = await getDay(db, today);
  await saveDay(db, { ...day, notes });
}

// Rounds: aim for 2 a day, and 1 still counts. No more rounds after one that hurt (spec §4).
export function roundsStatus(day) {
  return {
    done: day.rounds.length,
    target: 2,
    canStartAnother: !day.rounds.some((r) => r.afterPain >= 6),
  };
}

// The Doctor tab reads her notes straight from storage each time it opens: a copy held
// by the app went stale between tabs, and tapping out of the box then overwrote her note.
export async function loadDoctorNote(db, today) {
  const days = await getDaysBetween(db, addDays(today, -13), today);
  return { stats: doctorStats(days, today), todayNotes: days.find((d) => d.date === today)?.notes ?? '' };
}
