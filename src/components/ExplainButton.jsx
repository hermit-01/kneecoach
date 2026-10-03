import { useState } from 'react';
import { explain } from '../ai/helper.js';
import { useHelper } from '../ai/useHelper.js';

export default function ExplainButton({ plan, exercise }) {
  const helper = useHelper();
  const [text, setText] = useState(null);
  const [busy, setBusy] = useState(false);
  if (helper.status !== 'ready' && !text) return null;
  if (text) {
    return (
      <div className="card">
        <div className="ai-label">Your helper · AI, can make mistakes</div>
        <p>{text}</p>
      </div>
    );
  }
  async function run() {
    setBusy(true);
    setText((await explain(plan, exercise, setText)) ?? "Sorry, I couldn't explain that just now.");
    setBusy(false);
  }
  return (
    <button type="button" className="btn" disabled={busy} onClick={run}>{busy ? 'Thinking…' : 'Explain it differently'}</button>
  );
}
