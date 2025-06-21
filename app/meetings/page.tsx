"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Edit, Trash2, Calendar, Clock, Plus, Clipboard } from "lucide-react"
import toast, { Toaster } from "react-hot-toast"
import Link from "next/link"
import { useQuery } from '@tanstack/react-query'

interface Meeting {
  id: string
  title: string
  platform: string
  startTime: string
  endTime: string
  description?: string
  attendees: string[]
  project: {
    name: string
    aiEnabled: boolean
  }
  audioUploaded?: boolean
}

type ViewState = "list" | "edit"

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
    attendees: [],
    project: {
      name: rec.fields.Project || '',
      aiEnabled: rec.fields['AI Enabled'] || false,
    },
  }))
}

export default function MeetingsManager() {
  const { data: meetings = [], isLoading, isError, error, refetch } = useQuery<Meeting[]>({
    queryKey: ['meetings'],
    queryFn: fetchMeetings,
    refetchOnWindowFocus: false,
  })

  const [viewState, setViewState] = useState<ViewState>("list")
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString)
    return date.toLocaleString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    return date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleEdit = (meeting: Meeting) => {
    setEditingMeeting({ ...meeting })
    setViewState("edit")
  }

  const handleDelete = async (meetingId: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบการประชุมนี้?")) {
      return
    }

    try {
      // In real app, this would be an API call
      refetch()
      toast.success("ลบการประชุมเรียบร้อยแล้ว")
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการลบการประชุม")
    }
  }

  const handleSaveEdit = async () => {
    if (!editingMeeting) return

    if (!editingMeeting.title) {
      toast.error("กรุณาใส่หัวข้อการประชุม")
      return
    }

    if (!editingMeeting.startTime) {
      toast.error("กรุณาเลือกวันเวลาเริ่มประชุม")
      return
    }

    if (!editingMeeting.endTime) {
      toast.error("กรุณาเลือกวันเวลาสิ้นสุด")
      return
    }

    if (new Date(editingMeeting.endTime) <= new Date(editingMeeting.startTime)) {
      toast.error("เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น")
      return
    }

    setIsSubmitting(true)

    try {
      // In real app, this would be an API call to update the meeting
      refetch()
      toast.success("แก้ไขการประชุมเรียบร้อยแล้ว")
      setViewState("list")
      setEditingMeeting(null)
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการแก้ไขการประชุม")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editingMeeting) return

    const { name, value } = e.target
    setEditingMeeting((prev) => (prev ? { ...prev, [name]: value } : null))
  }

  const handleAttendeesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingMeeting) return

    const attendeesList = e.target.value
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email)

    setEditingMeeting((prev) => (prev ? { ...prev, attendees: attendeesList } : null))
  }

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
                  setViewState("list")
                  setEditingMeeting(null)
                }}
                className="p-1 rounded-full hover:bg-stone-100"
              >
                <ArrowLeft className="w-4 h-4" />
              </motion.button>
              <h1 className="text-lg font-normal text-stone-800">แก้ไข Meeting</h1>
            </div>
            <p className="text-xs text-stone-500 mt-1">แก้ไขข้อมูลการประชุม</p>
          </div>

          {/* Edit Form */}
          <div className="p-6">
            <div className="space-y-4">
              {/* Platform */}
              <div className="space-y-1">
                <label className="block text-xs text-stone-600 font-normal">แพลตฟอร์ม *</label>
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
                <label className="block text-xs text-stone-600 font-normal">หัวข้อการประชุม *</label>
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
                <label className="block text-xs text-stone-600 font-normal">รายละเอียดเพิ่มเติม</label>
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
                <label className="block text-xs text-stone-600 font-normal">วันเวลาเริ่มประชุม *</label>
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
                <label className="block text-xs text-stone-600 font-normal">วันเวลาสิ้นสุด *</label>
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
                <label className="block text-xs text-stone-600 font-normal">อีเมลผู้เข้าร่วมประชุม</label>
                <input
                  name="attendees"
                  value={editingMeeting.attendees.join(", ")}
                  onChange={handleAttendeesChange}
                  placeholder="user1@email.com, user2@email.com"
                  className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition-all duration-200"
                />
                <p className="text-xs text-stone-400">แยกอีเมลด้วยเครื่องหมายจุลภาค (,)</p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setViewState("list")
                    setEditingMeeting(null)
                  }}
                  className="py-2 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-2xl text-xs"
                >
                  ยกเลิก
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveEdit}
                  disabled={isSubmitting}
                  className="py-2 px-4 bg-stone-800 hover:bg-stone-900 text-white rounded-2xl text-xs disabled:opacity-50"
                >
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // Render meetings list
  // Sort meetings: upcoming first, then past
  const now = new Date()
  const upcomingMeetings = meetings.filter(m => new Date(m.endTime) >= now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  const pastMeetings = meetings.filter(m => new Date(m.endTime) < now)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
  const sortedMeetings = [...upcomingMeetings, ...pastMeetings]

  // --- Pagination ---
  const PAGE_SIZE = 5
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(sortedMeetings.length / PAGE_SIZE)
  const paginatedMeetings = sortedMeetings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  // --- End Pagination ---

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
              <h1 className="text-lg font-normal text-stone-800">จัดการ Meeting</h1>
            </div>
            <div className="flex space-x-2">
              <Link href="/create-meeting">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-1 px-3 py-1 bg-stone-800 hover:bg-stone-900 text-white rounded-2xl text-xs transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>สร้างใหม่</span>
                </motion.button>
              </Link>
              <Link href="/calendar">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-1 px-3 py-1 bg-stone-100 hover:bg-stone-200 rounded-2xl text-xs text-stone-700 transition-colors"
                >
                  <Calendar className="w-3 h-3" />
                  <span>ปฏิทิน</span>
                </motion.button>
              </Link>
            </div>
          </div>
          <p className="text-xs text-stone-500 mt-1">แก้ไขและจัดการการประชุมทั้งหมด</p>
        </div>

        {/* Meetings List */}
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12 text-stone-500">กำลังโหลดข้อมูล...</div>
          ) : isError ? (
            <div className="text-center py-12 text-red-500">
              เกิดข้อผิดพลาดในการโหลดข้อมูล<br />
              <button onClick={() => refetch()} className="underline text-xs mt-2">ลองใหม่อีกครั้ง</button>
            </div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-stone-400 mx-auto mb-4" />
              <h3 className="text-sm font-medium text-stone-600 mb-2">ยังไม่มีการประชุม</h3>
              <p className="text-xs text-stone-500 mb-4">เริ่มต้นด้วยการสร้างการประชุมใหม่</p>
              <Link href="/create-meeting">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-1 px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-2xl text-xs mx-auto"
                >
                  <Plus className="w-3 h-3" />
                  <span>สร้าง Meeting แรก</span>
                </motion.button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedMeetings.map((meeting: Meeting, idx: number) => {
                const [audioUploading, setAudioUploading] = useState(false)
                const [audioFile, setAudioFile] = useState<File | null>(null)

                function AudioUploadPrompt({ meetingIdx }: { meetingIdx: number }) {
                  const [uploading, setUploading] = useState(false)
                  const [file, setFile] = useState<File | null>(null)
                  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setFile(e.target.files[0])
                    }
                  }
                  const handleUpload = () => {
                    if (!file) return
                    setUploading(true)
                    setTimeout(() => {
                      paginatedMeetings[meetingIdx].audioUploaded = true
                      setUploading(false)
                      toast.success("อัปโหลดไฟล์เสียงสำเร็จ!")
                    }, 1200)
                  }
                  return (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex flex-col items-start my-2">
                      <span className="text-xs text-red-700 font-semibold mb-1">โครงการนี้ไม่ได้เปิด AI กรุณาอัปโหลดไฟล์เสียงของการประชุมนี้</span>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleFileChange}
                        className="mb-2 text-xs"
                        disabled={uploading}
                      />
                      <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs disabled:opacity-50"
                      >
                        {uploading ? "กำลังอัปโหลด..." : "อัปโหลดไฟล์เสียง"}
                      </button>
                    </div>
                  )
                }

                const isPast = new Date(meeting.endTime) < now
                const meetingUrl = `/meetings/${meeting.id}`
                const needsAudioUpload = isPast && !meeting.project.aiEnabled && !meeting.audioUploaded
                return (
                  <div
                    key={meeting.id}
                    className={`bg-stone-50 p-2 rounded-2xl border border-stone-100 hover:bg-stone-100 transition-colors ${isPast ? 'opacity-60 grayscale' : ''} mb-2`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-stone-800">{meeting.title}</h3>
                          <span className="text-xs text-stone-500 bg-stone-200 px-2 py-1 rounded-full">
                            {meeting.platform}
                          </span>
                          <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full ml-2">{meeting.project.name}</span>
                          {isPast && (
                            <span className="text-xs text-white bg-stone-400 px-2 py-0.5 rounded-full ml-2">สิ้นสุดแล้ว</span>
                          )}
                          {!isPast && (
                            <>
                              <a
                                href={meetingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 px-3 py-1 bg-stone-800 hover:bg-stone-900 text-white rounded-2xl text-xs transition-colors font-medium flex items-center"
                                style={{ textDecoration: 'none' }}
                              >
                                เข้าร่วมการประชุม
                              </a>
                              <button
                                type="button"
                                className="ml-1 p-1 rounded hover:bg-stone-200"
                                onClick={() => {
                                  navigator.clipboard.writeText(window.location.origin + meetingUrl)
                                  toast.success("คัดลอกลิงก์แล้ว!")
                                }}
                                title="คัดลอกลิงก์เข้าร่วม"
                              >
                                <Clipboard className="w-3 h-3 inline" />
                              </button>
                            </>
                          )}
                        </div>
                        {needsAudioUpload && (
                          <AudioUploadPrompt meetingIdx={idx} />
                        )}


                        <div className="flex items-center space-x-4 text-xs text-stone-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDateTime(meeting.startTime)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                            </span>
                          </div>
                        </div>

                        {meeting.description && (
                          <p className="text-xs text-stone-600 line-clamp-2">{meeting.description}</p>
                        )}
                      </div>

                      <div className="flex space-x-2 ml-4">
                        {!isPast && (
                          <>
                            <motion.button
                              disabled
                              title="เร็วๆ นี้"
                              className="p-2 bg-stone-200 text-stone-400 rounded-full cursor-not-allowed relative group"
                            >
                              <Edit className="w-3 h-3" />
                              <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 text-xs bg-stone-700 text-white rounded px-2 py-0.5 opacity-0 group-hover:opacity-100 transition">เร็วๆ นี้</span>
                            </motion.button>
                            <motion.button
                              disabled
                              title="เร็วๆ นี้"
                              className="p-2 bg-red-100 text-red-300 rounded-full cursor-not-allowed relative group"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 text-xs bg-stone-700 text-white rounded px-2 py-0.5 opacity-0 group-hover:opacity-100 transition">เร็วๆ นี้</span>
                            </motion.button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
