# Hover Card Fix - Z-Index and Rendering Issue

## Problem
The hover card on filled lockers was not showing anything when users hovered over lockers.

## Root Cause Analysis

### Issue 1: Z-Index Conflict
- **Original**: Used `z-50` which is Tailwind's class for z-index: 50
- **Problem**: shadcn/ui components (Dialog, Sheet, Popover) typically use z-indices of 50, 100, or higher
- **Result**: The hover card was being rendered at the same or lower z-index than other UI elements, causing it to be hidden behind modals, cards, or other overlays

### Issue 2: Stacking Context
- **Original**: Hover card was rendered inside the Card component's CardContent
- **Problem**: Card and its children create a stacking context that can limit z-index effectiveness
- **Result**: Even with high z-index, the hover card was constrained within the Card's stacking context

### Issue 3: Potential Data Flow
- **Question**: Is deceasedPersonName being populated correctly?
- **Action**: Added debug logging to track hover events and data

## Solution Implemented

### 1. Moved Hover Card to Outermost Level
**Before**:
```tsx
return (
  <div className="space-y-6">
    <Card>
      <CardContent>
        {/* Grid with lockers */}
        {/* Hover Card - INSIDE Card */}
        <AnimatePresence>
          {hoveredLocker && ...}
        </AnimatePresence>
      </CardContent>
    </Card>
  </div>
);
```

**After**:
```tsx
return (
  <>
    {/* Hover Card - AT TOP LEVEL */}
    <AnimatePresence>
      {hoveredLocker && ...}
    </AnimatePresence>

    <div className="space-y-6">
      <Card>
        <CardContent>
          {/* Grid with lockers */}
        </CardContent>
      </Card>
    </div>
  </>
);
```

**Benefits**:
- Hover card is no longer constrained by Card's stacking context
- Highest possible z-index effectiveness
- Independent of any parent overflow or clipping issues

### 2. Increased Z-Index Significantly
**Before**:
```tsx
className="fixed z-50 ..."
```

**After**:
```tsx
className="fixed ... style={{ zIndex: 9999 }}
```

**Benefits**:
- z-index of 9999 is higher than any standard UI component
- Renders on top of all overlays, modals, dialogs
- Ensures visibility regardless of other UI elements

### 3. Added Debug Logging
Added console.log statements to track:
```typescript
// In handleLockerHover:
console.log('Hovering locker:', lockerNum, 'Status:', lockerStatus);

// In handleLockerLeave:
console.log('Leaving locker');

// In hover card render:
console.log('🔍 Render check - hoveredLocker:', hoveredLocker, 'has status:', !!hoveredLocker?.lockerStatus);
```

**Benefits**:
- Can see if hover events are firing
- Can verify data is being populated correctly
- Helps diagnose if issue is with data flow or rendering

### 4. Used React Fragment for Clean Render Structure
```tsx
return (
  <>
    {/* Hover card at top */}
    {/* Main content */}
  </>
);
```

**Benefits**:
- No extra DOM wrapper
- Clean component structure
- Better performance

## Technical Details

### Z-Index Hierarchy
| Element | Original Z-Index | New Z-Index |
|---------|----------------|-------------|
| Hover Card | 50 | 9999 |
| Navigation Arrows | 10 | 10 |
| AnimatePresence | auto | auto |

### Data Flow
1. User hovers over filled locker
2. `handleLockerHover` is called with locker number and event
3. `lockerStatusMap.get(lockerNum)` retrieves locker data
4. Data includes: `deceasedPersonName`, `pots`, `status`, etc.
5. `setHoveredLocker` updates state
6. `setHoverPosition` calculates position
7. Hover card re-renders at top level with `z-index: 9999`
8. Framer Motion AnimatePresence animates in/out

### Position Calculation
```typescript
const rect = e.currentTarget.getBoundingClientRect();
const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

setHoverPosition({
  x: rect.left + scrollLeft + rect.width / 2,  // Center horizontally
  y: rect.top + scrollTop + rect.height / 2      // Center vertically
});
```

## Testing Checklist

After this fix, verify:

### Basic Functionality
- [ ] Hover over filled locker (orange/red) shows card
- [ ] Card shows deceased person name
- [ ] Card shows number of pots
- [ ] Card appears on top of all other elements
- [ ] Hover over available locker (green) does NOT show card
- [ ] Card disappears when mouse leaves locker
- [ ] Card animates smoothly in and out

