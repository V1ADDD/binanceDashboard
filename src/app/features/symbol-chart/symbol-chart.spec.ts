import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SymbolChart } from './symbol-chart';

describe('SymbolChart', () => {
  let component: SymbolChart;
  let fixture: ComponentFixture<SymbolChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SymbolChart],
    }).compileComponents();

    fixture = TestBed.createComponent(SymbolChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
