import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { PlayerRoutingModule } from './player-routing.module';
import { PlayerPageComponent } from './pages/player-page/player-page.component';

@NgModule({
  declarations: [PlayerPageComponent],
  imports: [SharedModule, PlayerRoutingModule],
})
export class PlayerModule {}