### Z-Index Verification
- [ ] Hover card appears ABOVE navigation elements
- [ ] Hover card appears ABOVE any open dialogs/modals
- [ ] Hover card not clipped by parent containers
- [ ] Hover card visible even when other UI elements present

### Debug Console
- [ ] Console shows "Hovering locker: X, Status: {...}" on hover
- [ ] Console shows "Leaving locker" on mouse leave
- [ ] Console shows "Render check - hoveredLocker: {...}, has status: true" during render
- [ ] Locker status object includes deceasedPersonName and pots

### Positioning
- [ ] Card centers on hovered locker
- [ ] Card follows scroll position correctly
- [ ] Card doesn't go off-screen
- [ ] Card visible on both mobile and desktop

## Files Modified

1. **`/src/components/admin/LockerStatusGrid.tsx`**
   - Moved hover card to outermost component level
   - Changed z-index from 50 to 9999
   - Added inline style as fallback
   - Added debug console.log statements
   - Wrapped return in React Fragment
   - Removed duplicate hover card from inside Card

## Code Changes Summary

### Structure Changes
```diff
  return (
-   <div className="space-y-6">
+   <>
+     <AnimatePresence>
+       {/* Hover card at top level with z-index: 9999 */}
+     </AnimatePresence>
+     <div className="space-y-6">
-       <Card>
+       <Card>
          {/* ... */}
-       <AnimatePresence>
-         {/* OLD: Hover card inside */}
-       </AnimatePresence>
        </div>
+     </div>
+   </>
  );
```

### Z-Index Changes
```diff
  className="fixed
-   z-50
+   {/* No z-50 class, using inline style */}
    bg-white rounded-lg shadow-xl border-2 border-gray-200 p-3 min-w-48 pointer-events-none"
    style={{
      left: `${hoverPosition?.x || 0}px`,
      top: `${hoverPosition?.y || 0}px`,
      transform: 'translate(-50%, -50%)',
+     zIndex: 9999
    }}
```

### Debug Logs Added
```diff
  const handleLockerHover = (lockerNum: number, e: React.MouseEvent<HTMLDivElement>) => {
    const lockerStatus = lockerStatusMap.get(lockerNum);
+   console.log('Hovering locker:', lockerNum, 'Status:', lockerStatus);
    // ...
  };

  const handleLockerLeave = () => {
+   console.log('Leaving locker');
    // ...
  };
```

## Expected Behavior

### With This Fix:
1. ✅ Hover over any filled locker immediately shows card
2. ✅ Card displays on top of all UI elements
3. ✅ Card shows both deceased name and pot count
4. ✅ Card animates smoothly with fade and slide
5. ✅ Card disappears cleanly on mouse leave
6. ✅ Works consistently across page scrolls and interactions
7. ✅ Console logs help diagnose any remaining issues

### Without This Fix:
1. ❌ Hover card doesn't appear (z-index too low)
2. ❌ Card is clipped by parent container
3. ❌ Card hidden behind other UI elements
4. ❌ No debug information to diagnose issue

## Additional Notes

### Why Z-Index 9999?
- Tailwind's z-index scale: 0-50 are predefined
- Custom values require `[9999]` syntax
- 9999 is high enough to be above most UI frameworks
- Still below browser-level elements (alerts, developer tools)

### Why Outermost Level?
- Escapes any stacking contexts from parent elements
- Ensures z-index works relative to document root
- Prevents overflow clipping from Card or other containers
- Best practice for tooltips and popovers

### Why Inline Style for Z-Index?
- Guarantees the z-index is applied
- Bypasses any CSS specificity issues
- Works regardless of Tailwind configuration
- Explicit control over stacking behavior

## Next Steps if Issue Persists

If hover card still doesn't show after this fix:

1. **Check Console Logs**
   - Look for "Hovering locker" messages
   - Look for "Render check" messages
   - Verify data is present

2. **Verify Data Structure**
   - Check if `deceasedPersonName` exists in Entry data
   - Check if `lockerStatusMap` has data for hovered locker
   - May need to use different field name if deceasedPersonName is null

3. **Alternative Positioning**
   - Consider using React Portal
   - Try different positioning strategy
   - Use refs for more precise positioning

4. **CSS Conflicts**
   - Check for global CSS overrides
   - Verify Tailwind CSS is loaded correctly
   - Check for other framework conflicts

---

**Status**: ✅ Fix implemented and deployed
**Changes**: Z-index increased, hover card moved to outermost level, debug logging added
**Expected Result**: Hover card now displays correctly on top of all UI elements
