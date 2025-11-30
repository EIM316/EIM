"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Home,
  Menu,
  LogOut,
  X,
  Trophy,
  PlayCircle,
  Settings,
  BarChart3,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import Swal from "sweetalert2";

export default function StudentPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [classCode, setClassCode] = useState("");
  const [classInfo, setClassInfo] = useState<any>(null);
  const [joining, setJoining] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any>(null);

  // ✅ Disable background scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    document.body.style.touchAction = menuOpen ? "none" : "";
  }, [menuOpen]);

  // ✅ Load student info and last joined class
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedType = localStorage.getItem("userType");

    if (!savedUser || savedType !== "student") {
      router.push("/");
      return;
    }

    const parsedUser = JSON.parse(savedUser);
    setUser(parsedUser);

    const savedClass = localStorage.getItem("studentClass");
    if (savedClass) {
      const classObj = JSON.parse(savedClass);
      setClassInfo(classObj);
      fetchLeaderboard(classObj.id, parsedUser.id_number);
    } else {
      fetchLatestClass(parsedUser.id_number);
    }
  }, [router]);

  // ✅ Fetch latest class if not cached
  const fetchLatestClass = async (studentId: string) => {
    try {
      const res = await fetch(`/api/class/latest?student_id=${studentId}`);
      if (!res.ok) throw new Error("Failed to fetch latest class");
      const data = await res.json();

      if (data.success && data.class) {
        setClassInfo(data.class);
        localStorage.setItem("studentClass", JSON.stringify(data.class));
        fetchLeaderboard(data.class.id, studentId);
      }
    } catch (err) {
      console.error("Error fetching latest class:", err);
    }
  };

  // ✅ Fetch leaderboard for this class
  const fetchLeaderboard = async (classId: string, studentId: string) => {
    try {
      const res = await fetch(
        `/api/class/leaderboard?class_id=${classId}&student_id=${studentId}`
      );
      const data = await res.json();
      if (data.success) setLeaderboard(data);
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
    }
  };

  // ✅ Join or Switch to another class
  const handleJoinClass = async () => {
    if (!classCode.trim()) {
      Swal.fire("Error", "Please enter a class code.", "error");
      return;
    }
    // ✅ Prevent joining the same class you're already in
if (classInfo && classCode.trim().toUpperCase() === classInfo.class_code.toUpperCase()) {
  Swal.fire("Notice", "You are still in the same class.", "info");
  return;
}


    setJoining(true);
    try {
      const res = await fetch(`/api/class/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_number: user.id_number,
          class_code: classCode.trim().toUpperCase(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        Swal.fire({
          title: classInfo
            ? "Switched Class Successfully!"
            : "Joined Successfully!",
          text: `You are now in "${data.class.class_name}".`,
          icon: "success",
          confirmButtonColor: "#7b2020",
        });

        setClassInfo(data.class);
        localStorage.setItem("studentClass", JSON.stringify(data.class));
        setClassCode("");
        setSwitching(false);
        fetchLeaderboard(data.class.id, user.id_number);
      } else {
        Swal.fire("Error", data.error || "Invalid class code.", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Server error occurred.", "error");
    } finally {
      setJoining(false);
    }
  };

  // ✅ Logout
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

  const handlePlay = () => router.push("/student/play");
  const handleModule = () => router.push("/student/module");

  return (
    <div className="flex flex-col items-center min-h-screen bg-white relative overflow-x-hidden">
      {/* ✅ Header */}
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <Menu
            className="w-7 h-7 cursor-pointer hover:opacity-80 transition"
            onClick={() => setMenuOpen(true)}
          />
          <Image
            src={user?.avatar || "/student-avatar.png"}
            alt="Profile"
            width={40}
            height={40}
            className="rounded-full border-2 border-white"
          />
          <span className="font-semibold text-lg">
            {user?.first_name?.toUpperCase()}
          </span>
        </div>
        <LogOut
          onClick={handleLogout}
          className="w-6 h-6 cursor-pointer hover:opacity-80"
        />
      </header>

      {/* ✅ Full-Screen Menu */}
      <div
        className={`fixed top-0 left-0 w-full h-full bg-[#7b2020] text-white z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Bar */}
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

        {/* Logout at bottom */}
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

      {/* ✅ Main Page */}
      <main className="flex-1 flex flex-col items-center w-full p-5 overflow-hidden">
        {/* 🏫 If No Class */}
        {!classInfo && (
          <div className="flex flex-col items-center justify-center text-center mt-40 w-full">
            <Image
              src="/resources/icons/classbg.png"
              alt="Join class"
              width={120}
              height={120}
              className="opacity-60 mb-4"
            />
            <p className="text-gray-700 font-medium mb-6 px-4">
              You are not yet part of any class. Enter a class code below to join your teacher’s class.
            </p>
            <input
              type="text"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
              placeholder="Enter class code"
              className="border-2 border-[#7b2020] rounded-md px-3 py-2 w-[80%] max-w-sm text-center text-black mb-3"
            />
            <button
              onClick={handleJoinClass}
              disabled={joining}
              className="bg-[#7b2020] text-white px-6 py-2 rounded-md font-semibold disabled:opacity-70"
            >
              {joining ? "Joining..." : "Join Class"}
            </button>
          </div>
        )}

        {/* 🧠 If Joined a Class */}
        {classInfo && (
          <div className="flex flex-col items-center justify-center mt-1">
            <h2 className="text-lg font-semibold text-[#7b2020] mb-2">
              {classInfo.class_name}
            </h2>

            {/* Switch Class */}
            {!switching ? (
              <button
                onClick={() => setSwitching(true)}
                className="flex items-center gap-2 text-[#7b2020] hover:text-red-700 font-medium transition mb-6"
              >
                <RefreshCw className="w-5 h-5" /> Switch Class
              </button>
            ) : (
              <div className="flex flex-col items-center mb-6">
                <input
                  type="text"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                  placeholder="Enter new class code"
                  className="border-2 border-[#7b2020] rounded-md px-3 py-2 w-[80%] max-w-sm text-center text-black mb-3"
                />
                <button
                  onClick={handleJoinClass}
                  disabled={joining}
                  className="bg-[#7b2020] text-white px-6 py-2 rounded-md font-semibold disabled:opacity-70"
                >
                  {joining ? "Switching..." : "Confirm Switch"}
                </button>
                <button
                  onClick={() => {
                    setSwitching(false);
                    setClassCode("");
                  }}
                  className="mt-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Module Button */}
            <button
              onClick={handleModule}
              className="flex flex-col items-center justify-center border-2 border-[#7b2020] text-[#7b2020] font-semibold w-80 h-60 rounded-xl shadow-md hover:bg-[#7b2020] hover:text-white transition-all mb-5 bg-white"
            >
              <Image
                src="/resources/modes/module.png"
                alt="Module Icon"
                width={180}
                height={90}
                className="object-contain rounded-md mb-4"
              />
              <span className="text-lg font-bold">Open Module</span>
            </button>

{/* 🏆 Enhanced Leaderboard (Fixed Layout) */}
<div className="w-[95%] border border-gray-300 rounded-2xl p-5 shadow-lg bg-gradient-to-b from-white to-gray-50 text-center mt-4 mb-28">
  <div className="flex flex-col items-center justify-center mb-4">
    <Trophy className="text-yellow-500 w-6 h-6" />
    <h3 className="text-xl font-bold text-[#7b2020]">Class Leaderboard</h3>
    <p className="text-xs text-gray-500">Top performers in {classInfo.class_name}</p>
  </div>

  {!leaderboard ? (
    <p className="text-sm text-gray-500 py-4">Loading leaderboard...</p>
  ) : leaderboard.topPeers.length === 0 ? (
    <p className="text-sm text-gray-500 py-4">
      No records yet — start earning points!
    </p>
  ) : (
    <>
      <p className="text-sm text-gray-700 mb-3">
        Your Rank:{" "}
        <span className="font-semibold text-[#7b2020]">
          {leaderboard.studentRank || "N/A"}
        </span>{" "}
        of {leaderboard.totalStudents}
      </p>

      <div className="max-h-56 sm:max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white">
        {leaderboard.topPeers.map((p: any, i: number) => {
          const isUser = p.id_number === user.id_number;
          const medal =
            i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${p.rank}.`;

          const rankBg =
            i === 0
              ? "bg-yellow-100"
              : i === 1
              ? "bg-gray-200"
              : i === 2
              ? "bg-amber-200"
              : "bg-gray-50";

          return (
            <div
              key={p.id_number}
              className={`flex items-center justify-between gap-2 px-3 py-2 border-b border-gray-100 last:border-none transition-all ${
                isUser
                  ? "bg-[#7b2020] text-white font-semibold shadow-inner"
                  : `${rankBg} text-gray-700`
              }`}
            >
              {/* Left side: rank + avatar + name */}
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold w-6 text-center">{medal}</span>
                <Image
                  src={p.avatar || "/resources/modes/engr.png"}
                  alt={p.first_name}
                  width={32}
                  height={32}
                  className="rounded-full border border-gray-300 bg-white"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium truncate max-w-[120px] sm:max-w-[200px]">
                    {p.first_name}
                  </span>
                  {isUser && (
                    <span className="text-[11px] text-white/80 italic">
                      (You)
                    </span>
                  )}
                </div>
              </div>

              {/* Right side: points */}
              <span
                className={`text-sm font-semibold ${
                  isUser ? "text-white" : "text-[#7b2020]"
                }`}
              >
                 {p.total_points} pts
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-gray-500 italic">
        Keep playing and completing modules to climb higher!
      </div>
    </>
  )}
</div>


          </div>
        )}
      </main>

      {/* 🎮 Floating Play Button */}
      {classInfo && (
        <button
          onClick={handlePlay}
          className="fixed bottom-1 bg-[#7b2020] text-white rounded-full px-8 py-3 shadow-lg flex items-center gap-2 text-lg font-semibold"
        >
          <PlayCircle className="w-6 h-6" /> Play
        </button>
      )}
    </div>
  );
}
