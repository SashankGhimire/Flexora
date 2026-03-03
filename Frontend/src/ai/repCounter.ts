export interface RepCounterState {
  reps: number;
  phase: 'up' | 'down';
}

export const countReps = (
  currentAngle: number,
  state: RepCounterState,
  thresholds: { downAngle: number; upAngle: number }
): RepCounterState => {
  if (state.phase === 'up' && currentAngle <= thresholds.downAngle) {
    return { ...state, phase: 'down' };
  }

  if (state.phase === 'down' && currentAngle >= thresholds.upAngle) {
    return { reps: state.reps + 1, phase: 'up' };
  }

  return state;
};
