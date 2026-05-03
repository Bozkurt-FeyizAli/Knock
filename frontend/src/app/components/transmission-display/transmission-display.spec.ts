import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransmissionDisplay } from './transmission-display';

describe('TransmissionDisplay', () => {
  let component: TransmissionDisplay;
  let fixture: ComponentFixture<TransmissionDisplay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransmissionDisplay],
    }).compileComponents();

    fixture = TestBed.createComponent(TransmissionDisplay);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
