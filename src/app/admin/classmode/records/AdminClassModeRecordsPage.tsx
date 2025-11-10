"use client";
declare global {
  interface Window {
    Android?: {
      saveBase64ToDownloads?: (base64Data: string, filename: string) => void;
    };
  }
}
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Loader2, Download } from "lucide-react"; // ✅ Added Download icon
import Swal from "sweetalert2";

export default function AdminClassModeRecordsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameCode = searchParams.get("code");
  const classId = searchParams.get("class_id");

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [admin, setAdmin] = useState<any>(null);
  const [downloading, setDownloading] = useState(false); // ✅ Added download state

  // ✅ Load admin info
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedType = localStorage.getItem("userType");

    if (!savedUser || savedType !== "admin") {
      router.push("/");
      return;
    }
    setAdmin(JSON.parse(savedUser));
  }, [router]);

  // ✅ Fetch class & game records
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
        if (recordData.success) {
          setRecords(recordData.records || []);
        } else {
          Swal.fire("Error", "Failed to load records for this game.", "error");
        }
      } catch (error) {
        console.error("❌ Error fetching game records:", error);
        Swal.fire(
          "Error",
          "Something went wrong fetching game records.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    if (gameCode && classId) fetchGameRecords();
  }, [gameCode, classId]);

  const handleDownload = async () => {
  if (!gameCode) return;
  setDownloading(true);

  try {
    const response = await fetch(`/api/admin/classmode/export/bygame?code=${gameCode}`);
    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    const reader = new FileReader();

    reader.onloadend = function () {
      // ✅ Android WebView bridge
      if (window.Android?.saveBase64ToDownloads) {
        try {
          window.Android.saveBase64ToDownloads(
            reader.result as string,
            `classmode_${gameCode}_records.csv`
          );
          console.log("✅ File sent to Android WebView for saving.");
          
        } catch (androidError) {
          console.error("❌ Android Bridge Error:", androidError);
          Swal.fire("Error", "Failed to save file on Android device.", "error");
        }
      } else {
        // ✅ Browser fallback
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `classmode_${gameCode}_records.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        console.log("✅ File downloaded via browser.");
        Swal.fire("✅ Success", "Class mode records downloaded!", "success");
      }
    };

    reader.readAsDataURL(blob);
  } catch (err) {
    console.error("❌ Error downloading:", err);
    Swal.fire("Error", "Failed to download class mode records.", "error");
  } finally {
    setDownloading(false);
  }
};

  if (!admin)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700">
        Loading admin data...
      </div>
    );

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-700">
        <Loader2 className="animate-spin w-10 h-10 mb-4 text-[#548E28]" />
        <p>Loading Game Records...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-white flex flex-col items-center pb-12 relative">
      {/* ✅ Admin Header */}
      <header className="w-full bg-[#548E28] text-white flex items-center justify-between px-4 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <ArrowLeft
            className="w-6 h-6 cursor-pointer"
            onClick={() =>
              router.push(`/admin/classmode?admin_id=${admin.admin_id}`)
            }
          />
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold">
              {classInfo?.class_name || "Class Records"}
            </h1>
            <p className="text-xs opacity-80">Game Code: {gameCode || "N/A"}</p>
          </div>
        </div>

        
      </header>

      {/* ✅ Records Section */}
      <section className="w-[90%] max-w-3xl mt-6 relative">
        <h2 className="text-[#548E28] font-bold text-base mb-2">
          GAME RECORDS
        </h2>

        <div className="border-2 border-[#548E28] rounded-lg bg-[#f3f8f2] p-5 flex flex-col relative min-h-[200px]">
          {records.length > 0 ? (
            <div className="w-full max-h-[450px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#548E28] text-white text-sm">
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
                      className="border-b border-[#548E28]/30 hover:bg-[#eaf6e9] transition-all"
                    >
                      <td className="p-2 pl-3">
                        <Image
                          src={
                            rec.student?.avatar ||
                            "/resources/icons/student.png"
                          }
                          alt={rec.student?.first_name || "Student"}
                          width={36}
                          height={36}
                          className="rounded-full border border-[#548E28] object-cover"
                        />
                      </td>
                      <td className="p-2 text-sm text-gray-800 font-medium">
                        {rec.student?.first_name} {rec.student?.last_name}
                      </td>
                      <td className="p-2 text-center text-sm font-semibold text-[#548E28]">
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
        className="fixed bottom-6 right-6 bg-[#548E28] hover:bg-[#3f6b1f] text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm font-semibold transition-all"
      >
        <Download className="w-4 h-4" />
        {downloading ? "Downloading..." : "Download CSV"}
      </button>
    </div>
  );
}
