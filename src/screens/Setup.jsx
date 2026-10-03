import { useState } from 'react';
import { dailyReminderUrl } from '../lib/calendar.js';
import { NHS_URL } from '../rules/exercises.js';

export default function Setup({ today, onDone }) {
  const [knee, setKnee] = useState(null);
  const [time, setTime] = useState('08:00');
  return (
    <main className="screen">
      <h1>Welcome to KneeCoach</h1>
      <p>A daily knee routine based on the NHS inform programme for knee osteoarthritis, with a private helper that runs on this phone.</p>
      <h2>Which knee is sore?</h2>
      <div className="row">
        {['left', 'right', 'both'].map((k) => (
          <button key={k} type="button" className={`btn ${knee === k ? 'primary' : ''}`} onClick={() => setKnee(k)}>
            {k[0].toUpperCase() + k.slice(1)}
          </button>
        ))}
      </div>
      <h2>What time suits you for exercises?</h2>
      <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      <a className="btn" href={dailyReminderUrl({ time, startDate: today })} target="_blank" rel="noreferrer">
        Add a daily reminder to my calendar
      </a>
      <div className="card">
        <p>
          <strong>Safety first.</strong> Stop if an exercise causes new pain, and talk to your treating doctor. The exercises
          are based on <a href={NHS_URL} target="_blank" rel="noreferrer">NHS inform</a>.
        </p>
      </div>
      <button type="button" className="btn primary" disabled={!knee} onClick={() => onDone({ knee, exerciseTime: time })}>
        Start
      </button>
    </main>
  );
}
