import { doseText } from '../rules/ladder.js';
import { estimateMinutes } from '../app/screen.js';

export default function Plan({ view, decision, plan, rounds, onStart, top = null }) {
  const banners = (
    <>
      {decision.seeDoctor && <div className="banner">Please talk to your treating doctor about your knee.</div>}
      {decision.sixWeekMessage && (
        <div className="banner">
          Six weeks in, your morning pain is not lower than in week one. NHS inform advises seeing a healthcare professional
          if knee pain hasn't improved within 6 weeks.
        </div>
      )}
    </>
  );
  const reasons = decision.reasons.map((r, i) => (
    <p className="reason" key={i}>{r.text} <em>({r.source})</em></p>
  ));

  if (view === 'rest') {
    return (
      <main className="screen">
        {top}
        <h1>Rest day today</h1>
        {banners}
        {reasons}
        <p>Check in again tomorrow morning.</p>
      </main>
    );
  }
  if (view === 'all-off') {
    return (
      <main className="screen">
        {top}
        <h1>No exercises switched on</h1>
        <p>All of today's exercises are switched off in Settings. Switch some back on to get a plan.</p>
      </main>
    );
  }
  return (
    <main className="screen">
      {top}
      <h1>Today: {plan.length} exercises, about {estimateMinutes(plan)} minutes</h1>
      {banners}
      {plan.map((p) => (
        <div className="card" key={p.exercise.id}>
          <strong>{p.exercise.name}</strong> <span className="muted">({p.exercise.clinicalName})</span>
          <div>
            {doseText(p)}
            {p.holdSeconds ? `, hold ${p.holdSeconds} s` : ''}
            {p.sides.length > 1 ? ', each leg' : ''}
          </div>
        </div>
      ))}
      {reasons}
      <p className="muted">
        {rounds.done >= rounds.target
          ? `${rounds.done} rounds done today. Well done!`
          : `Round ${rounds.done + 1} of ${rounds.target} today. One round still counts.`}
      </p>
      {rounds.canStartAnother ? (
        <button type="button" className="btn primary" onClick={onStart}>{rounds.done === 0 ? 'Start' : 'Start another round'}</button>
      ) : (
        <div className="card">That's enough for today. Rest, and check in again tomorrow morning.</div>
      )}
    </main>
  );
}
