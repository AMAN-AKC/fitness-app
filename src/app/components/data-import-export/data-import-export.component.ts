import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface BulkImportRowResult {
  rowNumber: number;
  status: string;
  errorMessage?: string;
  memberId?: number;
  email: string;
  phone: string;
  memberName: string;
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
})
export class DataImportExportComponent {
  importStatus = '';
  exportStatus = '';
  selectedFile: File | null = null;
  isImporting = false;
  importReport: BulkImportReport | null = null;
  showErrorDetails = false;
  errorRows: BulkImportRowResult[] = [];

  private apiUrl = environment.apiBaseUrl || 'http://localhost:8080/api/v1';

  constructor(private http: HttpClient) {}

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files?.[0] || null;
    this.importStatus = '';
    this.importReport = null;
  }

  /**
   * Upload CSV file for bulk member import (AC10)
   */
  importData(): void {
    if (!this.selectedFile) {
      this.importStatus = '⚠ Please select a file first';
      return;
    }

    if (!this.selectedFile.name.toLowerCase().endsWith('.csv')) {
      this.importStatus = '❌ Please select a CSV file';
      return;
    }

    this.isImporting = true;
    this.importStatus = `📤 Uploading ${this.selectedFile.name}...`;

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.http
      .post<BulkImportReport>(`${this.apiUrl}/import/members/csv`, formData)
      .subscribe(
        (response) => {
          this.importReport = response;
          this.isImporting = false;

          if (response.successCount === response.totalRows) {
            this.importStatus = `✅ Successfully imported ${response.successCount}/${response.totalRows} members`;
          } else if (response.successCount > 0) {
            this.importStatus = `⚠ Partial import: ${response.successCount}/${response.totalRows} members imported`;
          } else {
            this.importStatus = `❌ Import failed: ${response.message}`;
          }

          // Collect error rows for display
          this.errorRows = response.rowResults.filter(
            (r) => r.status !== 'SUCCESS',
          );
          if (this.errorRows.length > 0) {
            this.showErrorDetails = true;
          }

          this.selectedFile = null;
        },
        (error) => {
          this.isImporting = false;
          const errorMsg =
            error.error?.message || error.statusText || 'Import failed';
          this.importStatus = `❌ Import error: ${errorMsg}`;
          console.error('Import error:', error);
        },
      );
  }

  /**
   * Download CSV template for bulk import
   */
  downloadTemplate(): void {
    this.http
      .get(`${this.apiUrl}/import/members/template`, { responseType: 'blob' })
      .subscribe(
        (response) => {
          const url = window.URL.createObjectURL(response);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'member_import_template.csv';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          this.exportStatus = '✅ Template downloaded successfully';
        },
        (error) => {
          this.exportStatus = '❌ Failed to download template';
          console.error('Download error:', error);
        },
      );
  }

  /**
   * View import validation rules
   */
  viewImportRules(): void {
    this.http.get(`${this.apiUrl}/import/members/rules`).subscribe(
      (response: any) => {
        console.log('Import Rules:', response);
        alert(JSON.stringify(response, null, 2));
      },
      (error) => {
        console.error('Error fetching rules:', error);
      },
    );
  }

  /**
   * Toggle error details visibility
   */
  toggleErrorDetails(): void {
    this.showErrorDetails = !this.showErrorDetails;
  }

  /**
   * Get error icon/status indicator
   */
  getStatusIcon(status: string): string {
    switch (status) {
      case 'SUCCESS':
        return '✅';
      case 'DUPLICATE':
        return '⚠️';
      case 'VALIDATION_ERROR':
        return '❌';
      case 'SYSTEM_ERROR':
        return '⚠️';
      default:
        return '❓';
    }
  }

  // Placeholder methods for exports (to be implemented)
  exportMembers(): void {
    this.exportStatus = 'Exporting members...';
    setTimeout(() => {
      this.exportStatus = '✓ Members exported successfully';
    }, 1000);
  }

  exportTransactions(): void {
    this.exportStatus = 'Exporting transactions...';
    setTimeout(() => {
      this.exportStatus = '✓ Transactions exported successfully';
    }, 1000);
  }

  exportClasses(): void {
    this.exportStatus = 'Exporting classes...';
    setTimeout(() => {
      this.exportStatus = '✓ Classes exported successfully';
    }, 1000);
  }
}
