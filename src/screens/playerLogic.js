// Pure state for the exercise player (spec §4, screen 3), kept out of React so it can be tested.
export const REST_SECONDS = 60;
export const initialPlayer = { index: 0, count: 0, holdLeft: null, restLeft: 0, completed: [], tooPainful: [] };

export function totalReps(item) {
  return item.sides.length * item.sets * item.reps;
}

export function position(item, count) {
  const perSide = item.sets * item.reps;
  const sideIndex = Math.min(Math.floor(count / perSide), item.sides.length - 1);
  const inSide = count - sideIndex * perSide;
  return { side: item.sides[sideIndex], set: Math.floor(inSide / item.reps) + 1, rep: (inSide % item.reps) + 1 };
}

export function playerReducer(state, action) {
  switch (action.type) {
    case 'startHold':
      return { ...state, holdLeft: action.seconds };
    case 'tick':
      if (state.holdLeft !== null) return { ...state, holdLeft: Math.max(0, state.holdLeft - 1) };
      return { ...state, restLeft: Math.max(0, state.restLeft - 1) };
    case 'rep': {
      const count = state.count + 1;
      const { reps, sets } = action.item;
      const endOfSet = count % reps === 0;
      const endOfSide = count % (reps * sets) === 0;
      return { ...state, count, holdLeft: null, restLeft: endOfSet && !endOfSide ? REST_SECONDS : 0 };
    }
    case 'skipRest':
      return { ...state, restLeft: 0 };
    case 'next':
      return {
        ...state,
        index: state.index + 1,
        count: 0,
        holdLeft: null,
        restLeft: 0,
        completed: action.done ? [...state.completed, action.id] : state.completed,
        tooPainful: action.painful ? [...state.tooPainful, action.id] : state.tooPainful,
      };
    default:
      return state;
  }
}
