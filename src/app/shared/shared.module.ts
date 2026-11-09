import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { CountUpDirective } from './directives/count-up.directive';
import { DurationPipe } from './pipes/duration.pipe';
import { PercentCompletePipe } from './pipes/percent-complete.pipe';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { SearchBarComponent } from './components/search-bar/search-bar.component';
import { RatingStarsComponent } from './components/rating-stars/rating-stars.component';
import { StatusBadgeComponent } from './components/status-badge/status-badge.component';

const DECLARATIONS = [
  CountUpDirective,
  DurationPipe,
  PercentCompletePipe,
  EmptyStateComponent,
  SearchBarComponent,
  RatingStarsComponent,
  StatusBadgeComponent,
];

@NgModule({
  declarations: DECLARATIONS,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    IonicModule,
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    IonicModule,
    ...DECLARATIONS,
  ],
})
export class SharedModule {}
