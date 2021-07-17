import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserdropdownComponent } from './userdropdown.component';

describe('UserdropdownComponent', () => {
  let component: UserdropdownComponent;
  let fixture: ComponentFixture<UserdropdownComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserdropdownComponent ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserdropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
