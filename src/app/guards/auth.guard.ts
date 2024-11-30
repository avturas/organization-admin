import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';

export const canActivateDashboard: CanActivateFn = (route, state) => {
  if (!inject(AuthService).getIsAuthenticated()) {
    return inject(Router).createUrlTree(['/signIn']);
  }
  return true;
};

export const isAlreadySignedIn: CanActivateFn = (route, state) => {
  if (inject(AuthService).getIsAuthenticated()) {
    return inject(Router).createUrlTree(['/']);
  }
  return true;
};
