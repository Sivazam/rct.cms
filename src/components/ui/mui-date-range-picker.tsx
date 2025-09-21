"use client"

import { useState, useEffect } from "react"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { TextField, Stack } from "@mui/material"

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
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  // Update internal state when initialDateRange changes
  useEffect(() => {
    if (initialDateRange) {
      setStartDate(initialDateRange.from)
      setEndDate(initialDateRange.to)
    } else {
      setStartDate(null)
      setEndDate(null)
    }
  }, [initialDateRange])

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

  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date)
    if (date && endDate) {
      safeOnDateRangeChange({
        from: new Date(date),
        to: new Date(endDate)
      })
    }
  }

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date)
    if (startDate && date) {
      safeOnDateRangeChange({
        from: new Date(startDate),
        to: new Date(date)
      })
    }
  }

  return (
    <div className={className}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Stack direction="row" spacing={2}>
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={handleStartDateChange}
            slotProps={{
              textField: {
                size: "small",
                variant: "outlined",
                helperText: "Select start date"
              }
            }}
          />
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={handleEndDateChange}
            minDate={startDate || undefined}
            slotProps={{
              textField: {
                size: "small",
                variant: "outlined",
                helperText: "Select end date"
              }
            }}
          />
        </Stack>
      </LocalizationProvider>
    </div>
  )
}