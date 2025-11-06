import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SymbolDetails } from './symbol-details';

describe('SymbolDetails', () => {
  let component: SymbolDetails;
  let fixture: ComponentFixture<SymbolDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SymbolDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SymbolDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
