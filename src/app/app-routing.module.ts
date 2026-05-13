import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingComponent } from './components/landing/landing.component';
import { LoginComponent } from './components/login/login.component';
import { ResetpasswordComponent } from './components/resetpassword/resetpassword.component';
import { GlobalDashboardComponent } from './components/global-dashboard/global-dashboard.component';
import { ErrorPageComponent } from './components/shared/error-page/error-page.component';
import { MemberDashboardComponent } from './components/member-dashboard/member-dashboard.component';
import { FrontdeskDashboardComponent } from './components/frontdesk-dashboard/frontdesk-dashboard.component';
import { MemberRegistrationComponent } from './components/member-registration/member-registration.component';
import { ManagerDashboardComponent } from './components/manager-dashboard/manager-dashboard.component';
import { TrainerDashboardComponent } from './components/trainer-dashboard/trainer-dashboard.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { AdminUserManagementComponent } from './components/admin-user-management/admin-user-management.component';
import { AdminBranchManagementComponent } from './components/admin-branch-management/admin-branch-management.component';
import { AdminPlancatalogComponent } from './components/admin-plancatalog/admin-plancatalog.component';
import { HealthFormsComponent } from './components/health-forms/health-forms.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'landing', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'resetpassword', component: ResetpasswordComponent },
  {
    path: 'global-dashboard',
    component: GlobalDashboardComponent,
    canActivate: [AuthGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'admin-dashboard',
    component: AdminDashboardComponent,
    canActivate: [AuthGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'admin-users',
    component: AdminUserManagementComponent,
    canActivate: [AuthGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'admin-branches',
    component: AdminBranchManagementComponent,
    canActivate: [AuthGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'admin-plans',
    component: AdminPlancatalogComponent,
    canActivate: [AuthGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'member-dashboard',
    component: MemberDashboardComponent,
    canActivate: [AuthGuard],
    data: { roles: ['member'] },
  },
  {
    path: 'health-forms',
    component: HealthFormsComponent,
    canActivate: [AuthGuard],
    data: { roles: ['member'] },
  },
  {
    path: 'frontdesk-dashboard',
    component: FrontdeskDashboardComponent,
    canActivate: [AuthGuard],
    data: { roles: ['frontdesk'] },
  },
  {
    path: 'member-registration',
    component: MemberRegistrationComponent,
    canActivate: [AuthGuard],
    data: { roles: ['frontdesk', 'admin'] },
  },
  {
    path: 'manager-dashboard',
    component: ManagerDashboardComponent,
    canActivate: [AuthGuard],
    data: { roles: ['manager'] },
  },
  {
    path: 'trainer-dashboard',
    component: TrainerDashboardComponent,
    canActivate: [AuthGuard],
    data: { roles: ['trainer'] },
  },
  { path: 'error-showcase', component: ErrorPageComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
