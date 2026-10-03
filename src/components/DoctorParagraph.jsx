import { useState } from 'react';
import { doctorParagraph } from '../ai/helper.js';
import { useHelper } from '../ai/useHelper.js';

export default function DoctorParagraph({ plan, summary }) {
  const helper = useHelper();
  const [text, setText] = useState(null);
  const [busy, setBusy] = useState(false);
  if (helper.status !== 'ready' && !text) return null;
  async function run() {
    setBusy(true);
    setText((await doctorParagraph(plan, summary, setText)) ?? "Sorry, I couldn't draft that just now.");
    setBusy(false);
  }
  return (
    <div className="card">
      <div className="ai-label">AI-drafted: check it against the numbers above</div>
      {text ? (
        <p>{text}</p>
      ) : (
        <button type="button" className="btn" disabled={busy} onClick={run}>{busy ? 'Drafting…' : 'Draft a paragraph for my doctor'}</button>
      )}
    </div>
  );
}
