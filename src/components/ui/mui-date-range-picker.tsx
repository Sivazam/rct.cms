"use client"

import { useState } from "react"
import { DateRangePicker } from "@mui/x-date-pickers/DateRangePicker"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"

interface MUIDateRangePickerProps {
  onDateRangeChange: (range: { from: Date; to: Date } | undefined) => void
  placeholder?: string
  initialDateRange?: { from: Date; to: Date } | undefined
  className?: string
}

export function MUIDateRangePicker({
  onDateRangeChange,
  placeholder = "Select date range",
  initialDateRange,
  className
}: MUIDateRangePickerProps) {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>(
    initialDateRange ? [initialDateRange.from, initialDateRange.to] : [null, null]
  )

  // Safety check for onDateRangeChange
  const safeOnDateRangeChange = (range: { from: Date; to: Date } | undefined) => {
    try {
      if (typeof onDateRangeChange === 'function') {
        onDateRangeChange(range);
      } else {
        console.warn('MUIDateRangePicker: onDateRangeChange is not a function');
      }
    } catch (error) {
      console.error('MUIDateRangePicker: Error in onDateRangeChange:', error);
    }
  }

  const handleChange = (newRange: [Date | null, Date | null]) => {
    setDateRange(newRange)
    
    if (newRange[0] && newRange[1]) {
      const range = {
        from: new Date(newRange[0]),
        to: new Date(newRange[1])
      }
      safeOnDateRangeChange(range)
    } else if (newRange[0] === null && newRange[1] === null) {
      safeOnDateRangeChange(undefined)
    }
  }

  // Update internal state when initialDateRange changes
  useState(() => {
    if (initialDateRange) {
      setDateRange([initialDateRange.from, initialDateRange.to])
    } else {
      setDateRange([null, null])
    }
  })

  return (
    <div className={className}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DateRangePicker
          value={dateRange}
          onChange={handleChange}
          localeText={{ start: placeholder, end: "End date" }}
          slotProps={{
            textField: {
              size: "small",
              variant: "outlined",
              helperText: "Select a date range to filter data"
            }
          }}
        />
      </LocalizationProvider>
    </div>
  )
}