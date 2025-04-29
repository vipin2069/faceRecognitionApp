import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FaceInfoComponent } from './face-info.component';

describe('FaceInfoComponent', () => {
  let component: FaceInfoComponent;
  let fixture: ComponentFixture<FaceInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FaceInfoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FaceInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
