// The ten exercises (spec §5.6). The text is in our own words, based on the NHS
// inform programme for knee osteoarthritis, which we credit and link to. Never paste
// NHS inform text here: their terms forbid copying it or making derivative works.
export const NHS_URL =
  'https://www.nhsinform.scot/illnesses-and-conditions/muscle-bone-and-joints/leg-and-foot-problems-and-conditions/exercises-for-osteoarthritis-of-the-knee/';

export const STAGE_UNLOCK_LEVEL = { 1: 0, 2: 2, 3: 4 };

export const EXERCISES = [
  {
    id: 'heel-slide', stage: 1, name: 'Knee bend, lying', clinicalName: 'Heel slides',
    perSide: true, holdSeconds: 2, holdGrows: false,
    steps: [
      'Lie on your back with both legs straight.',
      'Slide the heel of your sore leg towards you, bending the knee as far as is comfortable.',
      'Hold for 2 seconds, then slide it back until the leg is straight.',
    ],
  },
  {
    id: 'static-quads', stage: 1, name: 'Thigh squeeze', clinicalName: 'Static quads (quad sets)',
    perSide: true, holdSeconds: 10, holdGrows: false,
    steps: [
      'Lie on your back with your legs straight.',
      'Tighten the front of your thigh so the back of the knee presses down into the bed.',
      'Hold for 10 seconds, then relax.',
    ],
  },
  {
    id: 'knee-roll', stage: 1, name: 'Knee over a roll', clinicalName: 'Inner-range quads',
    perSide: true, holdSeconds: 10, holdGrows: false,
    steps: [
      'Lie on your back with a rolled-up towel under your sore knee.',
      'Press the knee down into the roll so the knee straightens and the heel lifts.',
      'Hold for 10 seconds, then lower slowly.',
    ],
  },
  {
    id: 'straight-leg-raise', stage: 1, name: 'Straight-leg raise', clinicalName: 'Straight-leg raise (SLR)',
    perSide: true, holdSeconds: 5, holdGrows: false,
    steps: [
      'Lie on your back. Bend your good knee and keep the sore leg straight.',
      'Tighten the thigh of the straight leg and lift it a little off the bed.',
      'Hold for 5 seconds, then lower it slowly.',
    ],
  },
  {
    id: 'seated-stretch', stage: 1, name: 'Seated knee stretch', clinicalName: 'Knee extension stretch',
    perSide: true, holdSeconds: 10, holdGrows: false,
    steps: [
      'Sit on a chair with another chair in front of you.',
      'Rest the heel of your sore leg on the chair opposite.',
      'Gently straighten the knee as far as is comfortable and hold for up to 10 seconds.',
    ],
  },
  {
    id: 'bridge', stage: 2, name: 'Bridge', clinicalName: 'Glute bridge',
    perSide: false, holdSeconds: 3, holdGrows: false,
    steps: [
      'Lie on your back with both knees bent and your arms by your sides.',
      'Push through your feet to lift your hips towards the ceiling.',
      'Hold for 3 seconds, then lower slowly.',
    ],
  },
  {
    id: 'mini-squat', stage: 2, name: 'Mini squat to a chair', clinicalName: 'Partial sit-to-stand',
    perSide: false, holdSeconds: null, holdGrows: false,
    steps: [
      'Stand in front of a chair with your feet hip-width apart. Hold your arms forward for balance if you like.',
      'Bend your knees slowly until your bottom just touches the seat. Do not sit down.',
      'Stand back up slowly.',
    ],
  },
  {
    id: 'step-up', stage: 3, name: 'Step-ups', clinicalName: 'Step-ups',
    perSide: true, holdSeconds: null, holdGrows: false,
    steps: [
      'Stand at the bottom step, holding the bannister if needed.',
      'Put your sore leg on the step and keep it there.',
      'Step the other foot up onto the step and back down, slowly.',
    ],
  },
  {
    id: 'single-leg-stand', stage: 3, name: 'Standing on one leg', clinicalName: 'Single-leg balance',
    perSide: true, holdSeconds: 5, holdGrows: true,
    steps: [
      'Stand next to a kitchen counter or a sturdy chair you can hold.',
      'Stand on your sore leg and lift the other foot just off the floor.',
      'Keep your balance for the time shown, holding on if you need to.',
    ],
  },
  {
    id: 'step-back', stage: 3, name: 'Small step backwards', clinicalName: 'Partial reverse lunge',
    perSide: true, holdSeconds: null, holdGrows: false,
    steps: [
      'Stand tall, holding a counter or chair if needed.',
      'Step back with your sore leg and bend both knees a little, with the toes of the back foot on the floor.',
      'Return to standing. Only go as far as feels comfortable.',
    ],
  },
];

export function exerciseById(id) {
  return EXERCISES.find((e) => e.id === id) ?? null;
}
