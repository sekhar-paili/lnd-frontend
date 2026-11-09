import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { Role } from './core/models/user.model';
import { ShellComponent } from './layout/components/shell/shell.component';

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () =>
      import('./features/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    // Authenticated area: the shell (header/sidenav/footer) wraps all pages.
    path: '',
    component: ShellComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.module').then((m) => m.DashboardModule),
      },
      {
        path: 'catalogue',
        loadChildren: () =>
          import('./features/catalogue/catalogue.module').then((m) => m.CatalogueModule),
      },
      {
        path: 'player',
        loadChildren: () =>
          import('./features/player/player.module').then((m) => m.PlayerModule),
      },
      {
        path: 'my-learning',
        loadChildren: () =>
          import('./features/my-learning/my-learning.module').then(
            (m) => m.MyLearningModule,
          ),
      },
      {
        path: 'learning-paths',
        loadChildren: () =>
          import('./features/learning-paths/learning-paths.module').then(
            (m) => m.LearningPathsModule,
          ),
      },
      {
        path: 'quiz',
        loadChildren: () =>
          import('./features/quiz/quiz.module').then((m) => m.QuizModule),
      },
      {
        path: 'feedback',
        loadChildren: () =>
          import('./features/feedback/feedback.module').then((m) => m.FeedbackModule),
      },
      {
        path: 'admin/videos',
        canActivate: [RoleGuard],
        data: { roles: [Role.LndAdmin] },
        loadChildren: () =>
          import('./features/video-admin/video-admin.module').then(
            (m) => m.VideoAdminModule,
          ),
      },
      {
        path: 'admin/assignments',
        canActivate: [RoleGuard],
        data: { roles: [Role.LndAdmin] },
        loadChildren: () =>
          import('./features/assignments/assignments.module').then(
            (m) => m.AssignmentsModule,
          ),
      },
      {
        path: 'admin/quizzes',
        canActivate: [RoleGuard],
        data: { roles: [Role.LndAdmin] },
        loadChildren: () =>
          import('./features/quiz-admin/quiz-admin.module').then((m) => m.QuizAdminModule),
      },
      {
        path: 'admin/reports',
        canActivate: [RoleGuard],
        data: { roles: [Role.LndAdmin] },
        loadChildren: () =>
          import('./features/reports/reports.module').then((m) => m.ReportsModule),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
