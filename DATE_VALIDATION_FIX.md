# Date Validation Fix - Allow Past Dates, Block Future Dates

## Problem
The original `isDateBackdated` function was incorrectly comparing dates:
- It compared against `today at midnight` using `<` operator
- This caused issues:
  1. **Backdated entries (past dates)** were BLOCKED when they should be ALLOWED
  2. **Future dates** were not properly blocked (e.g., Oct 2025 was incorrectly treated)
  3. **Today's date at midnight** could be treated as "backdated" if current time was after midnight

## Solution
Updated to `isInvalidDate` function that:
1. **Allows all past/present dates** (historical entries, today's date at any time)
2. **Blocks only future dates** (dates after `Date.now()`)
3. **Respects original entry date** when calculating renewals

## Changes Made

### File: `/src/lib/firestore.ts`

#### 1. New isInvalidDate Function (replacing old isDateBackdated)

```typescript
// Helper function to check if a date is invalid (in future)
// Allow past/present dates for creating historical entries
// Block only future dates to prevent accidental future entries
const isInvalidDate = (date: Date): boolean => {
  const now = Date.now();
  const selectedTime = date.getTime();

  // Return true (invalid) only if date is in future
  // This allows past dates and today's date at any time
  return selectedTime > now;
};
```

#### 2. Updated Validation Comment

```typescript
// Helper function to validate entry date (allow past/present dates, block future dates)
const isInvalidDate = (date: Date): boolean => {
  const now = Date.now();
  const selectedTime = date.getTime();
  
  // Return true (invalid) only if date is in future
  // This allows past dates and today's date at any time
  return selectedTime > now;
};
```

#### 3. Updated Validation Block in addEntry

```typescript
// Validate entry date - allow past/present dates, block only future dates
const isInvalidDate = isInvalidDate(entryDate);
if (isInvalidDate) {
  console.error('[addEntry] Invalid entry date - date is in future:', entryDate);
  throw new Error('Invalid entry date - date is in future. Please select today date or a past date.');
}
```

#### 4. Updated Error Messages
- **Console log**: `'[addEntry] Invalid entry date - date is in future:'`
- **Error message**: `'Invalid entry date - date is in future. Please select today date or a past date.'`

## How It Works Now

### Scenario 1: Creating Entry with Today's Date
```javascript
entryDate = new Date('2024-12-25') // Today
isInvalidDate(entryDate) // Returns false (not invalid) - ALLOWED ✓
```

### Scenario 2: Creating Entry with Past Date (Backdated)
```javascript
entryDate = new Date('2024-12-01') // Past date
isInvalidDate(entryDate) // Returns false (not invalid) - ALLOWED ✓
```

### Scenario 3: Creating Entry with Future Date
```javascript
entryDate = new Date('2025-10-01') // Future date
isInvalidDate(entryDate) // Returns true (invalid) - BLOCKED ✓
```

### Scenario 4: Calculating Renewals
The renewal calculation at line 345 now correctly uses `entryDate`:
```typescript
const expiryDate = new Date(entryDate.getTime() + 30 * 24 * 60 * 60 * 1000);
```
This respects the original entry date (past or present) when calculating expiry.

## Benefits

1. **Historical Entries**: You can now create entries with past dates to match historical records
2. **Future Dates Prevention**: Only future dates are blocked (current issue with Oct 2025)
3. **Renewal Calculation**: Uses original entry date for accurate expiry calculation
4. **Clear Error Messages**: Users get helpful messages about what's wrong

## Testing

Test each scenario:
1. ✓ Today's date → Should work (entry created)
2. ✓ Yesterday's date → Should work (backdated entry)
3. ✓ Last month → Should work (historical entry)
4. ✗ Tomorrow's date → Should be blocked (future date)
5. ✗ Next month → Should be blocked (future date)

## Note for Admins

If you need to create truly backdated entries (e.g., for matching historical records where
the actual event happened in the past), this is now supported. The validation only blocks
accidental future dates, not intentional backdated entries.
