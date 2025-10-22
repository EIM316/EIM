"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  LogOut,
  X,
  Search,
  Menu,
  PlayCircle,
  ArrowLeft,
} from "lucide-react";
import Swal from "sweetalert2";

export default function ClassModePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [gameCode, setGameCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const HARDCODED_CODE = "5ABC9"; // 🔹 for now, hardcoded code reference

  // ✅ Load student data
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedType = localStorage.getItem("userType");

    if (!savedUser || savedType !== "student") {
      router.push("/");
      return;
    }

    setUser(JSON.parse(savedUser));
  }, [router]);

  // ✅ Handle join game
  const handleJoinGame = () => {
    if (!gameCode.trim()) {
      Swal.fire("Error", "Please enter a game code.", "error");
      return;
    }

    setJoining(true);

    setTimeout(() => {
      if (gameCode.trim().toUpperCase() === HARDCODED_CODE) {
        Swal.fire({
          title: "Joined Game!",
          text: "You successfully joined the match lobby.",
          icon: "success",
          confirmButtonColor: "#7b2020",
        }).then(() => {
          router.push("/student/play/classmode/waitingroom"); // 🔹 redirect placeholder
        });
      } else {
        Swal.fire("Error", "Invalid or expired game code.", "error");
      }
      setJoining(false);
    }, 800);
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
          <ArrowLeft
            className="w-6 h-6 cursor-pointer hover:text-gray-300"
            onClick={() => router.push("/student")}
          />
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
        <div className="flex flex-col items-center justify-center text-center mt-32 w-full">
          <Image
            src="/resources/icons/gamecode.png"
            alt="Join Game"
            width={130}
            height={130}
            className="opacity-70 mb-5"
          />
          <h2 className="text-2xl font-bold text-[#7b2020] mb-2">
            Enter Game Code
          </h2>
          <p className="text-gray-700 mb-6 px-4">
            Join a multiplayer match created by your professor.  
            (Try <b>{HARDCODED_CODE}</b> for now.)
          </p>

          <input
            type="text"
            value={gameCode}
            onChange={(e) => setGameCode(e.target.value)}
            placeholder="Enter code here"
            className="border-2 border-[#7b2020] rounded-md px-3 py-2 w-[80%] max-w-sm text-center text-black mb-3 uppercase"
          />

          <button
            onClick={handleJoinGame}
            disabled={joining}
            className="bg-[#7b2020] text-white px-6 py-2 rounded-md font-semibold flex items-center gap-2 disabled:opacity-70"
          >
            <PlayCircle className="w-5 h-5" />
            {joining ? "Joining..." : "Join Game"}
          </button>
        </div>
      </main>
    </div>
  );
}
