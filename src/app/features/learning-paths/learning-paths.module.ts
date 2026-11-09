import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { LearningPathsRoutingModule } from './learning-paths-routing.module';
import { PathListPageComponent } from './pages/path-list-page/path-list-page.component';
import { PathDetailPageComponent } from './pages/path-detail-page/path-detail-page.component';

@NgModule({
  declarations: [PathListPageComponent, PathDetailPageComponent],
  imports: [SharedModule, LearningPathsRoutingModule],
})
export class LearningPathsModule {}
