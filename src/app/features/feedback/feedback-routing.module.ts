import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { FeedbackPageComponent } from './pages/feedback-page/feedback-page.component';

const routes: Routes = [
  { path: ':targetType/:targetId', component: FeedbackPageComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FeedbackRoutingModule {}
