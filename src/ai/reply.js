import { sentencesOf, tidyAnswer } from './prompts.js';

// One reply from Gemma: streams tidy text to onText, and stops after timeoutMs (spec §6.3)
// or as soon as it starts a sentence past maxSentences, which tidyAnswer would cut anyway.
// On a phone, every extra sentence costs seconds inside the 30 s limit.
// `tf` is the Transformers.js module, passed in so this can be tested without it.
export async function generateText({ tf, generator, system, user, onText = () => {}, timeoutMs = 30000, maxNewTokens = 150, maxSentences = 3 }) {
  const stopper = new tf.InterruptableStoppingCriteria();
  let text = '';
  const streamer = new tf.TextStreamer(generator.tokenizer, {
    skip_prompt: true,
    callback_function: (piece) => {
      text += piece;
      if (sentencesOf(text).length > maxSentences) stopper.interrupt();
      onText(tidyAnswer(text, maxSentences));
    },
  });
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; stopper.interrupt(); }, timeoutMs);
  try {
    await generator([{ role: 'system', content: system }, { role: 'user', content: user }], {
      max_new_tokens: maxNewTokens,
      do_sample: false,
      streamer,
      stopping_criteria: stopper,
    });
  } finally {
    clearTimeout(timer);
  }
  if (!timedOut) return tidyAnswer(text, maxSentences);
  // Out of time: keep the finished sentences. With none, say so rather than show a fragment:
  // on a slow phone (a POCO M6 Pro took 54 s to read the question) the reply can be one word.
  const finished = sentencesOf(text).filter((s) => /[.!?]["'”’)]*$/.test(s)).slice(0, maxSentences);
  if (!finished.length) throw new TooSlowError();
  return finished.join(' ');
}

export class TooSlowError extends Error {
  constructor() {
    super('The helper took too long on this phone');
    this.name = 'TooSlowError';
  }
}
