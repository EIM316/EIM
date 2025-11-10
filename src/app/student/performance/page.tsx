"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Menu,
  LogOut,
  X,
  Home,
  Settings,
  BarChart3,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import Swal from "sweetalert2";

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

export default function StudentPerformancePage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState<any>(null);

  // ✅ Disable scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    document.body.style.touchAction = menuOpen ? "none" : "";
  }, [menuOpen]);

  // ✅ Load user and student performance
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      router.push("/");
      return;
    }

    const parsed = JSON.parse(savedUser);
    setUser(parsed);
    fetchStudentPerformance(parsed.id_number);
  }, [router]);

  const fetchStudentPerformance = async (id_number: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/student/details2?student_id=${id_number}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        Swal.fire("Error", json.error || "Failed to load performance data.", "error");
      }
    } catch (err) {
      console.error("Error fetching performance:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#7b2020",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Yes, logout",
    }).then((res) => {
      if (res.isConfirmed) {
        localStorage.clear();
        router.push("/");
      }
    });
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-700">
        <Loader2 className="animate-spin w-10 h-10 mb-4 text-[#7b2020]" />
        <p>Loading Performance Data...</p>
      </div>
    );

  if (!data)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-500">
        <p>No performance data found.</p>
      </div>
    );

  const { student, modules, game_points, game_attempts, badges, class_game_history } = data;

  return (
    <main className="min-h-screen flex flex-col items-center bg-white relative overflow-x-hidden">
      {/* ✅ Navbar */}
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md fixed top-0 left-0 z-50">
        <div className="flex items-center gap-3">
          <Menu
            className="w-7 h-7 cursor-pointer hover:opacity-80 transition"
            onClick={() => setMenuOpen(true)}
          />
          <Image
            src={student.avatar || "/student-avatar.png"}
            alt="Profile"
            width={40}
            height={40}
            className="rounded-full border-2 border-white"
          />
          <span className="font-semibold text-lg">
            {student.first_name?.toUpperCase()}
          </span>
        </div>
        <LogOut
          onClick={handleLogout}
          className="w-6 h-6 cursor-pointer hover:opacity-80"
        />
      </header>

      {/* ✅ Hamburger Menu */}
      <div
        className={`fixed top-0 left-0 w-full h-full bg-[#7b2020] text-white z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/20">
          <span className="text-xl font-bold">Menu</span>
          <X
            onClick={() => setMenuOpen(false)}
            className="w-8 h-8 cursor-pointer hover:opacity-80 transition"
          />
        </div>

        {/* Menu Options */}
        <div className="flex flex-col mt-6 px-6 space-y-6">
          <button
            onClick={() => {
              router.push("/student");
              setMenuOpen(false);
            }}
            className="flex items-center gap-3 text-lg font-medium hover:text-gray-300 transition"
          >
            <Home className="w-5 h-5" /> Home
          </button>

          <button
            onClick={() => {
              router.push("/student/settings");
              setMenuOpen(false);
            }}
            className="flex items-center gap-3 text-lg font-medium hover:text-gray-300 transition"
          >
            <Settings className="w-5 h-5" /> Profile Settings
          </button>

          <button
            onClick={() => {
              router.push("/student/performance");
              setMenuOpen(false);
            }}
            className="flex items-center gap-3 text-lg font-medium hover:text-gray-300 transition"
          >
            <BarChart3 className="w-5 h-5" /> Performance
          </button>

          <button
            onClick={() => {
              router.push("/student/reportaproblem");
              setMenuOpen(false);
            }}
            className="flex items-center gap-3 text-lg font-medium hover:text-gray-300 transition"
          >
            <AlertTriangle className="w-5 h-5" /> Report a Problem
          </button>
        </div>

        {/* Logout */}
        <div className="mt-auto border-t border-white/20 px-6 py-5">
          <button
            onClick={() => {
              setMenuOpen(false);
              handleLogout();
            }}
            className="flex items-center gap-3 text-lg font-semibold hover:text-gray-300 transition"
          >
            <LogOut className="w-5 h-5" /> Log Out
          </button>
        </div>
      </div>

      {/* ✅ Content */}
      <div className="pt-24 w-[90%] max-w-5xl">
        {/* Profile */}
        <section className="bg-white border-2 border-[#7b2020] rounded-xl p-5 shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <Image
              src={student.avatar || "/resources/icons/student.png"}
              alt={student.first_name}
              width={64}
              height={64}
              className="rounded-full border border-[#7b2020] object-cover"
            />
            <div>
              <h1 className="text-xl font-bold text-[#7b2020]">
                {student.first_name} {student.last_name}
              </h1>
              <p className="text-sm text-gray-600">{student.email}</p>
              <p className="text-xs text-gray-500">ID: {student.id_number}</p>
            </div>
          </div>
        </section>

        {/* Module Progress */}
        <section className="mt-6">
          <h2 className="text-[#7b2020] font-bold mb-2">MODULE PROGRESS</h2>
          <div className="bg-white border-2 border-[#7b2020] rounded-lg shadow-inner max-h-[250px] overflow-y-auto">
            {modules.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-[#7b2020] text-white sticky top-0">
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
                      className="border-b border-[#7b2020]/20 hover:bg-[#f3dada] transition-all"
                    >
                      <td className="p-2">{m.module.name}</td>
                      <td className="p-2 text-center">{m.current_slide}</td>
                      <td className="p-2 text-center">
                        {m.completed ? "✅" : "—"}
                      </td>
                      <td className="p-2 text-center">{m.points_earned}</td>
                      <td className="p-2 text-center">{m.attempts ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-600 text-center py-4">
                No module progress yet.
              </p>
            )}
          </div>
        </section>

        {/* Game Performance */}
        <section className="mt-6">
          <h2 className="text-[#7b2020] font-bold mb-2">GAME PERFORMANCE</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(game_points).map(([mode, points]) => (
              <div
                key={mode}
                className="bg-white border-2 border-[#7b2020] rounded-lg text-center py-3 shadow-sm"
              >
                <p className="text-sm font-semibold text-[#7b2020]">
                  {mode === "mode1"
                    ? "Refresher"
                    : mode === "mode2"
                    ? "Quiz Mode"
                    : mode === "mode3"
                    ? "Schematic Builder"
                    : mode === "mode4"
                    ? "Phase Rush"
                    : mode.toUpperCase()}
                </p>
                <p className="text-lg font-bold">{points}</p>
                <p className="text-xs text-gray-600">
                  Attempts: {game_attempts?.[mode] ?? 0}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Class Mode Game History */}
        <section className="mt-6">
          <h2 className="text-[#7b2020] font-bold mb-2">
            CLASS MODE GAME HISTORY
          </h2>
          <div className="bg-white border-2 border-[#7b2020] rounded-lg shadow-inner max-h-[300px] overflow-y-auto">
            {class_game_history.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-[#7b2020] text-white sticky top-0">
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
                      className="border-b border-[#7b2020]/20 hover:bg-[#f3dada] transition-all"
                    >
                      <td className="p-2">{r.game_code}</td>
                      <td className="p-2 text-center">
                        {r.game.class.class_name}
                      </td>
                      <td className="p-2 text-center">
                        {r.game.teacher.first_name} {r.game.teacher.last_name}
                      </td>
                      <td className="p-2 text-center font-semibold text-[#7b2020]">
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
              <p className="text-gray-600 text-center py-4">
                No class mode game history found.
              </p>
            )}
          </div>
        </section>

        {/* Badges */}
        <section className="mt-6 mb-10">
          <h2 className="text-[#7b2020] font-bold mb-2">BADGES EARNED</h2>
          <div className="bg-white border-2 border-[#7b2020] rounded-lg p-4 shadow-inner flex flex-wrap gap-3">
            {badges.length > 0 ? (
              badges.map((b, i) => (
                <div
                  key={i}
                  className="bg-[#f8e8e8] border border-[#7b2020] rounded-full px-4 py-2 text-sm text-[#7b2020] font-semibold"
                >
                  🏅 {b.module.name}
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-center w-full">
                No badges earned yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
