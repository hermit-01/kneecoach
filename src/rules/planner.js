import { MAX_RUNG, clampRung, rungAt } from './ladder.js';
import { daysBetween } from './dates.js';
import { SOURCES } from './sources.js';
import { EXERCISES, STAGE_UNLOCK_LEVEL } from './exercises.js';

export function initialState() {
  return {
    level: 0,
    streak: 0,
    penalty: {},
    consecutiveRestDays: 0,
    consecutiveWorseMornings: 0,
    lastExerciseDate: null,
    firstExerciseDate: null,
    sixWeekCheckShown: false,
    gapHandledFor: null,
  };
}

// Spec §5.4. Pure: returns a new state and today's decision, and never mutates `state`.
// answers: { pain: 0-10, worse: boolean|null, redFlag: boolean }
// ctx: { today: 'YYYY-MM-DD', yesterday: { exercised: boolean, good: boolean } }
export function morningCheck(state, answers, ctx) {
  const { pain, worse, redFlag } = answers;
  const { today, yesterday } = ctx;
  const s = { ...state, penalty: { ...state.penalty } };
  const reasons = [];
  let seeDoctor = false;
  const restToday = redFlag || pain >= 6;

  // 1. Long break (our rule): more than 7 days since she last exercised.
  if (s.lastExerciseDate && s.gapHandledFor !== s.lastExerciseDate && daysBetween(s.lastExerciseDate, today) > 7) {
    s.level = Math.max(0, s.level - 1);
    s.streak = 0;
    s.gapHandledFor = s.lastExerciseDate;
    reasons.push({ text: 'More than a week off, so we restart one step lower.', source: SOURCES.OURS_LONG_BREAK });
  }

  // 2. How did yesterday's exercise go? This is checked before the rest checks
  //    (spec clarification), so a rest day never grows the streak, but a worse
  //    morning still steps the plan down.
  if (yesterday.exercised) {
    if (worse) {
      s.level = Math.max(0, s.level - 1);
      s.streak = 0;
      s.consecutiveWorseMornings += 1;
      if (s.consecutiveWorseMornings >= 2) seeDoctor = true;
      reasons.push({ text: 'Your knee is worse than yesterday morning, so one step down.', source: SOURCES.NHS_MORNING_AFTER });
    } else {
      s.consecutiveWorseMornings = 0;
      if (yesterday.good && !restToday) {
        s.streak += 1;
        if (s.streak >= 3) {
          s.level = Math.min(MAX_RUNG, s.level + 1);
          s.streak = 0;
          reasons.push({ text: 'Three good days in a row, so one step up.', source: SOURCES.NHS_ADD_REPS });
        }
      }
    }
  }

  // 3. Rest days.
  if (restToday) {
    s.streak = 0;
    s.consecutiveRestDays += 1;
    if (redFlag) {
      reasons.push({ text: 'New pain, swelling or the knee giving way: no exercises today.', source: SOURCES.NHS_STOP_NEW_PAIN });
      return { state: s, decision: { type: 'REST_RED_FLAG', seeDoctor: true, reasons } };
    }
    if (s.consecutiveRestDays >= 2) seeDoctor = true;
    reasons.push({ text: `Morning pain ${pain}/10, so today is a rest day.`, source: SOURCES.OURS_REST_DAY });
    return { state: s, decision: { type: 'REST_PAIN', seeDoctor, reasons } };
  }

  return { state: s, decision: { type: 'EXERCISE', seeDoctor, reasons } };
}

// A day counts as "good" if she did at least one round, every round ended at
// pain 5/10 or below, and she never tapped "Too painful".
export function isGoodDay(day) {
  return day.rounds.length > 0 && day.rounds.every((r) => r.afterPain <= 5 && r.tooPainful.length === 0);
}

// Spec §5.3 and §5.6.
export function buildPlan(state, profile, { skipToday = [] } = {}) {
  const sides = profile.knee === 'both' ? ['left', 'right'] : [profile.knee];
  return EXERCISES
    .filter((ex) => state.level >= STAGE_UNLOCK_LEVEL[ex.stage])
    .filter((ex) => !profile.disabled.includes(ex.id) && !skipToday.includes(ex.id))
    .map((ex) => {
      const rung = clampRung(state.level - STAGE_UNLOCK_LEVEL[ex.stage] - (state.penalty[ex.id] ?? 0));
      const { sets, reps } = rungAt(rung);
      const holdSeconds = ex.holdGrows ? Math.min(20, 5 + 5 * rung) : ex.holdSeconds;
      return { exercise: ex, rung, sets, reps, holdSeconds, sides: ex.perSide ? sides : ['both'] };
    });
}

// Spec §5.5. result: { afterPain: 0-10, tooPainful: string[] }
export function afterRound(state, result, today) {
  const s = { ...state, penalty: { ...state.penalty } };
  const reasons = [];
  for (const id of result.tooPainful) s.penalty[id] = (s.penalty[id] ?? 0) + 1;
  if (result.tooPainful.length > 0) {
    reasons.push({
      text: 'Exercises marked "too painful" will be one step easier from tomorrow. Go slower and rest longer between reps.',
      source: SOURCES.NHS_REDUCE,
    });
  }
  s.lastExerciseDate = today;
  if (!s.firstExerciseDate) s.firstExerciseDate = today;
  s.consecutiveRestDays = 0;
  if (result.afterPain >= 6) {
    s.level = Math.max(0, s.level - 1);
    s.streak = 0;
    reasons.push({ text: `Pain ${result.afterPain}/10 after this round: that's enough for today, and one step down.`, source: SOURCES.NHS_REDUCE });
    return { state: s, outcome: { type: 'TOO_MUCH', reasons } };
  }
  return { state: s, outcome: { type: 'GOOD', reasons } };
}
