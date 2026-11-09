import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MyLearningPageComponent } from './pages/my-learning-page/my-learning-page.component';

const routes: Routes = [{ path: '', component: MyLearningPageComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MyLearningRoutingModule {}
