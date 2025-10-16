"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Menu,
  LogOut,
  RefreshCw,
  Search,
  X,
  Trophy,
  BookOpen,
  PlayCircle,
} from "lucide-react";
import Swal from "sweetalert2";

export default function StudentPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [classCode, setClassCode] = useState("");
  const [classInfo, setClassInfo] = useState<any>(null);
  const [joining, setJoining] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Load student and latest joined class
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
      setClassInfo(JSON.parse(savedClass));
    } else {
      fetchLatestClass(parsedUser.id_number);
    }
  }, [router]);

  // ✅ Fetch latest joined class from DB
  const fetchLatestClass = async (studentId: string) => {
    try {
      const res = await fetch(`/api/class/latest?student_id=${studentId}`);
      if (!res.ok) throw new Error("Failed to fetch latest class");
      const data = await res.json();

      if (data.success && data.class) {
        setClassInfo(data.class);
        localStorage.setItem("studentClass", JSON.stringify(data.class));
      }
    } catch (err) {
      console.error("Error fetching latest class:", err);
    }
  };

  // ✅ Join class
  const handleJoinClass = async () => {
    if (!classCode.trim()) {
      Swal.fire("Error", "Please enter a class code.", "error");
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
          title: "Joined Successfully!",
          text: `You joined class "${data.class.class_name}"`,
          icon: "success",
          confirmButtonColor: "#7b2020",
        });

        setClassInfo(data.class);
        localStorage.setItem("studentClass", JSON.stringify(data.class));
      } else {
        Swal.fire("Error", data.error || "Invalid class code.", "error");
      }
    } catch (err) {
      Swal.fire("Error", "Server error occurred.", "error");
    } finally {
      setJoining(false);
    }
  };

  // ✅ Switch Class
  const handleSwitchClass = () => {
    Swal.fire({
      title: "Switch Class?",
      text: "Are you sure you want to switch classes?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#7b2020",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Yes, switch",
    }).then((res) => {
      if (res.isConfirmed) {
        localStorage.removeItem("studentClass");
        setClassInfo(null);
        setClassCode("");
      }
    });
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

  const handlePlay = () => {
    router.push("/student/play");
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700">
        Loading student data...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-white relative">
      {/* Header */}
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md relative">
        <div className="flex items-center space-x-3">
          <Image
            src={user.avatar || "/student-avatar.png"}
            alt="Profile"
            width={40}
            height={40}
            className="rounded-full border-2 border-white"
          />
          <span className="font-semibold text-lg">
            {user.first_name?.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Search
            onClick={() => setShowSearch(true)}
            className="w-6 h-6 cursor-pointer hover:text-gray-300 text-white"
          />
          <Menu className="w-7 h-7 cursor-pointer" />
          <LogOut
            onClick={handleLogout}
            className="w-6 h-6 text-white cursor-pointer hover:text-gray-300"
          />
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="absolute inset-0 bg-[#7b2020] flex items-center justify-center px-4 z-10">
            <input
              type="text"
              placeholder="Search for key terms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-3/4 px-3 py-2 rounded-md text-white border"
              autoFocus
            />
            <X
              onClick={() => {
                setSearchTerm("");
                setShowSearch(false);
              }}
              className="ml-3 w-6 h-6 cursor-pointer text-white"
            />
          </div>
        )}
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center w-full p-5">
        {/* If not yet joined */}
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
              You are not yet part of any class. Enter a class code below to join
              your teacher’s class.
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

        {/* If already joined */}
        {classInfo && (
          <div className="relative w-full max-w-md mt-5 flex flex-col items-center">
            <div className="absolute top-0 right-0 flex items-center gap-2">
              <button
                onClick={handleSwitchClass}
                className="flex items-center gap-2 border border-[#7b2020] text-[#7b2020] font-semibold px-3 py-1.5 rounded-md hover:bg-[#7b2020] hover:text-white transition-all shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm font-bold">
                  {classInfo.class_name?.toUpperCase()}
                </span>
              </button>
            </div>

            <div className="flex flex-col items-center justify-center mt-20 w-full">
              <button className="flex items-center gap-2 bg-gray-300 text-gray-700 font-semibold px-5 py-2 rounded-md mb-4 cursor-not-allowed">
                <BookOpen className="w-5 h-5" /> Module (Coming Soon)
              </button>

              <div className="w-[90%] border border-gray-300 rounded-lg p-4 shadow-sm bg-gray-50 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Trophy className="text-yellow-500" />
                  <h3 className="font-bold text-[#7b2020]">Leaderboard Preview</h3>
                </div>
                <p className="text-sm text-gray-500">Coming soon...</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Play Button */}
      {classInfo && (
        <button
          onClick={handlePlay}
          className="fixed bottom-6 bg-[#7b2020] text-white rounded-full px-8 py-3 shadow-lg flex items-center gap-2 text-lg font-semibold"
        >
          <PlayCircle className="w-6 h-6" /> Play
        </button>
      )}
    </div>
  );
}
