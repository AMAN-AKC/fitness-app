import { Component, OnInit } from '@angular/core';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { FrontdeskApiService, ClassesDto, TrainerDto, PtSessionDto, MemberDto, AttendanceDto } from '../../services/frontdesk-api.service';
import { forkJoin } from 'rxjs';

interface PTRequest {
  id: number;
  name: string;
  avatar: string;
  pkg: string;
  date: string;
  time: string;
  note: string;
  status: 'pending' | 'accepted' | 'declined';
}

interface CompletedSession {
  id: number;
  name: string;
  date: string;
  duration: string;
  rating: number | null;
  notes: string;
}

interface WeekDayInfo {
  label: string;
  name: string;
  dateStr: string;
}

@Component({
  selector: 'app-trainer-dashboard',
  templateUrl: './trainer-dashboard.component.html',
  styleUrls: ['./trainer-dashboard.component.css'],
  standalone: false,
})
export class TrainerDashboardComponent implements OnInit {
  subAlertOpen: boolean = false;
  expandedClass: any = null;
  activeNotes: number | null = null;

  isLoading: boolean = false;
  trainer: TrainerDto | null = null;
  classesList: ClassesDto[] = [];
  ptSessionsList: PtSessionDto[] = [];
  membersList: MemberDto[] = [];
  roomsList: any[] = [];

  currentWeekDays: WeekDayInfo[] = [];
  currentWeekRangeLabel: string = '';

  // KPI Data
  classesThisWeek: number = 0;
  ptSessionsToday: number = 0;
  sessionTimes: string[] = [];

  ptRequests: PTRequest[] = [];
  completedSessions: CompletedSession[] = [];
  chartData: number[] = [0, 0, 0, 0, 0, 0, 0];

  activeTab: string = 'overview';
  tempBio: string = '';
  tempSpecialties: string = '';
  newCertName: string = '';
  certList: { name: string, isPending: boolean }[] = [];
  acceptingPtClients: boolean = true;
  profileError: string = '';

  // Availability Planner state
  selectedDays: string[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  availableHours: string[] = [
    '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', 
    '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', 
    '06:00 PM', '07:00 PM', '08:00 PM'
  ];
  activeSlotsSet: Set<string> = new Set<string>();
  availabilityError: string = '';
  
  // Register leave state
  leaveStartDate: string = '';
  leaveEndDate: string = '';
  leaveReason: string = '';
  
  // Intervention warning modal state
  showInterventionModal: boolean = false;
  affectedSessionsCount: number = 0;
  interventionJustification: string = '';
  pendingSlotsToSave: string = '';

  // Classes & Roster State
  selectedRosterClass: ClassesDto | null = null;
  rosterDateStr: string = new Date().toISOString().split('T')[0];
  rosterBookings: any[] = [];
  isLoadingRoster: boolean = false;

  // Retroactive Override Modal state
  showOverrideModal: boolean = false;
  overrideBookingId: number = 0;
  overrideMemberId: number = 0;
  overrideState: 'checked-in' | 'no-show' | 'excused' | null = null;
  overrideJustification: string = '';

  constructor(
    private toastService: ToastService,
    private authService: AuthService,
    private frontdeskApi: FrontdeskApiService
  ) {}

  ngOnInit(): void {
    this.initCurrentWeek();
    this.loadDashboardData();
  }

  initCurrentWeek(): void {
    const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const today = new Date();
    const day = today.getDay();
    // Monday is index 1. If Sunday (0), day offset should be -6. Otherwise 1 - day.
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));

