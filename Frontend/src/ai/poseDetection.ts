export interface PosePoint {
  x: number;
  y: number;
  score?: number;
}

export type PoseFrame = Record<string, PosePoint>;

export const detectPose = async (_frameData: unknown): Promise<PoseFrame | null> => {
  return null;
};
