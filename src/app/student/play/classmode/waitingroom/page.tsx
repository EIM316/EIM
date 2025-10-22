"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { LogOut, Search, X, Menu, ArrowLeft, Play, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function WaitingRoomPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const professor = {
    name: "MS. ASH",
    avatar: "/resources/avatars/prof.png",
    gameCode: "5ABC9",
    items: 20,
    duration: "5 MINUTES",
    hintAllowed: true,
  };

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (!savedUser.id_number) {
      router.push("/");
      return;
    }

    setUser(savedUser);
    setConnecting(true);

    const joinLobby = async () => {
      try {
        const { error } = await supabase.from("players").upsert(
          {
            id_number: savedUser.id_number,
            game_code: professor.gameCode,
            name: savedUser.first_name,
            avatar: savedUser.avatar || "/resources/avatars/student1.png",
          },
          { onConflict: "game_code,id_number" }
        );

        if (error) console.error("❌ Error joining lobby:", error.message);
        else console.log("✅ Joined or updated player:", savedUser.first_name);

        setConnected(true);
        setConnecting(false);
        refreshPlayers();
      } catch (err: any) {
        console.error("❌ Join Lobby Error:", err.message);
        setConnecting(false);
      }
    };

    const refreshPlayers = async () => {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("game_code", professor.gameCode);
      if (error) console.error("⚠️ Error fetching players:", error.message);
      setPlayers(data || []);
    };

    // 🔄 Player realtime updates
    const playerChannel = supabase
      .channel("players-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `game_code=eq.${professor.gameCode}`,
        },
        (payload) => {
          console.log("👥 Player update:", payload);
          refreshPlayers();
        }
      )
      .subscribe();

    // 🎮 Game start listener
    const gameChannel = supabase
      .channel("game-events")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "game_events",
          filter: `game_code=eq.${professor.gameCode}`,
        },
        (payload) => {
          if (payload.new.event_type === "game_started") {
            console.log("🎮 Game started!");
            // ✅ Navigate but DON'T delete player data
            router.push("/student/play/classmode/waitingroom/start");
          }
        }
      )
      .subscribe();

    joinLobby();

    // ✅ Cleanup: only remove player if NOT going to start page
    return () => {
      supabase.removeChannel(playerChannel);
      supabase.removeChannel(gameChannel);

      // detect if navigation is going to start page
      const nextRoute = window.location.pathname;
      const goingToStart =
        nextRoute.includes("/waitingroom/start") ||
        nextRoute.includes("/classmode/waitingroom/start");

      if (!goingToStart) {
        // remove only if truly leaving
        leaveLobby(savedUser);
      }
    };
  }, [router]);

  // 🧹 Leave logic
  const leaveLobby = async (userData: any) => {
    if (!userData?.id_number) return;
    await supabase
      .from("players")
      .delete()
      .eq("game_code", professor.gameCode)
      .eq("id_number", userData.id_number);
    console.log("👋 Player left lobby:", userData.first_name);
  };

  // 🎮 Start the game
  const handleStart = async () => {
    if (!players.length) return;

    const { error } = await supabase.from("game_events").insert([
      { game_code: professor.gameCode, event_type: "game_started" },
    ]);

    if (error) {
      console.error("❌ Error starting game:", error.message);
      Swal.fire("Error", "Failed to start the game!", "error");
    } else {
      console.log("🎮 Game start event broadcasted");
      Swal.fire("Started!", "Game has started!", "success");
    }
  };

  // 🚪 Leave button
  const handleLeave = () => {
    Swal.fire({
      title: "Leave Lobby?",
      text: "Are you sure you want to leave this game lobby?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#7b2020",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Yes, leave",
    }).then(async (res) => {
      if (res.isConfirmed && user?.id_number) {
        await leaveLobby(user);
        router.push("/student/play/classmode");
      }
    });
  };

  // 🔒 Logout button
  const handleLogout = () => {
    Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#7b2020",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Yes, logout",
    }).then(async (res) => {
      if (res.isConfirmed && user?.id_number) {
        localStorage.clear();
        await leaveLobby(user);
        router.push("/");
      }
    });
  };

  // 🌀 Loader
  if (connecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white text-gray-700">
        <Loader2 className="animate-spin w-12 h-12 text-[#7b2020] mb-4" />
        <p className="font-semibold text-[#7b2020]">Connecting to lobby...</p>
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

  const displayPlayers = [
    {
      name: "YOU",
      avatar:
        user.avatar && user.avatar.trim() !== ""
          ? user.avatar
          : "/resources/avatars/student1.png",
    },
    ...players.filter((p) => p.id_number !== user.id_number),
  ];

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-white relative">
      {/* Header */}
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md">
        <div className="flex items-center space-x-3">
          <ArrowLeft
            className="w-6 h-6 cursor-pointer hover:text-gray-300"
            onClick={handleLeave}
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
            className="w-6 h-6 cursor-pointer hover:text-gray-300"
          />
          <Menu className="w-7 h-7 cursor-pointer" />
          <LogOut
            onClick={handleLogout}
            className="w-6 h-6 text-white cursor-pointer hover:text-gray-300"
          />
        </div>
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
