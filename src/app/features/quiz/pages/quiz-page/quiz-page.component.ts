import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { apiErrorMessage } from '../../../../core/http/api-error';
import { Quiz, QuizResult } from '../../../../core/models';
import { QuizService } from '../../../../core/services/quiz.service';

@Component({
  selector: 'app-quiz-page',
  templateUrl: './quiz-page.component.html',
  styleUrls: ['./quiz-page.component.scss'],
  standalone: false,
})
export class QuizPageComponent implements OnInit {
  quiz?: Quiz;
  answers: Record<string, string> = {};
  result?: QuizResult;
  validationMessage = '';
  submitting = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly quizService: QuizService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('quizId');
    if (id) {
      this.quiz = this.quizService.getById(id);
    }
  }

  selectAnswer(questionId: string, optionId: string): void {
    this.answers[questionId] = optionId;
    this.validationMessage = '';
  }

  get unansweredCount(): number {
    if (!this.quiz) {
      return 0;
    }
    return this.quiz.questions.filter((q) => !this.answers[q.id]).length;
  }

  /** The server grades the attempt; the page only displays what it returns. */
  submit(): void {
    if (!this.quiz || this.submitting) {
      return;
    }
    if (this.unansweredCount > 0) {
      this.validationMessage = `Please answer all questions (${this.unansweredCount} remaining).`;
      return;
    }
    this.submitting = true;
    this.quizService.submitAttempt(this.quiz.id, this.answers).subscribe({
      next: ({ result }) => {
        this.result = result;
        this.submitting = false;
      },
      error: (err: unknown) => {
        this.validationMessage = apiErrorMessage(err);
        this.submitting = false;
      },
    });
  }

  retry(): void {
    this.answers = {};
    this.result = undefined;
    this.validationMessage = '';
  }
}
