import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { FormsModule } from '@angular/forms';
import { HttpServiceService } from './http-service.service';
import { HttpModule } from '@angular/http';
import { AdminHomeComponent } from './admin-home/admin-home.component';
import { RegisterProjectComponent } from './register-project/register-project.component';
import { RegisterNewsfeedComponent } from './register-newsfeed/register-newsfeed.component';

const ROUTES = [
  {
    path: '',
    component: HomeComponent
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
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot(ROUTES)
  ],
  providers: [HttpServiceService],
  bootstrap: [AppComponent]
})
export class AppModule { }
