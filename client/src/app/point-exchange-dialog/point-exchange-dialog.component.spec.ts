import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PointExchangeDialogComponent } from './point-exchange-dialog.component';

describe('PointExchangeDialogComponent', () => {
  let component: PointExchangeDialogComponent;
  let fixture: ComponentFixture<PointExchangeDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PointExchangeDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PointExchangeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
