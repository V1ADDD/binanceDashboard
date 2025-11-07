import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SymbolsTable } from './symbols-table';

describe('SymbolsTable', () => {
  let component: SymbolsTable;
  let fixture: ComponentFixture<SymbolsTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SymbolsTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SymbolsTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
