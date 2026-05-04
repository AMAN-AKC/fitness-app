import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataImportExportComponent } from './data-import-export.component';

describe('DataImportExportComponent', () => {
  let component: DataImportExportComponent;
  let fixture: ComponentFixture<DataImportExportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DataImportExportComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DataImportExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should handle file selection', () => {
    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    component.selectedFile = file;
    expect(component.selectedFile).toEqual(file);
  });

  it('should export data', () => {
    component.exportMembers();
    expect(component.exportStatus).toContain('Exporting');
  });
});
