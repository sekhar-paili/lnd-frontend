export interface VideoCategory {
  id: string;
  name: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  durationSeconds: number;
  sourceUrl: string;
  thumbnailUrl?: string;
}
