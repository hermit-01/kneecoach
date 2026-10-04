import { useCallback, useEffect, useState } from 'react';
import { openKneeDb } from './data/db.js';
import { localToday } from './rules/dates.js';
import { loadToday, completeSetup, submitMorning, finishRound, setExerciseEnabled, roundsStatus } from './app/actions.js';
import { screenFor, watchForNewDay } from './app/screen.js';
import { roundFacts, fixedRoundMessage } from './app/roundMessage.js';
import { prepareHelper } from './ai/helper.js';
import HelperStatus from './components/HelperStatus.jsx';
import Setup from './screens/Setup.jsx';
import CheckIn from './screens/CheckIn.jsx';
import Plan from './screens/Plan.jsx';
import Player from './screens/Player.jsx';
import After from './screens/After.jsx';
import RoundDone from './screens/RoundDone.jsx';
import Settings from './screens/Settings.jsx';
import DoctorNote from './screens/DoctorNote.jsx';
import Ask from './screens/Ask.jsx';

// In development only, ?today=YYYY-MM-DD pretends it is another day, for testing multi-day rules.
function currentDay() {
  return (import.meta.env.DEV && new URLSearchParams(location.search).get('today')) || localToday();
}

export default function App() {
  const [db, setDb] = useState(null);
  const [today, setToday] = useState(currentDay);
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('today');
  const [round, setRound] = useState(null); // null | { stage: 'playing' | 'after' | 'done', ... }

  const refresh = useCallback(async () => {
    if (db) setData(await loadToday(db, today));
  }, [db, today]);
  useEffect(() => { openKneeDb().then(setDb); }, []);
  useEffect(() => { refresh(); }, [refresh]);
  // Load the helper if it's already downloaded; never start an 800 MB download without her tap.
  useEffect(() => { if (db) prepareHelper({ db, startDownload: false }); }, [db]);
  useEffect(
    () => watchForNewDay({ getToday: currentDay, shownDay: today, onNewDay: (d) => { setRound(null); setToday(d); } }),
    [today],
  );

  if (!data) return <main className="screen"><p>Loading…</p></main>;
  const view = screenFor(data);
  if (view === 'setup') {
    return <Setup today={today} onDone={async (answers) => { await completeSetup(db, answers, today); await refresh(); }} />;
  }

  async function saveRound(afterPain) {
    const { state, day, outcome } = await finishRound(db, { ...round.result, afterPain }, today);
    const facts = roundFacts({ outcome, afterPain, state, roundsDone: day.rounds.length });
    setRound({ stage: 'done', message: fixedRoundMessage(facts), reasons: outcome.reasons });
    await refresh();
  }

  let body;
  if (tab === 'settings') {
    body = <Settings profile={data.profile} onToggle={async (id, on) => { await setExerciseEnabled(db, id, on); await refresh(); }} />;
  } else if (tab === 'ask') {
    body = <Ask db={db} plan={data.plan} />;
  } else if (tab === 'doctor') {
    body = <DoctorNote db={db} today={today} state={data.state} todayNotes={data.day.notes} />;
  } else if (round?.stage === 'playing') {
    body = <Player plan={data.plan} onFinish={(result) => setRound({ stage: 'after', result })} />;
  } else if (round?.stage === 'after') {
    body = <After onSubmit={saveRound} />;
  } else if (round?.stage === 'done') {
    body = <RoundDone message={round.message} reasons={round.reasons} onBack={() => setRound(null)} />;
  } else if (view === 'checkin') {
    body = <CheckIn askWorse={data.yesterday.exercised} onSubmit={async (answers) => { await submitMorning(db, answers, today); await refresh(); }} />;
  } else {
    body = (
      <Plan
        view={view}
        decision={data.day.decision}
        plan={data.plan}
        rounds={roundsStatus(data.day)}
        onStart={() => setRound({ stage: 'playing' })}
        top={<HelperStatus db={db} />}
      />
    );
  }
  return (
    <>
      {body}
      {!round && <TabBar tab={tab} onChange={setTab} />}
    </>
  );
}

function TabBar({ tab, onChange }) {
  const tabs = [['today', 'Today'], ['ask', 'Ask'], ['doctor', 'Doctor'], ['settings', 'Settings']];
  return (
    <nav className="tabbar">
      {tabs.map(([id, label]) => (
        <button key={id} type="button" className={tab === id ? 'active' : ''} onClick={() => onChange(id)}>{label}</button>
      ))}
    </nav>
  );
}
