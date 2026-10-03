# KneeCoach

A daily knee-osteoarthritis exercise app I built for my mom, with a private AI helper (Gemma, Google's open model) that runs on her phone.

- **Exercises and rules:** based on the [NHS inform programme for knee osteoarthritis](https://www.nhsinform.scot/illnesses-and-conditions/muscle-bone-and-joints/leg-and-foot-problems-and-conditions/exercises-for-osteoarthritis-of-the-knee/). The exercise text is written in our own words. KneeCoach is not affiliated with the NHS.
- **Safety:** plain, tested code decides her daily plan from her pain scores. The AI only talks: it answers questions from the exercise guide and drafts a note for her doctor.
- **Privacy:** everything stays on the phone, in IndexedDB.

## How it works

| Folder | What it does |
| --- | --- |
| `src/rules` | Pure functions: the dose ladder, the morning check, after-round updates, the six-week check |
| `src/data` | IndexedDB storage |
| `src/app` | Glue between the screens, the rules and storage |
| `src/ai` | The AI helper's instructions and guardrails |
| `src/screens` | React screens |

## Run it

    npm install
    npm test
    npm run dev      # http://localhost:5173/kneecoach/

## Credits

- Exercise programme: NHS inform (NHS 24), credited and linked, not copied
