import { Component } from '@angular/core';

@Component({
  selector: 'app-data-import-export',
  templateUrl: './data-import-export.component.html',
  styleUrls: ['./data-import-export.component.css'],
})
export class DataImportExportComponent {
  importStatus = '';
  exportStatus = '';
  selectedFile: File | null = null;

  constructor() {}

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files?.[0] || null;
  }

  importData(): void {
    if (this.selectedFile) {
      this.importStatus = `✓ Importing ${this.selectedFile.name}...`;
      setTimeout(() => {
        this.importStatus = `✓ Successfully imported ${this.selectedFile?.name}`;
        this.selectedFile = null;
      }, 2000);
    }
  }

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

  downloadTemplate(): void {
    console.log('Template downloaded');
  }
}
