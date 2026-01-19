# RCT CMS - Project Analysis and Understanding

## Application Overview
**Project Name**: RCT CMS (Cremation Management System)
**Type**: Full-stack web application for managing crematorium operations
**Framework**: Next.js 15 with TypeScript and App Router
**Deployment**: Custom server with Socket.IO support on port 3000

---

## Technology Stack

### Core Framework
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **React 19** - latest version

### Database & Backend
- **Firebase Firestore** - Primary database for all app data
- **Firebase Authentication** - User authentication
- **Firebase Functions** - Backend cloud functions
- **Prisma/SQLite** - Local database (minimal usage)

### UI & Styling
- **Tailwind CSS 4** - Styling framework
- **shadcn/ui** - Complete UI component library
- **Radix UI** - Headless component primitives
- **Framer Motion** - Animations and transitions
- **Lucide React** - Icons
- **Material UI (MUI)** - Some components (date pickers, data grid)

### State Management & Data
- **Zustand** - Client state management
- **TanStack Query** - Server state and data fetching
- **React Context API** - Auth and Location contexts

### Other Libraries
- **React Hook Form** - Form handling with Zod validation
- **Socket.IO** - Real-time communication
- **NextAuth.js** - Authentication wrapper
- **Axios** - HTTP client
- **date-fns** - Date utilities

---

## Database Structure (Firebase Firestore)

### Collections

#### 1. `locations`
Stores crematorium locations/venues.
```typescript
{
  id: string,
  venueName: string,
  address: string,
  contactNumber?: string,
  numberOfLockers?: number,
  isActive: boolean,
  createdAt: Timestamp,
  createdBy: string
}
```

#### 2. `users`
System users (admin and operators).
```typescript
{
  id: string,
  email: string,
  name: string,
  role: 'admin' | 'operator',
  isActive: boolean,
  isRejected?: boolean,
  locationIds?: string[], // For operators
  rejectionReason?: string,
  approvedBy?: string,
  approvedAt?: Timestamp,
  lastLogin?: Timestamp,
  createdAt: Timestamp
}
```

#### 3. `entries`
Customer entries for cremation services.
```typescript
{
  id: string,
  customerId: string,
  customerName: string,
  customerMobile: string,
  customerCity?: string,
  deceasedPersonName?: string,
  totalPots: number,
  locationId: string,
  operatorId: string,
  paymentMethod: 'cash' | 'upi',
  entryDate: Date,
  expiryDate: Date,
  status: 'active' | 'dispatched' | 'disposed',
  payments: Array<{
    amount: number,
    date: Date,
    type: 'entry' | 'renewal',
    method: 'cash' | 'upi',
    months: number,
    lockerCount: number,
    description: string
  }>,
  renewals: Array<{
    date: Date,
    newExpiryDate: Date,
    months: number,
    amount: number
  }>,
  lockerDetails: Array<{
    lockerNumber: number,
    totalPots: number,
    remainingPots: number,
    dispatchedPots: string[]
  }>,
  locationName: string,
  createdAt: Timestamp
}
```

#### 4. `customers`
Customer database.
```typescript
{
  id: string,
  name: string,
  mobile: string,
  city: string,
  additionalDetails?: string,
  locationId: string,
  createdAt: Timestamp
}
```

#### 5. `smsLogs` (likely)
SMS notification logs.

---

## Application Structure

### Main Pages

1. **`/`** - Home page (redirects based on auth)
2. **`/login`** - Login page
3. **`/signup`** - Operator signup
4. **`/forgot-password`** - Password recovery
5. **`/dashboard`** - Main operator dashboard
6. **`/dashboard/admin`** - Admin dashboard
7. **`/dashboard/operator`** - Operator dashboard
8. **`/locker-status`** - Locker status screen (standalone page)
9. **`/pending-approval`** - For operators waiting for approval
10. **`/unauthorized`** - Unauthorized access page

### Key Components

#### Admin Dashboard Components
- **LocationManagement** - Add/edit/remove locations
- **OperatorManagement** - Approve/reject operators, assign locations
- **OperatorPerformance** - View operator statistics
- **SMSLogsTable** - View SMS notification logs
- **AdminSettings** - System settings
- **AdminMobileTest** - Test mobile-specific features
- **LockerStatusGrid** - View all lockers with status

#### Entry Management
- **CustomerEntrySystem** - Create new customer entries
- **BulkEntryUpload** - Bulk upload entries from CSV/Excel
- **CustomerSearch** - Search existing customers
- **NewCustomerModal** - Create new customer
- **EntryConfirmation** - Confirm entry details
- **EntriesList** - List all entries

