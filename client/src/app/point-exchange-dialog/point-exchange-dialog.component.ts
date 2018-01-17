import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-point-exchange-dialog',
  templateUrl: './point-exchange-dialog.component.html',
  styleUrls: ['./point-exchange-dialog.component.css']
})
export class PointExchangeDialogComponent implements OnInit {
  point_history_id;
  admin_name;
  deposit_amount;
  deposit_date;
  deposit_time;

  constructor(
    public dialogRef: MatDialogRef<PointExchangeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { 
    this.point_history_id = data.point_history_id;
  }

  ngOnInit() {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onYesClick(): void {
    if(this.point_history_id && this.admin_name && this.deposit_amount && this.deposit_date && this.deposit_time) {
      if(confirm("point_history_id : " + this.point_history_id +
              "\nadmin_name : " + this.admin_name +
              "\ndeposit_amount : " + this.deposit_amount +
              "\ndeposit_date : " + this.getFullFormatDate(this.deposit_date, this.deposit_time) +
              "\n정말 완료하시겠어요??")) {
        this.dialogRef.close({
          point_history_id: this.point_history_id,
          admin_name: this.admin_name,
          deposit_amount: this.deposit_amount,
          deposit_date: this.getFullFormatDate(this.deposit_date, this.deposit_time)
        });
      }
    }
  }

  getFullFormatDate(date, time) {
    return date.getFullYear() + "-" + this.padDate(date.getMonth() + 1) + "-" + date.getDate() + " " + time + ":00";
  }

  padDate(month) {
    return (month < 10) ? "0" + month : month;
  }

}