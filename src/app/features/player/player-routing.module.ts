import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PlayerPageComponent } from './pages/player-page/player-page.component';

const routes: Routes = [
  { path: ':videoId', component: PlayerPageComponent },
  { path: '', redirectTo: '/catalogue', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PlayerRoutingModule {}
