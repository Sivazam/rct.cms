"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { CalendarIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface ResponsiveDateRangePickerProps {
  onDateRangeChange: (range: { from: Date; to: Date } | undefined) => void
  placeholder?: string
  initialDateRange?: { from: Date; to: Date } | undefined
  className?: string
}

export function ResponsiveDateRangePicker({
  onDateRangeChange,
  placeholder = "Select date range",
  initialDateRange,
  className
}: ResponsiveDateRangePickerProps) {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [isOpen, setIsOpen] = useState(false)

  // Initialize with initialDateRange
  useEffect(() => {
    if (initialDateRange) {
      setDateRange({
        from: initialDateRange.from,
        to: initialDateRange.to
      })
    }
  }, [initialDateRange])

  // Safety check for onDateRangeChange
  const safeOnDateRangeChange = (range: { from: Date; to: Date } | undefined) => {
    try {
      if (typeof onDateRangeChange === 'function') {
        onDateRangeChange(range);
      } else {
        console.warn('ResponsiveDateRangePicker: onDateRangeChange is not a function');
      }
    } catch (error) {
      console.error('ResponsiveDateRangePicker: Error in onDateRangeChange:', error);
    }
  }

  const handleDateSelect = (range: { from?: Date; to?: Date }) => {
    const newRange = {
      from: range.from,
      to: range.to
    }
    setDateRange(newRange)
    
    // Don't auto-close - let user continue selecting or click Done manually
    // Only apply the range change, don't close the popover
    if (newRange.from && newRange.to) {
      safeOnDateRangeChange({
        from: new Date(newRange.from),
        to: new Date(newRange.to)
      })
    }
  }

  const handleClear = () => {
    setDateRange({})
    safeOnDateRangeChange(undefined)
    setIsOpen(false)
  }

  const formatDateDisplay = () => {
    if (!dateRange.from && !dateRange.to) return placeholder
    
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, "MMM dd, yyyy")} - ${format(dateRange.to, "MMM dd, yyyy")}`
    }
    
    if (dateRange.from) {
      return `${format(dateRange.from, "MMM dd, yyyy")} - Select end date`
    }
    
    return `Select start date - ${format(dateRange.to!, "MMM dd, yyyy")}`
  }

  return (
    <div className={cn("w-full", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-10 sm:h-10",
              !dateRange.from && !dateRange.to && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate flex-1 min-w-0">
              {formatDateDisplay()}
            </span>
            {(dateRange.from || dateRange.to) && (
              <X 
                className="ml-2 h-4 w-4 flex-shrink-0" 
                onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                }}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
          <div className="p-3 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Select Date Range</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClear}
                className="h-6 px-2 text-xs"
              >
                Clear
              </Button>
            </div>
          </div>
          <div className="p-1">
            <Calendar
              mode="range"
              selected={{
                from: dateRange.from,
                to: dateRange.to
              }}
              onSelect={handleDateSelect}
              numberOfMonths={1} // Always show 1 month for better mobile compatibility
              className="rounded-md border w-full max-w-[280px] sm:max-w-none"
            />
          </div>
          <div className="p-3 border-t bg-gray-50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="text-sm text-muted-foreground">
                {dateRange.from && dateRange.to ? (
                  `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd, yyyy")}`
                ) : dateRange.from ? (
                  `Select end date`
                ) : (
                  "Select start date"
                )}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClear}
                  className="flex-1 sm:flex-none"
                >
                  Clear
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => setIsOpen(false)}
                  disabled={!dateRange.from || !dateRange.to}
                  className="flex-1 sm:flex-none"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}