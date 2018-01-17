import { Component, OnInit } from '@angular/core';
import { HttpServiceService } from '../http-service.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-home',
  templateUrl: './admin-home.component.html',
  styleUrls: ['./admin-home.component.css']
})
export class AdminHomeComponent implements OnInit {

  nickname = "";

  constructor(
    public httpService: HttpServiceService,
    public router: Router
  ) { }

  ngOnInit() {
    this.httpService.getUserInfo()
    .subscribe(
      (data) => {
        if(data.success == true) {
          this.nickname = data.data.nickname;
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

  logout() {
    this.httpService.logout();
  }

  registerProject() {
    this.router.navigate([ '/admin/register-project' ]);
  }

  registerNewsfeed() {
    this.router.navigate([ '/admin/register-newsfeed' ]);
  }

  openReportListPage() {
    this.router.navigate([ '/admin/report-list' ]);
  }

  openPointExchangeListPage() {
    this.router.navigate([ '/admin/point-exchange-list' ]);
  }
  
}
