"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface ResponsiveDatePickerProps {
  onDateChange: (date: Date) => void
  placeholder?: string
  initialDate?: Date | null
  disabled?: boolean
  maxDate?: Date
  minDate?: Date
  className?: string
}

export function ResponsiveDatePicker({
  onDateChange,
  placeholder = "Select date",
  initialDate,
  disabled = false,
  maxDate,
  minDate,
  className
}: ResponsiveDatePickerProps) {
  const [date, setDate] = useState<Date | undefined>(initialDate)
  const [isOpen, setIsOpen] = useState(false)

  // Safety check for onDateChange
  const safeOnDateChange = (selectedDate: Date) => {
    try {
      if (typeof onDateChange === 'function') {
        onDateChange(selectedDate);
      } else {
        console.warn('ResponsiveDatePicker: onDateChange is not a function');
      }
    } catch (error) {
      console.error('ResponsiveDatePicker: Error in onDateChange:', error);
    }
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate)
      safeOnDateChange(selectedDate)
      setIsOpen(false)
    }
  }

  const formatDateDisplay = (selectedDate: Date | undefined) => {
    if (!selectedDate) return placeholder
    return format(selectedDate, "MMM dd, yyyy")
  }

  return (
    <div className={cn("w-full", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-10",
              !date && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span className="truncate flex-1">
              {formatDateDisplay(date)}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            disabled={(date) => {
              // Check max date constraint
              if (maxDate && date > maxDate) return true
              // Check min date constraint
              if (minDate && date < minDate) return true
              return false
            }}
            initialFocus
            className="rounded-md border"
          />
          <div className="p-3 border-t bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {date ? format(date, "MMM dd, yyyy") : "Select a date"}
              </div>
              <Button 
                size="sm" 
                onClick={() => setIsOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}