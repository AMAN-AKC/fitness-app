import { Component, OnInit } from '@angular/core';
import { ManagerApiService } from '../../services/manager-api.service';
import { FrontdeskApiService } from '../../services/frontdesk-api.service';
import { AuthService } from '../../services/auth.service';

interface FitnessClass {
  classId?: number;
  className: string;
  trainerId: number;
  roomId: number;
  branchId: number;
  startDate: string;
  endDate: string;
  weekdays: string; // e.g. "MONDAY,WEDNESDAY"
  classTime: string; // e.g. "09:00"
  durationMins: number;
  capacity: number;
  prerequisites?: string;
  planEligibility?: string; // e.g. "ALL" or "GOLD,PLATINUM"
  status?: string;
  trainerName?: string;
  roomName?: string;
  cancelReason?: string;
}

@Component({
  selector: 'app-manager-schedule',
  templateUrl: './manager-schedule.component.html',
  styleUrls: ['./manager-schedule.component.css'],
  standalone: false
})
export class ManagerScheduleComponent implements OnInit {
  classes: FitnessClass[] = [];
  filteredClasses: FitnessClass[] = [];
  trainers: any[] = [];
  rooms: any[] = [];
  branches: { id: number; name: string }[] = [];

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Calendar View State
  viewMode: 'DAY' | 'WEEK' | 'MONTH' = 'WEEK';
  currentWeekStart = new Date();
  currentWeekRangeLabel = 'CURRENT WEEK';

  // Filters
  selectedBranchId = '1'; // Default Downtown
  selectedTrainerFilter = '';
  selectedRoomFilter = '';

  // Class Detail Panel State
  selectedClass: FitnessClass | null = null;
  enrolledBookings: any[] = [];

  // Substitute Trainer State
  isSubmittingSubstitute = false;
  substituteTrainerId = 0;
  substituteReason = '';
  isSubstitutePanelOpen = false;

  // Cancel Class State
  isSubmittingCancellation = false;
  cancelReason = '';
  isCancelPanelOpen = false;

  // Create/Edit Drawer State
  isCreateDrawerOpen = false;
  isEditMode = false;
  editingClass: FitnessClass = this.getEmptyClass();

  // Room Maintenance State
  isMaintenancePanelOpen = false;
  maintenanceRoomId = 0;
  maintenanceStartDate = '';
  maintenanceEndDate = '';
  maintenanceReason = '';
  isSubmittingMaintenance = false;
  overlappingClasses: FitnessClass[] = [];

