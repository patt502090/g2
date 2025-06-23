"use client";
import { useState } from "react";
import { X, UploadCloud, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function UploadModal({ meeting, onClose }: { meeting: any, onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");

  if (!meeting) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setUploadStatus("idle");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setUploadStatus("idle");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("meetingId", meeting.id);

    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setUploadStatus("success");
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
            <h2 className="text-lg font-medium text-stone-800">อัปโหลดไฟล์เสียง</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-stone-100">
              <X className="w-5 h-5 text-stone-500" />
            </button>
          </div>
          <p className="text-sm text-stone-600 mb-1">
            สำหรับ Meeting: <span className="font-medium text-stone-800">{meeting.title}</span>
          </p>
          <p className="text-xs text-stone-500 mb-4">ID: {meeting.id}</p>
          <div className="space-y-4">
            <div>
              <label htmlFor="file-upload" className="cursor-pointer group">
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
                  <p className="text-xs text-stone-400 mt-1">รองรับไฟล์เสียง (MP3, WAV, M4A)</p>
                </div>
              </label>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".mp3,.wav,.m4a"
              />
            </div>
            {uploadStatus === "success" && (
              <p className="text-sm text-center text-green-600">อัปโหลดสำเร็จ!</p>
            )}
            {uploadStatus === "error" && (
              <p className="text-sm text-center text-red-600">เกิดข้อผิดพลาดในการอัปโหลด</p>
            )}
            <button
              onClick={handleUpload}
              disabled={!file || isUploading || uploadStatus === "success"}
              className="w-full flex items-center justify-center px-4 py-2 bg-stone-800 text-white rounded-lg text-sm font-medium hover:bg-stone-900 disabled:bg-stone-400 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังอัปโหลด...
                </>
              ) : (
                "อัปโหลด"
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 