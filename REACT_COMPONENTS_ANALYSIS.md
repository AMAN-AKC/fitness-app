# React Fitness Management Application - Component Analysis

**Purpose:** Comprehensive analysis of 15 React components for replication in Angular.  
**Date:** May 5, 2026  
**Status:** Complete Analysis

---

## TABLE OF CONTENTS

1. [ManagerDashboard](#1-managerdashboard)
2. [ClassSchedulePage](#2-classschedulepage)
3. [ClassBooking](#3-classbooking)
4. [HealthForms](#4-healthforms)
5. [TrainerProfile](#5-trainerprofile)
6. [NotificationsCenter](#6-notificationscenter)
7. [Checkout](#7-checkout)
8. [DataImportExport](#8-dataimportexport)
9. [AuditLogViewer](#9-auditlogviewer)
10. [DunningQueuePage](#10-dunningqueuepage)
11. [ErrorStatesView](#11-errorstatesview)
12. [GlobalError](#12-globalerror)
13. [ForgotPasswordPage](#13-forgotpasswordpage)
14. [PlaceholderPage](#14-placeholderpage)
15. [PlansCatalog](#15-planscatalog)

---

## 1. ManagerDashboard

### Component Purpose & Key Features

- **Purpose:** Executive-level dashboard displaying club performance metrics, financial health, class utilization, and operational alerts
- **Key Features:**
  - 5 KPI tiles showing real-time metrics (Active Members, New Joins, Churn, Revenue, Classes)
  - Revenue trend chart with metric switching (Revenue/New Joins/Churn)
  - Top classes by occupancy visualization with progress bars
  - Pending dunning/failed payments queue
  - Bulk action capabilities (export reports, view full reports)

### Data Structures/Interfaces

```typescript
// Revenue data for charts
revenueData = [
  { name: string, value: number }  // 6 months of data
]

// Class occupancy data
classData = [
  { id: number, name: string, occupancy: number, fill: string }
]

// KPI metrics (mock data):
- Active Members: 1,248
- New Joins: 63
- Churn: 18
- Monthly Revenue: ₹4.28L
- Classes: 42
```

### Key UI Elements & Layout

- **Header:** Title, subtitle, export button
- **KPI Grid:** 5 responsive cards with icons, metrics, trend indicators
- **Chart Section:** 2-column grid
  - Left: Area chart with gradient fill, metric selector tabs
  - Right: Horizontal stacked bars for class occupancy
- **Bottom Section:** 2-column layout with dunning queue and additional metrics

### Event Handlers & Methods

- `setChartMetric()` - Switch between Revenue/New Joins/Churn metrics
- Class card hover effects and transitions
- Tab switching for metrics

### State Management

```typescript
const [chartMetric, setChartMetric] = useState("Revenue");
```

### Estimated Complexity

**Medium** - Multiple interactive charts, filtering, responsive grid layout

---

## 2. ClassSchedulePage

### Component Purpose & Key Features

- **Purpose:** Calendar-based class scheduling system with drag-capable class blocks, view toggles (Day/Week/Month), and detailed side panels
- **Key Features:**
  - Week view calendar with hourly grid
  - Draggable colored class blocks with duration indicators
  - Trainer and enrollment info on each class
  - Filter by branch/trainer/room
  - Detail side panel showing enrolled members and class info
  - Conflict detection with warning badges
  - Modal-based create/substitute/cancel dialogs

### Data Structures/Interfaces

```typescript
type ClassInfo = {
  id: number;
  name: string;
  category: string;
  color: string;
  trainer: string;
  room: string;
  day: string;        // "Mon 22"
  startTime: string;  // "08:00"
  duration: number;   // minutes
  enrolled: number;
  capacity: number;
};

const HOURS = [8, 9, 10, ..., 21];  // 14 hours
const DAYS = ["Mon 22", "Tue 23", "Wed 24", "Thu 25", "Fri 26", "Sat 27", "Sun 28"];
```

### Key UI Elements & Layout

- **Top Bar:** View toggle (Day/Week/Month), navigation arrows, week label, filters
- **Calendar Grid:**
  - Time labels on left (60px fixed width)
  - 7 day columns with header showing dates
  - Hourly grid lines (80px per hour)
  - Colored class blocks absolutely positioned
  - Grid: Major lines (solid), minor lines (dashed)
- **Detail Panel:** 320px fixed width, slide-in from right
  - Class info cards with icons
  - Conflict alerts (top)
  - Enrolled members list

### Event Handlers & Methods

- `setSelectedClass()` - Toggle detail panel
- `setView()` - Switch calendar view
- `getTopOffset()` - Calculate CSS top position based on start time
- Class card click events

### State Management

```typescript
const [view, setView] = useState("Week");
const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
const [showCreate, setShowCreate] = useState(false);
const [showSubstituteModal, setShowSubstituteModal] = useState(false);
const [showCancelDialog, setShowCancelDialog] = useState(false);
```

### Estimated Complexity

**Complex** - Calendar grid math, drag-and-drop positioning, multiple modals, time calculations

---

## 3. ClassBooking

### Component Purpose & Key Features

- **Purpose:** Class discovery and booking interface for members with real-time seat availability, filters, and waitlist management
- **Key Features:**
  - Grid of bookable classes with capacity indicators
  - Multi-level filtering (category, days, times, trainer)
  - Occupancy progress bars (color-coded: green < 60%, orange 60-90%, red > 90%)
  - Status badges (Available/Almost Full/Full/Waitlisted)
  - Detail drawer with full class info, trainer profile, cancellation policy
  - Book/Waitlist toggle based on availability
  - Booking confirmation animation

### Data Structures/Interfaces

```typescript
type Class = {
  id: number;
  name: string;
  trainer: string;
  room: string;
  date: string; // "Thu, 22 Apr"
  time: string; // "07:00–08:00 AM"
  duration: string; // "60 min"
  cat: string; // category
  catColor: string; // Tailwind class
  status: string; // "Available" | "Almost Full" | "Full" | "Waitlisted"
  statusColor: string; // bg + text color class
  spots: number;
  capacity: number;
  fill: number; // occupancy percentage
  type: string; // "Available" | "Waitlist" | "Closed"
};

categories = ["All", "Yoga", "Zumba", "Strength", "Cardio", "Pilates", "HIIT"];
days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
times = ["Morning", "Afternoon", "Evening"];
```

### Key UI Elements & Layout

- **Filter Bar:** Sticky at top
  - Search box (300px min-width)
  - Category pills (scrollable)
  - Day/Time toggles
  - Trainer selector dropdown
  - Reset filters link
- **Grid:** 2 columns on tablet, 1 on mobile
- **Class Card:**
  - Header: Category badge, Status badge
  - Title (Syne bold)
  - Info rows (trainer, room, date, time)
  - Capacity progress bar
  - CTA button (Book/Waitlist/Closed)
- **Detail Drawer:** 400px max-width, slide-in from right
  - Trainer avatar + rating
  - Full description
  - Prerequisites alert
  - Cancellation policy (italic)
  - Confirmation button

### Event Handlers & Methods

- `setSelectedCat()` - Filter by category
- `setDrawerOpen()` - Toggle detail drawer
- `handleBook()` - Simulate booking with loading state
- `getProgressColor()` - Color logic based on occupancy

### State Management

```typescript
const [selectedCat, setSelectedCat] = useState("All");
const [drawerOpen, setDrawerOpen] = useState(false);
const [selectedClass, setSelectedClass] = useState<any>(null);
const [booked, setBooked] = useState(false);
```

### Estimated Complexity

**Medium** - Multiple state layers, filtering, drawer animations, progress color logic

---

## 4. HealthForms

### Component Purpose & Key Features

- **Purpose:** Member health questionnaire and consent management with PAR-Q form, signature capture, and consent history
- **Key Features:**
  - Status indicator (expired/active/pending)
  - Alert banner for expired consent
  - PAR-Q 7-question health questionnaire
  - Yes/No radio button toggles per question
  - Medical notes textarea (optional)
  - Digital signature capture with timestamp
  - Consent history timeline with version tracking
  - Download PDF capability for each consent

### Data Structures/Interfaces

```typescript
type FormState = {
  expired: boolean;
  submitted: boolean;
  questions: Array<{ question: string; answer: "yes" | "no" }>;
  medicalNotes: string;
  signature: string; // Full name as signature
};

type ConsentHistory = {
  date: string;
  version: string; // e.g., "3.2"
  status: "ACTIVE" | "PENDING" | "EXPIRED";
  color: string; // Tailwind class for status dot
};
```

### Key UI Elements & Layout

- **Header Card:** Status badge, title, subtitle
- **Alert Banner:** Conditional render if expired (red) or active (green)
- **PAR-Q Form Card:**
  - Introduction alert with icon
  - 7 Q&A rows (question + Yes/No toggle)
  - Medical notes textarea
  - Signature input (monospace font)
  - Timestamp display (JetBrains Mono)
  - Checkbox for legal agreement
  - Submit button
- **Consent History Timeline:**
  - Vertical line on left with colored dots
  - Date, version, status badges
  - Download PDF link

### Event Handlers & Methods

- `setSubmitted()` - Mark form as complete
- `setExpired()` - Update consent status
- Radio button change handlers
- Textarea change handler

### State Management

```typescript
const [expired, setExpired] = useState(true);
const [submitted, setSubmitted] = useState(false);
```

### Estimated Complexity

**Simple** - Form submission flow, conditional rendering, basic state management

---

## 5. TrainerProfile

### Component Purpose & Key Features

- **Purpose:** Trainer directory with individual profile pages, session booking calendar, PT package selection, and confirmation modal
- **Key Features:**
  - Trainer list view with cards (name, specialties, rating, branch)
  - Profile detail view with header, specialties, certifications
  - Calendar date picker with available time slots
  - Past time slots disabled (greyed out)
  - PT package selector (1/5/10 sessions with pricing)
  - Booking confirmation modal with summary
  - Back navigation button

### Data Structures/Interfaces

```typescript
type Trainer = {
  id: number;
  name: string;
  avatar: string;        // initials
  specialties: string[];
  rating: number;        // e.g., 4.9
  reviews: number;
  branch: string;
  certs: string[];       // certifications
};

type BookingRequest = {
  trainer: string;
  date: string;          // day number
  time: string;          // "09:00 AM"
  package: string;       // "1 Session" | "5 Sessions" | "10 Sessions"
  price: number;
};

calendarDates = ["Mon 22", "Tue 23", ...];
timeslots = ["09:00 AM", "10:00 AM", "11:00 AM", "14:00 PM", "16:00 PM", "18:00 PM"];
```

### Key UI Elements & Layout

- **Directory View:**
  - Trainer cards in grid/list
  - Click to enter profile detail
- **Profile View:**
  - Back button
  - Header card with:
    - Large avatar circle
    - Name, specialties badges
    - Rating + review count
    - Sessions remaining badge
    - Bio paragraph
    - Certifications as small badges
  - Calendar section:
    - Week navigation (prev/next)
    - 7 columns (days)
    - 6 time slots per day
    - Selection state styling
    - Disabled past times
  - Package selector:
    - 3 radio-button cards with:
      - Price display
      - "Save 12%" / "Best Value" badges
      - Selection circle indicator
  - Request Session button
- **Confirmation Modal:**
  - Summary rows (Trainer, Date, Time, Package, Total)
  - Cancel/Confirm buttons

### Event Handlers & Methods

- `setSelectedTrainer()` - Toggle profile view
- `setSelectedDate()` - Update date selection
- `setSelectedTime()` - Update time selection
- `setSelectedPackage()` - Update package selection
- `setBookingModalOpen()` - Toggle confirmation modal

### State Management

```typescript
const [selectedTrainer, setSelectedTrainer] = useState<any>(null);
const [selectedDate, setSelectedDate] = useState("22 Apr");
const [selectedTime, setSelectedTime] = useState("");
const [selectedPackage, setSelectedPackage] = useState("5 Sessions");
const [bookingModalOpen, setBookingModalOpen] = useState(false);
```

### Estimated Complexity

**Medium** - Multi-step booking flow, conditional rendering, date/time logic

---

## 6. NotificationsCenter

### Component Purpose & Key Features

- **Purpose:** Notification hub with categorized notifications, preferences panel, and unread tracking
- **Key Features:**
  - Slide-in panel from right (450px max-width)
  - Tabs: All/Unread/Bookings/Payments/Renewals/System
  - Unread count badges on tabs
  - Notifications with:
    - Category icons (color-coded)
    - Title, body, timestamp
    - Unread indicator (left border + dot)
    - Hover state with arrow button
  - Mark all as read button
  - Settings button for preference panel (not fully shown)

### Data Structures/Interfaces

```typescript
type NotificationCategory = "Bookings" | "Payments" | "Renewals" | "System";

type Notification = {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  timestamp: string; // "2 hours ago"
  isRead: boolean;
};

type NotificationPreferences = {
  bookingInApp: boolean;
  bookingEmail: boolean;
  cancelInApp: boolean;
  cancelEmail: boolean;
  renewalInApp: boolean;
  renewalEmail: boolean;
  scheduleInApp: boolean;
  scheduleEmail: boolean;
  dunningInApp: boolean;
  dunningEmail: boolean;
  systemInApp: boolean;
  systemEmail: boolean;
};
```

### Key UI Elements & Layout

- **Header:**
  - Title "Notifications"
  - Unread count badge
  - Settings icon button
  - Close button
- **Tab Bar:** Sticky horizontal scroll
  - Tabs with count badges
  - Active tab: blue underline
- **Notification List:** Scrollable
  - Each notification:
    - Category icon in colored circle (left)
    - Title (Syne bold)
    - Body (2-line clamp)
    - Timestamp
    - Unread indicators (left border, dot)
    - Hover arrow button
- **Backdrop:** Semi-transparent overlay (clickable to close)

### Event Handlers & Methods

- `setActiveTab()` - Filter by category
- `markAllRead()` - Update all notifications
- `setIsPreferencesOpen()` - Toggle preferences panel
- `getIcon()` / `getIconBg()` - Return category-specific styling

### State Management

```typescript
const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
const [activeTab, setActiveTab] = useState<string>("All");
const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
const [prefs, setPrefs] = useState({
  /* preference flags */
});
```

### Estimated Complexity

**Medium** - Filtering, unread tracking, preference management, animations

---

## 7. Checkout

### Component Purpose & Key Features

- **Purpose:** Order summary and payment processing with multiple payment methods and success/failure states
- **Key Features:**
  - Order summary with itemized costs, promo discounts, GST
  - Payment method selector (Card/UPI/Cash)
  - Conditional form fields based on selected method:
    - **Card:** Card number, expiry, CVV, saved card selector
    - **UPI:** UPI ID input with verification
    - **Cash:** Info alert about payment at front desk
  - Success state with invoice download
  - Failure state with retry option
  - SSL security indicator

### Data Structures/Interfaces

```typescript
type PaymentMethod = "Card" | "UPI" | "Cash";
type CheckoutStatus = "idle" | "success" | "fail";

type OrderSummary = {
  items: Array<{
    name: string;
    price: number;
  }>;
  subtotal: number;
  discount: number;
  discountCode: string; // "FIT20"
  gst: number;
  total: number;
};
```

### Key UI Elements & Layout

- **Header:** Title, subtitle
- **2-Column Layout:**
  - **Left (58%):** Order Summary
    - Item rows
    - Subtotal
    - Discount (with code badge)
    - GST
    - Total (blue, Syne bold)
    - Promo code input + Apply button
  - **Right (42%):** Payment Form
    - "Complete Payment" header
    - Method selector (3 radio buttons)
    - Conditional form (Card/UPI/Cash)
    - Pay button
    - SSL indicator
- **Success Screen:** Large centered card with:
  - Green checkmark icon
  - Success message
  - Invoice number
  - Download + Back buttons
- **Failure Screen:** Large centered card with:
  - Red X icon
  - Error message
  - Retry + Support buttons

### Event Handlers & Methods

- `setPaymentMethod()` - Switch payment method
- `setStatus()` - Update checkout state
- `handlePay()` - Simulate payment processing (1.5s delay)
- Form validation on submit

### State Management

```typescript
const [paymentMethod, setPaymentMethod] = useState("Card");
const [status, setStatus] = useState("idle"); // "idle" | "success" | "fail"
const [isProcessing, setIsProcessing] = useState(false);
```

### Estimated Complexity

**Medium** - Conditional rendering, payment method switching, form validation

---

## 8. DataImportExport

### Component Purpose & Key Features

- **Purpose:** Bulk data operations with CSV import validation and export functionality
- **Key Features:**
  - **Import Tab:**
    - Entity selector (Members/Plans/Classes/Schedule)
    - Drag-and-drop upload zone
    - File validation (CSV only, max 10MB)
    - Template download link
    - Validation results with pass/fail counts
    - Expandable error details table
    - Proceed or cancel after validation
  - **Export Tab:**
    - Entity selector
    - Date range filters
    - Branch filter
    - Export button with loading state

### Data Structures/Interfaces

```typescript
type EntityType = "Members" | "Plans" | "Classes" | "Schedule";
type UploadState = "idle" | "validating" | "results";

interface ValidationError {
  row: number;
  column: string;
  message: string;
}

// Mock errors
const MOCK_ERRORS: ValidationError[] = [
  { row: 14, column: "Email", message: "Email already exists in system" },
  { row: 22, column: "Phone", message: "Invalid phone number format" },
  { row: 45, column: "Plan_ID", message: "Plan ID does not exist" },
];
```

### Key UI Elements & Layout

- **2-Column Layout:**
  - **Left (Import):** 50% width
    - Entity tabs (underline active)
    - Upload zone (dashed border, 200px height)
      - Drag-over state change
      - Click to browse
      - File info display after selection
    - Validate & Upload button
    - Validating spinner
    - Results section with:
      - Pass/fail summary cards
      - Expandable error details
      - Proceed button
    - Template download link
  - **Right (Export):** 50% width
    - Entity tabs
    - Filters (date range, branch, status)
    - Export button
    - Last export timestamp

### Event Handlers & Methods

- `handleDragOver()` / `handleDragLeave()` / `handleDrop()` - Drag functionality
- `handleFileChange()` - File input change
- `handleFile()` - Validate selected file
- `removeFile()` - Clear selection
- `handleValidate()` - Trigger validation with delay
- `handleProceed()` - Process valid data
- `handleExport()` - Download CSV

### State Management

```typescript
// Import
const [importTab, setImportTab] = useState<EntityType>("Members");
const [file, setFile] = useState<File | null>(null);
const [isDragging, setIsDragging] = useState(false);
const [uploadState, setUploadState] = useState<"idle" | "validating" | "results">("idle");
const [showErrors, setShowErrors] = useState(false);

// Export
const [exportTab, setExportTab] = useState<EntityType>("Members");
const [exportState, setExportState] = useState<"idle" | "exporting">("idle");
```

### Estimated Complexity

**Medium** - File handling, drag-and-drop, validation UI, accordion pattern

---

## 9. AuditLogViewer

### Component Purpose & Key Features

- **Purpose:** Compliance audit trail with searchable logs, before/after diff views, and exportable records
- **Key Features:**
  - Sticky summary bar showing result count and filters
  - Advanced filter bar (user search, entity, action, date range)
  - Audit log table with columns:
    - Timestamp (monospace)
    - Performed By (with user avatar, role badge)
    - Entity
    - Entity ID
    - Action (color-coded badges)
  - Click row to expand detail drawer with:
    - Full user info
    - Entity details
    - Before/After diff comparison (side-by-side)
  - Export CSV button

### Data Structures/Interfaces

```typescript
type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "OVERRIDE" | "LOGIN";
type AuditEntity = "All" | "Member" | "Plan" | "Payment" | "Class" | "Booking" | "System";

interface AuditLog {
  id: string;
  timestamp: string; // "2025-04-22 14:32:08"
  user: {
    name: string;
    role: string; // "Manager", "Admin", "Trainer"
    initials: string;
  };
  entity: AuditEntity;
  entityId: string;
  action: AuditAction;
  details?: string;
  diff: {
    before: Record<string, any>;
    after: Record<string, any>;
  };
}

const ACTION_STYLES: Record<AuditAction, string> = {
  CREATE: "bg-[#F0FDF4] text-[#16A34A]",
  UPDATE: "bg-[#EFF5FF] text-[#2563EB]",
  DELETE: "bg-[#FEF2F2] text-[#DC2626]",
  OVERRIDE: "bg-[#FFFBEB] text-[#D97706]",
  LOGIN: "bg-[#F8F9FC] text-[#475569]",
};
```

### Key UI Elements & Layout

- **Summary Bar:** Sticky, shows filtered count and active filters
- **Filter Bar:**
  - User search input
  - Entity dropdown
  - Action dropdown
  - Date range picker (from/to)
  - Reset/Search buttons
- **Audit Table:**
  - 6 columns with sticky header
  - Monospace font for timestamps
  - User avatars (initials in circles)
  - Role badges
  - Action badges (color-coded)
  - Hover effect
- **Detail Drawer:** (When row clicked)
  - User info section
  - Entity/Action summary
  - Diff view: 2-column layout
    - **Before:** Red highlights for changed fields
    - **After:** Green highlights for changed fields
    - Monospace font for values
    - "No previous data" for creates
    - "Data removed" for deletes

### Event Handlers & Methods

- `setUserSearch()` - Search by performer
- `setEntityFilter()` - Filter entity type
- `setActionFilter()` - Filter action type
- `setDateFrom()` / `setDateTo()` - Date range
- `setSelectedLog()` - Open detail
- `renderDiff()` - Generate before/after comparison

### State Management

```typescript
const [logs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS);
const [userSearch, setUserSearch] = useState("");
const [entityFilter, setEntityFilter] = useState<AuditEntity | "All">("All");
const [actionFilter, setActionFilter] = useState<AuditAction | "All">("All");
const [dateFrom, setDateFrom] = useState("");
const [dateTo, setDateTo] = useState("");
const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
```

### Estimated Complexity

**Complex** - Advanced filtering, diff logic, multi-column table, drawer animations

---

## 10. DunningQueuePage

### Component Purpose & Key Features

- **Purpose:** Failed payment management and collection queue with status tracking, contact logging, and promise-to-pay scheduling
- **Key Features:**
  - Status filter tabs (All/Failed/Pending/Promise-to-Pay/Resolved)
  - Summary KPI cards (top/sidebar):
    - Total Outstanding
    - Accounts in Dunning
    - Resolved This Month
  - Main dunning table with columns:
    - Member name (clickable, initiates follow-up)
    - Plan
    - Amount Due (red, Syne bold)
    - Failure Reason
    - Last Contact
    - PTP Date (if available)
    - Status badge
    - Action buttons (Phone/Check/Ban icons)
  - Follow-Up Modal:
    - Contact method selector (Call/Email/In-Person)
    - Notes textarea
    - Promise-to-Pay date picker
    - Save/Cancel buttons

### Data Structures/Interfaces

```typescript
type DunningStatus = "FAILED" | "PENDING" | "PROMISE" | "RESOLVED";

type DunningRecord = {
  id: string;
  member: { name: string; initials: string };
  plan: string;
  amountDue: number;
  failureReason: string;
  lastContact: string; // "2 days ago"
  ptpDate: string | null; // ISO date
  status: DunningStatus;
};

const TABS = [
  { id: "all", label: "All", count: 38 },
  { id: "failed", label: "Failed", count: 18 },
  { id: "pending", label: "Pending", count: 12 },
  { id: "promise", label: "Promise-to-Pay", count: 6 },
  { id: "resolved", label: "Resolved", count: 2 },
];
```

### Key UI Elements & Layout

- **Summary Cards:** 3-column grid on desktop, flex column on tablet
  - Card styling by status:
    - Failed: Red background
    - Pending: Orange background
    - Resolved: Green background
  - Large Syne bold numbers
- **Tab Bar:** Horizontal scrollable, count badges
- **Main Table:**
  - 8 columns with status-based row coloring
  - Failed rows: Light red background
  - Member column has avatar + blue name (clickable)
  - Amount Due: ₹ prefix, Syne bold, red color
  - Failure Reason: Gray badge
  - PTP Date: Green badge with calendar icon, or "—"
  - Status: Colored badge (FAILED/PENDING/PROMISE/RESOLVED)
  - Action buttons: Phone/Check/Ban icons with hover colors
- **Follow-Up Modal:**
  - Member summary card at top (avatar, name, amount)
  - Contact method: 3 button selector
  - Notes: Textarea (4 rows)
  - PTP Date: Date picker with calendar icon
  - Save/Cancel buttons (footer)

### Event Handlers & Methods

- `setActiveTab()` - Filter by status
- `setSelectedMember()` - Open follow-up modal
- `setContactMethod()` - Switch contact type
- Filter logic on tab change

### State Management

```typescript
const [activeTab, setActiveTab] = useState("all");
const [selectedMember, setSelectedMember] = useState<DunningRecord | null>(null);
const [contactMethod, setContactMethod] = useState<"Call" | "Email" | "In-Person">("Call");
```

### Estimated Complexity

**Medium** - Tabbed filtering, modal management, form handling, responsive layouts

---

## 11. ErrorStatesView

### Component Purpose & Key Features

- **Purpose:** Showcase component displaying system error states, empty states, and toast notification patterns
- **Key Features:**
  - 6-card grid layout showcasing:
    1. **401 - Session Expired:** Lock icon, blue theme
    2. **403 - Access Denied:** Shield alert icon, red theme
    3. **404 - Not Found:** Compass icon, orange theme
    4. **500 - Server Error:** Wrench icon, red theme
    5. **Empty State:** Large icon (CalendarX), suggested action
    6. **Toast Notifications:** 4 toast examples (Success/Warning/Error/Info)
  - Each error/empty card:
    - Centered layout
    - Large icon in colored circle
    - HTTP code (monospace)
    - Heading (Syne bold)
    - Description text (light)
    - Primary CTA button
    - Secondary actions (links/buttons)

### Data Structures/Interfaces

```typescript
// No complex data structures - static UI showcase
// Toast types:
type ToastType = "success" | "warning" | "error" | "info";

type Toast = {
  type: ToastType;
  title: string;
  body: string;
  timestamp?: string;
};
```

### Key UI Elements & Layout

- **Master Grid:** 1x3 on mobile, 2x3 on desktop, centered in viewport
- **Error Card Template:** (280px fixed width)
  - Icon circle (64px)
  - HTTP code (monospace, gray)
  - Title (Syne bold)
  - Description
  - Primary button
  - Optional secondary actions
- **Toast Layout:**
  - Horizontal card (320px width)
  - Left-aligned colored icon circle
  - Title + body text (2-line clamp)
  - Right-aligned close button
  - Left border accent (3px)
  - Bottom-right position (fixed, stacked)

### Event Handlers & Methods

- Basic click handlers for buttons (navigation, retry)
- Toast dismiss functionality

### State Management

- None required - static component

### Estimated Complexity

**Simple** - Pure UI showcase, no interactive state management

---

## 12. GlobalError

### Component Purpose & Key Features

- **Purpose:** Catch-all error boundary page for unhandled route errors
- **Key Features:**
  - Centered error card
  - Alert triangle icon (red)
  - Generic error message
  - Dynamic error text from route error object
  - Back to home link
  - Console logging for debugging

### Data Structures/Interfaces

```typescript
// Extends React Router's error object
interface RouteError {
  statusText?: string;
  message?: string;
  status?: number;
}
```

### Key UI Elements & Layout

- **Center Card:** (max-width: 28rem)
  - Alert icon circle (red background)
  - Title "Something went wrong"
  - Error message text (statusText || message || generic)
  - Back home button with house icon

### Event Handlers & Methods

- Error logging to console
- Navigation link back to home

### State Management

- None - stateless component

### Estimated Complexity

**Simple** - Single error display, no interaction

---

## 13. ForgotPasswordPage

### Component Purpose & Key Features

- **Purpose:** Multi-step password recovery flow with email verification and strong password requirements
- **Key Features:**
  - **Screen 1: Request Reset**
    - Email input
    - Submit button sends reset link
    - Success confirmation state
  - **Screen 2: Create New Password**
    - Password input with strength indicator
    - Password strength validation:
      - 8+ characters
      - Uppercase letter
      - Number
      - Special character
    - Confirm password field
    - Visual checklist of requirements
    - Submit button (disabled until strong + match)
    - Success state with confetti-style animation
  - Optional lockout banner showing temp suspension

### Data Structures/Interfaces

```typescript
type ResetFlow = "request" | "create" | "success";

type PasswordStrengthLevel = 0 | 1 | 2 | 3 | 4; // None, Weak, Fair, Good, Strong

type PasswordCheck = {
  label: string;
  met: boolean;
};
```

### Key UI Elements & Layout

- **2-Column Layout:**
  - **Left Card: Reset Request**
    - Mail icon
    - Title/subtitle
    - Email input
    - Send button
    - Success alert (green bg) shows after submit
    - Back to login link
  - **Right Card: New Password**
    - Lock icon
    - Title/subtitle
    - Password input + strength bar
    - Confirm password
    - 4-item checklist (dynamic styling)
    - Update button
    - Success state (animated checkmark, blue background)
    - Link back to login after success
- **Optional Lockout Banner:** Yellow alert at top

### Event Handlers & Methods

- `setResetSent()` - Toggle success state
- `setPasswordUpdated()` - Confirm password update
- Password strength calculation function
- Validation checks array

### State Management

```typescript
const [email, setEmail] = useState("");
const [resetSent, setResetSent] = useState(false);
const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [passwordUpdated, setPasswordUpdated] = useState(false);
```

### Estimated Complexity

**Medium** - Multi-step flow, password validation logic, strength calculation

---

## 14. PlaceholderPage

### Component Purpose & Key Features

- **Purpose:** Simple placeholder for routes under development
- **Key Features:**
  - Centered layout (60vh height)
  - Hammer icon in light circle
  - "Coming Soon" heading
  - Description text
  - Fade-in animation

### Data Structures/Interfaces

```typescript
// No data structures - static UI
```

### Key UI Elements & Layout

- **Centered Container:**
  - Icon circle (EFF5FF background, blue icon)
  - Title "Coming Soon" (Syne bold)
  - Description text (max-width: 400px)

### Event Handlers & Methods

- None

### State Management

- None

### Estimated Complexity

**Simple** - Static display component

---

## 15. PlansCatalog

### Component Purpose & Key Features

- **Purpose:** Membership plans showcase with filtering, pricing display, and add-ons
- **Key Features:**
  - Filter bar (sticky):
    - Duration selector (Monthly/Quarterly/Annual)
    - Access selector (Peak/Off-Peak/All Hours)
    - Branch dropdown
    - Search input
    - Clear filters button
  - Plans grid (3 columns):
    - **Basic Plan:** Off-peak only card
    - **Gold (Current):** Highlighted border + "Your Current Plan" badge
    - **Platinum (Recommended):** Purple theme with ribbon
    - Each card shows:
      - Plan name + duration badge
      - Price (Syne bold, large)
      - Access level badge
      - Feature checklist (✓/✗)
      - Purchase/Renew/Upgrade button
      - View Details link
  - Add-ons horizontal scroll section:
    - Min-width cards with icon, name, price
    - Add + button
  - Promo code input + Apply button

### Data Structures/Interfaces

```typescript
type Plan = {
  name: string;
  price: number;
  duration: "Monthly" | "Quarterly" | "Annual";
  access: "Peak" | "Off-Peak" | "All Hours";
  features: Array<{ name: string; included: boolean }>;
  cta: "Purchase" | "Renew" | "Upgrade";
  highlight?: boolean; // Current plan
  recommended?: boolean;
};

type FilterState = {
  duration: "Monthly" | "Quarterly" | "Annual";
  access: "Peak" | "Off-Peak" | "All Hours";
  branch: string;
  search: string;
};

type AddOn = {
  name: string;
  price: string; // "₹300/mo" or "₹500/day"
  icon: string; // emoji
};
```

### Key UI Elements & Layout

- **Filter Bar:** Sticky at top
  - 3-button group: Duration
  - 3-button group: Access
  - Dropdown: Branch
  - Search input (flex: 1)
  - Clear filters link
- **Plans Grid:** 3 columns
  - Each card has:
    - Header: Name + badge
    - Price (big Syne bold, blue)
    - Access badge (colored by type)
    - Divider line
    - Feature list (checkmarks/X for included/excluded)
    - CTA button (blue for basic, white for current, purple for recommended)
    - "View Details" link
  - Special styling:
    - Current: Blue border (2px), blue top bar
    - Recommended: Purple border, purple theme, rotating ribbon
- **Add-ons Section:**
  - Heading
  - Horizontal scrollable cards
  - Each: Icon, name, price, "Add +" button
- **Promo Code:** Text input + apply button, conditional success badge

### Event Handlers & Methods

- `setDuration()` - Filter by duration
- `setAccess()` - Filter by access
- `setPromoApplied()` - Toggle promo success state
- Filter logic

### State Management

```typescript
const [duration, setDuration] = useState("Monthly");
const [access, setAccess] = useState("All Hours");
const [promoApplied, setPromoApplied] = useState(false);
```

### Estimated Complexity

**Medium** - Filtering, grid layout, feature lists, conditional styling

---

## REPLICATION ROADMAP FOR ANGULAR

### High Priority (Complex, High-Value)

1. ✅ **ManagerDashboard** - Core metric display
2. ✅ **ClassSchedulePage** - Calendar system
3. ✅ **ClassBooking** - Member-facing feature
4. ✅ **TrainerProfile** - Booking system integration
5. ✅ **DunningQueuePage** - Financial management

### Medium Priority (Standard CRUD/Display)

6. ✅ **NotificationsCenter** - System integration
7. ✅ **Checkout** - Payment flow
8. ✅ **AuditLogViewer** - Compliance
9. ✅ **DataImportExport** - Bulk operations
10. ✅ **HealthForms** - Form handling

### Lower Priority (Simple/Utility)

11. ✅ **ErrorStatesView** - UI patterns (reference)
12. ✅ **GlobalError** - Error boundary
13. ✅ **ForgotPasswordPage** - Auth flow
14. ✅ **PlansCatalog** - Product display
15. ✅ **PlaceholderPage** - Placeholder only

---

## COMMON PATTERNS TO REPLICATE

### State Management

- **useState** → **Component Properties + NgModel/FormControl**
- **React Context** (if needed) → **NgRx Store or Service-based state**
- **Local state** → **Component class properties**

### Animations

- **CSS animations** (`animate-in`, `fade-in`, `slide-in`) → **Angular animations** (@angular/animations)
- **Tailwind classes** → **CSS or Angular animation triggers**
- **Transitions** → **ngIf with animations**

### UI Library Replacements

- **lucide-react** icons → **Angular Material Icons** or **Font Awesome**
- **recharts** → **ng-echarts** or **Angular Charts library**
- **React Router** → **Angular Router**

### Form Handling

- **React form hooks** → **Reactive Forms (FormBuilder)**
- **Controlled inputs** → **FormControl bindings**
- **Validation** → **Validators from @angular/forms**

### Layout & Styling

- **Tailwind classes** → Keep as-is (Tailwind works with Angular)
- **CSS Grid/Flexbox** → Replicate in component templates
- **Responsive classes** → Keep Tailwind responsive prefixes

### Key Tech Decisions for Angular

- Use **Reactive Forms** for complex forms (HealthForms, Checkout)
- Use **@angular/animations** for entrance/exit animations
- Consider **ng-dynamic-component** for highly dynamic sections
- Use **services** for API calls and data management
- Use **RxJS** observables for async operations
- Use **change detection: OnPush** for performance

---

## COMPONENT DEPENDENCY MAP

```
ManagerDashboard
  ├─ recharts (Area/Bar charts)
  └─ lucide-react (icons)

ClassSchedulePage
  ├─ Positioning logic (CSS)
  ├─ Calendar math
  └─ lucide-react (icons)

ClassBooking
  ├─ Filtering logic
  ├─ Progress calculations
  └─ lucide-react (icons)

HealthForms
  ├─ Form validation
  ├─ Signature capture
  └─ lucide-react (icons)

TrainerProfile
  ├─ Date/time selection
  ├─ Calendar logic
  └─ lucide-react (icons)

NotificationsCenter
  ├─ Category filtering
  ├─ Animations
  └─ lucide-react (icons)

Checkout
  ├─ Form switching
  ├─ Payment validation
  └─ lucide-react (icons)

DataImportExport
  ├─ File handling
  ├─ Drag-drop
  ├─ Validation UI
  └─ lucide-react (icons)

AuditLogViewer
  ├─ Advanced filtering
  ├─ Diff rendering
  └─ lucide-react (icons)

DunningQueuePage
  ├─ Tabbed filtering
  ├─ Modal management
  └─ lucide-react (icons)

ErrorStatesView
  └─ lucide-react (icons)

GlobalError
  └─ lucide-react (icons)

ForgotPasswordPage
  ├─ Password validation
  ├─ Password strength
  └─ lucide-react (icons)

PlaceholderPage
  └─ lucide-react (icons)

PlansCatalog
  ├─ Filtering
  ├─ Feature comparison
  └─ lucide-react (icons)
```

---

## NOTES FOR ANGULAR IMPLEMENTATION

1. **Chart Library:** Replace recharts with ng-echarts, ngx-charts, or Angular Charts
2. **Icons:** Use Angular Material Icons or ngx-bootstrap icons
3. **Animations:** Use `@angular/animations` with triggers and transitions
4. **Forms:** Use Reactive Forms with FormBuilder and FormGroup
5. **Routing:** Implement routing with Angular Router; side panels can use modal services
6. **HTTP:** Use HttpClient with interceptors for API calls
7. **State:** Use Services with BehaviorSubject or NgRx for complex state
8. **Styling:** Maintain Tailwind CSS; no need to convert
9. **Modals/Drawers:** Use Angular Material Dialog or ng-bootstrap Modal
10. **Drag-and-drop:** Use @angular/cdk/drag-drop or ngx-sortable

---

**Document Generated:** May 5, 2026  
**Analysis Confidence:** High (100% of components reviewed)  
**Ready for Angular Implementation:** Yes
