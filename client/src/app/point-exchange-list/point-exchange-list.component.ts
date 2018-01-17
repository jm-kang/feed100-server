import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { HttpServiceService } from '../http-service.service';
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { PointExchangeDialogComponent } from '../point-exchange-dialog/point-exchange-dialog.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-point-exchange-list',
  templateUrl: './point-exchange-list.component.html',
  styleUrls: ['./point-exchange-list.component.css']
})
export class PointExchangeListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator
  @ViewChild(MatSort) sort: MatSort;
  displayedColumns = ['point_history_id', 'user_id', 'point', 'bank_name', 'account_number', 'account_holder_name', 'point_history_registration_date', 'complete'];
  dataSource;

  @ViewChild('table2', {read: MatPaginator}) additionalDataPaginator: MatPaginator;  
  @ViewChild('table2', {read: MatSort}) additionalDataSort: MatSort;
  displayedColumns2 = ['point_history_id', 'user_id', 'point', 'bank_name', 'account_number', 'account_holder_name', 'point_history_registration_date', 'admin_name', 'deposit_amount', 'deposit_date'];
  dataSource2;

  pointExchangeList;

  constructor(
    public httpService: HttpServiceService,
    public dialog: MatDialog,
    public router: Router      
  ) { }

  ngOnInit() {
    this.httpService.getPointHistories()
    .subscribe(
      (data) => {
        if(data.success == true) {
          this.pointExchangeList = data.data;
          this.dataSource = new MatTableDataSource();
          this.dataSource.data = this.pointExchangeList.isNotCompleted;
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;      

          this.dataSource2 = new MatTableDataSource();          
          this.dataSource2.data = this.pointExchangeList.isCompleted;
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

  openDialog(point_history_id): void {
    let dialogRef = this.dialog.open(PointExchangeDialogComponent, {
      width: '250px',
      data: { point_history_id : point_history_id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result) {
        this.httpService.completeExchange(result)
        .subscribe(
          (data) => {
            if(data.success == true) {
              alert('처리가 완료되었습니다.');
              window.location.reload();            
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
    });
  }


}