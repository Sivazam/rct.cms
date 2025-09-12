"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  className?: string
  onDateRangeChange: (range: { from: Date; to: Date } | undefined) => void
  placeholder?: string
}

export function DateRangePicker({
  className,
  onDateRangeChange,
  placeholder = "Pick a date range",
}: DateRangePickerProps) {
  const [date, setDate] = useState<DateRange | undefined>()

  // Safety check for onDateRangeChange
  const safeOnDateRangeChange = (range: { from: Date; to: Date } | undefined) => {
    try {
      if (typeof onDateRangeChange === 'function') {
        onDateRangeChange(range);
      } else {
        console.warn('DateRangePicker: onDateRangeChange is not a function');
      }
    } catch (error) {
      console.error('DateRangePicker: Error in onDateRangeChange:', error);
    }
  }

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range)
    if (range?.from && range?.to) {
      safeOnDateRangeChange({ from: range.from, to: range.to })
    } else {
      safeOnDateRangeChange(undefined)
    }
  }

  const handleClear = () => {
    setDate(undefined)
    safeOnDateRangeChange(undefined)
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            className="rounded-md border"
          />
          <div className="p-3 border-t flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClear}
              className="mr-2"
            >
              Clear
            </Button>
            <Button 
              size="sm" 
              onClick={() => {
                if (date?.from && date?.to) {
                  onDateRangeChange({ from: date.from, to: date.to })
                }
              }}
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}