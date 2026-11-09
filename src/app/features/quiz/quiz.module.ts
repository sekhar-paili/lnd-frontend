import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { QuizRoutingModule } from './quiz-routing.module';
import { QuizPageComponent } from './pages/quiz-page/quiz-page.component';

@NgModule({
  declarations: [QuizPageComponent],
  imports: [SharedModule, QuizRoutingModule],
})
export class QuizModule {}
