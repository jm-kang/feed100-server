import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MomentModule } from 'angular2-moment';
import { MatPaginatorModule, MatTableModule, MatFormFieldModule, MatInputModule,
  MatSortModule, MatButtonModule, MatDialogModule, MatDatepickerModule, MatNativeDateModule,
  MAT_DATE_LOCALE } from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { FormsModule } from '@angular/forms';
import { HttpServiceService } from './http-service.service';
import { HttpModule } from '@angular/http';
import { AdminHomeComponent } from './admin-home/admin-home.component';
import { RegisterProjectComponent } from './register-project/register-project.component';
import { RegisterNewsfeedComponent } from './register-newsfeed/register-newsfeed.component';
import { PrivateInfoPolicyComponent } from './private-info-policy/private-info-policy.component';
import { TermsComponent } from './terms/terms.component';
import { ReportListComponent } from './report-list/report-list.component';
import { PointExchangeListComponent } from './point-exchange-list/point-exchange-list.component';
import { PointExchangeDialogComponent } from './point-exchange-dialog/point-exchange-dialog.component';

import { ScrollToModule } from 'ng2-scroll-to';
import { Ng2DeviceDetectorModule } from 'ng2-device-detector';
// import { WINDOW_PROVIDERS } from "./window.service";

const ROUTES = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'private-info-policy',
    component: PrivateInfoPolicyComponent
  },
  {
    path: 'terms',
    component: TermsComponent
  },
  {
    path: 'admin',
    redirectTo: 'admin/login'
  },
  {
    path: 'admin',
    children: [
      {
        path: 'login',
        component: LoginComponent
      },
      {
        path: 'home',
        component: AdminHomeComponent
      },
      {
        path: 'register-project',
        component: RegisterProjectComponent
      },
      {
        path: 'register-newsfeed',
        component: RegisterNewsfeedComponent
      },
      {
        path: 'report-list',
        component: ReportListComponent
      },
      {
        path: 'point-exchange-list',
        component: PointExchangeListComponent
      },
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginComponent,
    AdminHomeComponent,
    RegisterProjectComponent,
    RegisterNewsfeedComponent,
    PrivateInfoPolicyComponent,
    TermsComponent,
    ReportListComponent,
    PointExchangeListComponent,
    PointExchangeDialogComponent,
    PointExchangeDialogComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    MomentModule,
    MatPaginatorModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSortModule,
    MatButtonModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    BrowserAnimationsModule,
    ScrollToModule.forRoot(),
    Ng2DeviceDetectorModule.forRoot(),
    RouterModule.forRoot(ROUTES)
  ],
  entryComponents: [
    PointExchangeDialogComponent
  ],
  providers: [
    HttpServiceService,
    {provide: MAT_DATE_LOCALE, useValue: 'ko-KR'},
    // WINDOW_PROVIDERS
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
