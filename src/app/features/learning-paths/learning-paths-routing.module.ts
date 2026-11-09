import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PathListPageComponent } from './pages/path-list-page/path-list-page.component';
import { PathDetailPageComponent } from './pages/path-detail-page/path-detail-page.component';

const routes: Routes = [
  { path: '', component: PathListPageComponent },
  { path: ':pathId', component: PathDetailPageComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LearningPathsRoutingModule {}
