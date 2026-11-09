import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { QuizAdminRoutingModule } from './quiz-admin-routing.module';
import { QuizAdminPageComponent } from './pages/quiz-admin-page/quiz-admin-page.component';

@NgModule({
  declarations: [QuizAdminPageComponent],
  imports: [SharedModule, QuizAdminRoutingModule],
})
export class QuizAdminModule {}
