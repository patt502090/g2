"use client";
import { useState, useEffect } from "react";
import { X, UploadCloud, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

function getUserEmail() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userEmail') || '';
  }
  return '';
}

export default function SlideUploadModal({ meeting, onClose, onSuccess }: { meeting: any, onClose: () => void, onSuccess?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    setUserEmail(getUserEmail());
  }, []);

  if (!meeting) return null;

  const isOrganizer = userEmail.toLowerCase() === meeting.organizer?.toLowerCase();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOrganizer) {
      toast.error("คุณไม่มีสิทธิ์อัปโหลดไฟล์สไลด์สำหรับการประชุมนี้");
      return;
    }
    if (e.target.files) {
      setFile(e.target.files[0]);
      setUploadStatus("idle");
    }
  };

  const handleUpload = async () => {
    if (!file || !isOrganizer) return;
    setIsUploading(true);
    setUploadStatus("idle");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const url = `/api/upload-slide-proxy?meetingId=${encodeURIComponent(meeting.id)}`;
      const res = await fetch(url, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      setUploadStatus("success");
      if (onSuccess) onSuccess();
    } catch (error) {
      setUploadStatus("error");
    } finally {
      setIsUploading(false);
      setTimeout(() => onClose(), 1500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-white rounded-2xl shadow-lg w-full max-w-md relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-stone-800">อัปโหลดสไลด์ (pptx)</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-stone-100">
              <X className="w-5 h-5 text-stone-500" />
            </button>
          </div>
          <p className="text-sm text-stone-600 mb-1">
            สำหรับ Meeting: <span className="font-medium text-stone-800">{meeting.title}</span>
          </p>
          <p className="text-xs text-stone-500 mb-4">ID: {meeting.id}</p>
          {!isOrganizer ? (
            <div className="border-2 border-yellow-100 bg-yellow-50 rounded-xl p-6 text-center">
              <div className="flex justify-center mb-2">
                <AlertCircle className="w-8 h-8 text-yellow-500" />
              </div>
              <p className="text-sm text-yellow-700">
                คุณไม่มีสิทธิ์อัปโหลดไฟล์สไลด์สำหรับการประชุมนี้
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                เฉพาะผู้จัดการประชุมเท่านั้นที่สามารถอัปโหลดไฟล์สไลด์ได้
              </p>
            </div>
          ) : (
            <div>
              <label htmlFor="slide-upload" className="cursor-pointer group">
                <div className="border-2 border-dashed border-stone-300 rounded-xl p-6 text-center transition-colors group-hover:border-stone-400 group-hover:bg-stone-50">
                  <div className="flex justify-center mb-2">
                    <UploadCloud className="w-8 h-8 text-stone-400 group-hover:text-stone-500" />
                  </div>
                  {file ? (
                    <p className="text-sm text-stone-700">{file.name}</p>
                  ) : (
                    <p className="text-sm text-stone-500">
                      ลากและวางไฟล์ที่นี่ หรือ{" "}
                      <span className="font-medium text-stone-700">คลิกเพื่อเลือกไฟล์</span>
                    </p>
                  )}
                  <p className="text-xs text-stone-400 mt-1">รองรับไฟล์สไลด์ (PPT, PPTX)</p>
                </div>
              </label>
              <input
                id="slide-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".ppt,.pptx"
              />
            </div>
          )}
          {uploadStatus === "success" && (
            <p className="text-sm text-center text-green-600 mt-4">อัปโหลดสไลด์สำเร็จ!</p>
          )}
          {uploadStatus === "error" && (
            <p className="text-sm text-center text-red-600 mt-4">เกิดข้อผิดพลาดในการอัปโหลด</p>
          )}
          {isOrganizer && file && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-sm flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>กำลังอัปโหลด...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>อัปโหลด</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
} 