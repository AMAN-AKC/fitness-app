import { NgModule } from '@angular/core';
import {
  BrowserModule,
  provideClientHydration,
} from '@angular/platform-browser';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
  ],
  providers: [provideClientHydration()],
  bootstrap: [AppComponent],
})
export class AppModule {}
