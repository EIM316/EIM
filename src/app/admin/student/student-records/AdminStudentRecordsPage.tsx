"use client";
declare global {
  interface Window {
    Android?: {
      saveBase64ToDownloads?: (base64Data: string, filename: string) => void;
    };
  }
}

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ArrowLeft, Download } from "lucide-react";

interface Student {
  id_number: string;
  first_name: string;
  last_name: string;
  avatar?: string;
  email: string;
}

interface ModuleProgress {
  module: { name: string; description?: string };
  current_slide: number;
  completed: boolean;
  points_earned: number;
  attempts: number;
}

interface Badge {
  module: { name: string };
  completed_at: string;
}

interface ClassGameRecord {
  id: number;
  game_code: string;
  points: number;
  created_at: string;
  game: {
    game_type: string;
    status: string;
    class: { class_name: string };
    teacher: { first_name: string; last_name: string };
  };
}

interface StudentData {
  student: Student;
  modules: ModuleProgress[];
  game_points: Record<string, number>;
  game_attempts: Record<string, number>;
  badges: Badge[];
  class_game_history: ClassGameRecord[];
}

export default function AdminStudentRecordsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const student_id = searchParams.get("student_id");

  const [data, setData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [admin, setAdmin] = useState<any>(null);

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

  // ✅ Fetch student details
  useEffect(() => {
    const fetchData = async () => {
      if (!student_id) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/student/details?student_id=${student_id}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setData(null);
        }
      } catch (err) {
        console.error("❌ Error fetching student data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [student_id]);

  const handleDownload = async () => {
  if (!student_id) return;
  setDownloading(true);

  try {
    const response = await fetch(`/api/student/export?student_id=${student_id}`);
    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    const reader = new FileReader();

    reader.onloadend = function () {
      // ✅ Android WebView bridge
      if (window.Android?.saveBase64ToDownloads) {
        try {
          window.Android.saveBase64ToDownloads(
            reader.result as string,
            `student_${student_id}_record.csv`
          );
          console.log("✅ File sent to Android WebView for saving.");
          
        } catch (androidError) {
          console.error("❌ Android Bridge Error:", androidError);
          alert("Failed to save file on Android device.");
        }
      } else {
        // ✅ Browser fallback
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `student_${student_id}_record.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        console.log("✅ File downloaded via browser.");
      }
    };

    reader.readAsDataURL(blob);
  } catch (err) {
    console.error("❌ Error downloading:", err);
    alert("Failed to download student record.");
  } finally {
    setDownloading(false);
  }
};

  if (!admin)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        Loading admin data...
      </div>
    );

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-700">
        <Loader2 className="animate-spin w-10 h-10 mb-4 text-[#548E28]" />
        <p>Loading Student Record...</p>
      </div>
    );

  if (!data)
    return (
      <div className="text-center text-gray-600 mt-10">
        No student records found.
      </div>
    );

  const { student, modules, game_points, game_attempts, badges, class_game_history } = data;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center pb-12 relative">
      {/* ✅ Admin Header */}
      <header className="w-full bg-[#548E28] text-white flex items-center justify-between px-4 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <ArrowLeft
            className="w-6 h-6 cursor-pointer"
            onClick={() => router.push(`/admin/student?admin_id=${admin.admin_id}`)}
          />
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold">Student Record</h1>
            <p className="text-xs opacity-80">
              {student.first_name} {student.last_name}
            </p>
          </div>
        </div>

        {/* Admin Info */}
        <div className="flex items-center gap-3">
          <Image
            src={admin.avatar || "/resources/icons/admin.png"}
            alt="Admin Avatar"
            width={36}
            height={36}
            className="rounded-full border-2 border-white"
          />
          <p className="text-sm font-semibold">{admin.first_name}</p>
        </div>
      </header>

      {/* Student Profile */}
      <section className="w-[90%] max-w-3xl mt-6">
        <div className="bg-white border-2 border-[#548E28] rounded-xl p-5 shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <Image
              src={student.avatar || "/resources/icons/student.png"}
              alt={student.first_name}
              width={64}
              height={64}
              className="rounded-full border border-[#548E28] object-cover"
            />
            <div>
              <h1 className="text-xl font-bold text-[#548E28]">
                {student.first_name} {student.last_name}
              </h1>
              <p className="text-sm text-gray-600">{student.email}</p>
              <p className="text-xs text-gray-500">ID: {student.id_number}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Module Progress */}
      <section className="w-[90%] max-w-3xl mt-6">
        <h2 className="text-[#548E28] font-bold mb-2">MODULE PROGRESS</h2>
        <div className="bg-white border-2 border-[#548E28] rounded-lg shadow-inner max-h-[250px] overflow-y-auto">
          {modules.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-[#548E28] text-white sticky top-0">
                <tr>
                  <th className="p-2 text-left">Module</th>
                  <th className="p-2 text-center">Slide</th>
                  <th className="p-2 text-center">Completed</th>
                  <th className="p-2 text-center">Points</th>
                  <th className="p-2 text-center">Attempts</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((m, i) => (
                  <tr
                    key={i}
                    className="border-b border-[#548E28]/20 hover:bg-[#edf8e9] transition-all"
                  >
                    <td className="p-2">{m.module.name}</td>
                    <td className="p-2 text-center">{m.current_slide}</td>
                    <td className="p-2 text-center">{m.completed ? "✅" : "—"}</td>
                    <td className="p-2 text-center">{m.points_earned}</td>
                    <td className="p-2 text-center">{m.attempts ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-600 text-center py-4">No module progress yet.</p>
          )}
        </div>
      </section>

      {/* Game Points & Attempts */}
      <section className="w-[90%] max-w-3xl mt-6">
        <h2 className="text-[#548E28] font-bold mb-2">GAME PERFORMANCE</h2>
        {(() => {
          const modeNames: Record<string, string> = {
            mode1: "Refresher",
            mode2: "Quiz Mode",
            mode3: "Schematic Builder",
            mode4: "Phase Rush",
          };
          return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(game_points).map(([mode, points]) => (
                <div
                  key={mode}
                  className="bg-white border-2 border-[#548E28] rounded-lg text-center py-3 shadow-sm"
                >
                  <p className="text-sm font-semibold text-[#548E28]">
                    {modeNames[mode] || mode.toUpperCase()}
                  </p>
                  <p className="text-lg font-bold">{points}</p>
                  <p className="text-xs text-gray-600">
                    Attempts: {game_attempts?.[mode] ?? 0}
                  </p>
                </div>
              ))}
            </div>
          );
        })()}
      </section>

      {/* Class Mode Game History */}
      <section className="w-[90%] max-w-4xl mt-6">
        <h2 className="text-[#548E28] font-bold mb-2">CLASS MODE GAME HISTORY</h2>
        <div className="bg-white border-2 border-[#548E28] rounded-lg shadow-inner max-h-[300px] overflow-y-auto">
          {class_game_history.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-[#548E28] text-white sticky top-0">
                <tr>
                  <th className="p-2 text-left">Game Code</th>
                  <th className="p-2 text-center">Class</th>
                  <th className="p-2 text-center">Teacher</th>
                  <th className="p-2 text-center">Points</th>
                  <th className="p-2 text-right pr-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {class_game_history.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[#548E28]/20 hover:bg-[#edf8e9] transition-all"
                  >
                    <td className="p-2">{r.game_code}</td>
                    <td className="p-2 text-center">{r.game.class.class_name}</td>
                    <td className="p-2 text-center">
                      {r.game.teacher.first_name} {r.game.teacher.last_name}
                    </td>
                    <td className="p-2 text-center font-semibold text-[#548E28]">
                      {r.points}
                    </td>
                    <td className="p-2 text-right pr-4 text-xs text-gray-600">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-600 text-center py-4">No class mode history.</p>
          )}
        </div>
      </section>

      {/* Badges */}
      <section className="w-[90%] max-w-3xl mt-6 mb-10">
        <h2 className="text-[#548E28] font-bold mb-2">BADGES EARNED</h2>
        <div className="bg-white border-2 border-[#548E28] rounded-lg p-4 shadow-inner flex flex-wrap gap-3">
          {badges.length > 0 ? (
            badges.map((b, i) => (
              <div
                key={i}
                className="bg-[#f0f8f1] border border-[#548E28] rounded-full px-4 py-2 text-sm text-[#548E28] font-semibold"
              >
                🏅 {b.module.name}
              </div>
            ))
          ) : (
            <p className="text-gray-600 text-center w-full">No badges earned yet.</p>
          )}
        </div>
      </section>

      {/* ✅ Floating Download Button */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="fixed bottom-6 right-6 bg-[#548E28] hover:bg-[#43741e] text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm font-semibold transition-all"
      >
        <Download className="w-4 h-4" />
        {downloading ? "Downloading..." : "Download Records"}
      </button>
    </div>
  );
}
