"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Calendar, Clock, Video, Check } from "lucide-react"
import toast, { Toaster } from "react-hot-toast"
import Link from "next/link"

type FormState = "form" | "submitting" | "success"

interface MeetingResponse {
  meetingLink?: string
  meetingId?: string
  platform?: string
  title?: string
  startTime?: string
  endTime?: string
  success?: boolean
  error?: string
}

export default function CreateMeeting() {
  const [formState, setFormState] = useState<FormState>("form")
  const PARTICIPANT_CHOICES = [
    { id: "sel594klOeTQJywxl", name: "patt@patt.com", color: "#f9a8d4" },
    { id: "selQRrcNNL8T4HsqA", name: "patt@test.com1", color: "#c4b5fd" },
    { id: "selp7yC9j3rzaHa6t", name: "test@test.com", color: "#fca5a5" },
    { id: "selZ2vb1L3e4sTlRv", name: "pattlnwza@dev.com", color: "#fdba74" },
    { id: "selQ0ry5ld3J6bXnw", name: "dev@dev.com", color: "#e5e7eb" },
  ]
  const ORGANIZER_CHOICES = [
    { id: "org1", name: "patt@example.com", color: "#f9a8d4" },
    { id: "org221", name: "dev@dev2.com", color: "#f9a8d4" }

  ]
  const [formData, setFormData] = useState<{
    platform: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    attendees: string[];
    organizer: string;
    sendEmail: boolean;
  }>({
    platform: "Google Meet",
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    attendees: [],
    organizer: "",
    sendEmail: true,
  })
  const [meetingResponse, setMeetingResponse] = useState<MeetingResponse | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData((prev) => ({ ...prev, [name]: checked }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleAttendeesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, option => option.value)
    setFormData(prev => ({ ...prev, attendees: selected }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title) {
      toast.error("กรุณาใส่หัวข้อการประชุม")
      return
    }

    if (!formData.startTime) {
      toast.error("กรุณาเลือกวันเวลาเริ่มประชุม")
      return
    }

    if (!formData.endTime) {
      toast.error("กรุณาเลือกวันเวลาสิ้นสุด")
      return
    }

    if (new Date(formData.endTime) <= new Date(formData.startTime)) {
      toast.error("เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น")
      return
    }

    if (!formData.organizer) {
      toast.error("กรุณาเลือกผู้จัดการประชุม")
      return
    }

    setFormState("submitting")

    try {
      // Parse attendees email list
      const attendeesList = formData.attendees.map(
        (id: string) => PARTICIPANT_CHOICES.find(c => c.id === id)?.name
      ).filter(Boolean)

      // Parse organizer email
      const organizerEmail = ORGANIZER_CHOICES.find(c => c.id === formData.organizer)?.name || ""

      const randomId = Math.random().toString(36).substring(2, 12)

      const submitData = {
        id: randomId,
        platform: formData.platform,
        title: formData.title,
        description: formData.description,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        attendees: attendeesList,
        organizer: organizerEmail,
        sendEmail: formData.sendEmail,
      }

      console.log("Sending data to API:", submitData)

      // ส่งข้อมูลไปยัง API Route แทนที่จะส่งไปยัง webhook โดยตรง
      const response = await fetch("/api/create-meeting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      })

      console.log("API Response status:", response.status)

      let responseData
      try {
        responseData = await response.json()
        console.log("API Response data:", responseData)
      } catch (e) {
        console.error("Failed to parse response JSON:", e)
        throw new Error("Invalid response format")
      }

      if (!response.ok) {
        console.error("API Error:", responseData)
        throw new Error(responseData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      setMeetingResponse(responseData)
      setFormState("success")
      toast.success("สร้าง Meeting สำเร็จแล้ว")
    } catch (error) {
      console.error("Meeting creation error:", error)

      let errorMessage = "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"

      if (error instanceof Error) {
        if (error.message.includes("500")) {
          errorMessage = "เซิร์ฟเวอร์มีปัญหาภายใน - กรุณาติดต่อผู้ดูแลระบบหรือลองใหม่ในภายหลัง"
        } else if (error.message.includes("404")) {
          errorMessage = "ไม่พบ API endpoint - กรุณาติดต่อผู้ดูแลระบบ"
        } else if (error.message.includes("403")) {
          errorMessage = "ไม่มีสิทธิ์เข้าถึง - กรุณาตรวจสอบการตั้งค่า"
        } else if (error.message.includes("400")) {
          errorMessage = "ข้อมูลที่ส่งไม่ถูกต้อง - กรุณาตรวจสอบข้อมูลที่กรอก"
        } else if (error.message.includes("Webhook error")) {
          errorMessage = "ระบบ webhook มีปัญหา - กรุณาติดต่อผู้ดูแลระบบ"
        } else if (error.message.includes("NetworkError") || error.message.includes("Failed to fetch")) {
          errorMessage = "ไม่สามารถเชื่อมต่อได้ - กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต"
        } else {
          errorMessage = error.message
        }
      }

      toast.error(errorMessage)
      setFormState("form")
    }
  }

  const resetForm = () => {
    setFormData({
      platform: "Google Meet",
      title: "",
      description: "",
      startTime: "",
      endTime: "",
      attendees: [],
      organizer: "",
      sendEmail: true,
    })
    setMeetingResponse(null)
    setFormState("form")
  }

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString)
    return date.toLocaleString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Render form
  if (formState === "form") {
    return (
      <>
        <style>{`
          select[multiple] option:checked {
            background: #f3e8ff !important;
            color: #7c3aed !important;
            font-weight: bold;
          }
          select[multiple] option {
            /* Try to color the dot using a span, but native select doesn't support HTML, so fallback to gray dot */
          }
        `}</style>
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
            className="w-full max-w-md bg-white/90 rounded-3xl shadow-lg border border-stone-200"
          >
            {/* Header */}
            <div className="p-6 pb-3 border-b border-stone-100">
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
                <h1 className="text-lg font-normal text-stone-800">สร้าง Meeting</h1>
              </div>
              <p className="text-xs text-stone-500 mt-1">สร้างการประชุมออนไลน์ใหม่</p>
            </div>

            {/* Form */}
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Platform */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-1"
                >
                  <label className="block text-xs text-stone-600 font-normal">แพลตฟอร์ม *</label>
                  <select
                    name="platform"
                    value={formData.platform}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition-all duration-200"
                  >
                    <option value="Google Meet">Google Meet</option>
                    <option value="Zoom">Zoom</option>
                    <option value="MS Teams">MS Teams</option>
                  </select>
                </motion.div>

                {/* Title */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-1"
                >
                  <label className="block text-xs text-stone-600 font-normal">หัวข้อการประชุม *</label>
                  <input
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="เช่น ประชุมวางแผน Q2"
                    required
                    className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition-all duration-200"
                  />
                </motion.div>

                {/* Description */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-1"
                >
                  <label className="block text-xs text-stone-600 font-normal">รายละเอียดเพิ่มเติม</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="รายละเอียดการประชุม..."
                    rows={3}
                    className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition-all duration-200 resize-none"
                  />
                </motion.div>

                {/* Start Time */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-1"
                >
                  <label className="block text-xs text-stone-600 font-normal">วันเวลาเริ่มประชุม *</label>
                  <input
                    name="startTime"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition-all duration-200"
                  />
                </motion.div>

                {/* End Time */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-1"
                >
                  <label className="block text-xs text-stone-600 font-normal">วันเวลาสิ้นสุด *</label>
                  <input
                    name="endTime"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition-all duration-200"
                  />
                </motion.div>

                {/* Organizer */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-1"
                >
                  <label className="block text-xs text-stone-600 font-normal">เลือกผู้จัดการประชุม *</label>
                  <select
                    name="organizer"
                    value={formData.organizer}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition-all duration-200"
                  >
                    <option value="">-- เลือกผู้จัดการประชุม --</option>
                    {ORGANIZER_CHOICES.map(choice => (
                      <option key={choice.id} value={choice.id}>
                        {String.fromCharCode(9679)} {choice.name}
                      </option>
                    ))}
                  </select>
                </motion.div>

                {/* Attendees */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-1"
                >
                  <label className="block text-xs text-stone-600 font-normal">เลือกผู้เข้าร่วมประชุม</label>
                  <select
                    name="attendees"
                    multiple
                    size={3}
                    value={formData.attendees}
                    onChange={handleAttendeesChange}
                    className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition-all duration-200"
                  >
                    {PARTICIPANT_CHOICES.map(choice => (
                      <option key={choice.id} value={choice.id}>
                        {String.fromCharCode(9679)} {choice.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-stone-400">เลือกได้หลายคน (กด Ctrl หรือ Cmd ค้างไว้)</p>
                </motion.div>

                {/* Send Email Toggle */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-1"
                >
                  <label className="block text-xs text-stone-600 font-normal">ส่งอีเมลแจ้งเตือน</label>
                  <div className="flex items-center space-x-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="sendEmail"
                        className="sr-only peer"
                        checked={formData.sendEmail}
                        onChange={handleInputChange}
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-gray-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-800"></div>
                      <span className="ml-3 text-xs text-gray-700 font-medium">ส่งอีเมลแจ้งเตือน</span>
                    </label>
                  </div>
                  <p className="text-xs text-stone-400">ส่งอีเมลแจ้งเตือนไปยังผู้เข้าร่วมประชุม</p>
                </motion.div>

                {/* Submit Button */}
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full bg-stone-800 hover:bg-stone-900 text-white font-normal py-2 px-4 rounded-2xl transition-all duration-200 text-xs mt-2 cursor-pointer"
                >
                  สร้าง Meeting
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>
      </>
    )
  }

  // Render submitting state
  if (formState === "submitting") {
    return (
      <div className="min-h-screen paper-bg flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md bg-white/90 rounded-3xl shadow-lg border border-stone-200 p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full"
            />
          </motion.div>

          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="text-lg font-normal text-stone-800 mb-2"
          >
            กำลังสร้าง Meeting...
          </motion.h2>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="text-sm text-stone-600"
          >
            กรุณารอสักครู่ ระบบกำลังสร้างการประชุมของคุณ
          </motion.p>
        </motion.div>
      </div>
    )
  }

  // Render success state
  return (
    <div className="min-h-screen paper-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white/90 rounded-3xl shadow-lg border border-stone-200 p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3, ease: "easeOut" }}
          className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Check className="w-6 h-6 text-green-600" />
        </motion.div>

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="text-lg font-normal text-stone-800 mb-2"
        >
          สร้าง Meeting สำเร็จแล้ว
        </motion.h2>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="text-sm text-stone-600 mb-6"
        >
          การประชุมของคุณถูกสร้างเรียบร้อยแล้ว
        </motion.p>

        {/* Meeting Details */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="bg-stone-50 p-4 rounded-2xl border border-stone-100 mb-6 text-left"
        >
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Video className="w-4 h-4 text-stone-600" />
              <div>
                <p className="text-xs text-stone-500">แพลตฟอร์ม</p>
                <p className="text-sm text-stone-800">{meetingResponse?.platform || formData.platform}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-stone-600" />
              <div>
                <p className="text-xs text-stone-500">หัวข้อ</p>
                <p className="text-sm text-stone-800">{meetingResponse?.title || formData.title}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-stone-600" />
              <div>
                <p className="text-xs text-stone-500">เวลา</p>
                <p className="text-sm text-stone-800">
                  {formatDateTime(meetingResponse?.startTime || formData.startTime)}
                </p>
                <p className="text-sm text-stone-800">
                  ถึง {formatDateTime(meetingResponse?.endTime || formData.endTime)}
                </p>
              </div>
            </div>

            {meetingResponse?.meetingLink && (
              <div className="pt-2">
                <a
                  href={meetingResponse.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-stone-800 bg-stone-100 hover:bg-stone-200 py-2 px-4 rounded-2xl inline-block transition-colors"
                >
                  เข้าร่วมการประชุม
                </a>
              </div>
            )}
          </div>
        </motion.div>

        <div className="flex space-x-3">
          <Link href="/calendar">
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="text-xs text-stone-500 hover:text-stone-700 transition-colors cursor-pointer"
            >
              ดูปฏิทิน
            </motion.button>
          </Link>
          <Link href="/meetings">
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.65, duration: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="text-xs text-stone-500 hover:text-stone-700 transition-colors cursor-pointer"
            >
              จัดการ Meeting
            </motion.button>
          </Link>
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={resetForm}
            className="text-xs text-stone-500 hover:text-stone-700 transition-colors cursor-pointer"
          >
            สร้าง Meeting ใหม่
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
