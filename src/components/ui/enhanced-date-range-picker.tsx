"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface EnhancedDateRangePickerProps {
  className?: string
  onDateRangeChange: (range: { from: Date; to: Date } | undefined) => void
  placeholder?: string
  initialDateRange?: { from: Date; to: Date } | undefined
}

export function EnhancedDateRangePicker({
  className,
  onDateRangeChange,
  placeholder = "Pick a date range",
  initialDateRange
}: EnhancedDateRangePickerProps) {
  const [date, setDate] = useState<DateRange | undefined>(initialDateRange)
  const [isOpen, setIsOpen] = useState(false)

  // Safety check for onDateRangeChange
  const safeOnDateRangeChange = (range: { from: Date; to: Date } | undefined) => {
    try {
      if (typeof onDateRangeChange === 'function') {
        onDateRangeChange(range);
      } else {
        console.warn('EnhancedDateRangePicker: onDateRangeChange is not a function');
      }
    } catch (error) {
      console.error('EnhancedDateRangePicker: Error in onDateRangeChange:', error);
    }
  }

  const handleApply = () => {
    if (date?.from && date?.to) {
      // Create new Date objects to avoid reference issues
      const range = {
        from: new Date(date.from),
        to: new Date(date.to)
      }
      safeOnDateRangeChange(range)
      setIsOpen(false)
    }
  }

  const handleClear = () => {
    setDate(undefined)
    safeOnDateRangeChange(undefined)
    setIsOpen(false)
  }

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range)
    // Don't automatically apply - wait for user to click Apply
  }

  // Update internal state when initialDateRange changes
  useEffect(() => {
    if (initialDateRange) {
      setDate({
        from: new Date(initialDateRange.from),
        to: new Date(initialDateRange.to)
      })
    } else {
      setDate(undefined)
    }
  }, [initialDateRange])

  const formatDateDisplay = (dateRange: DateRange | undefined) => {
    if (!dateRange?.from) return placeholder
    
    if (dateRange.to) {
      return `${format(dateRange.from, "MMM dd, yyyy")} - ${format(dateRange.to, "MMM dd, yyyy")}`
    }
    
    return format(dateRange.from, "MMM dd, yyyy")
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-10",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span className="truncate">
              {formatDateDisplay(date)}
            </span>
            {date && (
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
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from || new Date()}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            className="rounded-md border"
          />
          <div className="p-3 border-t flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {date?.from && date?.to ? (
                `${format(date.from, "MMM dd")} - ${format(date.to, "MMM dd, yyyy")}`
              ) : (
                "Select date range"
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClear}
              >
                Clear
              </Button>
              <Button 
                size="sm" 
                onClick={handleApply}
                disabled={!date?.from || !date?.to}
              >
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}