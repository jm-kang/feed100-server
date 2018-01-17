import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PointExchangeListComponent } from './point-exchange-list.component';

describe('PointExchangeListComponent', () => {
  let component: PointExchangeListComponent;
  let fixture: ComponentFixture<PointExchangeListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PointExchangeListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PointExchangeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
