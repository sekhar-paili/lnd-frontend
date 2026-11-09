export enum AudienceType {
  Role = 'ROLE',
  Group = 'GROUP',
  Individual = 'INDIVIDUAL',
}

export enum AssignableType {
  Video = 'VIDEO',
  LearningPath = 'LEARNING_PATH',
}

export interface Assignment {
  id: string;
  audienceType: AudienceType;
  audienceValue: string;
  itemType: AssignableType;
  itemId: string;
  assignedAt: string;
}
