# KneeCoach

A daily knee-osteoarthritis exercise app I built for my mom, with a private AI helper (Gemma 3 1B, Google's open model) that runs on her phone.

- **Exercises and rules:** based on the [NHS inform programme for knee osteoarthritis](https://www.nhsinform.scot/illnesses-and-conditions/muscle-bone-and-joints/leg-and-foot-problems-and-conditions/exercises-for-osteoarthritis-of-the-knee/). The exercise text is written in our own words. KneeCoach is not affiliated with the NHS.
- **Safety:** plain, tested code decides her daily plan from her pain scores. The AI only answers her questions about the exercises. New pain, a fall, medicines, plan changes and "how do I do this exercise?" get fixed answers from code, never from the AI. In testing, the AI made things up when asked to re-explain an exercise, write encouragement or draft a note for her doctor, so it does none of those.
- **Privacy:** everything stays on the phone, in IndexedDB. After a one-time download of about 800 MB, the helper works offline.

## How it works

| Folder | What it does |
| --- | --- |
| `src/rules` | Pure functions: the dose ladder, the morning check, after-round updates, the six-week check |
| `src/data` | IndexedDB storage |
| `src/app` | Glue between the screens, the rules and storage |
| `src/ai` | The AI helper: resumable download, Gemma 3 1B through Transformers.js on WebGPU, guardrails, red-flag filter |
| `src/eval` | The 15-question exam the helper has to pass |
| `src/screens` | React screens |
| `scripts/last-logits.py` | Edits Gemma's graph so it scores only the last position of the prompt (see below) |

## Running Gemma on a phone

The [ONNX build of Gemma 3 1B](https://huggingface.co/onnx-community/gemma-3-1b-it-ONNX) scores every position of the prompt against its 262,144-word vocabulary. For a 330-token question that is one step of about 350 MB, which crashed the graphics chip on two Qualcomm phones. Text generation only reads the last position, so `scripts/last-logits.py` adds one `Slice` before the vocabulary layer. Answers are unchanged and the weights are untouched; the edited graphs are in `public/models/` with their notice. The app also hides the optional WebGPU "subgroups" feature, which crashes some Qualcomm shader compilers in onnxruntime-web 1.30 and later.

## Run it

    npm install
    npm test
    npm run dev      # http://localhost:5173/kneecoach/
    # The helper's exam (downloads about 800 MB once): http://localhost:5173/kneecoach/eval.html

## Credits

- Gemma 3 1B: Google, under the [Gemma Terms of Use](https://ai.google.dev/gemma/terms). The app downloads the weights from Hugging Face; the two edited graph files in `public/models/` carry a notice.
- ONNX build of Gemma 3 1B: onnx-community. Transformers.js: Hugging Face, Apache 2.0.
- Exercise programme: NHS inform (NHS 24), credited and linked, not copied.
