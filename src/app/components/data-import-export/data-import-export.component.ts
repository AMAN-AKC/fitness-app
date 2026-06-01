import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface BulkImportRowResult {
  rowNumber: number;
  status: string;
  errorMessage?: string;
  fieldErrors?: string;
}

interface BulkImportReport {
  success: boolean;
  message: string;
  fileName: string;
  overallStatus: string;
  totalRows: number;
  successCount: number;
  duplicateCount: number;
  validationErrorCount: number;
  systemErrorCount: number;
  rowResults: BulkImportRowResult[];
}

@Component({
  selector: 'app-data-import-export',
  templateUrl: './data-import-export.component.html',
  styleUrls: ['./data-import-export.component.css'],
  standalone: false
})
export class DataImportExportComponent {
  // Tabs
  activeImportTab: 'MEMBERS' | 'PLANS' | 'CLASSES' | 'SCHEDULE' = 'MEMBERS';
  activeExportTab: 'MEMBERS' | 'PLANS' | 'CLASSES' | 'SCHEDULE' = 'MEMBERS';

  // Import State
  selectedFile: File | null = null;
  dragOver = false;
  isImporting = false;
  importStatus = '';
  importReport: BulkImportReport | null = null;
  failedRows: { row: number; column: string; error: string }[] = [];
  showValidationResults = false;

  // Export State
  isExporting = false;
  exportStatus = '';
  lastExportInfo: { timestamp: string; fileName: string } | null = null;

  // Export Filters
  exportFilters = {
    dateFrom: '',
    dateTo: '',
    branchId: 'ALL',
    status: 'ALL'
  };

  private apiUrl = environment.apiBaseUrl || 'http://localhost:8080/api/v1';

  constructor(private http: HttpClient) {}

  // Tab Selection
  setImportTab(tab: 'MEMBERS' | 'PLANS' | 'CLASSES' | 'SCHEDULE'): void {
    this.activeImportTab = tab;
    this.resetImportState();
  }

  setExportTab(tab: 'MEMBERS' | 'PLANS' | 'CLASSES' | 'SCHEDULE'): void {
    this.activeExportTab = tab;
    this.exportStatus = '';
  }

  // File Handlers
  onFileSelected(event: any): void {
    const file = event.target.files?.[0] || null;
    this.handleFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    const file = event.dataTransfer?.files?.[0] || null;
    this.handleFile(file);
  }

