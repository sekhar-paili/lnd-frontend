import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { from, map, of, switchMap } from 'rxjs';

import { AppStateService } from '../../../../core/services/app-state.service';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
  standalone: false,
})
export class LoginPageComponent {
  error = '';
  showPassword = false;
  loading = false;
  build_version: any = environment.buildVersion;
  /** Seeded demo-account shortcuts; shown in development builds only. */
  readonly showDemoAccounts = environment.useDemoAuth;

  readonly form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  /** Credentials of the accounts seeded into the backend database (dev only). */
  readonly demoAccounts = [
    { role: 'L&D Admin', username: 'admin', password: 'admin123' },
    { role: 'Employee', username: 'erin', password: 'employee123' },
    { role: 'Partner', username: 'partner', password: 'partner123' },
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly appState: AppStateService,
    private readonly router: Router,
  ) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  submit(): void {
    if (this.loading) {
      return;
    }
    this.error = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { username, password } = this.form.getRawValue();
    this.loading = true;
    this.auth
      .login(username ?? '', password ?? '')
      .pipe(
        // Load the account's data before leaving the page, so the first
        // screen is already populated instead of flashing empty.
        switchMap((result) =>
          result.success ? from(this.appState.loadSessionData()).pipe(map(() => result)) : of(result),
        ),
      )
      .subscribe((result) => {
        this.loading = false;
        if (result.success) {
          void this.router.navigate(['/dashboard']);
        } else {
          this.error = result.error ?? 'Login failed.';
        }
      });
  }

  fillDemo(account: { username: string; password: string }): void {
    this.form.setValue({ username: account.username, password: account.password });
    this.error = '';
  }
}
