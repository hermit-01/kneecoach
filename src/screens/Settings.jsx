import { EXERCISES, NHS_URL } from '../rules/exercises.js';
import { SOURCES } from '../rules/sources.js';

export default function Settings({ profile, onToggle }) {
  return (
    <main className="screen">
      <h1>Settings</h1>
      <h2>Exercises</h2>
      <p className="muted">Switch off any exercise your treating doctor doesn't want you doing. Reps are set automatically.</p>
      {EXERCISES.map((ex) => (
        <label className="card toggle" key={ex.id}>
          <input type="checkbox" checked={!profile.disabled.includes(ex.id)} onChange={(e) => onToggle(ex.id, e.target.checked)} />
          <span>
            <strong>{ex.name}</strong> <span className="muted">({ex.clinicalName}) · stage {ex.stage}</span>
          </span>
        </label>
      ))}
      <h2>Exercise guide (for your review)</h2>
      {EXERCISES.map((ex) => (
        <div className="card" key={`guide-${ex.id}`}>
          <strong>{ex.name}</strong> <span className="muted">({ex.clinicalName})</span>
          <ol>{ex.steps.map((s) => <li key={s}>{s}</li>)}</ol>
        </div>
      ))}
      <h2>Where the rules come from</h2>
      <ul>{Object.values(SOURCES).map((s) => <li key={s} className="reason">{s}</li>)}</ul>
      <p className="muted">
        Exercises are written in our own words, based on the{' '}
        <a href={NHS_URL} target="_blank" rel="noreferrer">NHS inform programme for knee osteoarthritis</a>. KneeCoach is not
        affiliated with the NHS.
      </p>
    </main>
  );
}
