"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Upload, FileAudio, Check, X, Plus, ArrowLeft, Play, Pause, Calendar, Video } from "lucide-react"
import toast, { Toaster } from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

type FormState = "form" | "preview" | "submitting" | "success"

export default function MeetingAudioUpload() {
  const [formState, setFormState] = useState<FormState>("form")
  const [formData, setFormData] = useState({
    name: "",
    team: "",
    email: "",
    meetingDate: new Date().toISOString().split("T")[0],
    meetingTopic: "",
    audioFile: null as File | null,
  })
  const [teamEmails, setTeamEmails] = useState<string[]>([])
  const [newTeamEmail, setNewTeamEmail] = useState("")
  const [isDragOver, setIsDragOver] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [resultLink, setResultLink] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Create audio URL when file is selected
  useEffect(() => {
    if (formData.audioFile) {
      const url = URL.createObjectURL(formData.audioFile)
      setAudioUrl(url)
      return () => {
        URL.revokeObjectURL(url)
      }
    }
  }, [formData.audioFile])

  // Handle audio play/pause
  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  // Update audio play state when audio ends
  const handleAudioEnded = () => {
    setIsPlaying(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileSelect = (file: File) => {
    const allowedTypes = ["audio/mp3", "audio/wav", "audio/m4a", "audio/mpeg", "audio/x-m4a"]
    if (allowedTypes.includes(file.type) || file.name.match(/\.(mp3|wav|m4a)$/i)) {
      setFormData((prev) => ({ ...prev, audioFile: file }))
      toast.success("เพิ่มไฟล์เสียงเรียบร้อยแล้ว")
    } else {
      toast.error("กรุณาเลือกไฟล์เสียงที่รองรับ (.mp3, .wav, .m4a)")
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleAddTeamEmail = () => {
    if (!newTeamEmail) return

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newTeamEmail)) {
      toast.error("กรุณาใส่อีเมลที่ถูกต้อง")
      return
    }

    if (teamEmails.includes(newTeamEmail)) {
      toast.error("อีเมลนี้ถูกเพิ่มไปแล้ว")
      return
    }

    setTeamEmails([...teamEmails, newTeamEmail])
    setNewTeamEmail("")
    toast.success("เพิ่มสมาชิกเรียบร้อยแล้ว")
  }

  const handleRemoveTeamEmail = (index: number) => {
    const updatedEmails = [...teamEmails]
    updatedEmails.splice(index, 1)
    setTeamEmails(updatedEmails)
    toast.success("ลบสมาชิกเรียบร้อยแล้ว")
  }

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name) {
      toast.error("กรุณาใส่ชื่อของคุณ")
      return
    }

    if (!formData.email) {
      toast.error("กรุณาใส่อีเมลของคุณ")
      return
    }

    if (!formData.audioFile) {
      toast.error("กรุณาอัพโหลดไฟล์เสียงการประชุม")
      return
    }

    setFormState("preview")
  }

  const handleSubmit = async () => {
    setFormState("submitting")
    setProgress(0)

    try {
      const submitData = new FormData()
      submitData.append("name", formData.name)
      submitData.append("team", formData.team)
      submitData.append("email", formData.email)
      submitData.append("meetingDate", formData.meetingDate)
      submitData.append("meetingTopic", formData.meetingTopic)
      submitData.append("audioFile", formData.audioFile!)

      teamEmails.forEach((email, index) => {
        submitData.append(`teamEmail_${index}`, email)
      })

      // Progress simulation
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + Math.random() * 15
          return newProgress > 90 ? 90 : newProgress
        })
      }, 500)

      // Send to actual webhook
      const response = await fetch("https://g2.pupa-ai.com/webhook/meeting-upload", {
        method: "POST",
        body: submitData,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Try to get response data
      let responseData
      try {
        responseData = await response.json()
      } catch (e) {
        // If response is not JSON, that's okay
        responseData = { success: true }
      }

      setProgress(100)

      // Set result link if provided in response
      if (responseData.resultLink || responseData.summaryUrl) {
        setResultLink(responseData.resultLink || responseData.summaryUrl)
      } else {
        // Fallback result link
        setResultLink("https://g2.pupa-ai.com/summary/" + Date.now())
      }

      setTimeout(() => {
        setFormState("success")
        toast.success("ส่งข้อมูลสำเร็จแล้ว")
      }, 500)
    } catch (error) {
      console.error("Submission error:", error)

      let errorMessage = "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"

      if (error instanceof Error) {
        if (error.message.includes("500")) {
          errorMessage = "เซิร์ฟเวอร์มีปัญหา กรุณาลองใหม่ในภายหลัง"
        } else if (error.message.includes("404")) {
          errorMessage = "ไม่พบ endpoint กรุณาติดต่อผู้ดูแลระบบ"
        } else if (error.message.includes("NetworkError") || error.message.includes("Failed to fetch")) {
          errorMessage = "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต"
        }
      }

      toast.error(errorMessage)
      setFormState("preview")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      team: "",
      email: "",
      meetingDate: new Date().toISOString().split("T")[0],
      meetingTopic: "",
      audioFile: null,
    })
    setTeamEmails([])
    setFormState("form")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Format date to Thai format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
  }

  // Render form
  if (formState === "form") {
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
          className="w-full max-w-md bg-white/90 rounded-3xl shadow-lg border border-stone-200"
        >
          {/* Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="p-6 pb-3 border-b border-stone-100"
          >
            <h1 className="text-lg font-normal text-stone-800">สรุปเสียงการประชุม</h1>
            <p className="text-xs text-stone-500 mt-1">อัพโหลดไฟล์เสียงการประชุมเพื่อถอดความและสรุปอัตโนมัติ</p>

            {/* Navigation Links */}
            <div className="flex space-x-2 mt-3">
              <Link href="/create-meeting">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-1 px-3 py-1 bg-stone-100 hover:bg-stone-200 rounded-2xl text-xs text-stone-700 transition-colors"
                >
                  <Video className="w-3 h-3" />
                  <span>สร้าง Meeting</span>
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
              <Link href="/meetings">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-1 px-3 py-1 bg-stone-100 hover:bg-stone-200 rounded-2xl text-xs text-stone-700 transition-colors"
                >
                  <Calendar className="w-3 h-3" />
                  <span>จัดการ Meeting</span>
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="p-6"
          >
            <form onSubmit={handlePreview} className="space-y-4">
              {/* File Upload */}
              <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }} className="space-y-1">
                <label className="block text-xs text-stone-600 font-normal">อัพโหลดไฟล์เสียงการประชุม *</label>
                <motion.div
                  whileHover={{ borderColor: "#a8a29e" }}
                  transition={{ duration: 0.2 }}
                  className={`border border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                    isDragOver ? "border-stone-400 bg-stone-50 scale-105" : "border-stone-300 hover:bg-stone-25"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".mp3,.wav,.m4a,audio/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <AnimatePresence mode="wait">
                    {formData.audioFile ? (
                      <motion.div
                        key="file-selected"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center justify-center space-x-2"
                      >
                        <FileAudio className="w-4 h-4 text-stone-600" />
                        <span className="text-xs text-stone-700">{formData.audioFile.name}</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="file-empty"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-2"
                      >
                        <motion.div
                          animate={{ y: [0, -2, 0] }}
                          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                        >
                          <Upload className="w-5 h-5 text-stone-500 mx-auto" />
                        </motion.div>
                        <div>
                          <p className="text-xs text-stone-600">ลากและวางหรือคลิกเพื่อเลือกไฟล์เสียง</p>
                          <p className="text-xs text-stone-400 mt-1">รองรับ .mp3, .wav, .m4a</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>

              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                  className="space-y-1"
                >
                  <label className="block text-xs text-stone-600 font-normal">ชื่อของคุณ *</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="เช่น สมชาย จ."
                    required
                    className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition-all duration-200"
                  />
                </motion.div>

                {/* Team / Department */}
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                  className="space-y-1"
                >
                  <label className="block text-xs text-stone-600 font-normal">ทีมหรือแผนก</label>
                  <input
                    name="team"
                    value={formData.team}
                    onChange={handleInputChange}
                    placeholder="เช่น การตลาด"
                    className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition-all duration-200"
                  />
                </motion.div>
              </div>

              {/* Email */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.3 }}
                className="space-y-1"
              >
                <label className="block text-xs text-stone-600 font-normal">อีเมลของคุณ *</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  required
                  className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition-all duration-200"
                />
              </motion.div>

              {/* Team Emails */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.3 }}
                className="space-y-1"
              >
                <label className="block text-xs text-stone-600 font-normal">สมาชิกในทีม</label>

                <div className="flex space-x-2">
                  <input
                    type="email"
                    value={newTeamEmail}
                    onChange={(e) => setNewTeamEmail(e.target.value)}
                    placeholder="team.member@example.com"
                    className="flex-1 px-3 py-1.5 text-xs border border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition-all duration-200"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleAddTeamEmail}
                    className="px-2 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-2xl transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </motion.button>
                </div>

                <AnimatePresence>
                  {teamEmails.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-2 max-h-24 overflow-y-auto"
                    >
                      {teamEmails.map((email, index) => (
                        <motion.div
                          key={email}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: 20, opacity: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          className="flex items-center justify-between bg-stone-50 px-2 py-1 rounded-2xl border border-stone-100 mb-1"
                        >
                          <span className="text-xs text-stone-700">{email}</span>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            onClick={() => handleRemoveTeamEmail(index)}
                            className="text-stone-400 hover:text-stone-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </motion.button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <div className="grid grid-cols-2 gap-4">
                {/* Meeting Date */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.3 }}
                  className="space-y-1"
                >
                  <label className="block text-xs text-stone-600 font-normal">วันที่ประชุม *</label>
                  <input
                    name="meetingDate"
                    type="date"
                    value={formData.meetingDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition-all duration-200"
                  />
                </motion.div>

                {/* Meeting Topic */}
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.9, duration: 0.3 }}
                  className="space-y-1"
                >
                  <label className="block text-xs text-stone-600 font-normal">หัวข้อการประชุม</label>
                  <input
                    name="meetingTopic"
                    value={formData.meetingTopic}
                    onChange={handleInputChange}
                    placeholder="เช่น วางแผน Q2"
                    className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition-all duration-200"
                  />
                </motion.div>
              </div>

              {/* Submit Button */}
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.3 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-stone-800 hover:bg-stone-900 text-white font-normal py-2 px-4 rounded-2xl transition-all duration-200 text-xs mt-2"
              >
                ตรวจสอบข้อมูล
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  // Render preview
  if (formState === "preview") {
    return (
      <div className="min-h-screen paper-bg flex items-center justify-center p-4">
        <Toaster position="top-right" />

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md bg-white/90 rounded-3xl shadow-lg border border-stone-200"
        >
          {/* Header */}
          <div className="p-6 pb-3 border-b border-stone-100">
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setFormState("form")}
                className="p-1 rounded-full hover:bg-stone-100"
              >
                <ArrowLeft className="w-4 h-4" />
              </motion.button>
              <h1 className="text-lg font-normal text-stone-800">ตรวจสอบข้อมูล</h1>
            </div>
            <p className="text-xs text-stone-500 mt-1">กรุณาตรวจสอบข้อมูลก่อนส่ง</p>
          </div>

          {/* Preview Content */}
          <div className="p-6 space-y-6">
            {/* Audio Preview */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
              <div className="flex items-center space-x-3 mb-3">
                <FileAudio className="w-5 h-5 text-stone-600" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-stone-700">{formData.audioFile?.name}</p>
                  <p className="text-xs text-stone-500">
                    {formData.audioFile && formatFileSize(formData.audioFile.size)}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleAudio}
                  className="w-8 h-8 flex items-center justify-center bg-stone-200 hover:bg-stone-300 rounded-full"
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </motion.button>
              </div>

              {audioUrl && <audio ref={audioRef} src={audioUrl} onEnded={handleAudioEnded} className="hidden" />}

              {isPlaying && (
                <div className="w-full h-1 bg-stone-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{
                      duration: audioRef.current?.duration || 30,
                      ease: "linear",
                    }}
                    className="h-full bg-stone-500"
                  />
                </div>
              )}
            </div>

            {/* Form Data Preview */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-stone-500">ชื่อ</p>
                  <p className="text-sm text-stone-800">{formData.name}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500">ทีม/แผนก</p>
                  <p className="text-sm text-stone-800">{formData.team || "-"}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-stone-500">อีเมล</p>
                <p className="text-sm text-stone-800">{formData.email}</p>
              </div>

              {teamEmails.length > 0 && (
                <div>
                  <p className="text-xs text-stone-500">สมาชิกในทีม ({teamEmails.length} คน)</p>
                  <div className="mt-1 max-h-20 overflow-y-auto">
                    {teamEmails.map((email, index) => (
                      <p key={index} className="text-xs text-stone-700 mb-1">
                        {email}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-stone-500">วันที่ประชุม</p>
                  <p className="text-sm text-stone-800">{formatDate(formData.meetingDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500">หัวข้อการประชุม</p>
                  <p className="text-sm text-stone-800">{formData.meetingTopic || "-"}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setFormState("form")}
                className="py-2 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-2xl text-xs"
              >
                กลับไปแก้ไข
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                className="py-2 px-4 bg-stone-800 hover:bg-stone-900 text-white rounded-2xl text-xs"
              >
                ยืนยันและส่งเลย
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
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
            กำลังสรุปผล...
          </motion.h2>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="text-sm text-stone-600 mb-6"
          >
            กรุณารอสักครู่ ระบบกำลังประมวลผลไฟล์เสียงของคุณ
          </motion.p>

          <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-stone-600 rounded-full"
            />
          </div>

          <p className="text-xs text-stone-500 mt-2">{Math.round(progress)}%</p>
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
          ส่งข้อมูลสำเร็จแล้ว
        </motion.h2>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="text-sm text-stone-600 mb-6"
        >
          ไฟล์เสียงการประชุมของคุณถูกส่งไปเพื่อถอดความและสรุปเรียบร้อยแล้ว
        </motion.p>

        {resultLink && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="mb-6"
          >
            <p className="text-xs text-stone-500 mb-2">คุณสามารถดูผลสรุปได้ที่ลิงก์นี้</p>
            <a
              href={resultLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-stone-800 bg-stone-100 hover:bg-stone-200 py-2 px-4 rounded-2xl inline-block transition-colors"
            >
              ดูผลสรุปการประชุม
            </a>
          </motion.div>
        )}

        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={resetForm}
          className="text-xs text-stone-500 hover:text-stone-700 transition-colors"
        >
          ส่งไฟล์เสียงใหม่
        </motion.button>
      </motion.div>
    </div>
  )
}
