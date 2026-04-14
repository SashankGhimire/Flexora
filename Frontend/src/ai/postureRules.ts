import { ExerciseType } from '../types';

export interface PostureEvaluation {
  isCorrect: boolean;
  feedback: string;
  accuracy: number;
}

export const evaluatePosture = (
  exercise: ExerciseType,
  metrics: { primaryAngle: number }
): PostureEvaluation => {
  const targetRanges: Record<ExerciseType, { min: number; max: number; label: string }> = {
    squat: { min: 80, max: 110, label: 'Keep hips and knees aligned' },
    pushup: { min: 70, max: 110, label: 'Keep your body in a straight line' },
    shoulderPress: { min: 90, max: 165, label: 'Stack wrists over elbows and press overhead with control' },
    jumpingJack: { min: 140, max: 180, label: 'Raise arms fully and keep torso controlled' },
    standingKneeRaise: { min: 80, max: 140, label: 'Lift one knee toward hip height with an upright torso' },
    bicepCurl: { min: 45, max: 120, label: 'Keep elbow close to torso and control the curl' },
  };

  const range = targetRanges[exercise];
  const inRange = metrics.primaryAngle >= range.min && metrics.primaryAngle <= range.max;
  const center = (range.min + range.max) / 2;
  const delta = Math.abs(metrics.primaryAngle - center);
  const accuracy = Math.max(0, Math.min(100, Math.round(100 - delta)));

  return {
    isCorrect: inRange,
    feedback: inRange ? 'Great form' : range.label,
    accuracy,
  };
};


