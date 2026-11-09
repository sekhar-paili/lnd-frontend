import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { FeedbackRoutingModule } from './feedback-routing.module';
import { FeedbackPageComponent } from './pages/feedback-page/feedback-page.component';

@NgModule({
  declarations: [FeedbackPageComponent],
  imports: [SharedModule, FeedbackRoutingModule],
})
export class FeedbackModule {}
