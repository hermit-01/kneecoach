import { MAX_RUNG } from './ladder.js';
import { daysBetween } from './dates.js';
import { SOURCES } from './sources.js';

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
