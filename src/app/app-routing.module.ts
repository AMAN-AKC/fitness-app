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
import { NotificationsCenterComponent } from './components/notifications-center/notifications-center.component';
import { PlansCatalogComponent } from './components/plans-catalog/plans-catalog.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { ManagerScheduleComponent } from './components/manager-schedule/manager-schedule.component';
import { ClassBookingComponent } from './components/class-booking/class-booking.component';
import { AuditLogViewerComponent } from './components/audit-log-viewer/audit-log-viewer.component';
import { DataImportExportComponent } from './components/data-import-export/data-import-export.component';
import { AdminPromosComponent } from './components/admin-promos/admin-promos.component';

import { TrainerProfileComponent } from './components/trainer-profile/trainer-profile.component';
import { MemberReferralComponent } from './components/member-referral/member-referral.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'landing', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'resetpassword', component: ResetpasswordComponent },
  {
    path: 'admin',
    component: GlobalDashboardComponent,
    canActivate: [AuthGuard],
    data: { roles: ['admin'] },
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'users', component: AdminUserManagementComponent },
      { path: 'branches', component: AdminBranchManagementComponent },
      { path: 'plans', component: AdminPlancatalogComponent },
      { path: 'notifications', component: NotificationsCenterComponent },
      { path: 'audit-logs', component: AuditLogViewerComponent },
      { path: 'import-export', component: DataImportExportComponent },
      { path: 'promos', component: AdminPromosComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  {
    path: 'frontdesk',
    component: GlobalDashboardComponent,
    canActivate: [AuthGuard],
    data: { roles: ['frontdesk', 'admin'] },
    children: [
      { path: 'dashboard', component: FrontdeskDashboardComponent, data: { roles: ['frontdesk', 'admin'] } },
      { path: 'registration', component: MemberRegistrationComponent, data: { roles: ['frontdesk', 'admin'] } },
      { path: 'notifications', component: NotificationsCenterComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  {
    path: 'manager',
    component: GlobalDashboardComponent,
    canActivate: [AuthGuard],
    data: { roles: ['manager'] },
    children: [
      { path: 'dashboard', component: ManagerDashboardComponent },
      { path: 'schedule', component: ManagerScheduleComponent },
      { path: 'notifications', component: NotificationsCenterComponent },
      { path: 'audit-logs', component: AuditLogViewerComponent },
      { path: 'import-export', component: DataImportExportComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  {
    path: 'trainer',
    component: GlobalDashboardComponent,
    canActivate: [AuthGuard],
    data: { roles: ['trainer'] },
    children: [
      { path: 'dashboard', component: TrainerDashboardComponent },
      { path: 'notifications', component: NotificationsCenterComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  {
    path: 'member',
    component: GlobalDashboardComponent,
    canActivate: [AuthGuard],
    data: { roles: ['member'] },
    children: [
      { path: 'dashboard', component: MemberDashboardComponent },
      { path: 'class-booking', component: ClassBookingComponent },
      { path: 'health-forms', component: HealthFormsComponent },
      { path: 'plans', component: PlansCatalogComponent },
      { path: 'checkout', component: CheckoutComponent },
      { path: 'notifications', component: NotificationsCenterComponent },
      { path: 'trainers', component: TrainerProfileComponent },
      { path: 'referral', component: MemberReferralComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  // Redirects for old paths
  { path: 'member-dashboard', redirectTo: 'member/dashboard' },
  { path: 'health-forms', redirectTo: 'member/health-forms' },
  // Redirects for old paths
  { path: 'admin-dashboard', redirectTo: 'admin/dashboard' },
  { path: 'frontdesk-dashboard', redirectTo: 'frontdesk/dashboard' },
  { path: 'manager-dashboard', redirectTo: 'manager/dashboard' },
  { path: 'trainer-dashboard', redirectTo: 'trainer/dashboard' },
  
  { path: 'unauthorized', component: ErrorPageComponent, data: { code: '401' } },
  { path: 'forbidden', component: ErrorPageComponent, data: { code: '403' } },
  { path: 'server-error', component: ErrorPageComponent, data: { code: '500' } },
  { path: 'not-found', component: ErrorPageComponent, data: { code: '404' } },
  { path: 'error-showcase', component: ErrorPageComponent },
  { path: '**', redirectTo: 'not-found' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
