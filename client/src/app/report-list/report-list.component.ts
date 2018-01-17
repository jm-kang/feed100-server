import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpServiceService } from '../http-service.service';
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';

@Component({
  selector: 'app-report-list',
  templateUrl: './report-list.component.html',
  styleUrls: ['./report-list.component.css']
})
export class ReportListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator
  @ViewChild(MatSort) sort: MatSort;
  displayedColumns = ['project_name', 'project_participant_id', 'type', 'feedback_id', 'opinion_id', 'interview_id', 'report_id', 'project_report_registration_date'];
  dataSource;

  @ViewChild('table2', {read: MatPaginator}) additionalDataPaginator: MatPaginator;  
  @ViewChild('table2', {read: MatSort}) additionalDataSort: MatSort;
  displayedColumns2 = ['newsfeed_name', 'newsfeed_comment_id', 'newsfeed_report_registration_date'];
  dataSource2;

  reportList;

  constructor(
    public httpService: HttpServiceService,    
  ) {
   }

   ngOnInit() {
    this.httpService.getReportList()
    .subscribe(
      (data) => {
        if(data.success == true) {
          this.reportList = data.data;   
          this.dataSource = new MatTableDataSource();
          this.dataSource.data = this.reportList.project_report;
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;      

          this.dataSource2 = new MatTableDataSource();          
          this.dataSource2.data = this.reportList.newsfeed_report;
          this.dataSource2.paginator = this.additionalDataPaginator;
          this.dataSource2.sort = this.additionalDataSort;      
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

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
    this.dataSource.filter = filterValue;
  }

  applyFilter2(filterValue: string) {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
    this.dataSource2.filter = filterValue;
  }


}
