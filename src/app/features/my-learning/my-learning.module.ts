import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { MyLearningRoutingModule } from './my-learning-routing.module';
import { MyLearningPageComponent } from './pages/my-learning-page/my-learning-page.component';

@NgModule({
  declarations: [MyLearningPageComponent],
  imports: [SharedModule, MyLearningRoutingModule],
})
export class MyLearningModule {}
