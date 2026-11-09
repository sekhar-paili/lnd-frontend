import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { VideoAdminRoutingModule } from './video-admin-routing.module';
import { VideoAdminPageComponent } from './pages/video-admin-page/video-admin-page.component';

@NgModule({
  declarations: [VideoAdminPageComponent],
  imports: [SharedModule, VideoAdminRoutingModule],
})
export class VideoAdminModule {}
