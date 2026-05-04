import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagerDashboardComponent } from './manager-dashboard.component';

describe('ManagerDashboardComponent', () => {
  let component: ManagerDashboardComponent;
  let fixture: ComponentFixture<ManagerDashboardComponent>;

  beforeEach(async ) {
    await TestBed.configureTestingModule({
      declarations: [ ManagerDashboardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagerDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 5 KPI tiles', () => {
    expect(component).toBeTruthy();
  });

  it('should have 5 classes in classData', () => {
    expect(component.classData.length).toBe(5);
  });

  it('should have 4 dunning members', () => {
    expect(component.dunningMembers.length).toBe(4);
  });

  it('should format currency correctly', () => {
    expect(component.formatCurrency(428500)).toBe('₹4.29L');
    expect(component.formatCurrency(50000)).toBe('₹50000');
  });

  it('should set chart metric', () => {
    component.setChartMetric('New Joins');
    expect(component.chartMetric).toBe('New Joins');
  });

  it('should retry payment', () => {
    const member = component.dunningMembers[0];
    component.retryPayment(member);
    expect(member.status).toBe('attempted');
  });
});
