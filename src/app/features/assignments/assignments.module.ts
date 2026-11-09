import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { AssignmentsRoutingModule } from './assignments-routing.module';
import { AssignmentsPageComponent } from './pages/assignments-page/assignments-page.component';

@NgModule({
  declarations: [AssignmentsPageComponent],
  imports: [SharedModule, AssignmentsRoutingModule],
})
export class AssignmentsModule {}
