import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  let component: EmptyStateComponent;
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmptyStateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default input values', () => {
    expect(component.title).toBe('No items found');
    expect(component.description).toBe(
      'Try adjusting your filters or search criteria.',
    );
    expect(component.isGhost).toBe(true);
  });

  it('should accept custom input values', () => {
    component.title = 'Custom Title';
    component.description = 'Custom Description';
    component.buttonText = 'Custom Button';
    fixture.detectChanges();
    expect(component.title).toBe('Custom Title');
  });

  it('should execute button action callback', () => {
    const mockCallback = jasmine.createSpy('callback');
    component.buttonAction = mockCallback;
    component.onButtonClick();
    expect(mockCallback).toHaveBeenCalled();
  });

  it('should generate calendar icon SVG', () => {
    component.icon = 'calendar';
    const svg = component.getIconSvg();
    expect(svg).toContain('svg');
  });

  it('should generate search icon SVG', () => {
    component.icon = 'search';
    const svg = component.getIconSvg();
    expect(svg).toContain('circle');
  });

  it('should generate inbox icon SVG', () => {
    component.icon = 'inbox';
    const svg = component.getIconSvg();
    expect(svg).toContain('svg');
  });

  it('should generate box icon SVG', () => {
    component.icon = 'box';
    const svg = component.getIconSvg();
    expect(svg).toContain('svg');
  });

  it('should generate heart icon SVG', () => {
    component.icon = 'heart';
    const svg = component.getIconSvg();
    expect(svg).toContain('svg');
  });

  it('should return box icon for unknown icon type', () => {
    component.icon = 'unknown';
    const svg = component.getIconSvg();
    expect(svg).toContain('svg');
  });
});
