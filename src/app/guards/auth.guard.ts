import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): boolean {
    const requiredRoles = route.data['roles'] as string[] | undefined;
    const session = this.authService.getCurrentSession();

    if (!session) {
      this.router.navigate(['/login']);
      return false;
    }

    if (requiredRoles && !this.authService.hasRole(requiredRoles)) {
      this.router.navigate(['/forbidden']);
      return false;
    }

    return true;
  }
}
