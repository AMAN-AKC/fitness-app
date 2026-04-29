import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToastComponent } from './toast.component';

describe('ToastComponent', () => {
  let component: ToastComponent;
  let fixture: ComponentFixture<ToastComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ToastComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add success toast', () => {
    component.success('Test success message');
    expect(component.toasts.length).toBe(1);
    expect(component.toasts[0].type).toBe('success');
  });

  it('should add warning toast', () => {
    component.warning('Test warning message');
    expect(component.toasts.length).toBe(1);
    expect(component.toasts[0].type).toBe('warning');
  });

  it('should add error toast', () => {
    component.error('Test error message');
    expect(component.toasts.length).toBe(1);
    expect(component.toasts[0].type).toBe('error');
  });

  it('should add info toast', () => {
    component.info('Test info message');
    expect(component.toasts.length).toBe(1);
    expect(component.toasts[0].type).toBe('info');
  });

  it('should dismiss specific toast', () => {
    component.success('Message 1');
    component.success('Message 2');
    const toastId = component.toasts[0].id;
    component.dismiss(toastId);
    expect(component.toasts.length).toBe(1);
  });

  it('should dismiss all toasts', () => {
    component.success('Message 1');
    component.warning('Message 2');
    component.dismissAll();
    expect(component.toasts.length).toBe(0);
  });

  it('should auto-dismiss after duration', (done) => {
    component.success('Test message', 100);
    expect(component.toasts.length).toBe(1);
    setTimeout(() => {
      expect(component.toasts.length).toBe(0);
      done();
    }, 150);
  });

  it('should return correct icon for toast type', () => {
    expect(component.getIcon('success')).toBe('✓');
    expect(component.getIcon('warning')).toBe('⚠');
    expect(component.getIcon('error')).toBe('✗');
    expect(component.getIcon('info')).toBe('ℹ');
  });

  it('should generate unique toast IDs', () => {
    component.success('Message 1');
    component.success('Message 2');
    const id1 = component.toasts[0].id;
    const id2 = component.toasts[1].id;
    expect(id1).not.toEqual(id2);
  });
});
