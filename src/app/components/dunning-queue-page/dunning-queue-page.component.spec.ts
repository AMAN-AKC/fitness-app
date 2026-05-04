import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DunningQueuePageComponent } from './dunning-queue-page.component';

describe('DunningQueuePageComponent', () => {
  let component: DunningQueuePageComponent;
  let fixture: ComponentFixture<DunningQueuePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DunningQueuePageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DunningQueuePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate total outstanding', () => {
    expect(component.getTotalOutstanding()).toBeGreaterThan(0);
  });

  it('should retry payment', () => {
    const item = component.dunningItems[0];
    const oldAttempts = item.attemptCount;
    component.retryPayment(item);
    expect(item.attemptCount).toBe(oldAttempts + 1);
    expect(item.status).toBe('queued');
  });

  it('should toggle expand', () => {
    component.toggleExpand('1');
    expect(component.expandedId).toBe('1');
    component.toggleExpand('1');
    expect(component.expandedId).toBeNull();
  });
});
