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

  // ✅ Handle join game (database validation)
  const handleJoinGame = async () => {
    if (!gameCode.trim()) {
      Swal.fire("Error", "Please enter a game code.", "error");
      return;
    }

    setJoining(true);
    try {
      const res = await fetch(`/api/classmode/validate?code=${gameCode.trim().toUpperCase()}`);
      const data = await res.json();

      if (data.success && data.game) {
        Swal.fire({
          title: "Joined Game!",
          text: `Welcome to ${data.game.game_type.replace("_", " ").toUpperCase()} lobby.`,
          icon: "success",
          confirmButtonColor: "#7b2020",
        }).then(() => {
          localStorage.setItem("activeGameCode", data.game.game_code);
          localStorage.setItem("activeGameType", data.game.game_type);
          router.push(`/student/play/classmode/waitingroom?code=${data.game.game_code}`);
        });
      } else {
        Swal.fire("Error", "Invalid or expired game code.", "error");
      }
    } catch (err) {
      Swal.fire("Error", "Failed to connect to game server.", "error");
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

        

      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center w-full p-5">
        <div className="flex flex-col items-center justify-center text-center mt-32 w-full">
          <Image
            src="/resources/admin/classmode.png"
            alt="Join Game"
            width={180}
            height={130}
            className="opacity-70 mb-5"
          />
          <h2 className="text-2xl font-bold text-[#7b2020] mb-2">
            Enter Game Code
          </h2>
          <p className="text-gray-700 mb-6 px-4">
            Join a multiplayer match created by your professor.
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
