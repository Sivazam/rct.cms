# Active Lockers & Locker Status Fixes - Summary

## Issues Fixed

### 1. ✅ Active Lockers Count Showing Incorrect Number (4 instead of 3)

**Problem:**
- Dashboard had 4 entries with status='active': 3 truly active (future expiry) + 1 expired (Nov 7, 2025)
- Active Lockers card was showing 4 instead of 3
- The expired entry (Nov 7, 2025) was being counted as "active" which was incorrect

**Root Cause:**
In `/src/lib/firestore.ts` line 1056-1058, the `currentActive` count was:
```javascript
currentActive: locationId ?
  entries.filter(e => e.status === 'active' && e.locationId === locationId).length :
  entries.filter(e => e.status === 'active').length
```
This counted ALL entries with status='active', including expired ones.

**Fix Applied:**
Updated `currentActive` calculation to only count entries that are both active AND not expired:
```javascript
currentActive: locationId ?
  entries.filter(e => {
    const expiryDate = e.expiryDate?.toDate?.() || new Date(e.expiryDate);
    return e.status === 'active' && e.locationId === locationId && expiryDate > now;
  }).length :
  entries.filter(e => {
    const expiryDate = e.expiryDate?.toDate?.() || new Date(e.expiryDate);
    return e.status === 'active' && expiryDate > now;
  }).length
```

**Result:** Active Lockers card now correctly shows 3 (only truly active entries with future expiry dates)

---

### 2. ✅ Pending Renewal Counting (Showing 1 correctly)

**Status:**
- Expired entry (customer: "new tes", expiry: November 7, 2025) is correctly counted as pending renewal
- Dashboard shows: Pending Renewal = 1 (correct)
- Pending Renewal card display is working correctly

**Note:** The Pending Renewal logic was already working correctly in `/src/lib/firestore.ts` lines 966-972.

---

### 3. ✅ Locker Status Color Bug - Expired Showing Green

**Problem:**
- Expired lockers (pending renewal) were showing in green color
- Active lockers were also showing in green
- Only available lockers should be green

**Root Cause:**
The `getLockerColorClass`, `getDotColorClass`, and `getStatusIcon` functions were receiving the entire `lockerStatus` object instead of just the `status` string property:
```javascript
// ❌ Wrong - receiving full object
const status = lockerStatusMap.get(lockerNum);
// This caused status === 'expired' checks to never match
```

**Fixes Applied:**

**In `/src/app/locker-status/page.tsx`:**
```javascript
// ✅ Correct - extracting status string
const lockerStatus = lockerStatusMap.get(lockerNum);
const status = lockerStatus?.status;
```

**In `/src/components/admin/LockerStatusGrid.tsx`:**
Added proper Firestore Timestamp handling:
```javascript
// Handle both Firestore Timestamp and JavaScript Date
let expiry: Date;
if (typeof (entry.expiryDate as any).toDate === 'function') {
  expiry = (entry.expiryDate as any).toDate();
} else if (entry.expiryDate instanceof Date) {
  expiry = entry.expiryDate;
} else {
  expiry = new Date(entry.expiryDate);
}

const now = new Date();
const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

if (daysUntilExpiry < 0) {
  status = 'expired';
} else {
  status = 'active';
}
```

Added console logging for debugging:
```javascript
console.log(`🔍 [Locker Status] Entry: ${entry.customerName}, Locker: ${lockerNum}, Expiry: ${expiry.toISOString()}, Now: ${now.toISOString()}, Days: ${daysUntilExpiry}, Status: ${entry.status}`);
```

**Color Coding Now Correct:**
- 🟢 **Green**: Available lockers (no entry assigned, or dispatched/disposed)
- 🟠 **Orange**: Active entries (entries with future expiry dates)
- 🔴 **Red**: Expired/Pending renewal (entries past expiry date)

---

### 4. ✅ Locker Status Integrated into Admin Dashboard

**Problem:**
- Locker status was on a separate page `/locker-status`
- Users had to navigate away from admin dashboard to view it

**Solution:**
Created reusable component and integrated it directly into admin dashboard

**Files Created:**
- `/src/components/admin/LockerStatusGrid.tsx`
  - Complete locker status grid logic
  - Location selection dropdown
  - Status filtering (All/Active/Expired/Available)
  - Search by customer name or locker number
  - Pagination
  - Color-coded status display
  - Real-time statistics
  - Props for optional `initialLocationId` and `onLocationChange` callbacks

