import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { CatalogueRoutingModule } from './catalogue-routing.module';
import { CataloguePageComponent } from './pages/catalogue-page/catalogue-page.component';
import { VideoCardComponent } from './components/video-card/video-card.component';

@NgModule({
  declarations: [CataloguePageComponent, VideoCardComponent],
  imports: [SharedModule, CatalogueRoutingModule],
})
export class CatalogueModule {}
