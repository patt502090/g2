"use client";

import React from "react";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Plus,
  Clipboard,
  LogOut,
  Info,
  Link as LinkIcon,
  UploadCloud,
  Ban,
  X,
  FileText,
  FileCheck,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import UploadModal from "../components/UploadModal";
import SlideUploadModal from "../components/SlideUploadModal";

interface Meeting {
  id: string;
  title: string;
  platform: string;
  startTime: string;
  endTime: string;
  description?: string;
  attendees: string[];
  url?: string;
  plan?: string;
  useFireflies?: boolean;
  firefliesSent?: boolean;
  firefliesTranscriptId?: string;
  organizer?: string;
  roles?: { [key: string]: string[] };
  transcript?: string;
  meetingNotes?: string;
  Cancelled?: boolean;
  slideText?: string;
  slideFileName?: string;
}

type ViewState = "list" | "edit";

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
  console.log(data);
  return (data.records || []).map((rec: any) => ({
    id: rec.id,
    title: rec.fields.Summary || "",
    platform: Array.isArray(rec.fields.Platform)
      ? rec.fields.Platform[0]
      : rec.fields.Platform || "Airtable",
    startTime: rec.fields.Start,
    endTime: rec.fields.End,
    description: rec.fields.Description || "",
    attendees: rec.fields.Participants || [],
    url: rec.fields.URL || "",
    useFireflies: rec.fields["Use Fireflies"] || false,
    firefliesSent: rec.fields["Fireflies Sent"] || false,
    firefliesTranscriptId: rec.fields["Fireflies Transcript ID"] || "",
    organizer: rec.fields.Organizer || "",
    roles: rec.fields.Roles ? JSON.parse(rec.fields.Roles) : {},
    transcript: rec.fields.Transcript || "",
    meetingNotes: rec.fields["Meeting Notes"] || "",
    Cancelled: rec.fields["Cancelled"] || false,
    slideText: rec.fields["Slide Text"] || "",
    slideFileName: rec.fields["Slide File Name"] || "",
  }));
}

// Email context/helper
function getUserEmail() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("userEmail") || "";
  }
  return "";
}
function setUserEmail(email: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("userEmail", email);
  }
}
function clearUserEmail() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("userEmail");
  }
}

