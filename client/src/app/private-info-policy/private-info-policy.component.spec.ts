import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivateInfoPolicyComponent } from './private-info-policy.component';

describe('PrivateInfoPolicyComponent', () => {
  let component: PrivateInfoPolicyComponent;
  let fixture: ComponentFixture<PrivateInfoPolicyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PrivateInfoPolicyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrivateInfoPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