  private handleFile(file: File | null): void {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('PLEASE SELECT A VALID CSV FILE.');
      this.selectedFile = null;
      return;
    }
    this.selectedFile = file;
    this.importStatus = '';
    this.importReport = null;
    this.failedRows = [];
    this.showValidationResults = false;
  }

  resetImportState(): void {
    this.selectedFile = null;
    this.importReport = null;
    this.failedRows = [];
    this.showValidationResults = false;
    this.importStatus = '';
  }

  // VALIDATE & UPLOAD
  validateAndUpload(): void {
    if (!this.selectedFile) {
      alert('PLEASE SELECT OR DRAG A CSV FILE FIRST.');
      return;
    }

    this.isImporting = true;
    this.importStatus = 'VALIDATING DATA...';

    let endpoint = 'members';
    if (this.activeImportTab === 'PLANS') endpoint = 'plans';
    else if (this.activeImportTab === 'CLASSES') endpoint = 'classes';
    else if (this.activeImportTab === 'SCHEDULE') endpoint = 'schedule';

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('dryRun', 'true');

    this.http.post<any>(`${this.apiUrl}/import/${endpoint}/csv`, formData).subscribe({
      next: (res) => {
        this.isImporting = false;
        
        // Parse backend response
        const total = res.totalRows || 0;
        const success = res.successCount || 0;
        const duplicates = res.duplicateCount || 0;
        const validationErrors = res.validationErrorCount || 0;
        
        this.importReport = {
          success: true,
          message: res.message || 'IMPORT COMPLETED.',
          fileName: res.fileName || this.selectedFile!.name,
          overallStatus: res.overallStatus || 'SUCCESS',
          totalRows: total,
          successCount: success,
          duplicateCount: duplicates,
          validationErrorCount: validationErrors,
          systemErrorCount: res.systemErrorCount || 0,
          rowResults: res.rowResults || []
        };

        // Format row results to failedRows
        this.failedRows = [];
        if (res.rowResults) {
          res.rowResults.forEach((r: any) => {
            if (r.status !== 'SUCCESS') {
              this.failedRows.push({
                row: r.rowNumber,
                column: r.fieldErrors || 'ROW DATA',
                error: r.errorMessage || 'VALIDATION ERROR'
              });
            }
          });
        }

        this.showValidationResults = true;
        this.importStatus = `SUCCESSFULLY PROCESSED CSV.`;
      },
      error: (err) => {
        this.isImporting = false;
        this.importStatus = `❌ ERROR: ${err?.error?.message || 'CSV UPLOAD FAILED.'}`;
      }
    });
  }

  // DOWNLOAD TEMPLATE
  downloadTemplate(): void {
    if (this.activeImportTab === 'MEMBERS') {
      this.http.get(`${this.apiUrl}/import/members/template`, { responseType: 'blob' }).subscribe({
        next: (response) => {
          const url = window.URL.createObjectURL(response);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'member_import_template.csv';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        },
        error: () => {
          this.fallbackTemplateDownload();
        }
      });
    } else {
      this.fallbackTemplateDownload();
    }
  }

  private fallbackTemplateDownload(): void {
    let headers = '';
    let fileName = '';
    
    if (this.activeImportTab === 'PLANS') {
      headers = 'planName,durationDays,price,accessStart,accessEnd,eligibilityType,prorationRule,taxPercent,branchVisibility\n';
      fileName = 'plans_import_template.csv';
    } else if (this.activeImportTab === 'CLASSES') {
      headers = 'className,trainerId,roomId,branchId,startDate,endDate,weekdays,classTime,durationMins,capacity,prerequisites,planEligibility\n';
      fileName = 'classes_import_template.csv';
    } else if (this.activeImportTab === 'SCHEDULE') {
      headers = 'classId,trainerId,roomId,date,time,status\n';
      fileName = 'schedule_import_template.csv';
    } else {
      headers = 'memName,email,phone,dob,address,emgContact,emgPhone,homeBranchId,referralCode,corporateCode,notes\n';
      fileName = 'member_import_template.csv';
    }

    const blob = new Blob([headers], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  // PROCEED & CANCEL
  proceedWithImport(): void {
    if (!this.selectedFile) return;
    this.isImporting = true;
    this.importStatus = 'COMMITTING DATA...';
    let endpoint = 'members';
    if (this.activeImportTab === 'PLANS') endpoint = 'plans';
    else if (this.activeImportTab === 'CLASSES') endpoint = 'classes';
    else if (this.activeImportTab === 'SCHEDULE') endpoint = 'schedule';

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('dryRun', 'false');

    this.http.post<any>(`${this.apiUrl}/import/${endpoint}/csv`, formData).subscribe({
      next: (res) => {
        this.isImporting = false;
        alert('DATA HAS BEEN COMMITTED TO THE DATABASE.');
        this.resetImportState();
      },
      error: (err) => {
        this.isImporting = false;
        alert(`❌ ERROR: ${err?.error?.message || 'COMMIT FAILED.'}`);
      }
    });
  }

  cancelImport(): void {
    this.resetImportState();
  }

  // EXPORT CSV
  exportData(): void {
    this.isExporting = true;
    this.exportStatus = 'GENERATING EXPORT FILE...';

    // Mock export delays and generate csv client-side
    setTimeout(() => {
      this.isExporting = false;
      let csvContent = '';
      let fileName = '';

      if (this.activeExportTab === 'CLASSES') {
        csvContent = 'classId,className,trainerId,roomId,branchId,startDate,endDate,weekdays,classTime,durationMins,capacity\n1,Yoga Basics,1,1,1,2026-05-01,2026-06-01,Mon,08:00:00,60,20\n';
        fileName = 'classes_export.csv';
      } else if (this.activeExportTab === 'PLANS') {
        csvContent = 'planId,planName,durationDays,price,eligibilityType,isActive\n1,General Pass,30,999.00,GENERAL,true\n2,Elite Membership,365,9999.00,CORPORATE,true\n';
        fileName = 'plans_export.csv';
      } else if (this.activeExportTab === 'SCHEDULE') {
        csvContent = 'scheduleId,classId,className,date,time,trainerName\n1,1,Yoga Basics,2026-05-20,08:00:00,Coach Sanjay\n';
        fileName = 'schedule_export.csv';
      } else {
        csvContent = 'memberId,memName,email,phone,status,homeBranchId\n1,Rahul Singh,rahul@gmail.com,9876543210,ACTIVE,1\n';
        fileName = 'members_export.csv';
      }

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      this.lastExportInfo = {
        timestamp: new Date().toLocaleString(),
        fileName: fileName
      };
      this.exportStatus = '✓ DATA EXPORTED SUCCESSFULLY.';
    }, 1500);
  }
}
