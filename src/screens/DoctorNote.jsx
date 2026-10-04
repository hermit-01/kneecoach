import { useEffect, useState } from 'react';
import { getDaysBetween } from '../data/db.js';
import { addDays } from '../rules/dates.js';
import { doctorStats, statsSummaryText } from '../stats/doctorStats.js';
import { saveNotes } from '../app/actions.js';

export default function DoctorNote({ db, today, state, todayNotes }) {
  const [stats, setStats] = useState(null);
  const [notes, setNotes] = useState(todayNotes);

  useEffect(() => {
    getDaysBetween(db, addDays(today, -13), today).then((days) => setStats(doctorStats(days, today)));
  }, [db, today]);

  if (!stats) return <main className="screen"><p>Loading…</p></main>;
  const text = statsSummaryText(stats, state);
  return (
    <main className="screen">
      <h1>For your doctor</h1>
      <PainChart series={stats.series} />
      <p className="muted">Orange: morning pain · Green dashes: highest pain after a round · 0-10 NRS</p>
      <div className="card"><pre className="summary">{text}</pre></div>
      <h2>Your notes for today</h2>
      <textarea
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => saveNotes(db, today, notes)}
        placeholder="For example: stiff after the stairs"
      />
      <div className="row">
        <button type="button" className="btn" onClick={() => window.print()}>Print</button>
        {navigator.share && (
          <button type="button" className="btn primary" onClick={() => navigator.share({ title: 'KneeCoach summary', text })}>Share</button>
        )}
      </div>
    </main>
  );
}

function PainChart({ series }) {
  const w = 320;
  const h = 120;
  const step = w / (series.length - 1);
  const points = (key) =>
    series
      .map((s, i) => (s[key] === null ? null : `${Math.round(i * step)},${Math.round(h - (s[key] / 10) * h)}`))
      .filter(Boolean)
      .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chart" role="img" aria-label="Pain over the last 14 days">
      <polyline fill="none" stroke="#c97f05" strokeWidth="3" points={points('morningPain')} />
      <polyline fill="none" stroke="#2f9e57" strokeWidth="3" strokeDasharray="6 4" points={points('afterPain')} />
    </svg>
  );
}
