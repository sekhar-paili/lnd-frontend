import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule, Optional, SkipSelf } from '@angular/core';

import { AuthInterceptor } from './http/auth.interceptor';

/**
 * CoreModule holds application-wide singletons. Services are declared
 * `providedIn: 'root'`; the module additionally registers the HTTP
 * interceptor and guards against being imported more than once.
 */
@NgModule({
  imports: [CommonModule],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }],
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parent: CoreModule) {
    if (parent) {
      throw new Error(
        'CoreModule is already loaded. Import it in AppModule only.',
      );
    }
  }
}
