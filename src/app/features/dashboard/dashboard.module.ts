import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardPageComponent } from './pages/dashboard-page/dashboard-page.component';
import { MilestoneListComponent } from './components/milestone-list/milestone-list.component';

@NgModule({
  declarations: [DashboardPageComponent, MilestoneListComponent],
  imports: [SharedModule, DashboardRoutingModule],
})
export class DashboardModule {}
