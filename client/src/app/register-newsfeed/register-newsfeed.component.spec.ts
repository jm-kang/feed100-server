import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterNewsfeedComponent } from './register-newsfeed.component';

describe('RegisterNewsfeedComponent', () => {
  let component: RegisterNewsfeedComponent;
  let fixture: ComponentFixture<RegisterNewsfeedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RegisterNewsfeedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RegisterNewsfeedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
