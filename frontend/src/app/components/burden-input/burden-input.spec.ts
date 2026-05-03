import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BurdenInput } from './burden-input';

describe('BurdenInput', () => {
  let component: BurdenInput;
  let fixture: ComponentFixture<BurdenInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BurdenInput],
    }).compileComponents();

    fixture = TestBed.createComponent(BurdenInput);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
