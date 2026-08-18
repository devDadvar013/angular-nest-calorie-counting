import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** فقط کاربران واردشده می‌توانند وارد صفحه شوند */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.user$.pipe(
    map((user): true | UrlTree =>
      user ? true : router.createUrlTree(['/login']),
    ),
  );
};

/** کاربر واردشده نباید صفحه لاگین را ببیند */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.user$.pipe(
    map((user): true | UrlTree =>
      user ? router.createUrlTree(['/dashboard']) : true,
    ),
  );
};
