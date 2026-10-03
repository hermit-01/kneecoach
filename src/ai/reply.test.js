import { describe, it, expect } from 'vitest';
import { generateText } from './reply.js';

function fakeTf() {
  class InterruptableStoppingCriteria { constructor() { this.interrupted = false; } interrupt() { this.interrupted = true; } }
  class TextStreamer { constructor(tokenizer, options) { this.options = options; } }
  return { InterruptableStoppingCriteria, TextStreamer };
}

describe('generateText', () => {
  it('sends the system prompt and question, and streams the reply', async () => {
    let seenMessages;
    let seenOptions;
    const generator = async (messages, options) => {
      seenMessages = messages;
      seenOptions = options;
      options.streamer.options.callback_function('Hold for ');
      options.streamer.options.callback_function('10 seconds. ');
    };
    const seen = [];
    const text = await generateText({ tf: fakeTf(), generator, system: 'SYS', user: 'Q?', onText: (t) => seen.push(t) });
    expect(seenMessages).toEqual([{ role: 'system', content: 'SYS' }, { role: 'user', content: 'Q?' }]);
    expect(seenOptions).toMatchObject({ do_sample: false, max_new_tokens: 150 });
    expect(seen).toEqual(['Hold for ', 'Hold for 10 seconds. ']);
    expect(text).toBe('Hold for 10 seconds.');
  });
  it('stops a reply that takes too long (review focus 4)', async () => {
    const generator = (messages, options) => new Promise((resolve) => {
      const check = setInterval(() => { if (options.stopping_criteria.interrupted) { clearInterval(check); resolve(); } }, 5);
    });
    const started = Date.now();
    expect(await generateText({ tf: fakeTf(), generator, system: 'S', user: 'U', timeoutMs: 20 })).toBe('');
    expect(Date.now() - started).toBeLessThan(1000);
  });
});