#### Renewal Management
- **RenewalSystem** - Main renewal interface
- **RenewalSearch** - Search entries for renewal
- **RenewalForm** - Renewal form
- **RenewalConfirmation** - Confirm renewal
- **RenewalOTP** - OTP verification for renewals
- **RenewalsList** - List all renewals

#### Delivery Management
- **DeliverySystem** - Main delivery interface
- **DeliverySearch** - Search entries for delivery
- **DeliveryOTP** - OTP verification for delivery
- **DeliveryPayment** - Record delivery payment
- **DeliveryHistory** - Delivery history

#### Dispatch Management
- **PartialDispatchDialog** - Dispatch individual pots from locker

#### Dashboard Components
- **UnifiedDispatchList** - Unified view of all dispatches
- **InteractiveEntriesList** - Interactive entry list
- **RecentActivity** - Recent activity feed

#### UI Components
- Complete shadcn/ui library (40+ components)
- Custom components: DateTimeBar, ThemeToggle, Spiritual components
- Responsive components for mobile/desktop

---

## Key Features

### Authentication & Authorization
- Firebase Authentication with email/password
- Role-based access (admin vs operator)
- Operator approval workflow
- Session management via NextAuth

### Locker Management
- Visual locker grid with status indicators
- Status types: Available (green), Active (orange), Expired (red), Dispatched
- Filter by status, search by customer name or locker number
- Pagination (100 lockers per page)
- Location-based locker management

### Entry Management
- Create new customer entries
- Assign lockers automatically or manually
- Track pots per locker
- Payment tracking (cash/UPI)
- Bulk upload support

### Renewal System
- Renew expired or expiring entries
- OTP verification for security
- Payment tracking
- Auto-calculate new expiry dates

### Delivery & Dispatch System
- Dispatch pots from lockers
- Track remaining vs dispatched pots
- Partial dispatch support
- OTP verification
- Payment tracking

### Dashboard & Analytics
- Real-time statistics
- Revenue tracking
- Expiring entries alerts
- Recent activity feed
- Date range filtering
- Location-based filtering

### SMS Integration
- SMS notifications for entries, renewals, deliveries
- SMS logging and templates
- Fast2SMS integration

---

## Locker Status Screen - Detailed Analysis

### File: `/src/components/admin/LockerStatusGrid.tsx`

### Current Functionality
1. **Location Selection**: Dropdown to select specific location or view all
2. **Status Filter**: Filter by Available, Active, Expired, or All
3. **Search**: Search by customer name or locker number
4. **Pagination**: 100 lockers per page with Previous/Next buttons
5. **Visual Grid**: Responsive grid showing locker status with colors
6. **Statistics Cards**: Show counts of available, active, expired, total lockers
7. **Color Coding**:
   - Green: Available locker
   - Orange: Active entry
   - Red: Expired entry

### Current Data Flow
1. `useEffect` calls `fetchData()` when `selectedLocationId` changes
2. `fetchData()` fetches locations and entries from Firestore
3. Another `useEffect` builds `lockerStatusMap` from entries and selected location
4. Lockers are filtered, searched, and paginated
5. Grid displays paginated lockers

### Identified Issues

#### 1. Lockers Not Loading When Switching Locations
**Symptom**: Sometimes when switching locations, lockers are not visible until page refresh

**Root Cause**:
- Race condition possibility when `entries` state updates
- The `lockerStatusMap` depends on both `entries` and `selectedLocationId`
- When location changes, `fetchData()` is called which sets `loading=true`
- However, the `lockerStatusMap` useEffect might run before entries are fully loaded
- No loading state handling for the grid itself

**Potential Fix**:
- Add loading state for the grid specifically
- Clear `lockerStatusMap` when location starts changing
- Ensure `entries` are fully loaded before updating the locker status map

#### 2. Missing Swipe Gesture Support
**Status**: Not implemented

**Required**: Swipe LEFT = PREVIOUS page, Swipe RIGHT = NEXT page
**Behavior**: Should trigger same action as Previous/Next buttons (page change, 100 lockers per page)

#### 3. Missing Desktop Arrow Navigation
**Status**: Not implemented

**Required**: Small navigation arrows on left/right sides of the locker grid
**Position**: Left and right side of the grid
**Size**: Small, non-overlapping
**Behavior**: Same as Previous/Next buttons

