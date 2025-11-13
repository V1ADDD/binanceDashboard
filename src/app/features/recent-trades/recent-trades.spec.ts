import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecentTrades } from './recent-trades';

describe('RecentTrades', () => {
  let component: RecentTrades;
  let fixture: ComponentFixture<RecentTrades>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentTrades],
    }).compileComponents();

    fixture = TestBed.createComponent(RecentTrades);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
