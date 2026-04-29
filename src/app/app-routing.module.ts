import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingComponent } from './components/landing/landing.component';
import { LoginComponent } from './components/login/login.component';
import { ResetpasswordComponent } from './components/resetpassword/resetpassword.component';
import { GlobalDashboardComponent } from './components/global-dashboard/global-dashboard.component';
import { ErrorPageComponent } from './components/shared/error-page/error-page.component';
import { MemberDashboardComponent } from './components/member-dashboard/member-dashboard.component';

const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'landing', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'resetpassword', component: ResetpasswordComponent },
  { path: 'global-dashboard', component: GlobalDashboardComponent },
  { path: 'member-dashboard', component: MemberDashboardComponent },
  { path: 'error-showcase', component: ErrorPageComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
