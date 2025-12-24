# Fix for Backdated Entry Date Issue

## Problem
Error message showed: "Wed Oct 01 2025 00:00:00 GMT+0530 (India Standard Time)"
This indicated wrong timezone offset (+0530 instead of +05:30) and potential date comparison issue.

## Root Cause
The `isDateBackdated` function was comparing selected date against `new Date()` (which includes current time).
When user selects "today's date at midnight" but system clock shows "current time" (e.g., 2 PM),
the comparison `date < today` would fail, incorrectly flagging as backdated.

Example:
- User selects: Wed Dec 25 2024 at 00:00:00 (midnight today)
- System time: Wed Dec 25 2024 at 14:00:00 (2 PM)
- Comparison: midnight < 2 PM = TRUE → Incorrectly flagged as backdated

## Solution

Updated `isDateBackdated` function to:
1. Calculate "end of yesterday" as yesterday at 23:59:59.999
2. Only block dates strictly before yesterday
3. Allow any date from today onwards (including today at midnight)

```typescript
const isDateBackdated = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to midnight today

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(23, 59, 59, 999); // End of yesterday

  // A date is backdated only if it's before end of yesterday (yesterday or earlier)
  // Today's date at any time is allowed, even at midnight
  return date.getTime() < yesterday.getTime();
};
```

## Files Modified
- `/src/lib/firestore.ts` - Updated `isDateBackdated` function and improved error message

## Testing
1. Try creating entry with today's date - should work
2. Try creating entry with yesterday's date - should be blocked
3. Try creating entry with tomorrow's date - should be blocked (future dates not allowed)

## Additional Notes
- The "GMT+0530" issue in error message might be a Date.toString() formatting quirk
- With the new logic, today's date at midnight will always be allowed regardless of current system time
