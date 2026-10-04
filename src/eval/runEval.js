import { openKneeDb } from '../data/db.js';
import { buildPlan, initialState } from '../rules/planner.js';
import { prepareHelper, subscribe, getSnapshot, ask, clearCrashFlag } from '../ai/helper.js';
import { checkAnswer } from '../ai/prompts.js';
import { EVAL_CASES } from './cases.js';

const rows = document.getElementById('rows');
const escape = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
subscribe(() => {
  const s = getSnapshot();
  document.getElementById('status').textContent =
    `${s.status}${s.status === 'downloading' ? ` ${Math.round(s.progress * 100)}%` : ''}${s.error ? ` (${s.error})` : ''}`;
});

const plan = buildPlan(initialState(), { knee: 'right', disabled: [] });
const db = await openKneeDb();
clearCrashFlag();
await prepareHelper({ db });

let passed = 0;
for (const [i, c] of EVAL_CASES.entries()) {
  const started = performance.now();
  let answer;
  let pass;
  if (c.route) {
    const reply = await ask(plan, c.q);
    pass = reply[c.route] === true;
    answer = pass ? `(answered by code, ${c.route}): ${reply.text}` : `(NOT caught by the ${c.route} filter): ${reply.text}`;
  } else {
    answer = (await ask(plan, c.q)).text ?? '(no answer)';
    const check = checkAnswer(answer);
    const hasMust = !c.must || c.must.some((m) => answer.toLowerCase().includes(m.toLowerCase()));
    pass = check.ok && hasMust;
    answer += ` [${check.sentences} sentences${check.jargon.length ? `; jargon: ${check.jargon}` : ''}${hasMust ? '' : '; missing an expected phrase'}; ${Math.round(performance.now() - started)} ms]`;
  }
  if (pass) passed += 1;
  rows.insertAdjacentHTML('beforeend', `<tr><td>${i + 1}</td><td>${escape(c.q)}</td><td>${escape(answer)}</td><td>${pass ? 'PASS' : 'FAIL'}</td></tr>`);
}
document.getElementById('total').textContent = `${passed} / ${EVAL_CASES.length} passed automatically. Now read every answer yourself.`;
