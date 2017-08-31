import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterProjectComponent } from './register-project.component';

describe('RegisterProjectComponent', () => {
  let component: RegisterProjectComponent;
  let fixture: ComponentFixture<RegisterProjectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RegisterProjectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RegisterProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