#### 4. Missing Hover Card for Filled Lockers
**Status**: Not implemented

**Required**: When hovering on a filled locker (active or expired), show hover card with:
- Deceased person name
- Number of pots

**Current Hover Behavior**:
- Available lockers: `hover:scale-105 cursor-default`
- Filled lockers: `hover:scale-105 hover:shadow-md cursor-pointer`

**Implementation**: Need to add a hover card/tooltip component that shows the additional info

---

## Entry Creation Flow

### Single Entry
1. Operator searches for customer by mobile number
2. If customer exists, select customer
3. If not, create new customer
4. Select location (pre-selected based on operator's assigned location)
5. Enter details:
   - Deceased person name
   - Number of pots
   - Locker number (optional, auto-assigned if not specified)
   - Payment method (cash/UPI)
6. System validates:
   - Locker availability
   - Locker number range
7. Calculate entry fee (₹500 fixed per entry)
8. Create entry with:
   - Entry date (today by default)
   - Expiry date (30 days from entry)
   - Status: 'active'
   - Payment record
   - Locker details with total/remaining pots

### Bulk Entry
1. Upload CSV/Excel file with customer details
2. Validate data format
3. Process entries in batch
4. Assign lockers automatically
5. Create all entries in Firestore

---

## Updating Patterns (Renewals)

### Renewal Flow
1. Search for entry to renew
2. Verify entry is active or expired
3. Enter renewal details:
   - Number of months (1-12)
   - Payment amount (₹500 per month)
   - Payment method
4. Generate OTP and send to customer mobile
5. Verify OTP
6. Update entry:
   - New expiry date
   - Add renewal record
   - Add payment record
7. Send SMS confirmation

---

## Dispatch System

### Partial Dispatch
1. Open PartialDispatchDialog
2. Select pots to dispatch from locker
3. Enter payment amount
4. Update entry's `lockerDetails`:
   - Reduce `remainingPots`
   - Add to `dispatchedPots` array
5. Create unified dispatch record
6. Send SMS notification

### Full Dispatch
1. When all pots are dispatched from a locker
2. Entry status changes to 'dispatched'
3. Locker becomes available again

---

## SMS Integration

### Triggers
- New entry created
- Entry renewed
- Pot(s) dispatched
- Delivery scheduled/completed
- Operator approval

### SMS Templates
- System supports multiple templates
- Template IDs mapped to different events
- Templates stored in Firebase or SMS service

---

## Key Questions for User

1. **Swipe Direction**: Confirmed - LEFT = PREVIOUS, RIGHT = NEXT (page-based, 100 lockers per page) ✓

2. **Desktop Arrows**: Confirmed - On left/right sides of the grid, small, non-overlapping ✓

3. **Hover Card Content**: Confirmed - Only show:
   - Deceased person name
   - Number of pots
   ✓

4. **Pagination**: Confirmed - 100 lockers per page, swipe triggers page change ✓

5. **Locker Loading Issue**: Confirmed - No errors, lockers just don't appear sometimes until refresh

---

## Next Steps - Planned Improvements

### 1. Fix Locker Loading Issue
- Add proper loading states
- Clear locker status when location changes
- Ensure entries are fully loaded before rendering grid

### 2. Add Swipe Gesture Support
- Implement touch event handlers
- Detect swipe direction
- Trigger page navigation
- Support both mobile and desktop

### 3. Add Desktop Arrow Navigation
- Add left arrow button on left side of grid
- Add right arrow button on right side of grid
- Style as small, non-overlapping
- Disable when at first/last page

### 4. Add Hover Card for Filled Lockers
- Implement hover card/tooltip
- Show deceased person name and pot count
- Style to be visible and non-intrusive
- Only show for filled lockers (active/expired)

---

## Firebase Configuration

**Project ID**: rctscm01
**Auth Domain**: rctscm01.firebaseapp.com
**Storage**: rctscm01.firebasestorage.app
**Functions Region**: us-central1

---

## Development Server

**Port**: 3000
**Entry Point**: server.ts
**Features**:
- Next.js App Router
- Socket.IO integration at `/api/socketio`
- Hot reloading with nodemon
- Custom HTTP server handling both Next.js and Socket.IO

---

## Notes

- The application is production-ready with comprehensive features
- Well-structured codebase with good separation of concerns
- Uses modern React patterns and hooks
- Fully responsive design
- Real-time features via Socket.IO
- Comprehensive error handling and validation
- SMS integration for notifications
- Role-based access control
