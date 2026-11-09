import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CataloguePageComponent } from './pages/catalogue-page/catalogue-page.component';

const routes: Routes = [{ path: '', component: CataloguePageComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CatalogueRoutingModule {}
