import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { QuizAdminPageComponent } from './pages/quiz-admin-page/quiz-admin-page.component';

const routes: Routes = [{ path: '', component: QuizAdminPageComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class QuizAdminRoutingModule {}
