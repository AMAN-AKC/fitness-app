import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CheckoutComponent } from './checkout.component';

describe('CheckoutComponent', () => {
  let component: CheckoutComponent;
  let fixture: ComponentFixture<CheckoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CheckoutComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CheckoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate totals', () => {
    expect(component.getSubtotal()).toBe(19999);
    expect(component.getTax()).toBeGreaterThan(0);
  });

  it('should remove item', () => {
    const initialCount = component.items.length;
    component.removeItem(component.items[0].id);
    expect(component.items.length).toBe(initialCount - 1);
  });

  it('should update quantity', () => {
    component.updateQuantity(component.items[0].id, 5);
    expect(component.items[0].quantity).toBe(5);
  });
});
