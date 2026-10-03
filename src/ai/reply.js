// One reply from Gemma: streams text to onText, and stops after timeoutMs (spec §6.3).
// `tf` is the Transformers.js module, passed in so this can be tested without it.
export async function generateText({ tf, generator, system, user, onText = () => {}, timeoutMs = 30000, maxNewTokens = 150 }) {
  const stopper = new tf.InterruptableStoppingCriteria();
  let text = '';
  const streamer = new tf.TextStreamer(generator.tokenizer, {
    skip_prompt: true,
    callback_function: (piece) => {
      text += piece;
      onText(text);
    },
  });
  const timer = setTimeout(() => stopper.interrupt(), timeoutMs);
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
  return text.trim();
}
