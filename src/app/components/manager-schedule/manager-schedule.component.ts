import { Component, OnInit } from '@angular/core';
import { ManagerApiService } from '../../services/manager-api.service';

interface FitnessClass {
  classId?: number;
  className: string;
  trainerId: number;
  roomId: number;
  branchId: number;
  startDate: string;
  endDate: string;
  weekdays: string;
  classTime: string;
  durationMins: number;
  capacity: number;
  prerequisites?: string;
  planEligibility?: string;
  status?: string;
  trainerName?: string;
  roomName?: string;
}

@Component({
  selector: 'app-manager-schedule',
  templateUrl: './manager-schedule.component.html',
  styleUrls: ['./manager-schedule.component.css']
})
export class ManagerScheduleComponent implements OnInit {
  classes: FitnessClass[] = [];
  filteredClasses: FitnessClass[] = [];
  trainers: any[] = [];
  rooms: any[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  
  viewFilter: 'ALL' | 'TODAY' | 'WEEK' = 'ALL';

  isModalOpen = false;
  isEditMode = false;
  editingClass: FitnessClass = this.getEmptyClass();
  
  cancelReason = '';
  isCancelModalOpen = false;
  classToCancel: number | null = null;

  isSubModalOpen = false;
  subTrainerId: number = 0;
  subReason = '';
  classToSub: number | null = null;

  constructor(private managerApi: ManagerApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.managerApi.getClasses().subscribe({
      next: (data) => {
        this.classes = data;
        this.applyFilters();
        this.loadTrainersAndRooms();
      },
      error: (err) => {
        this.errorMessage = 'Failed to load classes.';
        this.isLoading = false;
      }
    });
  }

  loadTrainersAndRooms(): void {
    this.managerApi.getTrainers().subscribe(data => this.trainers = data);
    this.managerApi.getRooms().subscribe(data => {
        this.rooms = data;
        this.isLoading = false;
    });
  }

  getEmptyClass(): FitnessClass {
    return {
      className: '',
      trainerId: 0,
      roomId: 0,
      branchId: 1, // Default branch
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      weekdays: '',
      classTime: '09:00',
      durationMins: 60,
      capacity: 20
    };
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.editingClass = this.getEmptyClass();
    this.isModalOpen = true;
  }

  openEditModal(cls: FitnessClass): void {
    this.isEditMode = true;
    this.editingClass = { ...cls };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.errorMessage = '';
  }

  saveClass(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    const obs = this.isEditMode 
      ? this.managerApi.updateClass(this.editingClass.classId!, this.editingClass)
      : this.managerApi.createClass(this.editingClass);

    obs.subscribe({
      next: () => {
        this.successMessage = `Class ${this.isEditMode ? 'updated' : 'created'} successfully!`;
        this.closeModal();
        this.loadData();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to save class. Check for scheduling conflicts.';
        this.isLoading = false;
      }
    });
  }

  openSubModal(cls: FitnessClass): void {
    this.classToSub = cls.classId!;
    this.subTrainerId = cls.trainerId;
    this.subReason = '';
    this.isSubModalOpen = true;
  }

  confirmSubstitute(): void {
    if (!this.classToSub || !this.subTrainerId || !this.subReason) return;

    this.managerApi.substituteTrainer(this.classToSub, this.subTrainerId, this.subReason).subscribe({
      next: () => {
        this.isSubModalOpen = false;
        this.loadData();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to substitute trainer.';
      }
    });
  }

  openCancelModal(id: number): void {
    this.classToCancel = id;
    this.cancelReason = '';
    this.isCancelModalOpen = true;
  }

  confirmCancel(): void {
    if (!this.classToCancel || !this.cancelReason) return;
    
    this.managerApi.cancelClass(this.classToCancel, this.cancelReason).subscribe({
      next: () => {
        this.isCancelModalOpen = false;
        this.loadData();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to cancel class.';
      }
    });
  }

  applyFilters(): void {
    if (this.viewFilter === 'ALL') {
      this.filteredClasses = this.classes;
    } else if (this.viewFilter === 'TODAY') {
      const today = new Date().toISOString().split('T')[0];
      this.filteredClasses = this.classes.filter(c => c.startDate <= today && c.endDate >= today);
    } else if (this.viewFilter === 'WEEK') {
      // Simple week filter: next 7 days
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      const todayStr = today.toISOString().split('T')[0];
      const nextWeekStr = nextWeek.toISOString().split('T')[0];
      this.filteredClasses = this.classes.filter(c => c.startDate <= nextWeekStr && c.endDate >= todayStr);
    }
  }

  setFilter(filter: 'ALL' | 'TODAY' | 'WEEK'): void {
    this.viewFilter = filter;
    this.applyFilters();
  }

  exportCsv(): void {
    this.managerApi.exportClassesCsv().subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Schedule_Export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.isLoading = true;
      this.managerApi.importClassesCsv(file).subscribe({
        next: (results) => {
          this.successMessage = `Import complete! ${results.filter(r => r.status === 'SUCCESS').length} classes added.`;
          this.loadData();
          setTimeout(() => this.successMessage = '', 5000);
        },
        error: () => {
          this.errorMessage = 'Failed to import CSV.';
          this.isLoading = false;
        }
      });
    }
  }
}
