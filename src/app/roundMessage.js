// After a round, code decides the facts (spec §6.2, job 3). Gemma may phrase them
// (Task 15); this is the fixed wording used when the helper isn't available.
export function roundFacts({ outcome, afterPain, state, roundsDone }) {
  return {
    afterPain,
    band: afterPain <= 3 ? 'minimal' : afterPain <= 5 ? 'acceptable' : 'too much',
    tooMuch: outcome.type === 'TOO_MUCH',
    goodDaysInARow: state.streak,
    roundsDone,
    changes: outcome.reasons.map((r) => r.text),
  };
}

export function fixedRoundMessage(f) {
  if (f.tooMuch) {
    return `Pain ${f.afterPain}/10 is more than the NHS advises during exercise, so that's enough for today. Tomorrow's plan will be one step easier.`;
  }
  const first = `${f.afterPain}/10 is ${f.band === 'minimal' ? 'minimal' : 'within the acceptable range'}. Well done.`;
  const next = f.roundsDone >= 2 ? 'Both rounds are done for today.' : 'If you can, do a second round later today.';
  return `${first} ${next} We'll check your knee again tomorrow morning.`;
}