  timeSlotLabels = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30'
  ];

  // Create Form Checkbox Arrays
  repeatDays = [
    { label: 'M', value: 'MONDAY', checked: false },
    { label: 'T', value: 'TUESDAY', checked: false },
    { label: 'W', value: 'WEDNESDAY', checked: false },
    { label: 'T', value: 'THURSDAY', checked: false },
    { label: 'F', value: 'FRIDAY', checked: false },
    { label: 'S', value: 'SATURDAY', checked: false },
    { label: 'S', value: 'SUNDAY', checked: false }
  ];

  membershipPlans = [
    { label: 'BASIC PLAN', value: 'BASIC', checked: false },
    { label: 'GOLD PLAN', value: 'GOLD', checked: false },
    { label: 'PLATINUM PLAN', value: 'PLATINUM', checked: false }
  ];
  planEligAll = true;

  // Live Conflict Checks
  hasConflict = false;
  conflictMessage = '';

  members: any[] = [];

  constructor(
    private managerApi: ManagerApiService,
    private frontdeskApi: FrontdeskApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.resetToToday();
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.frontdeskApi.getBranches().subscribe({
      next: (branchesData) => {
        this.branches = branchesData.map(b => ({ id: b.branchId || 0, name: b.branchName || 'UNKNOWN BRANCH' }));
        const session = this.authService.getCurrentSession();
        if (session && session.branchId) {
          this.selectedBranchId = session.branchId.toString();
        } else if (this.branches.length > 0) {
          this.selectedBranchId = this.branches[0].id.toString();
        }

        this.managerApi.getClasses().subscribe({
          next: (data) => {
            this.classes = data;
            this.loadTrainersAndRooms();
            this.loadMembers();
          },
          error: (err) => {
            this.errorMessage = 'Failed to load classes.';
            this.isLoading = false;
          }
        });
      },
      error: () => {
        this.errorMessage = 'Failed to load branches.';
        this.isLoading = false;
      }
    });
  }

  loadMembers(): void {
    this.frontdeskApi.getMembers().subscribe({
      next: (data) => {
        this.members = data;
        this.mapMemberNamesToBookings();
      },
      error: () => {}
    });
  }

  loadTrainersAndRooms(): void {
    this.managerApi.getTrainers().subscribe({
      next: (trainersData) => {
        const branchNum = Number(this.selectedBranchId);
        this.trainers = trainersData.filter(t => t.branchId === branchNum || !t.branchId);
        this.managerApi.getRooms().subscribe({
          next: (roomsData) => {
            this.rooms = roomsData.filter(r => r.branchId === branchNum || r.branch?.branchId === branchNum || !r.branchId);
            this.mapNamesToClasses();
            this.isLoading = false;
          },
          error: () => {
            this.isLoading = false;
          }
        });
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  mapNamesToClasses(): void {
    const trainerMap = new Map<number, string>();
    this.trainers.forEach(t => trainerMap.set(t.trainerId, t.trainerName));

    const roomMap = new Map<number, string>();
    this.rooms.forEach(r => roomMap.set(r.facilityId, r.facilityName));

    this.classes.forEach(c => {
      c.trainerName = trainerMap.get(c.trainerId) || `Trainer #${c.trainerId}`;
      c.roomName = roomMap.get(c.roomId) || `Room #${c.roomId}`;
    });
    this.applyFilters();
  }

  mapMemberNamesToBookings(): void {
    if (!this.enrolledBookings || this.enrolledBookings.length === 0 || !this.members || this.members.length === 0) return;
    const memberMap = new Map<number, string>();
    this.members.forEach(m => memberMap.set(m.memberId, m.fullName || m.username || `Member #${m.memberId}`));
    this.enrolledBookings.forEach(b => {
      b.memberName = memberMap.get(b.memberId) || `Member #${b.memberId}`;
    });
  }

  getEmptyClass(): FitnessClass {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(today.getMonth() + 1);
    
    return {
      className: '',
      trainerId: 0,
      roomId: 0,
      branchId: this.selectedBranchId ? Number(this.selectedBranchId) : 1,
      startDate: today.toISOString().split('T')[0],
      endDate: nextMonth.toISOString().split('T')[0],
      weekdays: '',
      classTime: '08:00',
      durationMins: 60,
      capacity: 20,
      prerequisites: '',
      planEligibility: 'ALL'
    };
  }

  // Week Navigation
  navigateWeek(direction: number): void {
    const newDate = new Date(this.currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction * 7));
    this.currentWeekStart = newDate;
    
    // Format week range label
    const endOfWeek = new Date(newDate);
    endOfWeek.setDate(newDate.getDate() + 6);
    
    const startStr = newDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
    const endStr = endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
    this.currentWeekRangeLabel = `WEEK OF ${startStr}–${endStr}`;
    
    this.applyFilters();
  }

  resetToToday(): void {
    const today = new Date();
    // Move to start of week (Monday)
    const day = today.getDay();
    const diff = today.getDate() - day + (day == 0 ? -6 : 1);
    this.currentWeekStart = new Date(today.setDate(diff));
    
    const endOfWeek = new Date(this.currentWeekStart);
    endOfWeek.setDate(this.currentWeekStart.getDate() + 6);
    const startStr = this.currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
    const endStr = endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
    this.currentWeekRangeLabel = `WEEK OF ${startStr}–${endStr}`;
    
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredClasses = this.classes.filter(c => {
      // 1. Branch filter
      if (this.selectedBranchId && c.branchId !== Number(this.selectedBranchId)) return false;
      // 2. Trainer filter
      if (this.selectedTrainerFilter && c.trainerId !== Number(this.selectedTrainerFilter)) return false;
      // 3. Room filter
      if (this.selectedRoomFilter && c.roomId !== Number(this.selectedRoomFilter)) return false;
      return true;
    });
  }

  // Flattened grid blocks for weekly calendar view
  getCalendarBlocks() {
    const blocks: any[] = [];
    
    this.filteredClasses.forEach(c => {
      if (!c.weekdays || c.status === 'CANCELLED') return;
      const days = c.weekdays.split(',').map(d => d.trim().toUpperCase());
      
      days.forEach(day => {
        const colIndex = this.getDayColumnIndex(day);
        if (colIndex === -1) return;
        
        const timeSlot = this.getTimeRowIndexAndSpan(c.classTime, c.durationMins);
        if (!timeSlot) return;
        
        blocks.push({
          class: c,
          colIndex: colIndex,
          rowStart: timeSlot.start,
          rowSpan: timeSlot.span,
          categoryColor: this.getCategoryColor(c.className),
          textColor: this.getCategoryTextColor(c.className),
          trainerInitials: c.trainerName ? this.getInitials(c.trainerName) : 'TR'
        });
      });
    });
    
    return blocks;
  }

  getDayColumnIndex(day: string): number {
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    const idx = days.indexOf(day);
    return idx !== -1 ? idx + 2 : -1; // Col 1 is time labels, so offset by 2
  }

  getTimeRowIndexAndSpan(timeStr: string, duration: number): { start: number, span: number } | null {
    if (!timeStr) return null;
    const parts = timeStr.split(':');
    const hour = parseInt(parts[0], 10);
    const min = parseInt(parts[1], 10);
    
    const totalMin = hour * 60 + min;
    const startMin = 8 * 60; // Grid starts at 08:00
    const endMin = 21 * 60; // Grid ends at 21:00
    
    if (totalMin < startMin || totalMin >= endMin) return null;
    
    const slotIndex = Math.floor((totalMin - startMin) / 30);
    const startRow = slotIndex + 2; // Row 1 is Day Headers
    const spanRows = Math.ceil(duration / 30);
    
    return { start: startRow, span: spanRows };
  }

  getCategoryColor(className: string): string {
    const name = className.toUpperCase();
    if (name.includes('YOGA')) return '#00D9FF';
    if (name.includes('STRENGTH') || name.includes('LIFT')) return '#FFB800';
    if (name.includes('CARDIO') || name.includes('SPIN')) return '#FF3B30';
    if (name.includes('ZUMBA') || name.includes('DANCE')) return '#7C3AED';
    if (name.includes('HIIT')) return '#FFB800';
    if (name.includes('PILATES')) return '#FF006E';
    return '#E7FF3C'; // default
  }

  getCategoryTextColor(className: string): string {
    const name = className.toUpperCase();
    if (name.includes('CARDIO') || name.includes('SPIN') || name.includes('ZUMBA') || name.includes('DANCE') || name.includes('PILATES')) {
      return '#FFF';
    }
    return '#111';
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  // Details Side Panel Actions
  selectClass(cls: FitnessClass): void {
    this.selectedClass = cls;
    this.isCancelPanelOpen = false;
    this.isSubstitutePanelOpen = false;
    this.enrolledBookings = [];
    
    // Load enrolled list
    if (cls.classId) {
      this.managerApi.getBookingsByClass(cls.classId).subscribe({
        next: (data) => {
          this.enrolledBookings = data.filter(b => b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'WAITLISTED');
          this.mapMemberNamesToBookings();
        },
        error: (err) => {
          console.error('Failed to load class bookings', err);
        }
      });
    }
  }

  closeDetailPanel(): void {
    this.selectedClass = null;
    this.enrolledBookings = [];
  }

  // Substitute Trainer Flow
  openSubstitutePanel(): void {
    if (!this.selectedClass) return;
    this.substituteTrainerId = this.selectedClass.trainerId;
    this.substituteReason = '';
    this.isSubstitutePanelOpen = true;
  }

  confirmSubstitute(): void {
    if (!this.selectedClass || !this.selectedClass.classId || !this.substituteTrainerId || !this.substituteReason) {
      alert('ALL FIELDS ARE REQUIRED TO PERFORM A TRAINER SUBSTITUTION.');
      return;
    }

    this.isSubmittingSubstitute = true;
    this.managerApi.substituteTrainer(this.selectedClass.classId, this.substituteTrainerId, this.substituteReason).subscribe({
      next: (updated) => {
        this.successMessage = 'TRAINER SUBSTITUTION REGISTERED!';
        this.isSubstitutePanelOpen = false;
        this.isSubmittingSubstitute = false;
        
        // Refresh local details
        this.selectedClass!.trainerId = updated.trainerId;
        this.selectedClass!.trainerName = this.trainers.find(t => t.trainerId === updated.trainerId)?.trainerName || 'Substitute Trainer';
        
        this.loadData();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        alert(err.error?.message || 'Conflict: New trainer has a scheduling conflict.');
        this.isSubmittingSubstitute = false;
      }
    });
  }

  // Cancel Class Flow
  openCancelPanel(): void {
    this.cancelReason = '';
    this.isCancelPanelOpen = true;
  }

  confirmCancelClass(): void {
    if (!this.selectedClass || !this.selectedClass.classId || !this.cancelReason) {
      alert('A JUSTIFICATION REASON IS REQUIRED TO CANCEL A CLASS.');
      return;
    }

    this.isSubmittingCancellation = true;
    this.managerApi.cancelClass(this.selectedClass.classId, this.cancelReason).subscribe({
      next: () => {
        this.successMessage = 'CLASS CANCELLATION COMPLETED AND NOTIFICATIONS DISPATCHED!';
        this.isCancelPanelOpen = false;
        this.isSubmittingCancellation = false;
        this.closeDetailPanel();
        this.loadData();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to cancel class.');
        this.isSubmittingCancellation = false;
      }
    });
  }

  // Create/Edit Recurring Class Drawer Actions
  openCreateDrawer(): void {
    this.isEditMode = false;
    this.editingClass = this.getEmptyClass();
    this.resetCheckboxes();
    this.isCreateDrawerOpen = true;
  }

  openEditDrawer(): void {
    if (!this.selectedClass) return;
    this.isEditMode = true;
    this.editingClass = { ...this.selectedClass };
    
    // Parse Repeat Days
    const days = this.editingClass.weekdays ? this.editingClass.weekdays.split(',').map(d => d.trim().toUpperCase()) : [];
    this.repeatDays.forEach(d => d.checked = days.includes(d.value));

    // Parse Eligibility
    const plans = this.editingClass.planEligibility ? this.editingClass.planEligibility.split(',').map(p => p.trim().toUpperCase()) : [];
    this.planEligAll = plans.includes('ALL');
    this.membershipPlans.forEach(p => p.checked = plans.includes(p.value));

    this.closeDetailPanel();
    this.checkConflict();
    this.isCreateDrawerOpen = true;
  }

  closeCreateDrawer(): void {
    this.isCreateDrawerOpen = false;
    this.hasConflict = false;
    this.conflictMessage = '';
  }

  resetCheckboxes(): void {
    this.repeatDays.forEach(d => d.checked = false);
    this.membershipPlans.forEach(p => p.checked = false);
    this.planEligAll = true;
  }

  onDayToggle(dayIndex: number): void {
    this.repeatDays[dayIndex].checked = !this.repeatDays[dayIndex].checked;
    this.updateWeekdaysField();
  }

  updateWeekdaysField(): void {
    const selected = this.repeatDays.filter(d => d.checked).map(d => d.value);
    this.editingClass.weekdays = selected.join(',');
    this.checkConflict();
  }

  onPlanToggle(planIndex: number): void {
    this.membershipPlans[planIndex].checked = !this.membershipPlans[planIndex].checked;
    this.planEligAll = false;
    this.updatePlanEligibilityField();
  }

  toggleAllPlans(): void {
    this.planEligAll = !this.planEligAll;
    if (this.planEligAll) {
      this.membershipPlans.forEach(p => p.checked = false);
    }
    this.updatePlanEligibilityField();
  }

  updatePlanEligibilityField(): void {
    if (this.planEligAll) {
      this.editingClass.planEligibility = 'ALL';
    } else {
      const selected = this.membershipPlans.filter(p => p.checked).map(p => p.value);
      this.editingClass.planEligibility = selected.join(',');
    }
  }

  // Live Conflict Checking
  checkConflict(): void {
    this.hasConflict = false;
    this.conflictMessage = '';

    if (!this.editingClass.roomId || !this.editingClass.classTime || !this.editingClass.weekdays) return;

    const room = Number(this.editingClass.roomId);
    const time = this.editingClass.classTime;
    const duration = Number(this.editingClass.durationMins || 60);
    const days = this.editingClass.weekdays.split(',').map(d => d.trim().toUpperCase());
    const start = this.editingClass.startDate;
    const end = this.editingClass.endDate;

    for (const c of this.classes) {
      // Exclude current class if editing
      if (this.isEditMode && c.classId === this.editingClass.classId) continue;
      if (Number(c.roomId) !== room || c.status === 'CANCELLED') continue;

      // Overlapping date range
      if (c.startDate <= end && c.endDate >= start) {
        // Weekday overlap
        const cDays = c.weekdays.split(',').map(d => d.trim().toUpperCase());
        const commonDays = days.filter(d => cDays.includes(d));

        if (commonDays.length > 0) {
          // Time overlap
          if (this.timeOverlaps(time, duration, c.classTime, c.durationMins)) {
            this.hasConflict = true;
            this.conflictMessage = `CONFLICT: ROOM ALREADY BOOKED AT ${c.classTime.substring(0,5)} BY ${c.className.toUpperCase()} ON ${commonDays.join(', ')}.`;
            return;
          }
        }
      }
    }
  }

  timeOverlaps(t1: string, d1: number, t2: string, d2: number): boolean {
    const getMinutes = (t: string) => {
      const parts = t.split(':');
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    };
    
    const s1 = getMinutes(t1);
    const e1 = s1 + d1;
    const s2 = getMinutes(t2);
    const e2 = s2 + d2;
    
    return s1 < e2 && e1 > s2;
  }

  // Save Recurring Class
  saveRecurringClass(): void {
    if (!this.editingClass.className || !this.editingClass.trainerId || !this.editingClass.roomId || !this.editingClass.weekdays) {
      alert('ALL REQUISITE FIELDS (CLASS NAME, TRAINER, ROOM, REPEAT DAYS) MUST BE COMPLETED.');
      return;
    }

    this.isLoading = true;
    const obs = this.isEditMode
      ? this.managerApi.updateClass(this.editingClass.classId!, this.editingClass)
      : this.managerApi.createClass(this.editingClass);

    obs.subscribe({
      next: () => {
        this.successMessage = `CLASS SUCCESSFULLY ${this.isEditMode ? 'UPDATED' : 'CREATED'}!`;
        this.closeCreateDrawer();
        this.loadData();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        alert(err.error?.message || 'Conflict: Failed to schedule recurring class due to database conflicts.');
        this.isLoading = false;
      }
    });
  }

  // Room Maintenance Flow
  openMaintenancePanel(): void {
    this.maintenanceRoomId = 0;
    this.maintenanceStartDate = new Date().toISOString().split('T')[0];
    this.maintenanceEndDate = new Date().toISOString().split('T')[0];
    this.maintenanceReason = '';
    this.overlappingClasses = [];
    this.isMaintenancePanelOpen = true;
  }

  checkMaintenanceOverlap(): void {
    this.overlappingClasses = [];
    if (!this.maintenanceRoomId || !this.maintenanceStartDate || !this.maintenanceEndDate) return;
    const start = this.maintenanceStartDate;
    const end = this.maintenanceEndDate;
    this.overlappingClasses = this.classes.filter(c => 
      Number(c.roomId) === Number(this.maintenanceRoomId) && 
      c.status !== 'CANCELLED' && 
      c.startDate <= end && c.endDate >= start
    );
  }

  confirmMaintenance(): void {
    if (!this.maintenanceRoomId || !this.maintenanceStartDate || !this.maintenanceEndDate || !this.maintenanceReason) {
      alert('ALL FIELDS ARE REQUIRED TO ENFORCE MAINTENANCE HOLD.');
      return;
    }
    this.checkMaintenanceOverlap();
    if (this.overlappingClasses.length > 0) {
      alert(`MAINTENANCE BLOCK POSTPONED: There are ${this.overlappingClasses.length} pre-scheduled class obligations in this room. You must migrate or cancel these sessions before saving the hold.`);
      return;
    }

    this.isSubmittingMaintenance = true;
    this.managerApi.toggleMaintenance(this.maintenanceRoomId, true, this.maintenanceReason).subscribe({
      next: () => {
        this.successMessage = 'ROOM MAINTENANCE HOLD ACTIVE!';
        this.isMaintenancePanelOpen = false;
        this.isSubmittingMaintenance = false;
        this.loadData();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to schedule room maintenance.');
        this.isSubmittingMaintenance = false;
      }
    });
  }

  cancelOverlappingClass(cls: FitnessClass): void {
    if (!confirm('Are you sure you want to cancel this class?')) return;
    this.managerApi.cancelClass(cls.classId!, 'ROOM MAINTENANCE OVERRIDE: ' + this.maintenanceReason).subscribe({
      next: () => {
        cls.status = 'CANCELLED';
        this.checkMaintenanceOverlap();
        this.successMessage = 'CLASS CANCELLATION COMPLETED!';
        setTimeout(() => this.successMessage = '', 3000);
      }
    });
  }

  migrateClass(cls: FitnessClass, newRoomIdStr: string | number): void {
    const newRoomId = Number(newRoomIdStr);
    const updated = { ...cls, roomId: newRoomId };
    this.managerApi.updateClass(cls.classId!, updated).subscribe({
      next: () => {
        cls.roomId = newRoomId;
        this.checkMaintenanceOverlap();
        this.successMessage = 'SESSION MIGRATED SUCCESSFULLY!';
        setTimeout(() => this.successMessage = '', 3000);
      }
    });
  }

  // Export & Import
  exportCalendarReport(): void {
    this.managerApi.exportClassesCsv().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FitClub_Schedule_Export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
      },
      error: () => alert('CSV Export failed.')
    });
  }
}
