"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { LogOut, Search, X, Menu, ArrowLeft, Play, Loader2 } from "lucide-react";
import io from "socket.io-client";

// ✅ Use Render server, force WebSocket for instant connection
const socket = io("https://eim-server.onrender.com", {
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  timeout: 8000, // 8s connect timeout
  autoConnect: false,
});

export default function WaitingRoomPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [players, setPlayers] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true); // ⏳ New loading state

  const professor = {
    name: "MS. ASH",
    avatar: "/resources/avatars/prof.png",
    gameCode: "5ABC9",
    items: 20,
    duration: "5 MINUTES",
    hintAllowed: true,
  };

  /* 🧠 Connect to socket and join room */
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (!savedUser.first_name) {
      router.push("/");
      return;
    }
    setUser(savedUser);

    // 🔹 Show connecting spinner
    setConnecting(true);

    // 🔹 Establish connection
    socket.connect();

    socket.on("connect", () => {
      console.log("✅ Connected to socket:", socket.id);
      setConnected(true);
      setConnecting(false);

      // Join room immediately after connect
      socket.emit(
        "join_room",
        professor.gameCode,
        savedUser.first_name,
        savedUser.avatar || "/resources/avatars/student1.png"
      );
    });

    socket.on("connect_error", (err) => {
      console.warn("⚠️ Socket connect error:", err.message);
      setConnected(false);
      setConnecting(true);

      // Retry connection in a few seconds
      setTimeout(() => socket.connect(), 3000);
    });

    socket.on("disconnect", () => {
      console.warn("❌ Disconnected from server");
      setConnected(false);
      setConnecting(true);
    });

    // 🔹 Listen for player list updates
    socket.on("update_player_list", (playerArray) => {
      console.log("👥 Updated player list:", playerArray);
      setPlayers(
        playerArray.map((p: any) => ({
          ...p,
          avatar:
            p.avatar && p.avatar.trim() !== ""
              ? p.avatar
              : "/resources/avatars/student1.png",
        }))
      );
    });

    // 🔹 Listen for game start
    socket.on("game_started", (playerList) => {
      console.log("🎮 Game started by professor!");
      localStorage.setItem("players", JSON.stringify(playerList));
      router.push("/student/play/classmode/waitingroom/start");
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("update_player_list");
      socket.off("game_started");
      socket.disconnect();
    };
  }, [router]);

  /* 🟢 Professor starts the game */
  const handleStart = () => {
    if (!players.length) return;
    localStorage.setItem("players", JSON.stringify(players));
    socket.emit("start_game", professor.gameCode, players);
  };

  /* 🚪 Leave lobby */
  const handleLeave = () => {
    Swal.fire({
      title: "Leave Lobby?",
      text: "Are you sure you want to leave this game lobby?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#7b2020",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Yes, leave",
    }).then((res) => {
      if (res.isConfirmed) {
        socket.disconnect();
        router.push("/student/play/classmode");
      }
    });
  };

  /* 🔒 Logout */
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
        socket.disconnect();
        router.push("/");
      }
    });
  };

  /* 🌀 Show circular loader while connecting */
  if (connecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white text-gray-700">
        <Loader2 className="animate-spin w-12 h-12 text-[#7b2020] mb-4" />
        <p className="font-semibold text-[#7b2020]">Connecting to server...</p>
        <p className="text-sm text-gray-500 mt-1">Please wait a moment ⏳</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700">
        Loading lobby...
      </div>
    );
  }

  /* 👥 Display list */
  const displayPlayers = [
    {
      name: "YOU",
      avatar:
        user.avatar && user.avatar.trim() !== ""
          ? user.avatar
          : "/resources/avatars/student1.png",
    },
    ...players.filter((p) => p.name !== user.first_name),
  ];

  /* 🧱 UI */
  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-white relative">
      {/* Header */}
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md relative">
        <div className="flex items-center space-x-3">
          <ArrowLeft
            className="w-6 h-6 cursor-pointer hover:text-gray-300"
            onClick={() => router.push("/student/play/classmode")}
          />
          <Image
            src={
              user.avatar && user.avatar.trim() !== ""
                ? user.avatar
                : "/resources/avatars/student1.png"
            }
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

      {/* Professor Info */}
      <div className="flex flex-col items-center w-full mt-6">
        <Image
          src={professor.avatar}
          alt="Professor"
          width={70}
          height={70}
          className="rounded-full border-2 border-[#7b2020] mb-2"
        />
        <span className="font-bold text-lg text-[#7b2020] mb-2">
          {professor.name}
        </span>

        <div className="bg-green-500 text-white rounded-md px-5 py-3 text-center text-sm shadow-md">
          <div className="font-bold text-base mb-1">
            CLASS MODE: {professor.gameCode}
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span>
              {professor.items} ITEMS | {professor.duration}
            </span>
            <span className="text-xs bg-white text-green-700 rounded-md px-2 py-0.5 mt-1">
              {professor.hintAllowed ? "HINT ALLOWED" : "NO HINTS"}
            </span>
          </div>
        </div>

        {!connected && (
          <p className="text-red-600 text-sm mt-2 animate-pulse">
            ⚠️ Reconnecting to server...
          </p>
        )}
      </div>

      {/* Lobby */}
      <div className="mt-6 w-[90%] max-w-xs bg-[#b22222] rounded-2xl shadow-md flex flex-col items-center py-5">
        <span className="text-white font-bold text-xl mb-3">
          {displayPlayers.length}/8 PLAYERS
        </span>

        <div className="grid grid-cols-3 gap-4">
          {displayPlayers.map((p, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center text-white"
            >
              <div className="bg-blue-100 rounded-full p-1.5 shadow-sm">
                <Image
                  src={p.avatar || "/resources/avatars/student1.png"}
                  alt={p.name || "Player"}
                  width={55}
                  height={55}
                  className="rounded-full"
                />
              </div>
              <span className="text-sm font-semibold mt-1">{p.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col items-center gap-3 mt-8">
        <button
          onClick={handleStart}
          disabled={!connected}
          className={`flex items-center gap-2 px-8 py-3 rounded-md shadow-md transition-all font-semibold ${
            connected
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-gray-400 cursor-not-allowed text-gray-200"
          }`}
        >
          <Play className="w-5 h-5" />
          {connected ? "START" : "CONNECTING..."}
        </button>

        <button
          onClick={handleLeave}
          className="bg-[#b22222] text-white font-semibold px-6 py-2 rounded-md shadow-md transition-all hover:bg-[#991f1f]"
        >
          LEAVE
        </button>
      </div>
    </div>
  );
}
