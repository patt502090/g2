"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, ChevronLeft, ChevronRight, CalendarIcon, Clock, Video, Calendar } from "lucide-react"
import Link from "next/link"
import { useQuery } from '@tanstack/react-query'

interface Meeting {
  id: string
  title: string
  platform: string
  startTime: string
  endTime: string
  description?: string
}

const AIRTABLE_URL = "https://api.airtable.com/v0/app2qL011Os47CDj3/tblc6PrAM7agpg1e2"
const AIRTABLE_TOKEN = "patWV3bGZRRVWS311.25760cb99550e24f03f4ba7573f7ef813530cfa488a4f4d1a2f9952d707b1fe7"

async function fetchMeetings(): Promise<Meeting[]> {
  const res = await fetch(AIRTABLE_URL, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_TOKEN}`,
    },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('Failed to fetch meetings')
  const data = await res.json()
  return (data.records || []).map((rec: any) => ({
    id: rec.id,
    title: rec.fields.Summary || '',
    platform: Array.isArray(rec.fields.Platform) ? rec.fields.Platform[0] : (rec.fields.Platform || 'Airtable'),
    startTime: rec.fields.Start,
    endTime: rec.fields.End,
    description: rec.fields.Description || '',
  }))
}

export default function CalendarPage() {
  const { data: meetings = [], isLoading, isError, refetch } = useQuery<Meeting[]>({
    queryKey: ['calendar-meetings'],
    queryFn: fetchMeetings,
    refetchOnWindowFocus: false,
  })
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())

  useEffect(() => {
    if (
      selectedDate &&
      (selectedDate.getMonth() !== currentDate.getMonth() ||
        selectedDate.getFullYear() !== currentDate.getFullYear())
    ) {
      setSelectedDate(null)
    }
  }, [currentDate])

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    return date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getMeetingsForDate = (date: Date) => {
    const dateString = date.toISOString().split("T")[0]
    return meetings.filter((meeting) => {
      const meetingDate = new Date(meeting.startTime).toISOString().split("T")[0]
      return meetingDate === dateString
    })
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const dayMeetings = getMeetingsForDate(date)
      const isToday = new Date().toDateString() === date.toDateString()
      const isSelected = selectedDate?.toDateString() === date.toDateString()

      days.push(
        <motion.button
          key={day}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSelectedDate(date)}
          className={`h-8 w-8 rounded-full text-xs flex items-center justify-center relative transition-colors ${
            isSelected
              ? "bg-stone-800 text-white"
              : isToday
                ? "bg-stone-200 text-stone-800"
                : "hover:bg-stone-100 text-stone-700"
          }`}
        >
          {day}
          {dayMeetings.length > 0 && (
            <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
          )}
        </motion.button>,
      )
    }

    return days
  }

  return (
    <div className="min-h-screen paper-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-2xl bg-white/90 rounded-3xl shadow-lg border border-stone-200"
      >
        {/* Header */}
        <div className="p-6 pb-3 border-b border-stone-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Link href="/">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1 rounded-full hover:bg-stone-100"
                >
                  <ArrowLeft className="w-4 h-4" />
                </motion.button>
              </Link>
              <h1 className="text-lg font-normal text-stone-800">ปฏิทินการประชุม</h1>
            </div>
            <div className="flex space-x-2">
              <Link href="/create-meeting">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-1 px-3 py-1 bg-stone-800 hover:bg-stone-900 text-white rounded-2xl text-xs transition-colors"
                >
                  <Video className="w-3 h-3" />
                  <span>สร้าง Meeting</span>
                </motion.button>
              </Link>
              <Link href="/meetings">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-1 px-3 py-1 bg-stone-100 hover:bg-stone-200 rounded-2xl text-xs text-stone-700 transition-colors"
                >
                  <Calendar className="w-3 h-3" />
                  <span>จัดการ</span>
                </motion.button>
              </Link>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calendar */}
            <div className="space-y-4">
              {/* Calendar Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-stone-800">
                  {currentDate.toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "long",
                  })}
                </h2>
                <div className="flex space-x-1">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigateMonth("prev")}
                    className="p-1 rounded-full hover:bg-stone-100"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigateMonth("next")}
                    className="p-1 rounded-full hover:bg-stone-100"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((day) => (
                    <div key={day} className="text-xs text-stone-500 text-center py-1">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>
              </div>
            </div>

            {/* Meeting List for selected day */}
            <div>
              {isLoading ? (
                <div className="text-center py-12 text-stone-500">กำลังโหลดข้อมูล...</div>
              ) : isError ? (
                <div className="text-center py-12 text-red-500">
                  เกิดข้อผิดพลาดในการโหลดข้อมูล<br />
                  <button onClick={() => refetch()} className="underline text-xs mt-2">ลองใหม่อีกครั้ง</button>
                </div>
              ) : selectedDate ? (
                <>
                  <h3 className="text-sm font-medium text-stone-800 mb-2">
                    การประชุมวันที่ {formatDate(selectedDate)}
                  </h3>
                  {getMeetingsForDate(selectedDate).length === 0 ? (
                    <div className="text-xs text-stone-500">ไม่มีการประชุม</div>
                  ) : (
                    <div className="space-y-2">
                      {getMeetingsForDate(selectedDate).map((meeting: Meeting) => (
                        <div key={meeting.id} className="bg-stone-50 p-3 rounded-2xl border border-stone-100">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs font-medium text-stone-800">{meeting.title}</span>
                            <span className="text-xs text-stone-500 bg-stone-200 px-2 py-0.5 rounded-full">{meeting.platform}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-stone-600">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}</span>
                          </div>
                          {meeting.description && (
                            <div className="text-xs text-stone-600 mt-1">{meeting.description}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-xs text-stone-500">เลือกวันที่เพื่อดูการประชุม</div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
