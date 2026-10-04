import { useState } from 'react';
import PainScale from '../components/PainScale.jsx';

export default function After({ onSubmit }) {
  const [pain, setPain] = useState(null);
  return (
    <main className="screen">
      <h1>How's your knee now?</h1>
      <PainScale value={pain} onChange={setPain} />
      <p className="muted">0 = no pain · 10 = worst pain</p>
      <button type="button" className="btn primary" disabled={pain === null} onClick={() => onSubmit(pain)}>Save</button>
      {pain === null && <p className="hint">Choose a number to save.</p>}
    </main>
  );
}
