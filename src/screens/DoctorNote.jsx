import { useEffect, useRef, useState } from 'react';
import { statsSummaryText, withTodayNote } from '../stats/doctorStats.js';
import { saveNotes, loadDoctorNote } from '../app/actions.js';

export default function DoctorNote({ db, today, state }) {
  const [stats, setStats] = useState(null);
  const [notes, setNotes] = useState('');
  const pending = useRef(null); // note text not saved yet
  const timer = useRef(null);

  // Her notes come from storage every time the tab opens, never from a copy held by the app.
  useEffect(() => {
    loadDoctorNote(db, today).then(({ stats: loaded, todayNotes }) => {
      setStats(loaded);
      setNotes(todayNotes);
    });
  }, [db, today]);

  // Save as she types, and at once if she leaves the tab or switches apps.
  function flush() {
    clearTimeout(timer.current);
    if (pending.current === null) return;
    saveNotes(db, today, pending.current);
    pending.current = null;
  }
  function changeNotes(text) {
    setNotes(text);
    pending.current = text;
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 500);
  }
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      flush();
    };
  }, [db, today]);

  if (!stats) return <main className="screen"><p>Loading…</p></main>;
  const text = statsSummaryText(withTodayNote(stats, today, notes), state);
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
        onChange={(e) => changeNotes(e.target.value)}
        onBlur={flush}
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

// 0-10 NRS over the window, with 0/5/10 guide lines and the first and last dates so a value can be read off.
function PainChart({ series }) {
  const w = 320;
  const h = 150;
  const [left, right, top, bottom] = [24, 10, 10, 24];
  const x = (i) => left + (i * (w - left - right)) / (series.length - 1);
  const y = (v) => top + (h - top - bottom) * (1 - v / 10);
  const marks = (key) => series.map((s, i) => (s[key] === null ? null : [x(i), y(s[key])])).filter(Boolean);
  const day = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const first = day(series[0].date);
  const last = day(series.at(-1).date);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chart" role="img" aria-label={`Pain from 0 to 10, ${first} to ${last}`}>
      {[0, 5, 10].map((v) => (
        <g key={v}>
          <line className="chart-grid" x1={left} x2={w - right} y1={y(v)} y2={y(v)} />
          <text className="chart-label" x={left - 7} y={y(v) + 3.5} textAnchor="end">{v}</text>
        </g>
      ))}
      <text className="chart-label" x={left} y={h - 7}>{first}</text>
      <text className="chart-label" x={w - right} y={h - 7} textAnchor="end">{last}</text>
      {['morningPain', 'afterPain'].map((key) => (
        <g key={key}>
          <polyline className={key === 'morningPain' ? 'chart-morning' : 'chart-after'} points={marks(key).map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(' ')} />
          {marks(key).map(([px, py]) => (
            <circle key={`${px}`} className={key === 'morningPain' ? 'chart-dot-morning' : 'chart-dot-after'} cx={px} cy={py} r="3" />
          ))}
        </g>
      ))}
    </svg>
  );
}
