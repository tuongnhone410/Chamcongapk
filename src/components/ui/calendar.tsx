"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { vi } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      locale={vi}
      showOutsideDays={showOutsideDays}
      className={cn("p-0 w-full", className)}
      classNames={{
        months: "flex flex-col space-y-4 w-full",
        month: "space-y-4 w-full",
        month_caption: "flex justify-center pt-1 relative items-center mb-4",
        caption_label: "text-sm font-black uppercase tracking-widest text-primary",
        nav: "space-x-1 flex items-center",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-zinc-800 absolute left-1 z-10"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-zinc-800 absolute right-1 z-10"
        ),
        month_grid: "w-full",
        weekdays: "grid grid-cols-7 w-full mb-2",
        weekday: "text-zinc-500 font-black text-[10px] uppercase text-center",
        weeks: "space-y-1 w-full",
        week: "grid grid-cols-7 w-full",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-full p-0 font-bold aria-selected:opacity-100 rounded-xl transition-all hover:bg-zinc-800 text-sm flex items-center justify-center"
        ),
        day_button: "w-full h-full flex items-center justify-center",
        range_start: "day-range-start",
        range_end: "day-range-end",
        selected: "bg-primary text-black hover:bg-primary hover:text-black focus:bg-primary focus:text-black shadow-[0_0_15px_rgba(59,130,246,0.6)] rounded-xl font-black scale-110",
        today: "bg-zinc-800 text-primary border border-primary/30",
        outside: "day-outside text-zinc-700 opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        disabled: "text-zinc-800 opacity-30",
        range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ ...props }) => {
          if (props.orientation === 'left') return <ChevronLeft className="h-4 w-4" />
          return <ChevronRight className="h-4 w-4" />
        }
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
