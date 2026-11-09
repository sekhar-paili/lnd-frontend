import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { QuizPageComponent } from './pages/quiz-page/quiz-page.component';

const routes: Routes = [{ path: ':quizId', component: QuizPageComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class QuizRoutingModule {}
