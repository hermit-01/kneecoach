import { useState } from 'react';
import { ask } from '../ai/helper.js';
import { useHelper } from '../ai/useHelper.js';
import { NHS_URL } from '../rules/exercises.js';
import HelperStatus from '../components/HelperStatus.jsx';

// Who wrote each answer: code (fixed safety or app answers) or the AI.
function labelFor(m) {
  if (m.redFlag) return 'Safety message';
  if (m.fromApp) return 'From the app';
  return 'Your helper · AI, can make mistakes';
}

export default function Ask({ db, plan }) {
  const helper = useHelper();
  const [question, setQuestion] = useState('');
  const [thread, setThread] = useState([]);
  const [busy, setBusy] = useState(false);

  async function send() {
    const q = question.trim();
    if (!q || busy) return;
    setQuestion('');
    setBusy(true);
    const index = thread.length;
    const update = (patch) => setThread((t) => t.map((m, i) => (i === index ? { ...m, ...patch } : m)));
    setThread((t) => [...t, { q, a: '' }]);
    const reply = await ask(plan, q, (text) => update({ a: text }));
    update({
      a: reply.unavailable ? "Your helper isn't ready yet, so I can't answer questions right now." : reply.text,
      redFlag: reply.redFlag,
      // Fixed answers and failure messages are written by the app, not the AI.
      fromApp: Boolean(reply.planChange || reply.medical || reply.privacy || reply.steps || reply.failed || reply.unavailable),
    });
    setBusy(false);
  }

  return (
    <main className="screen">
      <h1>Ask about your exercises</h1>
      {helper.status !== 'ready' && <HelperStatus db={db} />}
      {thread.map((m, i) => (
        <div key={i}>
          <div className="card mine">{m.q}</div>
          <div className={m.redFlag ? 'banner' : 'card'}>
            <div className="ai-label">{labelFor(m)}</div>
            <p>{m.a || '…'}</p>
          </div>
        </div>
      ))}
      <textarea rows={2} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="For example: how long do I hold the thigh squeeze?" />
      <button type="button" className="btn primary" disabled={busy || !question.trim()} onClick={send}>{busy ? 'Thinking…' : 'Ask'}</button>
      <p className="muted">
        Answers come only from your exercise guide, based on <a href={NHS_URL} target="_blank" rel="noreferrer">NHS inform</a>.
        Nothing you type leaves this phone.
      </p>
    </main>
  );
}
