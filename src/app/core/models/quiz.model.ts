export enum QuestionType {
  MultipleChoice = 'MCQ',
  TrueFalse = 'TRUE_FALSE',
}

export interface QuizOption {
  id: string;
  label: string;
}

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  options: QuizOption[];
  /**
   * The answer key. Only sent by the backend to L&D admins (for editing);
   * learners never receive it, so it is absent on their copies of a quiz.
   */
  correctOptionId?: string;
}

export interface Quiz {
  id: string;
  title: string;
  passMarkPercent: number;
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  scorePercent: number;
  passed: boolean;
  answeredAt: string;
  answers: Record<string, string>;
}

export interface QuizResult {
  scorePercent: number;
  passed: boolean;
  correctCount: number;
  totalCount: number;
}