function AttendeesTooltip({
  organizer,
  attendees,
  children,
}: {
  organizer?: string;
  attendees?: string[];
  children: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null
  );
  const ref = useRef<HTMLSpanElement>(null);
  const userEmail = getUserEmail();

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
      {show &&
        coords &&
        createPortal(
          <div
            className="z-50 w-56 bg-white border border-stone-200 rounded-xl shadow-lg p-3 text-xs text-stone-800 whitespace-pre-line"
            style={{
              position: "absolute",
              top: coords.top,
              left: coords.left,
            }}
          >
            <div className="mb-1 font-semibold text-stone-700">ผู้จัด</div>
            <div className="mb-2">
              {organizer ? (
                organizer
              ) : (
                <span className="text-stone-400">-</span>
              )}
            </div>
            <div className="mb-1 font-semibold text-stone-700">ผู้เข้าร่วม</div>
            {attendees && attendees.length > 0 ? (
              <ul className="list-disc list-inside">
                {attendees.map((a: string, i: number) => (
                  <li key={i}>
                    {a}
                    {userEmail &&
                      a.toLowerCase() === userEmail.toLowerCase() && (
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

export default function MeetingsManager() {
  const {
    data: meetings = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Meeting[]>({
    queryKey: ["meetings"],
    queryFn: fetchMeetings,
    refetchOnWindowFocus: false,
  });

  const [viewState, setViewState] = useState<ViewState>("list");
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadMeeting, setUploadMeeting] = useState<Meeting | null>(null);
  const [cancelModal, setCancelModal] = useState<{
    open: boolean;
    meetingId?: string;
  }>({ open: false });
  const [viewMeeting, setViewMeeting] = useState<Meeting | null>(null);
  const [viewTab, setViewTab] = useState<"transcript" | "notes">("transcript");
  const [slideUploadMeeting, setSlideUploadMeeting] = useState<Meeting | null>(
    null
  );

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleEdit = (meeting: Meeting) => {
    setEditingMeeting({ ...meeting });
    setViewState("edit");
  };

  const handleDelete = async (meetingId: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะยกเลิกการประชุมนี้?")) {
      return;
    }

    try {
      // In real app, this would be an API call
      refetch();
      toast.success("ยกเลิกการประชุมเรียบร้อยแล้ว");
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการยกเลิกการประชุม");
    }
  };

  const handleSaveEdit = async () => {
    if (!editingMeeting) return;

    if (!editingMeeting.title) {
      toast.error("กรุณาใส่หัวข้อการประชุม");
      return;
    }

    if (!editingMeeting.startTime) {
      toast.error("กรุณาเลือกวันเวลาเริ่มประชุม");
      return;
    }

    if (!editingMeeting.endTime) {
      toast.error("กรุณาเลือกวันเวลาสิ้นสุด");
      return;
    }

    if (
      new Date(editingMeeting.endTime) <= new Date(editingMeeting.startTime)
    ) {
      toast.error("เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น");
      return;
    }

    setIsSubmitting(true);

    try {
      // In real app, this would be an API call to update the meeting
      refetch();
      toast.success("แก้ไขการประชุมเรียบร้อยแล้ว");
      setViewState("list");
      setEditingMeeting(null);
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการแก้ไขการประชุม");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    if (!editingMeeting) return;

    const { name, value } = e.target;
    setEditingMeeting((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleAttendeesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingMeeting) return;

    const attendeesList = e.target.value
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email);

    setEditingMeeting((prev) =>
      prev ? { ...prev, attendees: attendeesList } : null
    );
  };

  const toggleFireflies = (meetingId: string) => {
    // In real app, this would be an API call to toggle fireflies
    console.log(`Toggle fireflies for meeting ${meetingId}`);
  };

  const handleOpenSlideUploadModal = (meeting: Meeting) =>
    setSlideUploadMeeting(meeting);
  const handleCloseSlideUploadModal = () => setSlideUploadMeeting(null);
  const handleSlideUploadSuccess = () => {
    refetch();
    setSlideUploadMeeting(null);
    toast.success("อัปโหลดสไลด์สำเร็จ!");
  };

  // Render edit form
  if (viewState === "edit" && editingMeeting) {
    return (
      <div className="min-h-screen paper-bg flex items-center justify-center p-4">
        <Toaster position="top-right" />

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md bg-white/90 rounded-3xl shadow-lg border border-stone-200"
        >
          {/* Header */}
          <div className="p-6 pb-3 border-b border-stone-100">
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setViewState("list");
                  setEditingMeeting(null);
                }}
                className="p-1 rounded-full hover:bg-stone-100 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </motion.button>
              <h1 className="text-lg font-normal text-stone-800">
                แก้ไข Meeting
              </h1>
            </div>
            <p className="text-xs text-stone-500 mt-1">แก้ไขข้อมูลการประชุม</p>
          </div>

          {/* Edit Form */}
          <div className="p-6">
            <div className="space-y-4">
              {/* Platform */}
              <div className="space-y-1">
                <label className="block text-xs text-stone-600 font-normal">
                  แพลตฟอร์ม *
                </label>
                <select
                  name="platform"
                  value={editingMeeting.platform}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition-all duration-200"
                >
                  <option value="Google Meet">Google Meet</option>
                  <option value="Zoom">Zoom</option>
                  <option value="MS Teams">MS Teams</option>
                </select>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="block text-xs text-stone-600 font-normal">
                  หัวข้อการประชุม *
                </label>
                <input
                  name="title"
                  value={editingMeeting.title}
                  onChange={handleInputChange}
                  placeholder="เช่น ประชุมวางแผน Q2"
                  required
                  className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition-all duration-200"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-xs text-stone-600 font-normal">
                  รายละเอียดเพิ่มเติม
                </label>
                <textarea
                  name="description"
                  value={editingMeeting.description || ""}
                  onChange={handleInputChange}
                  placeholder="รายละเอียดการประชุม..."
                  rows={3}
                  className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition-all duration-200 resize-none"
                />
              </div>

              {/* Start Time */}
              <div className="space-y-1">
                <label className="block text-xs text-stone-600 font-normal">
                  วันเวลาเริ่มประชุม *
                </label>
                <input
                  name="startTime"
                  type="datetime-local"
                  value={editingMeeting.startTime.slice(0, 16)}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition-all duration-200"
                />
              </div>

              {/* End Time */}
              <div className="space-y-1">
                <label className="block text-xs text-stone-600 font-normal">
                  วันเวลาสิ้นสุด *
                </label>
                <input
                  name="endTime"
                  type="datetime-local"
                  value={editingMeeting.endTime.slice(0, 16)}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition-all duration-200"
                />
              </div>

              {/* Attendees */}
              <div className="space-y-1">
                <label className="block text-xs text-stone-600 font-normal">
                  อีเมลผู้เข้าร่วมประชุม
                </label>
                <input
                  name="attendees"
                  value={editingMeeting.attendees.join(", ")}
                  onChange={handleAttendeesChange}
                  placeholder="user1@email.com, user2@email.com"
                  className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition-all duration-200"
                />
                <p className="text-xs text-stone-400">
                  แยกอีเมลด้วยเครื่องหมายจุลภาค (,)
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setViewState("list");
                    setEditingMeeting(null);
                  }}
                  className="py-2 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-2xl text-xs cursor-pointer"
                >
                  ยกเลิก
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveEdit}
                  disabled={isSubmitting}
                  className="py-2 px-4 bg-stone-800 hover:bg-stone-900 text-white rounded-2xl text-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Render meetings list
  // Sort meetings: upcoming first, then past
  const now = new Date();
  const upcomingMeetings = meetings
    .filter((m) => new Date(m.endTime) >= now)
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  const pastMeetings = meetings
    .filter((m) => new Date(m.endTime) < now)
    .sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  const sortedMeetings = [...upcomingMeetings, ...pastMeetings];

  // --- Pagination ---
  const PAGE_SIZE = 5;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(sortedMeetings.length / PAGE_SIZE);
  const paginatedMeetings = sortedMeetings.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );
  // --- End Pagination ---

  // Email context/helper
  const [userEmail, setUserEmailState] = useState(getUserEmail());
  const [showEmailModal, setShowEmailModal] = useState(!userEmail);
  useEffect(() => {
    if (!userEmail) setShowEmailModal(true);
  }, [userEmail]);
  function handleSetEmail(email: string) {
    setUserEmail(email);
    setUserEmailState(email);
    setShowEmailModal(false);
  }
  function handleChangeEmail() {
    clearUserEmail();
    setUserEmailState("");
    setShowEmailModal(true);
  }

  const filteredMeetings =
    userEmail.trim() === ""
      ? sortedMeetings
      : sortedMeetings.filter(
          (m) =>
            m.attendees.some(
              (a) => a.toLowerCase() === userEmail.trim().toLowerCase()
            ) ||
            (m.organizer &&
              m.organizer.toLowerCase() === userEmail.trim().toLowerCase())
        );
  const filteredPaginatedMeetings = filteredMeetings.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );
  const filteredTotalPages = Math.ceil(filteredMeetings.length / PAGE_SIZE);

  const allMeetings = filteredMeetings; // or sortedMeetings if that's your main list
  const firstPastIdx = allMeetings.findIndex((m) => new Date(m.endTime) < now);
  const firstPastId = firstPastIdx !== -1 ? allMeetings[firstPastIdx].id : null;

  return (
    <div className="min-h-screen paper-bg flex items-center justify-center p-4">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#fff",
            color: "#333",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            borderRadius: "16px",
            padding: "12px 16px",
            fontSize: "14px",
          },
          success: {
            iconTheme: {
              primary: "#4b5563",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 max-w-xs w-full">
            <h2 className="text-base font-medium mb-2">กรอกอีเมลของคุณ</h2>
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full px-3 py-2 border border-stone-200 rounded-xl mb-3 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  handleSetEmail((e.target as HTMLInputElement).value);
              }}
              autoFocus
            />
            <button
              className="w-full bg-stone-800 hover:bg-stone-900 text-white rounded-xl py-2 text-xs cursor-pointer"
              onClick={() => {
                const input =
                  document.querySelector<HTMLInputElement>("input[type=email]");
                if (input && input.value) handleSetEmail(input.value);
              }}
            >
              ยืนยัน
            </button>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal.open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 max-w-xs w-full">
            <h2 className="text-base font-medium mb-2">
              ยืนยันการยกเลิกประชุม
            </h2>
            <p className="text-xs text-stone-600 mb-4">
              คุณต้องการยกเลิกการประชุมนี้จริงหรือไม่?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-1 rounded-xl bg-stone-100 text-stone-700 text-xs cursor-pointer"
                onClick={() => setCancelModal({ open: false })}
              >
                ไม่ยกเลิก
              </button>
              <button
                className="px-4 py-1 rounded-xl bg-red-600 text-white text-xs cursor-pointer"
                onClick={async () => {
                  await fetch("/api/cancel-meeting-proxy", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: cancelModal.meetingId }),
                  });
                  setCancelModal({ open: false });
                  toast.success("ยกเลิกการประชุมเรียบร้อยแล้ว");
                  // refetch หรือ toast ตามต้องการ
                }}
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

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
                  className="p-1 rounded-full hover:bg-stone-100 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </motion.button>
              </Link>
              <h1 className="text-lg font-normal text-stone-800">
                รายการ Meeting
              </h1>
            </div>
            <div className="flex space-x-2">
              <Link href="/create-meeting">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-1 px-3 py-1 bg-stone-800 hover:bg-stone-900 text-white rounded-2xl text-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>สร้างใหม่</span>
                </motion.button>
              </Link>
              <Link href="/">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-1 px-3 py-1 bg-stone-100 hover:bg-stone-200 rounded-2xl text-xs text-stone-700 transition-colors cursor-pointer"
                >
                  <Calendar className="w-3 h-3" />
                  <span>ปฏิทิน</span>
                </motion.button>
              </Link>
            </div>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            แก้ไขและจัดการการประชุมทั้งหมด
          </p>
        </div>

        {/* Meetings List */}
        <div className="p-6">
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
          ) : meetings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-stone-400 mx-auto mb-4" />
              <h3 className="text-sm font-medium text-stone-600 mb-2">
                ยังไม่มีการประชุม
              </h3>
              <p className="text-xs text-stone-500 mb-4">
                เริ่มต้นด้วยการสร้างการประชุมใหม่
              </p>
              <Link href="/create-meeting">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-1 px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-2xl text-xs mx-auto cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>สร้าง Meeting แรก</span>
                </motion.button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPaginatedMeetings.map((meeting: Meeting, idx) => {
                const isPast = new Date(meeting.endTime) < now;
                const isFirstPastInAll = meeting.id === firstPastId;
                const meetingUrl = `/meetings/${meeting.id}`;
                const isOrganizer =
                  userEmail &&
                  meeting.organizer &&
                  meeting.organizer.toLowerCase() === userEmail.toLowerCase();
                const isAttendee =
                  userEmail &&
                  meeting.attendees.some(
                    (a) => a.toLowerCase() === userEmail.toLowerCase()
                  );
                const startTime = new Date(meeting.startTime);
                const isUpcoming = !isPast && startTime > now;
                const isOngoing = !isPast && startTime <= now;

                return (
                  <React.Fragment key={meeting.id}>
                    {isFirstPastInAll && (
                      <div className="flex items-center my-4">
                        <div className="flex-grow border-t border-dashed border-stone-300"></div>
                        <span className="mx-3 text-xs text-stone-400">
                          ประชุมที่ผ่านมา
                        </span>
                        <div className="flex-grow border-t border-dashed border-stone-300"></div>
                      </div>
                    )}
                    <div
                      className={`p-4 rounded-2xl border transition-all duration-200 mb-2 hover:shadow-md ${
                        meeting.Cancelled === true
                          ? "bg-red-50/50 border-red-300"
                          : isPast
                          ? "bg-stone-50/50 border-stone-200/50"
                          : isOngoing
                          ? "bg-green-50/30 border-green-200/50"
                          : isUpcoming && (isOrganizer || isAttendee)
                          ? "bg-yellow-50/30 border-yellow-200/50"
                          : "bg-white border-stone-200"
                      }`}
                    >
                      <div className="flex items-center w-full gap-1 flex-nowrap">
                        <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
                          <h3
                            className="truncate min-w-0 max-w-[100px] text-base font-medium text-stone-800"
                            title={meeting.title}
                          >
                            {meeting.title}
                          </h3>
                          <span className="text-xs px-2 py-1 rounded-full bg-stone-100 text-stone-700 whitespace-nowrap flex-shrink-0">
                            {meeting.platform}
                          </span>
                          {isOrganizer && (
                            <span className="text-xs px-2 py-1 rounded-full bg-stone-200 text-stone-800 whitespace-nowrap flex-shrink-0">
                              ผู้จัดประชุม
                            </span>
                          )}
                          {isAttendee && !isOrganizer && (
                            <span className="text-xs px-2 py-1 rounded-full bg-stone-100 text-stone-700 whitespace-nowrap flex-shrink-0">
                              ผู้เข้าร่วม
                            </span>
                          )}
                          {isPast ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-stone-100 text-stone-500 whitespace-nowrap flex-shrink-0">
                              ประชุมเสร็จสิ้น
                            </span>
                          ) : isOngoing ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 whitespace-nowrap flex-shrink-0">
                              กำลังประชุม
                            </span>
                          ) : null}
                          {meeting.Cancelled === true && (
                            <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 whitespace-nowrap flex-shrink-0 ml-2">
                              การประชุมถูกยกเลิก
                            </span>
                          )}
                          {isPast &&
                            isOrganizer &&
                            !meeting.useFireflies &&
                            !meeting.firefliesTranscriptId &&
                            !meeting.transcript &&
                            !meeting.meetingNotes && (
                              <div className="flex justify-end items-center ml-auto mb-2">
                                <button
                                  className="px-2 py-1 bg-stone-800 hover:bg-stone-900 text-white rounded-2xl text-xs flex items-center space-x-2 cursor-pointer"
                                  onClick={() => setUploadMeeting(meeting)}
                                >
                                  <UploadCloud className="w-4 h-4 mr-1" />
                                  <span>อัปโหลดเสียง</span>
                                </button>
                              </div>
                            )}
                        </div>

                        {!meeting.Cancelled && !isPast && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <a
                              href={meetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`px-2 py-1 text-white rounded-2xl text-xs transition-all duration-200 font-medium flex items-center whitespace-nowrap cursor-pointer ${
                                isOngoing
                                  ? "bg-green-600 hover:bg-green-700"
                                  : "bg-stone-800 hover:bg-stone-900"
                              }`}
                              style={{ textDecoration: "none" }}
                            >
                              {isOngoing ? "เข้าร่วมเลย" : "เข้าร่วมการประชุม"}
                            </a>
                            <button
                              type="button"
                              className="p-1.5 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  window.location.origin + meetingUrl
                                );
                                toast.success("คัดลอกลิงก์แล้ว!");
                              }}
                              title="คัดลอกลิงก์เข้าร่วม"
                            >
                              <Clipboard className="w-3.5 h-3.5 text-stone-600" />
                            </button>
                            <div className="relative group">
                              <button
                                onClick={() =>
                                  setCancelModal({
                                    open: true,
                                    meetingId: meeting.id,
                                  })
                                }
                                className="p-1.5 text-red-600 hover:bg-red-100 rounded-full transition-colors cursor-pointer"
                                type="button"
                                title="ยกเลิกการประชุม"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                              <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 rounded bg-stone-800 text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 whitespace-nowrap">
                                ยกเลิกการประชุม
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center text-xs text-stone-600">
                          <Calendar className="w-3.5 h-3.5 mr-1" />
                          <span>{formatDateTime(meeting.startTime)}</span>
                          <span className="mx-1">-</span>
                          <span>{formatTime(meeting.endTime)}</span>
                        </div>
                        <AttendeesTooltip
                          organizer={meeting.organizer}
                          attendees={meeting.attendees}
                        >
                          <div className="flex items-center text-xs text-stone-600 cursor-help">
                            <Info className="w-3.5 h-3.5 mr-1" />
                            <span>
                              {meeting.attendees?.length || 0} คนเข้าร่วม
                            </span>
                          </div>
                        </AttendeesTooltip>
                        {meeting.description && (
                          <p className="text-xs text-stone-500 line-clamp-2">
                            {meeting.description}
                          </p>
                        )}
                      </div>

                      {isPast &&
                        meeting.useFireflies &&
                        !meeting.firefliesSent && (
                          <div className="flex items-center space-x-2 mt-2">
                            <div className="w-2 h-2 bg-stone-400 rounded-full animate-pulse"></div>
                            <span className="text-xs text-stone-600">
                              กำลังประมวลผล...
                            </span>
                          </div>
                        )}

                      {isPast && meeting.meetingNotes && (
                        <div className="flex items-center space-x-2 mt-2">
                          <div className="w-2 h-2 bg-stone-600 rounded-full"></div>
                          <a
                            href="#"
                            className="text-xs text-stone-600 hover:text-stone-800 hover:underline"
                            onClick={(e) => {
                              e.preventDefault();
                              setViewMeeting(meeting);
                              setViewTab("transcript");
                            }}
                          >
                            ดูบันทึกการประชุม
                          </a>
                        </div>
                      )}

                      {isUpcoming &&
                        isOrganizer &&
                        !meeting.slideText &&
                        !meeting.Cancelled && (
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              className="flex items-center gap-2 text-xs text-stone-700 bg-white border border-stone-200 rounded-xl px-3 py-1 hover:bg-stone-50 hover:border-stone-400 transition cursor-pointer font-medium"
                              onClick={() =>
                                handleOpenSlideUploadModal(meeting)
                              }
                            >
                              <UploadCloud className="w-4 h-4" />
                              <span>อัปโหลดสไลด์ (pptx)</span>
                              <span className="ml-2 px-2 py-0.5 bg-yellow-400 text-white text-[10px] rounded-full font-semibold tracking-wider align-middle">
                              PREMIUM
                              </span>
                            </button>
                            <span className="relative group">
                              <Info className="w-4 h-4 text-stone-400 group-hover:text-stone-700 cursor-pointer" />
                              <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 hidden group-hover:block bg-white border border-stone-200 rounded-xl shadow-lg p-3 text-xs text-stone-800 w-64">
                                อัปโหลดไฟล์สไลด์ (.pptx) เพื่อให้ AI
                                เข้าใจเนื้อหาการประชุมและช่วยสรุปได้แม่นยำยิ่งขึ้น
                              </span>
                            </span>
                          </div>
                        )}
                    </div>
                  </React.Fragment>
                );
              })}
              {filteredTotalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-6">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1 rounded-2xl text-xs bg-stone-100 hover:bg-stone-200 disabled:opacity-50 cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-stone-500">
                    Page {page} of {filteredTotalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === filteredTotalPages}
                    className="px-3 py-1 rounded-2xl text-xs bg-stone-100 hover:bg-stone-200 disabled:opacity-50 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      <div className="fixed bottom-6 left-6 z-50">
        <button
          onClick={handleChangeEmail}
          className="w-12 h-12 rounded-full bg-stone-200 hover:bg-stone-300 flex items-center justify-center shadow-lg transition-colors cursor-pointer"
          title="ล้างอีเมล"
        >
          <LogOut className="w-6 h-6 text-stone-700" />
        </button>
      </div>

      {uploadMeeting && (
        <UploadModal
          meeting={uploadMeeting}
          onClose={() => setUploadMeeting(null)}
          onSuccess={refetch}
        />
      )}

      {slideUploadMeeting && (
        <SlideUploadModal
          meeting={slideUploadMeeting}
          onClose={handleCloseSlideUploadModal}
          onSuccess={handleSlideUploadSuccess}
        />
      )}

      {/* Modal for viewing transcript/notes */}
      {viewMeeting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-white via-stone-50 to-stone-100 rounded-3xl shadow-2xl p-0 max-w-lg w-full relative border border-stone-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-stone-100 rounded-t-3xl">
              <div className="flex items-center gap-2">
                <Info className="w-6 h-6 text-stone-700" />
                <div>
                  <div className="font-semibold text-base text-stone-800">
                    {viewMeeting.title}
                  </div>
                  <div className="text-xs text-stone-500">
                    {viewMeeting.platform} |{" "}
                    {viewMeeting.startTime &&
                      new Date(viewMeeting.startTime).toLocaleString("th-TH")}
                  </div>
                </div>
              </div>
              <button
                className="p-2 rounded-full hover:bg-stone-200 transition"
                onClick={() => setViewMeeting(null)}
              >
                <X className="w-5 h-5 text-stone-500" />
              </button>
            </div>
            {/* Tabs */}
            <div className="flex space-x-2 px-6 pt-4">
              <button
                className={`flex-1 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                  viewTab === "transcript"
                    ? "bg-stone-800 text-white shadow"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
                onClick={() => setViewTab("transcript")}
              >
                <FileText className="inline-block w-4 h-4 mr-1" />
                Transcript <span className="ml-2 px-2 py-0.5 bg-yellow-400 text-white text-[10px] rounded-full font-semibold tracking-wider align-middle">PREMIUM</span>
              </button>
              <button
                className={`flex-1 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                  viewTab === "notes"
                    ? "bg-stone-800 text-white shadow"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
                onClick={() => setViewTab("notes")}
              >
                <FileCheck className="inline-block w-4 h-4 mr-1" />
                สรุปประชุม
              </button>
            </div>
            {/* Content */}
            <div className="px-6 pb-6 pt-4 max-h-80 overflow-y-auto custom-scrollbar">
              {viewTab === "transcript" ? (
                viewMeeting.transcript ? (
                  <div className="whitespace-pre-wrap text-sm text-stone-800">
                    {viewMeeting.transcript}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-stone-400 py-8">
                    <span className="text-3xl mb-2">🗒️</span>
                    <span className="text-sm">ไม่มี Transcript
                    </span>
                  </div>
                )
              ) : viewMeeting.meetingNotes ? (
                <div className="whitespace-pre-wrap text-sm text-stone-800">
                  {viewMeeting.meetingNotes}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-stone-400 py-8">
                  <span className="text-3xl mb-2">📄</span>
                  <span className="text-sm">ไม่มีสรุปประชุม</span>
                </div>
              )}
            </div>
          </div>
          {/* Custom scrollbar style */}
          <style jsx global>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 8px;
              background: #f3f4f6;
              border-radius: 8px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #d1d5db;
              border-radius: 8px;
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
