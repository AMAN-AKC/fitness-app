import { NgModule } from '@angular/core';
import {
  BrowserModule,
  provideClientHydration,
} from '@angular/platform-browser';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withFetch,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth.interceptor';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LandingComponent } from './components/landing/landing.component';
import { LoginComponent } from './components/login/login.component';
import { ResetpasswordComponent } from './components/resetpassword/resetpassword.component';
import { GlobalDashboardComponent } from './components/global-dashboard/global-dashboard.component';
import { ErrorPageComponent } from './components/shared/error-page/error-page.component';
import { EmptyStateComponent } from './components/shared/empty-state/empty-state.component';
import { ToastComponent } from './components/shared/toast/toast.component';
import { MemberDashboardComponent } from './components/member-dashboard/member-dashboard.component';
import { FrontdeskDashboardComponent } from './components/frontdesk-dashboard/frontdesk-dashboard.component';
import { MemberRegistrationComponent } from './components/member-registration/member-registration.component';
import { TrainerDashboardComponent } from './components/trainer-dashboard/trainer-dashboard.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { AdminUserManagementComponent } from './components/admin-user-management/admin-user-management.component';
import { AdminBranchManagementComponent } from './components/admin-branch-management/admin-branch-management.component';
import { AdminPlancatalogComponent } from './components/admin-plancatalog/admin-plancatalog.component';
import { ManagerDashboardComponent } from './components/manager-dashboard/manager-dashboard.component';
import { TrainerProfileComponent } from './components/trainer-profile/trainer-profile.component';
import { HealthFormsComponent } from './components/health-forms/health-forms.component';
import { NotificationsCenterComponent } from './components/notifications-center/notifications-center.component';
import { ClassBookingComponent } from './components/class-booking/class-booking.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { ClassSchedulePageComponent } from './components/class-schedule-page/class-schedule-page.component';
import { DataImportExportComponent } from './components/data-import-export/data-import-export.component';
import { AuditLogViewerComponent } from './components/audit-log-viewer/audit-log-viewer.component';
import { DunningQueuePageComponent } from './components/dunning-queue-page/dunning-queue-page.component';
import { PlansCatalogComponent } from './components/plans-catalog/plans-catalog.component';

import { GlobalErrorComponent } from './components/global-error/global-error.component';
import { PlaceholderPageComponent } from './components/placeholder-page/placeholder-page.component';
import { ManagerScheduleComponent } from './components/manager-schedule/manager-schedule.component';

@NgModule({
  declarations: [
    AppComponent,
    LandingComponent,
    LoginComponent,
    ResetpasswordComponent,
    GlobalDashboardComponent,
    ErrorPageComponent,
    EmptyStateComponent,
    ToastComponent,
    MemberDashboardComponent,
    FrontdeskDashboardComponent,
    MemberRegistrationComponent,
    TrainerDashboardComponent,
    AdminUserManagementComponent,
    AdminPlancatalogComponent,
    ManagerDashboardComponent,
    TrainerProfileComponent,
    HealthFormsComponent,
    NotificationsCenterComponent,
    ClassBookingComponent,
    CheckoutComponent,
    ClassSchedulePageComponent,
    DataImportExportComponent,
    AuditLogViewerComponent,
    DunningQueuePageComponent,
    PlansCatalogComponent,
    GlobalErrorComponent,
    PlaceholderPageComponent,
    ManagerScheduleComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    AdminBranchManagementComponent,
    AdminDashboardComponent,
  ],
  providers: [
    provideClientHydration(),
    provideHttpClient(withFetch(), withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
