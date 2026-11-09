export type FeedbackTargetType = 'VIDEO' | 'LEARNING_PATH';

export interface Feedback {
  id: string;
  userId: string;
  targetType: FeedbackTargetType;
  targetId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}
