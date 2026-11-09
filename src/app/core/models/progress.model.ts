import { environment } from '../../../environments/environment';

export interface VideoProgress {
  userId: string;
  videoId: string;
  positionSeconds: number;
  percentComplete: number;
  completed: boolean;
  updatedAt: string;
}

/** Percent watched at which a video is marked complete (from environment). */
export const COMPLETION_THRESHOLD_PERCENT = environment.completionThresholdPercent;
