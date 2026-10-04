import { useEffect, useReducer, useState } from 'react';
import { speak, stopSpeaking } from '../lib/speech.js';
import { NHS_URL } from '../rules/exercises.js';
import { doseText } from '../rules/ladder.js';
import { initialPlayer, playerReducer, position, totalReps } from './playerLogic.js';

// One round: every exercise in today's plan, on each side, for each set and rep.
export default function Player({ plan, onFinish }) {
  const [state, dispatch] = useReducer(playerReducer, initialPlayer);
  const [voice, setVoice] = useState(true);
  const item = plan[state.index];

  // Moving past the last exercise ends the round.
  useEffect(() => {
    if (!item) onFinish({ completed: state.completed, tooPainful: state.tooPainful });
  }, [item]);

  useEffect(() => {
    if (item && voice) speak(`${item.exercise.name}. ${item.exercise.steps.join(' ')}`);
    return stopSpeaking;
  }, [state.index, voice]);

  // One-second timer for holds and for the rest between sets.
  useEffect(() => {
    if (state.holdLeft === 0) {
      dispatch({ type: 'rep', item });
      return undefined;
    }
    if (state.holdLeft === null && state.restLeft === 0) return undefined;
    const timer = setTimeout(() => dispatch({ type: 'tick' }), 1000);
    return () => clearTimeout(timer);
  }, [state.holdLeft, state.restLeft]);

  if (!item) return <main className="screen"><p>Saving…</p></main>;
  const total = totalReps(item);
  const finished = state.count >= total;
  const where = position(item, Math.min(state.count, total - 1));
  const sideLabel = where.side === 'both' ? '' : `${where.side === 'left' ? 'Left' : 'Right'} leg · `;

  return (
    <main className="screen">
      <p className="muted">Exercise {state.index + 1} of {plan.length}</p>
      <h1>{item.exercise.name}</h1>
      <p className="muted">
        {item.exercise.clinicalName} · {doseText(item)}
        {item.holdSeconds ? `, hold ${item.holdSeconds} s` : ''}
      </p>
      <ol>{item.exercise.steps.map((s) => <li key={s}>{s}</li>)}</ol>
      <p><a href={NHS_URL} target="_blank" rel="noreferrer">Watch the NHS inform exercise videos</a></p>
      {!finished && (
        <div className="card">
          <div>{sideLabel}Set {where.set} of {item.sets} · Rep {where.rep} of {item.reps}</div>
          {state.restLeft > 0 ? (
            <>
              <div className="timer">{state.restLeft}</div>
              <p className="muted">Rest for a minute between sets.</p>
              <button type="button" className="btn" onClick={() => dispatch({ type: 'skipRest' })}>Skip the rest</button>
            </>
          ) : state.holdLeft !== null ? (
            <div className="timer" aria-live="polite">{state.holdLeft}</div>
          ) : item.holdSeconds ? (
            <button type="button" className="btn primary" onClick={() => dispatch({ type: 'startHold', seconds: item.holdSeconds })}>
              Start {item.holdSeconds}-second hold
            </button>
          ) : (
            <button type="button" className="btn primary" onClick={() => dispatch({ type: 'rep', item })}>Done one rep</button>
          )}
        </div>
      )}
      {finished ? (
        <button type="button" className="btn primary" onClick={() => dispatch({ type: 'next', id: item.exercise.id, done: true })}>
          {state.index + 1 < plan.length ? 'Next exercise' : 'Finish this round'}
        </button>
      ) : (
        <button type="button" className="btn danger" onClick={() => dispatch({ type: 'next', id: item.exercise.id, painful: true })}>
          Too painful: skip this one
        </button>
      )}
      <button type="button" className="btn" onClick={() => setVoice((v) => !v)}>{voice ? 'Stop reading aloud' : 'Read aloud'}</button>
    </main>
  );
}
