import { useState } from 'react';
import PainScale from '../components/PainScale.jsx';

export default function CheckIn({ askWorse, onSubmit }) {
  const [pain, setPain] = useState(null);
  const [worse, setWorse] = useState(askWorse ? null : false);
  const [redFlag, setRedFlag] = useState(null);
  const ready = pain !== null && worse !== null && redFlag !== null;
  const choice = (selected) => `btn ${selected ? 'primary' : ''}`;
  return (
    <main className="screen">
      <h1>Good morning! How does your knee feel right now?</h1>
      <PainScale value={pain} onChange={setPain} />
      <p className="muted">0 = no pain · 10 = worst pain</p>
      {askWorse && (
        <>
          <h2>Is it worse than yesterday morning?</h2>
          <div className="row">
            <button type="button" className={choice(worse === true)} onClick={() => setWorse(true)}>Worse</button>
            <button type="button" className={choice(worse === false)} onClick={() => setWorse(false)}>Same or better</button>
          </div>
        </>
      )}
      <h2>Any new pain, swelling, or the knee giving way?</h2>
      <div className="row">
        <button type="button" className={choice(redFlag === true)} onClick={() => setRedFlag(true)}>Yes</button>
        <button type="button" className={choice(redFlag === false)} onClick={() => setRedFlag(false)}>No</button>
      </div>
      <button
        type="button"
        className="btn primary"
        disabled={!ready}
        onClick={() => onSubmit({ pain, worse: askWorse ? worse : null, redFlag })}
      >
        Continue
      </button>
    </main>
  );
}