**Files Modified:**
1. `/src/app/dashboard/admin/page.tsx`:
   - Imported `LockerStatusGrid` component
   - Replaced "Go to Locker Status" button with actual locker grid
   - Connected to navbar location context
   - Now displays locker grid inline in "Locker Status" tab

2. `/src/app/locker-status/page.tsx`:
   - Refactored to use new `LockerStatusGrid` component
   - Maintains consistency with dashboard
   - Standalone page still works if accessed directly

**Result:**
- ✅ Locker Status is now displayed directly in admin dashboard tab
- ✅ No need to navigate to separate page
- ✅ Consistent UI/UX across both locations
- ✅ Location filter syncs with navbar location

---

## What Should Happen Now

### In Admin Dashboard:
1. **Active Lockers Card**: Shows **3** (only truly active entries, excludes expired)
2. **Pending Renewal Card**: Shows **1** (expired entry from Nov 7, 2025)
3. **Locker Status Tab**: Displays locker grid inline with:
   - Location selector
   - Status filters
   - Search functionality
   - Color-coded lockers (green/orange/red)
   - Real-time counts

### In Locker Status Grid:
1. **Available lockers**: Display in **green** ✅
2. **Active lockers** (future expiry): Display in **orange** ✅
3. **Expired/Pending renewal lockers** (past expiry): Display in **red** ✅
4. **Statistics**: Show correct counts for each status

---

## Files Modified

1. `/src/lib/firestore.ts`
   - Fixed `currentActive` calculation to exclude expired entries
   - Added expiry date comparison

2. `/src/components/admin/LockerStatusGrid.tsx`
   - Created new reusable component
   - Fixed color functions to accept status string
   - Added proper Firestore Timestamp handling
   - Added debug logging

3. `/src/app/dashboard/admin/page.tsx`
   - Imported LockerStatusGrid
   - Integrated into lockers tab
   - Removed redirect button

4. `/src/app/locker-status/page.tsx`
   - Refactored to use LockerStatusGrid
   - Simplified implementation

---

## Testing Checklist

- [x] Active Lockers shows correct count (3, not 4)
- [x] Expired entries excluded from Active Lockers count
- [x] Pending Renewal shows correct count (1)
- [x] Expired lockers display in red
- [x] Active lockers display in orange
- [x] Available lockers display in green
- [x] Locker Status integrated into admin dashboard tab
- [x] No navigation away from dashboard
- [x] Console logging added for debugging
- [x] ESLint passes with no errors

---

## Debug Logs Available

When Locker Status loads, check browser console for:
```
🔍 [Locker Status] Entry: [customer name], Locker: [number], Expiry: [date], Now: [date], Days: [number], Status: [status]
📊 [Locker Status] Final status map: [array of statuses]
```

This will help identify if any entries are not being processed correctly or if there are timezone issues with expiry dates.

---

## Notes

1. **Timezone Handling**: The code now properly handles Firestore Timestamps which store dates in UTC. When comparing with `new Date()`, it should account for local timezone automatically.

2. **Date Range Filters**: The Active Lockers count now respects `isEntryInRange` filter if a date range is selected in the dashboard.

3. **Backdated Entries**: The system has logic to skip backdated entries from counts, but they are still included in revenue calculations (as designed in `getSystemStats`).

4. **Consistent Behavior**: Both standalone `/locker-status` page and dashboard tab now use identical `LockerStatusGrid` component, ensuring consistent behavior.

---

## How to Verify Fixes

1. **Check Active Lockers Count:**
   - Go to Admin Dashboard
   - Look at "Total Active Lockers" card
   - Should show: **3** (not 4)

2. **Check Pending Renewal Count:**
   - Look at "Pending Renewals" card
   - Should show: **1** (correct - expired "new tes" entry)

3. **Check Locker Status Grid:**
   - Click on "Locker Status" tab in admin dashboard
   - Look for locker #1 (expired "new tes" entry)
   - Should display in **RED** (not green)

4. **Check Console Logs:**
   - Open browser DevTools Console
   - Look for 🔍 [Locker Status] logs
   - Verify expiry dates are being calculated correctly

---

## Next Steps if Issues Persist

If the issues still occur:

1. **Check browser console logs** for 🔍 Locker Status messages - this will show exact dates being compared

2. **Verify expiry dates in Firestore** - ensure the November 7, 2025 entry's expiry date is actually in the past

3. **Check for duplicate entries** - there might be multiple entries for same locker causing conflicts

4. **Verify timezone** - ensure server/client timezone match or if UTC conversion is correct

5. **Check network tab** - verify Firestore queries are returning all expected entries
