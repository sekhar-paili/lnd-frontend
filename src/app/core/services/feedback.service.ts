import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../http/api.service';
import { Feedback, FeedbackTargetType } from '../models';

export interface FeedbackSummary {
  items: Feedback[];
  /** Mean rating rounded to one decimal; 0 when there is no feedback. */
  averageRating: number;
  count: number;
}

export interface NewFeedback {
  targetType: FeedbackTargetType;
  targetId: string;
  rating: number;
  comment?: string;
}

/**
 * Feedback is fetched per target on demand (it is not part of the session
 * data load). The average is computed by the server.
 */
@Injectable({ providedIn: 'root' })
export class FeedbackService {
  constructor(private readonly api: ApiService) {}

  load(targetType: FeedbackTargetType, targetId: string): Observable<FeedbackSummary> {
    return this.api.get<FeedbackSummary>('/feedback', { targetType, targetId });
  }

  /** The author is always the signed-in user; the server ignores any other. */
  submit(input: NewFeedback): Observable<Feedback> {
    return this.api.post<Feedback>('/feedback', input);
  }
}
