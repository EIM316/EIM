// waitingroom/page.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { LogOut, Search, Menu, ArrowLeft, Play, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function WaitingRoomPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);

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
        await supabase.from("players").upsert(
          {
            id_number: savedUser.id_number,
            game_code: professor.gameCode,
            name: savedUser.first_name,
            avatar: savedUser.avatar || "/resources/avatars/student1.png",
          },
          { onConflict: "game_code,id_number" }
        );

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
        .eq("game_code", professor.gameCode)
        .order("id", { ascending: true });

      if (!error) setPlayers(data || []);
    };

    // realtime players (filter inside handler)
    const playerChannel = supabase
      .channel("players-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players" },
        (payload) => {
          const row = payload.new as any;
          if (row?.game_code === professor.gameCode) refreshPlayers();
        }
      )
      .subscribe();

    // listen for start events filtered by game_code
    const gameChannel = supabase
      .channel("game-state-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "game_state",
          filter: `game_code=eq.${professor.gameCode}`,
        },
        (payload) => {
          const game = payload.new as any;
          if (game?.event_type === "game_started") {
            console.log("🎮 Game started broadcast received!");
            router.push("/student/play/classmode/waitingroom/start");
          }
        }
      )
      .subscribe();

    joinLobby();

    return () => {
      supabase.removeChannel(playerChannel);
      supabase.removeChannel(gameChannel);
    };
  }, [router]);

  const leaveLobby = async (userData: any) => {
    if (!userData?.id_number) return;
    await supabase
      .from("players")
      .delete()
      .eq("game_code", professor.gameCode)
      .eq("id_number", userData.id_number);
  };

  const handleStart = async () => {
    if (!players.length) return;

    try {
      // reset progress for all players (starter only)
      await supabase.from("game_events").update({ progress: 0 }).eq("game_code", professor.gameCode);

      // insert a single start signal for this game_code
      const { data, error } = await supabase
        .from("game_state")
        .insert([{ game_code: professor.gameCode, event_type: "game_started" }])
        .select();

      if (error) {
        console.error("❌ Start error:", error.message);
        Swal.fire("Error", "Failed to start the game!", "error");
      } else {
        console.log("🎮 Game start broadcasted to all!", data);
        Swal.fire({
          title: "Started!",
          text: "Game is starting for everyone...",
          icon: "success",
          timer: 800,
          showConfirmButton: false,
        }).then(() => {
          router.push("/student/play/classmode/waitingroom/start");
        });
      }
    } catch (err: any) {
      console.error("❌ Exception:", err.message);
      Swal.fire("Error", "Something went wrong!", "error");
    }
  };

  if (connecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white text-gray-700">
        <Loader2 className="animate-spin w-12 h-12 text-[#7b2020] mb-4" />
        <p className="font-semibold text-[#7b2020]">Connecting to lobby...</p>
        <p className="text-sm text-gray-500 mt-1">Please wait ⏳</p>
      </div>
    );
  }

  if (!user)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700">
        Loading lobby...
      </div>
    );

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
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md">
        <div className="flex items-center space-x-3">
          <ArrowLeft
            className="w-6 h-6 cursor-pointer hover:text-gray-300"
            onClick={() => router.back()}
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
          <Search className="w-6 h-6 cursor-pointer hover:text-gray-300" />
          <Menu className="w-7 h-7 cursor-pointer" />
          <LogOut
            onClick={() => router.push("/")}
            className="w-6 h-6 text-white cursor-pointer hover:text-gray-300"
          />
        </div>
      </header>

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
          <div className="font-bold text-base mb-1">CLASS MODE: {professor.gameCode}</div>
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

      <div className="mt-6 w-[90%] max-w-xs bg-[#b22222] rounded-2xl shadow-md flex flex-col items-center py-5">
        <span className="text-white font-bold text-xl mb-3">{displayPlayers.length}/8 PLAYERS</span>
        <div className="grid grid-cols-3 gap-4">
          {displayPlayers.map((p, i) => (
            <div key={i} className="flex flex-col items-center justify-center text-white">
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

      <div className="flex flex-col items-center gap-3 mt-8">
        <button
          onClick={handleStart}
          disabled={!connected}
          className={`flex items-center gap-2 px-8 py-3 rounded-md shadow-md transition-all font-semibold ${
            connected ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-400 cursor-not-allowed text-gray-200"
          }`}
        >
          <Play className="w-5 h-5" />
          {connected ? "START" : "CONNECTING..."}
        </button>
      </div>
    </div>
  );
}
