"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Loader2, Download } from "lucide-react";
import Swal from "sweetalert2";

// ✅ Add Android WebView bridge typing
declare global {
  interface Window {
    Android?: {
      saveBase64ToDownloads?: (base64Data: string, filename: string) => void;
    };
  }
}

export default function GameRecordsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameCode = searchParams.get("code");
  const classId = searchParams.get("class_id");

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [classInfo, setClassInfo] = useState<any>(null);

  // ✅ Fetch records
  useEffect(() => {
    const fetchGameRecords = async () => {
      try {
        setLoading(true);
        const [recordRes, classRes] = await Promise.all([
          fetch(`/api/classmode/records/bygame?code=${gameCode}`),
          fetch(`/api/class/info?class_id=${classId}`),
        ]);

        const recordData = await recordRes.json();
        const classData = await classRes.json();

        if (classData.success) setClassInfo(classData.class);
        if (recordData.success) setRecords(recordData.records || []);
        else Swal.fire("Error", "Failed to load records for this game.", "error");
      } catch (error) {
        console.error("❌ Error fetching game records:", error);
        Swal.fire("Error", "Something went wrong fetching game records.", "error");
      } finally {
        setLoading(false);
      }
    };

    if (gameCode && classId) fetchGameRecords();
  }, [gameCode, classId]);

  // ✅ Floating download button (Android + Web)
  const handleDownload = async () => {
    if (!gameCode) return;
    setDownloading(true);

    try {
      const response = await fetch(`/api/classmode/records/export/bygame?code=${gameCode}`);
      if (!response.ok) throw new Error("Failed to download CSV");

      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = function () {
        const filename = `game_${gameCode}_records.csv`;

        if (window.Android?.saveBase64ToDownloads) {
          // ✅ Android WebView version
          try {
            window.Android.saveBase64ToDownloads(reader.result as string, filename);
            
          } catch (androidError) {
            console.error("❌ Android Bridge Error:", androidError);
            Swal.fire("Error", "Failed to save file on Android device.", "error");
          }
        } else {
          // ✅ Browser fallback
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);

          Swal.fire("✅ Success", "Game records downloaded successfully!", "success");
        }
      };

      reader.readAsDataURL(blob);
    } catch (err) {
      console.error("❌ Download error:", err);
      Swal.fire("Error", "Failed to download CSV file.", "error");
    } finally {
      setDownloading(false);
    }
  };

  // ✅ Loading screen
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-700">
        <Loader2 className="animate-spin w-10 h-10 mb-4 text-[#7b2020]" />
        <p>Loading Game Records...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-white flex flex-col items-center pb-12 relative">
      {/* Header */}
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <ArrowLeft
            className="w-6 h-6 cursor-pointer"
            onClick={() => router.push(`/teacher/class?class_id=${classId}`)}
          />
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold">{classInfo?.class_name || "Class Records"}</h1>
            <p className="text-xs opacity-80">Game Code: {gameCode || "N/A"}</p>
          </div>
        </div>
      </header>

      {/* Records Section */}
      <section className="w-[90%] max-w-md mt-6 relative">
        <h2 className="text-[#7b2020] font-bold text-base mb-2">GAME RECORDS</h2>

        <div className="border-2 border-[#7b2020] rounded-lg bg-[#f8e8e8] p-5 flex flex-col relative min-h-[200px]">
          {records.length > 0 ? (
            <div className="w-full max-h-[400px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#7b2020] text-white text-sm">
                  <tr>
                    <th className="p-2 pl-3">Avatar</th>
                    <th className="p-2">Student</th>
                    <th className="p-2 text-center">Points</th>
                    <th className="p-2 text-right pr-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec: any, idx: number) => (
                    <tr
                      key={idx}
                      className="border-b border-[#7b2020]/30 hover:bg-[#f3dada] transition-all"
                    >
                      <td className="p-2 pl-3">
                        <Image
                          src={rec.student?.avatar || "/resources/icons/student.png"}
                          alt={rec.student?.first_name || "Student"}
                          width={36}
                          height={36}
                          className="rounded-full border border-[#7b2020] object-cover"
                        />
                      </td>
                      <td className="p-2 text-sm text-gray-800 font-medium">
                        {rec.student?.first_name} {rec.student?.last_name}
                      </td>
                      <td className="p-2 text-center text-sm font-semibold text-[#7b2020]">
                        {rec.points}
                      </td>
                      <td className="p-2 text-right pr-3 text-xs text-gray-600">
                        {new Date(rec.created_at).toLocaleDateString()}{" "}
                        {new Date(rec.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-700 font-medium text-center">
              NO RECORDS FOUND FOR THIS GAME
            </p>
          )}
        </div>
      </section>

      {/* ✅ Floating Download Button */}
       <button
        onClick={handleDownload}
        disabled={downloading}
        className="fixed bottom-6 right-6 bg-[#7b2020] hover:bg-[#631818] text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm font-semibold transition-all"
      >
        <Download className="w-4 h-4" />
        {downloading ? "Downloading..." : "Download Records"}
      </button>
    </div>
  );
}
