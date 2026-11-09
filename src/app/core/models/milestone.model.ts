export type MilestoneStatus = 'PLANNED' | 'IN_PROGRESS' | 'DONE';

export interface Milestone {
  id: string;
  title: string;
  status: MilestoneStatus;
  date: string;
}
