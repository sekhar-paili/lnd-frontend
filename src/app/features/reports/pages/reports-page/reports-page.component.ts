import { Component, OnInit } from '@angular/core';

import { Quiz } from '../../../../core/models';
import { QuizService } from '../../../../core/services/quiz.service';
import {
  ParticipantReport,
  ReportService,
} from '../../../../core/services/report.service';

@Component({
  selector: 'app-reports-page',
  templateUrl: './reports-page.component.html',
  styleUrls: ['./reports-page.component.scss'],
  standalone: false,
})
export class ReportsPageComponent implements OnInit {
  reports: ParticipantReport[] = [];
  loading = true;
  loadError = false;
  readonly columns = ['name', 'videos', 'quizzes', 'paths'];

  constructor(
    private readonly reportService: ReportService,
    private readonly quizService: QuizService,
  ) {}

  ngOnInit(): void {
    this.reportService.loadParticipantReports().subscribe({
      next: (reports) => {
        this.reports = reports;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
      },
    });
  }

  quizTitle(quizId: string): string {
    const quiz: Quiz | undefined = this.quizService.getById(quizId);
    return quiz?.title ?? quizId;
  }
}
