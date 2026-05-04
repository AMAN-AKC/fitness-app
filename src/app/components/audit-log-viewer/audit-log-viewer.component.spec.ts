import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuditLogViewerComponent } from './audit-log-viewer.component';

describe('AuditLogViewerComponent', () => {
  let component: AuditLogViewerComponent;
  let fixture: ComponentFixture<AuditLogViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AuditLogViewerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditLogViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with 5 logs', () => {
    expect(component.logs.length).toBe(5);
  });

  it('should get type icon', () => {
    expect(component.getTypeIcon('create')).toBe('✚');
  });

  it('should filter logs by type', () => {
    component.filterType = 'create';
    const filtered = component.filteredLogs;
    expect(filtered.every((l) => l.type === 'create')).toBe(true);
  });
});
