import { Component, OnInit } from '@angular/core';
import { HttpServiceService } from '../http-service.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  username: string = "";
  password: string = "";
  role: string = "admin";

  constructor(
    public httpService: HttpServiceService,
    public router: Router
  ) { }

  ngOnInit() {
    this.httpService.getUserInfo()
    .subscribe(
      (data) => {
        if(data.success == true) {
          alert('이미 로그인되어있습니다.');
          this.router.navigate([ '/admin/home' ]);
        }
        else if(data.success == false) {
          this.httpService.apiRequestErrorHandler(data)
          .then(() => {
            this.ngOnInit();
          })
        }
      },
      (err) => {
        console.log(err);
        alert('오류가 발생했습니다.');
      }
    );
  }

  localLogin() {
    if(!this.username) {
      alert('이메일을 입력해주세요.');
      return;
    }
    if(!this.password) {
      alert('비밀번호를 입력해주세요.');
      return;
    }
    this.httpService.localLogin(this.username, this.password, this.role)
    .subscribe(
      (data) => {
        if(data.success == true) {
          localStorage.setItem('accessToken', data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken);
          this.router.navigate([ '/admin/home' ]);
        }
        else if(data.success == false) {
          switch(data.message) {
            case 'username is unregistered':
              alert('이메일을 정확히 입력해주세요.');
              break;
            case 'password is not correct':
              alert('비밀번호를 정확히 입력해주세요.');
              break;
          }
        }
      },
      (err) => {
        console.log(err);
        alert('오류가 발생했습니다.');
      }
    );
  }

}
