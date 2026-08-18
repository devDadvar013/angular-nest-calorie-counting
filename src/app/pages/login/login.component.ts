import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { AuthService } from '../../services/auth.service';

/** اعتبارنامه پیش‌فرض — با SeedService بک‌اند هماهنگ است */
const DEMO_EMAIL = 'demo@calorie.app';
const DEMO_PASSWORD = 'demo1234';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** 'login' یا 'register' */
  readonly mode = signal<'login' | 'register'>('login');

  readonly demoEmail = DEMO_EMAIL;
  readonly demoPassword = DEMO_PASSWORD;

  readonly form = new FormGroup({
    name: new FormControl(''),
    email: new FormControl(DEMO_EMAIL, [
      Validators.required,
      Validators.email,
    ]),
    password: new FormControl(DEMO_PASSWORD, [
      Validators.required,
      Validators.minLength(6),
    ]),
  });

  readonly loggingIn = signal(false);
  readonly error = signal('');

  toggleMode(): void {
    this.mode.set(this.mode() === 'login' ? 'register' : 'login');
    this.error.set('');
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    const { email, password, name } = this.form.value;
    this.loggingIn.set(true);
    this.error.set('');

    const call =
      this.mode() === 'login'
        ? this.auth.login(email ?? '', password ?? '')
        : this.auth.register(
            email ?? '',
            password ?? '',
            (name ?? '').trim() || undefined,
          );

    call.pipe(take(1)).subscribe((user) => {
      this.loggingIn.set(false);
      if (user) {
        this.router.navigate(['/dashboard']);
      } else {
        this.error.set(
          this.mode() === 'login'
            ? 'ایمیل یا رمز عبور نامعتبر است.'
            : 'ثبت‌نام انجام نشد؛ شاید این ایمیل قبلاً ثبت شده باشد.',
        );
      }
    });
  }
}
