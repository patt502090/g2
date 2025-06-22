"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  Clock,
  Video,
  Calendar,
  Clipboard,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import Head from "next/head";
import { useUserEmail } from "./providers";
import { createPortal } from "react-dom";

interface Meeting {
  id: string;
  title: string;
  platform: string;
  startTime: string;
  endTime: string;
  description?: string;
  attendees: string[];
  organizer?: string;
  url?: string;
}

const AIRTABLE_URL =
  "https://api.airtable.com/v0/app2qL011Os47CDj3/tblc6PrAM7agpg1e2";
const AIRTABLE_TOKEN =
  "patWV3bGZRRVWS311.25760cb99550e24f03f4ba7573f7ef813530cfa488a4f4d1a2f9952d707b1fe7";

async function fetchMeetings(): Promise<Meeting[]> {
  const res = await fetch(AIRTABLE_URL, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_TOKEN}`,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch meetings");
  const data = await res.json();
  console.log("=== [CALENDAR] Airtable raw data:", data);
  const mappedMeetings = (data.records || []).map((rec: any) => ({
    id: rec.id,
    title: rec.fields.Summary || "",
    platform: Array.isArray(rec.fields.Platform)
      ? rec.fields.Platform[0]
      : rec.fields.Platform || "Airtable",
    startTime: rec.fields.Start,
    endTime: rec.fields.End,
    description: rec.fields.Description || "",
    attendees: rec.fields.Participants || [],
    organizer: rec.fields.Organizer || "",
    url: rec.fields.URL || "",
  }));
  console.log("=== [CALENDAR] Mapped meetings:", mappedMeetings);
  return mappedMeetings;
}

function AttendeesTooltip({ organizer, attendees, children }: { organizer?: string; attendees?: string[]; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState<{top: number, left: number} | null>(null);
  const ref = useRef<HTMLSpanElement>(null);
  const { userEmail } = useUserEmail();

  useEffect(() => {
    if (show && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 4, // 4px gap
        left: rect.left + window.scrollX,
      });
    }
  }, [show]);

  return (
    <span
      className="relative"
      ref={ref}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      tabIndex={0}
    >
      {children}
      {show && coords && createPortal(
        <div
          className="z-50 w-56 bg-white border border-stone-200 rounded-xl shadow-lg p-3 text-xs text-stone-800 whitespace-pre-line"
          style={{
            position: "absolute",
            top: coords.top,
            left: coords.left,
          }}
        >
          <div className="mb-1 font-semibold text-stone-700">ผู้จัด</div>
          <div className="mb-2">{organizer ? organizer : <span className="text-stone-400">-</span>}</div>
          <div className="mb-1 font-semibold text-stone-700">ผู้เข้าร่วม</div>
          {attendees && attendees.length > 0 ? (
            <ul className="list-disc list-inside">
              {attendees.map((a: string, i: number) => (
                <li key={i}>
                  {a}
                  {userEmail && a.toLowerCase() === userEmail.toLowerCase() && (
                    <span className="text-stone-500 ml-1">(คุณ)</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-stone-400">-</div>
          )}
        </div>,
        document.body
      )}
    </span>
  );
}

export default function CalendarPage() {
  const {
    data: meetings = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Meeting[]>({
    queryKey: ["calendar-meetings"],
    queryFn: fetchMeetings,
    refetchOnWindowFocus: false,
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const { userEmail, handleChangeEmail } = useUserEmail();

  console.log("=== [CALENDAR] PAGE MOUNTED ===");
  console.log("=== [CALENDAR] userEmail:", userEmail);
  console.log("meetings:", meetings);

  useEffect(() => {
    if (
      selectedDate &&
      (selectedDate.getMonth() !== currentDate.getMonth() ||
        selectedDate.getFullYear() !== currentDate.getFullYear())
    ) {
      setSelectedDate(null);
    }
  }, [currentDate]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getMeetingsForDate = (date: Date) => {
    const dateString = date.toISOString().split("T")[0];
    return meetings.filter((meeting) => {
      const meetingDate = new Date(meeting.startTime)
        .toISOString()
        .split("T")[0];
      return meetingDate === dateString;
    });
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );
      const dayMeetings = getMeetingsForDate(date);
      // highlight if user is organizer or attendee for any meeting on this day
      let highlightType: "organizer" | "attendee" | null = null;
      for (const m of dayMeetings) {
        if (
          m.organizer &&
          m.organizer.toLowerCase() === userEmail.toLowerCase()
        ) {
          highlightType = "organizer";
          break;
        }
        if (
          (Array.isArray(m.attendees) ? m.attendees : []).some(
            (a) => a.toLowerCase() === userEmail.toLowerCase()
          )
        ) {
          highlightType = highlightType || "attendee";
        }
      }
      const isToday = new Date().toDateString() === date.toDateString();
      const isSelected = selectedDate?.toDateString() === date.toDateString();

      days.push(
        <motion.button
          key={day}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSelectedDate(date)}
          className={`h-8 w-8 rounded-full text-xs flex items-center justify-center relative transition-colors
            ${
              isSelected
                ? "bg-stone-800 text-white"
                : isToday
                ? "bg-stone-200 text-stone-800"
                : highlightType === "organizer"
                ? "ring-2 ring-stone-900 text-stone-900"
                : highlightType === "attendee"
                ? "ring-2 ring-stone-500 text-stone-700"
                : "hover:bg-stone-100 text-stone-700"
            }
          `}
        >
          {day}
          {dayMeetings.length > 0 && (
            <div
              className={`absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full ${
                highlightType === "organizer"
                  ? "bg-stone-900"
                  : highlightType === "attendee"
                  ? "bg-stone-500"
                  : "bg-stone-400"
              }`}
            ></div>
          )}
        </motion.button>
      );
    }

    return days;
  };

  useEffect(() => {
    async function fetchAirtableMetaTables() {
      const baseId = "app2qL011Os47CDj3";
      const url = `https://api.airtable.com/v0/meta/bases/${baseId}/tables`;
      try {
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${AIRTABLE_TOKEN}`,
          },
        });
        const data = await res.json();
        console.log("Airtable meta tables:", data);
      } catch (err) {
        console.error("Failed to fetch Airtable meta tables", err);
      }
    }
    fetchAirtableMetaTables();
  }, []);

  return (
    <>
      <Head>
        <title>ปฏิทินการประชุม | Meeting Calendar</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
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
                <h1 className="text-lg font-normal text-stone-800">
                  ปฏิทินการประชุม
                </h1>
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
                      <div
                        key={day}
                        className="text-xs text-stone-500 text-center py-1"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar days */}
                  <div className="grid grid-cols-7 gap-1">
                    {renderCalendarDays()}
                  </div>
                </div>
              </div>

              {/* Meeting List for selected day */}
              <div>
                {isLoading ? (
                  <div className="text-center py-12 text-stone-500">
                    กำลังโหลดข้อมูล...
                  </div>
                ) : isError ? (
                  <div className="text-center py-12 text-red-500">
                    เกิดข้อผิดพลาดในการโหลดข้อมูล
                    <br />
                    <button
                      onClick={() => refetch()}
                      className="underline text-xs mt-2"
                    >
                      ลองใหม่อีกครั้ง
                    </button>
                  </div>
                ) : selectedDate ? (
                  <>
                    <h3 className="text-sm font-medium text-stone-800 mb-2 pl-2">
                      การประชุมวันที่ {formatDate(selectedDate)}
                    </h3>
                    {getMeetingsForDate(selectedDate).length === 0 ? (
                      <div className="text-xs text-stone-500">
                        ไม่มีการประชุม
                      </div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto pr-1 pt-2 pl-2">
                        <div className="space-y-2 overflow-visible">
                          {getMeetingsForDate(selectedDate).map((meeting: Meeting) => {
                            const isPast =
                              new Date(meeting.endTime) < new Date();
                            const isOrganizer =
                              meeting.organizer &&
                              meeting.organizer.toLowerCase() ===
                                userEmail.toLowerCase();
                            const isAttendee =
                              Array.isArray(meeting.attendees) &&
                              meeting.attendees.some(
                                (a) =>
                                  a.toLowerCase() === userEmail.toLowerCase()
                              );
                            const isUserInvolved = isOrganizer || isAttendee;
                            return (
                              <div
                                key={meeting.id}
                                className={`relative bg-stone-50 p-2 rounded-2xl border border-stone-100 mb-2${
                                  isPast ? " opacity-60 grayscale" : ""
                                } ${
                                  isUserInvolved
                                    ? isOrganizer
                                      ? "outline outline-stone-900"
                                      : "outline-2 outline-stone-500"
                                    : ""
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center space-x-1 flex-nowrap min-w-0">
                                    <span
                                      className="text-xs font-medium text-stone-800 truncate max-w-[10rem]"
                                      title={meeting.title}
                                    >
                                      {meeting.title}
                                    </span>
                                    <span
                                      className={`text-xs text-stone-500 bg-stone-200 px-2 py-0.5 rounded-full ${
                                        meeting.platform === "Google Meet"
                                          ? "min-w-[3.2rem] max-w-[3.2rem]"
                                          : "truncate max-w-[5rem]"
                                      }`}
                                      title={meeting.platform}
                                      style={
                                        meeting.platform === "Google Meet"
                                          ? { fontSize: "12px" }
                                          : {}
                                      }
                                    >
                                      {meeting.platform === "Google Meet"
                                        ? "GMeet"
                                        : meeting.platform}
                                    </span>
                                    {isUserInvolved && (
                                      <span
                                        className={` px-1 py-0.5 rounded-full font-medium whitespace-nowrap ${
                                          isOrganizer
                                            ? "bg-stone-900 text-white"
                                            : "bg-stone-200 text-stone-700 border border-stone-400"
                                        }`}
                                        style={{ fontSize: "11px" }}
                                      >
                                        {isOrganizer ? "ผู้จัด" : "ผู้เข้าร่วม"}
                                      </span>
                                    )}
                                  </div>
                                  {isUserInvolved && (
                                    <div className="flex items-center space-x-1">
                                      <button
                                        type="button"
                                        className={`p-2 rounded-full flex items-center justify-center ${
                                          isPast
                                            ? "bg-stone-100 text-stone-300 cursor-not-allowed"
                                            : "hover:bg-stone-200"
                                        }`}
                                        onClick={() => {
                                          if (!isPast) {
                                            navigator.clipboard.writeText(
                                              window.location.origin +
                                                `/meetings/${meeting.id}`
                                            );
                                            alert("คัดลอกลิงก์แล้ว!");
                                          }
                                        }}
                                        title={
                                          isPast
                                            ? "หมดเวลาประชุมแล้ว"
                                            : "คัดลอกลิงก์เข้าร่วม"
                                        }
                                        disabled={isPast}
                                      >
                                        <Clipboard className="w-3 h-3" />
                                      </button>
                                      <a
                                        href={
                                          isPast
                                            ? undefined
                                            : `/meetings/${meeting.id}`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`p-2 rounded-full flex items-center justify-center ${
                                          isPast
                                            ? "bg-stone-100 text-stone-300 cursor-not-allowed"
                                            : "bg-stone-800 hover:bg-stone-900 text-white"
                                        }`}
                                        title={
                                          isPast
                                            ? "หมดเวลาประชุมแล้ว"
                                            : "เข้าร่วมการประชุม"
                                        }
                                        style={{
                                          textDecoration: "none",
                                          pointerEvents: isPast
                                            ? "none"
                                            : "auto",
                                        }}
                                        tabIndex={isPast ? -1 : 0}
                                      >
                                        <Video className="w-4 h-4" />
                                      </a>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2 text-xs text-stone-600">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {formatTime(meeting.startTime)} -{" "}
                                    {formatTime(meeting.endTime)}
                                  </span>
                                </div>
                                {meeting.description ? (
                                  <div className="flex items-center justify-between text-xs text-stone-600 mt-1">
                                    <div className="truncate mr-2">{meeting.description}</div>
                                    <div className="flex items-center space-x-2">
                                      <AttendeesTooltip organizer={meeting.organizer} attendees={meeting.attendees}>
                                        <span
                                          className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 text-xs cursor-pointer"
                                        >
                                          {Array.isArray(meeting.attendees) ? `${meeting.attendees.length} คนเข้าร่วม` : '0 คนเข้าร่วม'}
                                        </span>
                                      </AttendeesTooltip>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex justify-end mt-1">
                                    <div className="flex items-center space-x-2">
                                      <AttendeesTooltip organizer={meeting.organizer} attendees={meeting.attendees}>
                                        <span
                                          className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 text-xs cursor-pointer"
                                        >
                                          {Array.isArray(meeting.attendees) ? `${meeting.attendees.length} คนเข้าร่วม` : '0 คนเข้าร่วม'}
                                        </span>
                                      </AttendeesTooltip>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-stone-500">
                    เลือกวันที่เพื่อดูการประชุม
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
