import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { VideoAdminPageComponent } from './pages/video-admin-page/video-admin-page.component';

const routes: Routes = [{ path: '', component: VideoAdminPageComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VideoAdminRoutingModule {}
