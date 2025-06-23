"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Calendar, Clock, Video, Check, AlertCircle, Info } from "lucide-react"
import toast, { Toaster } from "react-hot-toast"
import Link from "next/link"

type FormState = "form" | "submitting" | "success"

interface AIRole {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const AI_ROLES: AIRole[] = [
  {
    id: "notetaker",
    name: "AI Notetaker",
    description: "จดบันทึกและสรุปประเด็นสำคัญจากการประชุม",
    icon: "📝"
  },
  {
    id: "action_tracker",
    name: "AI Action Tracker",
    description: "จับประเด็น Action Items และติดตามงานที่ได้รับมอบหมาย",
    icon: "📌"
  },
  {
    id: "risk_detector",
    name: "AI Risk Detector",
    description: "ตรวจจับความเสี่ยง การตัดสินใจที่อาจมีปัญหา และความขัดแย้ง",
    icon: "🔍"
  },
  {
    id: "time_keeper",
    name: "AI Time Keeper",
    description: "บริหารจัดการเวลา และแจ้งเตือนตามวาระการประชุม",
    icon: "⏱️"
  },
  {
    id: "sentiment_analyzer",
    name: "AI Sentiment Analyzer",
    description: "วิเคราะห์อารมณ์และท่าทีของผู้เข้าร่วมประชุม",
    icon: "🎭"
  },
  {
    id: "decision_logger",
    name: "AI Decision Logger",
    description: "บันทึกการตัดสินใจสำคัญและเหตุผลประกอบ",
    icon: "✅"
  },
  {
    id: "question_tracker",
    name: "AI Question Tracker",
    description: "จับประเด็นคำถามที่ยังไม่ได้รับคำตอบ",
    icon: "❓"
  }
];

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
  const [step, setStep] = useState(1);
  const [formState, setFormState] = useState<FormState>("form")
  const [showAIInfo, setShowAIInfo] = useState(false)
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
    aiRoles: string[];
    useFireflies: boolean;
  }>({
    platform: "Google Meet",
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    attendees: [],
    organizer: "",
    sendEmail: true,
    aiRoles: ["notetaker"],
    useFireflies: true
  })
  const [meetingResponse, setMeetingResponse] = useState<MeetingResponse | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      if (name === 'useFireflies') {
        setFormData(prev => ({ ...prev, useFireflies: checked }));
      } else if (name.startsWith('aiRole_')) {
        const roleId = name.replace('aiRole_', '')
        setFormData((prev) => ({
          ...prev,
          aiRoles: checked 
            ? [...prev.aiRoles, roleId]
            : prev.aiRoles.filter(id => id !== roleId)
        }))
      } else {
      setFormData((prev) => ({ ...prev, [name]: checked }))
      }
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
        useFireflies: formData.useFireflies,
        aiRoles: formData.aiRoles.map(roleId => ({
          id: roleId,
          name: AI_ROLES.find(r => r.id === roleId)?.name || '',
          description: AI_ROLES.find(r => r.id === roleId)?.description || ''
        }))
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
      aiRoles: ["notetaker"],
      useFireflies: true
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

  // Step 1: Meeting Info
  if (step === 1) {
    return (
        <div className="min-h-screen paper-bg flex items-center justify-center p-4">
        <motion.div className="w-full max-w-md bg-white/90 rounded-3xl shadow-lg border border-stone-200">
            <div className="p-6 pb-3 border-b border-stone-100">
                <h1 className="text-lg font-normal text-stone-800">สร้าง Meeting</h1>
            <p className="text-xs text-stone-500 mt-1">Step 1: ข้อมูลประชุม</p>
            </div>
            <div className="p-6">
            <form onSubmit={e => { e.preventDefault(); setStep(2); }} className="space-y-4">
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

              <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                className="space-y-1"
              >
                <label className="block text-xs text-stone-600 font-normal">สรุปอัตโนมัติ</label>
                <div className="flex items-center space-x-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="useFireflies"
                      className="sr-only peer"
                      checked={formData.useFireflies}
                      onChange={handleInputChange}
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-gray-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-800"></div>
                    <span className="ml-3 text-xs text-gray-700 font-medium">สรุปอัตโนมัติ</span>
                  </label>
                  <span className="relative group cursor-pointer">
                    <Info className="w-4 h-4 text-gray-400 group-hover:text-gray-700" />
                    {/* Tooltip */}
                    <span className="absolute left-0 top-full mt-2 z-50 hidden group-hover:block bg-white border border-stone-200 rounded-xl shadow-lg p-3 text-xs text-stone-800 w-64">
                      สรุปอัตโนมัติ คือฟีเจอร์ที่ช่วยถอดเสียงและสรุปเนื้อหาการประชุมให้อัตโนมัติหลังจบการประชุม คุณสามารถดูสรุปและข้อความที่ถอดเสียงได้ในแต่ละรายการประชุม
                    </span>
                  </span>
                </div>
                <p className="text-xs text-stone-400">เปิดไว้เพื่อให้ระบบช่วยสรุปและถอดเสียงประชุมให้อัตโนมัติ</p>
              </motion.div>

              <motion.button type="submit" className="w-full bg-stone-800 hover:bg-stone-900 text-white font-normal py-2 px-4 rounded-2xl transition-all duration-200 text-xs mt-2 cursor-pointer">ถัดไป</motion.button>
              </form>
            </div>
          </motion.div>
        </div>
    );
  }

  // Step 2: AI Assistant
  if (step === 2) {
    return (
      <div className="min-h-screen paper-bg flex items-center justify-center p-4">
        <motion.div className="w-full max-w-md bg-white/90 rounded-3xl shadow-lg border border-stone-200">
          <div className="p-6 pb-3 border-b border-stone-100">
            <h1 className="text-lg font-normal text-stone-800">AI Meeting Assistant</h1>
            <p className="text-xs text-stone-500 mt-1">Step 2: เลือก AI Assistant</p>
          </div>
          <div className="p-6 space-y-4">
            {/* Always-on Notetaker badge */}
            <span className="flex items-center gap-1 px-2 py-0.5 bg-stone-100 text-stone-700 text-xs rounded-full">
              <span className="text-base mr-1" role="img" aria-label="notetaker">📝</span>
              <span>AI Notetaker</span>
              <span className="ml-1 text-[10px] text-stone-400 leading-none">(บังคับ)</span>
            </span>
            {/* เลือก AI อื่น ๆ */}
            <div className="grid grid-cols-2 gap-3">
              {AI_ROLES.filter(r => r.id !== 'notetaker').map((role) => (
                <label key={role.id} className={`relative flex items-start p-3 rounded-xl border cursor-pointer transition-all ${formData.aiRoles.includes(role.id) ? 'border-stone-400 bg-stone-50' : 'border-stone-200 hover:border-stone-300'}`}> 
                  <input
                    type="checkbox"
                    name={`aiRole_${role.id}`}
                    checked={formData.aiRoles.includes(role.id)}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{role.icon}</span>
                      <span className="text-sm font-medium text-stone-800">{role.name}</span>
                    </div>
                    <p className="mt-1 text-xs text-stone-500">{role.description}</p>
                  </div>
                  <div className={`absolute top-3 right-3 w-4 h-4 rounded-full border flex items-center justify-center ${formData.aiRoles.includes(role.id) ? 'border-stone-500 bg-stone-500' : 'border-stone-300'}`}>
                    {formData.aiRoles.includes(role.id) && (<Check className="w-3 h-3 text-white" />)}
                  </div>
                </label>
              ))}
            </div>
            <div className="flex justify-between mt-4">
              <button type="button" onClick={() => setStep(1)} className="text-xs text-stone-500 hover:text-stone-700">ย้อนกลับ</button>
              <button type="button" onClick={() => setStep(3)} className="bg-stone-800 hover:bg-stone-900 text-white rounded-2xl px-4 py-1 text-xs">ถัดไป</button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Step 3: Preview
  if (step === 3) {
    return (
      <div className="min-h-screen paper-bg flex items-center justify-center p-4">
        <motion.div className="w-full max-w-md bg-white/90 rounded-3xl shadow-lg border border-stone-200">
          <div className="p-6 pb-3 border-b border-stone-100">
            <h1 className="text-lg font-normal text-stone-800">Preview</h1>
            <p className="text-xs text-stone-500 mt-1">Step 3: ตรวจสอบข้อมูลก่อนสร้าง Meeting</p>
          </div>
          <div className="p-6 space-y-4">
            {/* หัวข้อและแพลตฟอร์ม */}
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-stone-800">{formData.title}</span>
              <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-xs">{formData.platform}</span>
            </div>
            {/* เวลา */}
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <Calendar className="w-4 h-4" />
              <span>{formatDateTime(formData.startTime)} - {formatDateTime(formData.endTime)}</span>
            </div>
            {/* ผู้จัด */}
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-block w-4 h-4 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center mr-1" style={{fontSize: '13px'}}>👤</span>
              <span className="font-medium">{ORGANIZER_CHOICES.find(c => c.id === formData.organizer)?.name}</span>
            </div>
            {/* ผู้เข้าร่วม */}
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-block w-4 h-4 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center mr-1" style={{fontSize: '13px'}}>👥</span>
              <span>{formData.attendees.map(id => PARTICIPANT_CHOICES.find(c => c.id === id)?.name).filter(Boolean).join(', ')}</span>
            </div>
            {/* รายละเอียด */}
            {formData.description && (
              <div className="bg-stone-50 rounded-xl p-3 text-xs text-stone-600 border border-stone-100">
                {formData.description}
              </div>
            )}
            {/* AI Assistant */}
            <div>
              <span className="block text-xs text-stone-500 mb-1">AI Assistant</span>
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center gap-1 px-2 py-0.5 bg-stone-100 text-stone-700 text-xs rounded-full">
                  <span className="text-base mr-1" role="img" aria-label="notetaker">📝</span>
                  <span>AI Notetaker</span>
                  <span className="ml-1 text-[10px] text-stone-400 leading-none">(บังคับ)</span>
                </span>
                {AI_ROLES.filter(r => r.id !== 'notetaker' && formData.aiRoles.includes(r.id)).map(r => (
                  <span key={r.id} className="flex items-center gap-1 px-2 py-0.5 bg-stone-50 text-stone-700 text-xs rounded-full">
                    <span className="text-base">{r.icon}</span>
                    <span>{r.name}</span>
                  </span>
                ))}
              </div>
            </div>
            {/* ส่งอีเมล */}
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <span className="inline-block w-4 h-4 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center mr-1" style={{fontSize: '13px'}}>✉️</span>
              <span>ส่งอีเมลแจ้งเตือน: <b>{formData.sendEmail ? 'ใช่' : 'ไม่'}</b></span>
            </div>
            <div className="flex justify-between mt-4">
              <button type="button" onClick={() => setStep(2)} className="text-xs text-stone-500 hover:text-stone-700">ย้อนกลับ</button>
              <button type="button" onClick={handleSubmit} className="bg-stone-800 hover:bg-stone-900 text-white rounded-2xl px-4 py-1 text-xs">สร้าง Meeting</button>
            </div>
          </div>
        </motion.div>
      </div>
    );
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