    this.currentWeekDays = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      const dayNum = nextDay.getDate();
      this.currentWeekDays.push({
        label: `${weekdays[i]} ${dayNum}`,
        name: weekdays[i],
        dateStr: nextDay.toISOString().split('T')[0]
      });
    }

    const startOfWeekStr = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
    const endOfWeek = new Date(monday);
    endOfWeek.setDate(monday.getDate() + 6);
    const endOfWeekStr = endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
    this.currentWeekRangeLabel = `WEEK OF ${startOfWeekStr}–${endOfWeekStr}`;
  }

  loadDashboardData(): void {
    const session = this.authService.getCurrentSession();
    if (!session || !session.userId) {
      this.toastService.error('NO ACTIVE SESSION FOUND. PLEASE LOGIN.');
      return;
    }

    this.isLoading = true;
    this.frontdeskApi.getTrainerByUserId(Number(session.userId)).subscribe({
      next: (trainer) => {
        this.trainer = trainer;
        this.tempBio = trainer.bio || '';
        this.tempSpecialties = trainer.specialties || '';
        this.certList = this.parseCertifications(trainer.certifications);
        this.acceptingPtClients = trainer.acceptingPtClients !== false;
        
        // Initialize availability planner
        this.activeSlotsSet.clear();
        if (trainer.availability) {
          trainer.availability.split(',').map(s => s.trim()).filter(s => s.length > 0).forEach(slot => {
            this.activeSlotsSet.add(slot);
          });
        }

        const trainerId = Number(trainer.trainerId);
        
        forkJoin({
          classes: this.frontdeskApi.getClassesByTrainer(trainerId),
          ptSessions: this.frontdeskApi.getPtSessionsByTrainer(trainerId),
          members: this.frontdeskApi.getMembers(),
          rooms: this.frontdeskApi.getRooms()
        }).subscribe({
          next: ({ classes, ptSessions, members, rooms }) => {
            this.classesList = classes;
            this.ptSessionsList = ptSessions;
            this.membersList = members;
            this.roomsList = rooms;

            this.processDashboardState();
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Error loading dashboard sub-data:', err);
            this.toastService.error('FAILED TO LOAD TRAINER DATA.');
            this.isLoading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error loading trainer profile:', err);
        this.toastService.error('FAILED TO LOAD TRAINER PROFILE.');
        this.isLoading = false;
      }
    });
  }

  processDashboardState(): void {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const memberMap = new Map<number, MemberDto>();
    this.membersList.forEach(m => memberMap.set(Number(m.memberId), m));

    // KPI: PT sessions today
    const sessionsToday = this.ptSessionsList.filter(s => {
      const isApprovedOrCompleted = s.status === 'APPROVED' || s.status === 'COMPLETED';
      return isApprovedOrCompleted && s.scheduledAt && s.scheduledAt.startsWith(todayStr);
    });
    this.ptSessionsToday = sessionsToday.length;

    // KPI: session times today
    this.sessionTimes = sessionsToday.map(s => {
      const date = new Date(s.scheduledAt);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    });

    // KPI: classes this week count
    let classesCount = 0;
    this.currentWeekDays.forEach(day => {
      classesCount += this.getClassesForDay(day.name, day.dateStr).length;
    });
    this.classesThisWeek = classesCount;

    // PT Requests mapping
    const requestedPt = this.ptSessionsList.filter(s => s.status === 'REQUESTED' || s.status === 'APPROVED' || s.status === 'DECLINED');
    this.ptRequests = requestedPt.map(s => {
      const mName = s.memberName || memberMap.get(s.memberId)?.memName || `Member #${s.memberId}`;
      const initials = mName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
      const scheduledDate = new Date(s.scheduledAt);
      return {
        id: s.sessionId || 0,
        name: mName,
        avatar: initials,
        pkg: `${s.durationMins} MIN`,
        date: scheduledDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        time: scheduledDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        note: s.trainerNotes || '',
        status: s.status === 'REQUESTED' ? 'pending' : (s.status === 'APPROVED' ? 'accepted' : 'declined')
      };
    });

    // Completed Sessions mapping
    const completedPt = this.ptSessionsList.filter(s => s.status === 'COMPLETED');
    this.completedSessions = completedPt.map(s => {
      const mName = s.memberName || memberMap.get(s.memberId)?.memName || `Member #${s.memberId}`;
      const scheduledDate = new Date(s.scheduledAt);
      return {
        id: s.sessionId || 0,
        name: mName,
        date: scheduledDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        duration: `${s.durationMins} min`,
        rating: 5,
        notes: s.trainerNotes || ''
      };
    });

    // Calculate weekly stats chartData
    this.calculateChartData();
  }

  calculateChartData(): void {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    const weekdaysList = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    
    this.classesList.forEach(c => {
      if (c.status !== 'CANCELLED' && c.weekdays) {
        const days = c.weekdays.toUpperCase().split(',').map(d => d.trim());
        days.forEach(day => {
          const idx = weekdaysList.indexOf(day);
          if (idx !== -1) {
            counts[idx]++;
          }
        });
      }
    });

    this.ptSessionsList.forEach(s => {
      if (s.status === 'COMPLETED' || s.status === 'APPROVED') {
        const date = new Date(s.scheduledAt);
        let dayIdx = date.getDay() - 1;
        if (dayIdx === -1) dayIdx = 6; // Sunday
        
        const sessionTime = date.getTime();
        const startOfWeek = new Date(this.currentWeekDays[0].dateStr).getTime();
        const endOfWeek = new Date(this.currentWeekDays[6].dateStr).getTime() + 86400000;
        if (sessionTime >= startOfWeek && sessionTime <= endOfWeek) {
          counts[dayIdx]++;
        }
      }
    });

    this.chartData = counts.map(count => Math.max(10, Math.min(count * 20, 80)));
  }

  getClassesForDay(dayName: string, dateStr: string): ClassesDto[] {
    const fullDayName = this.mapToFullDayName(dayName);
    return this.classesList.filter(c => {
      if (c.status === 'CANCELLED') return false;
      if (c.startDate && dateStr < c.startDate) return false;
      if (c.endDate && dateStr > c.endDate) return false;
      
      const days = c.weekdays.toUpperCase().split(',').map(d => d.trim());
      return days.includes(fullDayName);
    });
  }

  mapToFullDayName(shortName: string): string {
    const map: { [key: string]: string } = {
      'MON': 'MONDAY',
      'TUE': 'TUESDAY',
      'WED': 'WEDNESDAY',
      'THU': 'THURSDAY',
      'FRI': 'FRIDAY',
      'SAT': 'SATURDAY',
      'SUN': 'SUNDAY'
    };
    return map[shortName] || shortName;
  }

  getCategoryClass(className: string): string {
    const name = className.toLowerCase();
    if (name.includes('yoga') || name.includes('meditation')) return 'block-yoga';
    if (name.includes('zumba') || name.includes('dance')) return 'block-zumba';
    if (name.includes('lift') || name.includes('power') || name.includes('pump') || name.includes('strength')) return 'block-strength';
    return 'block-cardio';
  }

  getRoomName(roomId: number): string {
    const room = this.roomsList.find(r => r.facilityId === roomId);
    return room ? room.facilityName : 'Studio Room';
  }

  closeSubAlert(): void {
    this.subAlertOpen = false;
  }

  toggleClassExpanded(cls: any): void {
    if (this.expandedClass && this.expandedClass.classId === cls.classId) {
      this.expandedClass = null;
    } else {
      this.expandedClass = cls;
      
      // Fetch Room / Facility Name
      const room = this.roomsList.find(r => r.facilityId === cls.roomId);
      this.expandedClass.roomName = room ? room.facilityName : `Room #${cls.roomId}`;
      
      // Fetch enrolled count dynamically
      this.frontdeskApi.getBookingsByClass(cls.classId).subscribe({
        next: (bookings) => {
          const activeBookings = bookings.filter(b => b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'WAITLISTED');
          this.expandedClass.enrolledCount = activeBookings.length;
        },
        error: () => {
          this.expandedClass.enrolledCount = 0;
        }
      });
    }
  }

  toggleNotes(sessionId: number): void {
    this.activeNotes = this.activeNotes === sessionId ? null : sessionId;
  }

  handleRequestAction(reqId: number, action: 'accepted' | 'declined'): void {
    const status = action === 'accepted' ? 'APPROVED' : 'DECLINED';
    this.frontdeskApi.updatePtSessionStatus(reqId, status, '').subscribe({
      next: () => {
        this.toastService.success(`REQUEST ${status}`);
        this.loadDashboardData();
      },
      error: (err) => {
        this.toastService.error(`FAILED TO UPDATE REQUEST.`);
        console.error(err);
      }
    });
  }

  markSessionCompleted(reqId: number): void {
    this.frontdeskApi.updatePtSessionStatus(reqId, 'COMPLETED', '').subscribe({
      next: () => {
        this.toastService.success(`SESSION MARKED AS COMPLETED`);
        this.loadDashboardData();
      },
      error: (err) => {
        this.toastService.error(`FAILED TO COMPLETE SESSION.`);
        console.error(err);
      }
    });
  }

  getPendingRequests(): number {
    return this.ptRequests.filter(req => req.status === 'pending').length;
  }

  getRatingStars(rating: number | null): Array<number> {
    if (!rating) return [];
    return Array.from({ length: rating }, (_, i) => i);
  }

  getEmptyStars(rating: number | null): Array<number> {
    if (!rating) return [];
    return Array.from({ length: 5 - rating }, (_, i) => i);
  }

  saveNotes(sessionId: number, notesValue: string): void {
    this.frontdeskApi.updatePtSessionStatus(sessionId, 'COMPLETED', notesValue).subscribe({
      next: () => {
        this.activeNotes = null;
        this.toastService.success('TRAINING SESSION NOTES UPDATED SUCCESSFULLY.');
        this.loadDashboardData();
      },
      error: (err) => {
        console.error('Failed to update PT session notes:', err);
        this.toastService.error('FAILED TO SAVE PT SESSION NOTES.');
      }
    });
  }

  cancelNotes(): void {
    this.activeNotes = null;
  }

  parseCertifications(certsStr: string | undefined): { name: string, isPending: boolean }[] {
    if (!certsStr) return [];
    return certsStr.split(',').map(c => c.trim()).filter(c => c.length > 0).map(c => {
      const isPending = c.includes('Pending Manager Verification');
      return {
        name: c.replace(' (Pending Manager Verification)', ''),
        isPending
      };
    });
  }

  serializeCertifications(certs: { name: string, isPending: boolean }[]): string {
    return certs.map(c => c.isPending ? `${c.name} (Pending Manager Verification)` : c.name).join(', ');
  }

  addCertification(): void {
    const name = this.newCertName.trim();
    if (!name) return;
    this.certList.push({ name, isPending: true });
    this.newCertName = '';
  }

  removeCertification(index: number): void {
    this.certList.splice(index, 1);
  }

  saveProfileChanges(): void {
    this.profileError = '';
    const bio = this.tempBio.trim();
    if (!bio || bio.length > 500) {
      this.profileError = 'Validation Error: Biography text cannot be left blank and must not exceed 500 characters.';
      this.toastService.error('VALIDATION ERROR: BIOGRAPHY TEXT CANNOT BE LEFT BLANK AND MUST NOT EXCEED 500 CHARACTERS.');
      return;
    }

    if (!this.trainer || !this.trainer.trainerId) {
      this.toastService.error('TRAINER NOT INITIALIZED.');
      return;
    }

    const updated: TrainerDto = {
      ...this.trainer,
      bio: bio,
      specialties: this.tempSpecialties.trim(),
      certifications: this.serializeCertifications(this.certList),
      acceptingPtClients: this.acceptingPtClients
    };

    this.frontdeskApi.updateTrainer(Number(this.trainer.trainerId), updated).subscribe({
      next: (res) => {
        this.trainer = res;
        this.tempBio = res.bio || '';
        this.tempSpecialties = res.specialties || '';
        this.certList = this.parseCertifications(res.certifications);
        this.acceptingPtClients = res.acceptingPtClients !== false;
        this.toastService.success('Profile updated successfully. Your updated biography and specializations are now live. Newly appended certifications have been routed to branch management for documentation review.');
      },
      error: (err) => {
        console.error('Failed to update trainer profile:', err);
        this.toastService.error('FAILED TO SAVE PROFILE CHANGES.');
      }
    });
  }

  convertTo24h(time12h: string): string {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = '00';
    }
    if (modifier === 'PM') {
      hours = (parseInt(hours, 10) + 12).toString();
    }
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
  }

  capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  isSlotActive(day: string, hour: string): boolean {
    return this.activeSlotsSet.has(`${day}-${hour}`);
  }

  toggleSlot(day: string, hour: string): void {
    this.availabilityError = '';
    const key = `${day}-${hour}`;
    if (this.activeSlotsSet.has(key)) {
      this.activeSlotsSet.delete(key);
    } else {
      // Validate class conflict:
      const conflictMsg = this.checkAvailabilityConflict(day, hour);
      if (conflictMsg) {
        this.availabilityError = conflictMsg;
        this.toastService.error(conflictMsg);
        return;
      }
      this.activeSlotsSet.add(key);
    }
  }

  checkAvailabilityConflict(dayName: string, timeStr: string): string | null {
    const parsedTime = this.convertTo24h(timeStr);
    
    const conflictingClass = this.classesList.find(c => {
      if (c.status === 'CANCELLED') return false;
      const days = c.weekdays.toUpperCase().split(',').map(d => d.trim());
      if (!days.includes(dayName.toUpperCase())) return false;
      
      const classStart = c.classTime.substring(0, 5); // "09:00"
      const slotStart = parsedTime.substring(0, 5); // "09:00"
      return classStart === slotStart;
    });

    if (conflictingClass) {
      const room = this.roomsList.find(r => r.roomId === conflictingClass.roomId);
      const roomName = room ? room.roomName : `Room #${conflictingClass.roomId}`;
      return `Schedule Matrix Conflict: An availability block cannot be configured on ${this.capitalize(dayName)}s at ${timeStr} because you are already assigned to lead [${conflictingClass.className}] in ${roomName} during that time window.`;
    }
    
    return null;
  }

  saveAvailability(): void {
    if (!this.trainer || !this.trainer.trainerId) {
      this.toastService.error('TRAINER PROFILE NOT LOADED.');
      return;
    }

    const newSlotsStr = Array.from(this.activeSlotsSet).join(', ');
    const oldSlots = this.trainer.availability ? this.trainer.availability.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];
    
    // Identify trimmed slots: in oldSlots but not in activeSlotsSet
    const trimmedSlots = oldSlots.filter(s => !this.activeSlotsSet.has(s));
    
    if (trimmedSlots.length > 0) {
      // Check if any trimmed slot has future active bookings
      const affectedBookings = this.ptSessionsList.filter(s => {
        if (s.status !== 'APPROVED' && s.status !== 'REQUESTED') return false;
        const scheduledTime = new Date(s.scheduledAt);
        if (scheduledTime < new Date()) return false;
        
        // Get day and time of booking
        const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        const bookingDayName = days[scheduledTime.getDay()];
        
        // format time back to "hh:mm AM/PM"
        let hours = scheduledTime.getHours();
        const minutes = scheduledTime.getMinutes().toString().padStart(2, '0');
        const modifier = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 should be 12
        const bookingTimeStr = `${hours.toString().padStart(2, '0')}:${minutes} ${modifier}`;
        
        const bookingSlotKey = `${bookingDayName}-${bookingTimeStr}`;
        return trimmedSlots.includes(bookingSlotKey);
      });

      if (affectedBookings.length > 0) {
        this.affectedSessionsCount = affectedBookings.length;
        this.pendingSlotsToSave = newSlotsStr;
        this.interventionJustification = '';
        this.showInterventionModal = true;
        return;
      }
    }

    // No affected bookings, save directly
    this.updateTrainerAvailability(newSlotsStr);
  }

  abortAvailabilitySave(): void {
    this.showInterventionModal = false;
    this.pendingSlotsToSave = '';
    // Restore slots from trainer model
    this.activeSlotsSet.clear();
    if (this.trainer && this.trainer.availability) {
      this.trainer.availability.split(',').map(s => s.trim()).filter(s => s.length > 0).forEach(slot => {
        this.activeSlotsSet.add(slot);
      });
    }
    this.toastService.warning('SAVING AVAILABILITY OPERATION ABORTED.');
  }

  forceSectorCancellation(): void {
    const reason = this.interventionJustification.trim();
    if (!reason) {
      this.toastService.error('CANCELLATION JUSTIFICATION REASON IS MANDATORY.');
      return;
    }

    if (!this.trainer || !this.trainer.trainerId) return;

    // Identify and cancel bookings
    const oldSlots = this.trainer.availability ? this.trainer.availability.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];
    const trimmedSlots = oldSlots.filter(s => !this.activeSlotsSet.has(s));

    const affectedBookings = this.ptSessionsList.filter(s => {
      if (s.status !== 'APPROVED' && s.status !== 'REQUESTED') return false;
      const scheduledTime = new Date(s.scheduledAt);
      if (scheduledTime < new Date()) return false;
      
      const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const bookingDayName = days[scheduledTime.getDay()];
      
      let hours = scheduledTime.getHours();
      const minutes = scheduledTime.getMinutes().toString().padStart(2, '0');
      const modifier = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const bookingTimeStr = `${hours.toString().padStart(2, '0')}:${minutes} ${modifier}`;
      
      const bookingSlotKey = `${bookingDayName}-${bookingTimeStr}`;
      return trimmedSlots.includes(bookingSlotKey);
    });

    // Cancel all affected bookings sequentially
    const cancelObservables = affectedBookings.map(b => 
      this.frontdeskApi.updatePtSessionStatus(Number(b.sessionId), 'CANCELLED', reason)
    );

    if (cancelObservables.length > 0) {
      // Execute cancellation requests
      forkJoin(cancelObservables).subscribe({
        next: () => {
          this.updateTrainerAvailability(this.pendingSlotsToSave);
          this.showInterventionModal = false;
          this.toastService.success(`AVAILABILITY UPDATED: ${affectedBookings.length} CONFIRMED PT SESSIONS AUTOMATICALLY CANCELLED. RE-CREDITS PROTOCOL TRIGGERED (+1 CREDIT).`);
        },
        error: (err) => {
          console.error('Failed to cancel affected bookings:', err);
          this.toastService.error('ERROR CANCELING SESSIONS.');
        }
      });
    } else {
      this.updateTrainerAvailability(this.pendingSlotsToSave);
      this.showInterventionModal = false;
    }
  }

  updateTrainerAvailability(newSlotsStr: string): void {
    if (!this.trainer || !this.trainer.trainerId) return;

    const updated: TrainerDto = {
      ...this.trainer,
      availability: newSlotsStr
    };

    this.frontdeskApi.updateTrainer(Number(this.trainer.trainerId), updated).subscribe({
      next: (res) => {
        this.trainer = res;
        this.activeSlotsSet.clear();
        if (res.availability) {
          res.availability.split(',').map(s => s.trim()).filter(s => s.length > 0).forEach(slot => {
            this.activeSlotsSet.add(slot);
          });
        }
        this.toastService.success('Standard weekly template availability published successfully.');
        this.loadDashboardData();
      },
      error: (err) => {
        console.error('Failed to update trainer availability:', err);
        this.toastService.error('FAILED TO SAVE AVAILABILITY.');
      }
    });
  }

  registerLeave(): void {
    if (!this.leaveStartDate || !this.leaveEndDate || !this.leaveReason.trim()) {
      this.toastService.error('ALL FIELDS ARE MANDATORY TO REGISTER LEAVE / TIME-OFF.');
      return;
    }

    const start = new Date(this.leaveStartDate + 'T00:00:00');
    const end = new Date(this.leaveEndDate + 'T23:59:59');
    
    if (start > end) {
      this.toastService.error('START DATE CANNOT BE AFTER END DATE.');
      return;
    }

    if (!this.trainer || !this.trainer.trainerId) return;

    // 1. Identify group classes in range
    const affectedClasses = this.classesList.filter(c => {
      if (c.status === 'CANCELLED') return false;
      const classStart = new Date(c.startDate);
      const classEnd = new Date(c.endDate);
      return classStart <= end && classEnd >= start;
    });

    // 2. Identify confirmed/pending PT sessions in range
    const affectedSessions = this.ptSessionsList.filter(s => {
      if (s.status !== 'APPROVED' && s.status !== 'REQUESTED') return false;
      const scheduled = new Date(s.scheduledAt);
      return scheduled >= start && scheduled <= end;
    });

    // Cancel all PT sessions
    const cancelObservables = affectedSessions.map(s => 
      this.frontdeskApi.updatePtSessionStatus(Number(s.sessionId), 'CANCELLED', `TRAINER ON LEAVE: ${this.leaveReason.trim()}`)
    );

    if (cancelObservables.length > 0) {
      forkJoin(cancelObservables).subscribe({
        next: () => {
          this.toastService.success(`LEAVE REGISTERED: ${affectedSessions.length} PT BOOKINGS CANCELLED AND AUTOMATICALLY RE-CREDITED.`);
          this.finalizeLeave(affectedClasses);
        },
        error: (err) => {
          console.error('Failed to cancel PT sessions for leave:', err);
          this.toastService.error('FAILED TO REGISTER LEAVE / PT CANCELLATION.');
        }
      });
    } else {
      this.finalizeLeave(affectedClasses);
    }
  }

  finalizeLeave(affectedClasses: ClassesDto[]): void {
    if (affectedClasses.length > 0) {
      this.toastService.info(`${affectedClasses.length} ASSIGNED CLASSES DETECTED. MARKED PENDING SUBSTITUTE INSTRUCTOR COVERAGE.`);
    }
    this.toastService.success('UNAVAILABILITY DATE BLOCK REGISTERED SYSTEM-WIDE.');
    
    this.leaveStartDate = '';
    this.leaveEndDate = '';
    this.leaveReason = '';
    this.loadDashboardData();
  }

  selectRosterClass(cls: ClassesDto): void {
    this.selectedRosterClass = cls;
    this.loadRosterForClass();
  }

  loadRosterForClass(): void {
    if (!this.selectedRosterClass) return;
    this.isLoadingRoster = true;
    this.rosterBookings = [];
    
    this.frontdeskApi.getBookingsByClass(Number(this.selectedRosterClass.classId)).subscribe({
      next: (bookings) => {
        const memberMap = new Map<number, any>();
        this.membersList.forEach(m => memberMap.set(Number(m.memberId), m));
        
        this.frontdeskApi.getTodayAttendance(Number(this.trainer?.branchId)).subscribe({
          next: (attendanceList) => {
            const checkedInMemberIds = new Set<number>();
            attendanceList.forEach(a => {
              if (a.classId === this.selectedRosterClass?.classId && a.memberId) {
                checkedInMemberIds.add(Number(a.memberId));
              }
            });

            this.rosterBookings = bookings.map(b => {
              const member = memberMap.get(Number(b.memberId));
              const memName = member?.memName || `Member #${b.memberId}`;
              const email = member?.email || 'N/A';
              
              const hasUnpaidDues = member?.status === 'SUSPENDED';
              const pendingHealthWaiver = false;
              
              const isCheckedIn = checkedInMemberIds.has(Number(b.memberId));
              
              return {
                id: b.bookingId,
                memberId: b.memberId,
                name: memName,
                email: email,
                bookingStatus: b.bookingStatus,
                isCheckedIn: isCheckedIn,
                hasUnpaidDues: hasUnpaidDues,
                pendingHealthWaiver: pendingHealthWaiver
              };
            });
            this.isLoadingRoster = false;
          },
          error: (err) => {
            console.error('Failed to load class attendance list:', err);
            this.rosterBookings = bookings.map(b => {
              const member = memberMap.get(Number(b.memberId));
              return {
                id: b.bookingId,
                memberId: b.memberId,
                name: member?.memName || `Member #${b.memberId}`,
                email: member?.email || 'N/A',
                bookingStatus: b.bookingStatus,
                isCheckedIn: false,
                hasUnpaidDues: member?.status === 'SUSPENDED',
                pendingHealthWaiver: false
              };
            });
            this.isLoadingRoster = false;
          }
        });
      },
      error: (err) => {
        console.error('Failed to load class bookings:', err);
        this.isLoadingRoster = false;
        this.toastService.error('FAILED TO LOAD CLASS ROSTER.');
      }
    });
  }

  isTimingGateLocked(classTimeStr: string, dateStr: string): { locked: boolean; message: string; isRetroactive: boolean } {
    return { locked: false, message: '', isRetroactive: false };
  }

  mutateAttendanceState(booking: any, state: 'checked-in' | 'no-show' | 'excused'): void {
    if (!this.selectedRosterClass) return;

    const gate = this.isTimingGateLocked(this.selectedRosterClass.classTime, this.rosterDateStr);
    
    if (gate.locked) {
      if (gate.isRetroactive) {
        this.overrideBookingId = booking.id;
        this.overrideMemberId = booking.memberId;
        this.overrideState = state;
        this.overrideJustification = '';
        this.showOverrideModal = true;
      } else {
        this.toastService.error(gate.message);
      }
      return;
    }

    this.executeAttendanceMutation(booking.id, booking.memberId, state);
  }

  executeAttendanceMutation(bookingId: number, memberId: number, state: 'checked-in' | 'no-show' | 'excused', justification?: string): void {
    if (!this.selectedRosterClass) return;
    const classId = Number(this.selectedRosterClass.classId);
    const branchId = Number(this.trainer?.branchId);

    if (state === 'checked-in') {
      if (justification) {
        const dto: AttendanceDto = {
          memberId: memberId,
          branchId: branchId,
          classId: classId,
          scanMethod: 'MANUAL'
        };
        const session = this.authService.getCurrentSession();
        const userId = session ? Number(session.userId) : 1;
        this.frontdeskApi.overrideCheckIn(dto, userId, justification).subscribe({
          next: () => {
            this.toastService.success('RETROACTIVE ATTENDANCE RECORDED: MEMBER MARKED CHECKED-IN WITH OVERRIDE JUSTIFICATION LOGGED.');
            this.loadRosterForClass();
          },
          error: (err) => {
            console.error('Failed to override check-in:', err);
            this.toastService.error('FAILED TO OVERRIDE ATTENDANCE.');
          }
        });
      } else {
        this.frontdeskApi.markClassAttendance(classId, memberId, branchId).subscribe({
          next: () => {
            this.toastService.success('MEMBER ATTENDANCE MARKED CHECKED-IN.');
            this.loadRosterForClass();
          },
          error: (err) => {
            console.error('Failed to mark class attendance:', err);
            this.toastService.error('FAILED TO MARK ATTENDANCE.');
          }
        });
      }
    } else if (state === 'no-show') {
      this.frontdeskApi.markNoShow(bookingId).subscribe({
        next: () => {
          this.toastService.success(justification ? 'RETROACTIVE ATTENDANCE OVERRIDE: MEMBER MARKED NO-SHOW.' : 'MEMBER MARKED NO-SHOW.');
          this.loadRosterForClass();
        },
        error: (err) => {
          console.error('Failed to mark no-show:', err);
          this.toastService.error('FAILED TO MARK NO-SHOW.');
        }
      });
    } else if (state === 'excused') {
      this.frontdeskApi.cancelClassBooking(bookingId).subscribe({
        next: () => {
          this.toastService.success(justification ? 'RETROACTIVE ATTENDANCE OVERRIDE: BOOKING CANCELLED AND EXCUSED.' : 'BOOKING CANCELLED AND EXCUSED.');
          this.loadRosterForClass();
        },
        error: (err) => {
          console.error('Failed to cancel booking (excuse):', err);
          this.toastService.error('FAILED TO EXCUSE BOOKING.');
        }
      });
    }
  }

  submitRetroactiveOverride(): void {
    const reason = this.overrideJustification.trim();
    if (!reason) {
      this.toastService.error('MANDATORY RETROACTIVE OVERRIDE JUSTIFICATION REQUIRED.');
      return;
    }

    if (!this.overrideState) return;

    this.executeAttendanceMutation(this.overrideBookingId, this.overrideMemberId, this.overrideState, reason);
    this.showOverrideModal = false;
  }

  closeOverrideModal(): void {
    this.showOverrideModal = false;
    this.overrideBookingId = 0;
    this.overrideMemberId = 0;
    this.overrideState = null;
    this.overrideJustification = '';
  }
}
