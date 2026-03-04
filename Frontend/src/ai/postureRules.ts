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
    lunge: { min: 75, max: 110, label: 'Maintain knee-over-ankle position' },
    jumpingJack: { min: 140, max: 180, label: 'Raise arms fully and keep torso controlled' },
    plank: { min: 160, max: 190, label: 'Keep your core engaged and back flat' },
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
