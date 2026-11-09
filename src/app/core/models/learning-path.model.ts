export interface LearningPathStep {
  id: string;
  title: string;
  videoId?: string;
  quizId?: string;
  order: number;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  steps: LearningPathStep[];
}

export enum StepState {
  Locked = 'LOCKED',
  Unlocked = 'UNLOCKED',
  Completed = 'COMPLETED',
}

export interface LearningPathStepView extends LearningPathStep {
  state: StepState;
}
