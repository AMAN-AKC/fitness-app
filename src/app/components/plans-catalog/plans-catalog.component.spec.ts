import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlansCatalogComponent } from './plans-catalog.component';

describe('PlansCatalogComponent', () => {
  let component: PlansCatalogComponent;
  let fixture: ComponentFixture<PlansCatalogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlansCatalogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PlansCatalogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 3 plans', () => {
    expect(component.plans.length).toBe(3);
  });

  it('should have one popular plan', () => {
    const popular = component.plans.filter((p) => p.popular);
    expect(popular.length).toBe(1);
  });

  it('should format price', () => {
    expect(component.formatPrice(1000)).toBe('₹1,000');
  });
});
