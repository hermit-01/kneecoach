// Where each rule comes from (spec §5). Shown to her next to every plan change.
export const SOURCES = {
  NHS_STOP_NEW_PAIN: 'NHS inform: stop the exercises if they cause new pain',
  NHS_MORNING_AFTER: 'NHS inform: knee pain should be no worse the morning after exercising',
  NHS_ADD_REPS: 'NHS inform: add 1 or 2 reps every few days as it gets easier',
  NHS_REDUCE: 'NHS inform: keep pain at 5/10 or below; above that, do fewer reps, go slower and rest longer',
  NHS_SIX_WEEKS: 'NHS inform: see a healthcare professional if knee pain has not improved within 6 weeks',
  OURS_REST_DAY: 'KneeCoach rule: rest on mornings when pain is 6/10 or more',
  OURS_LONG_BREAK: 'KneeCoach rule: after more than 7 days off, restart one step lower',
};
