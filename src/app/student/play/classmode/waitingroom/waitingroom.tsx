"use client";
export const dynamic = "force-dynamic";
export const revalidate = 0;
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import { LogOut, Search, Menu, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function WaitingRoomPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [gameCode, setGameCode] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [professorInfo, setProfessorInfo] = useState<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedUserStr = localStorage.getItem("user");
    if (!savedUserStr) {
      router.push("/");
      return;
    }

    const savedUser = JSON.parse(savedUserStr);
    if (!savedUser?.id_number) {
      router.push("/");
      return;
    }

    const urlCode = searchParams.get("code");
    const storedCode = localStorage.getItem("activeGameCode");
    const codeToUse = urlCode || storedCode;

    if (!codeToUse) {
      Swal.fire("Error", "No active game found.", "error").then(() =>
        router.push("/student/play/classmode")
      );
      return;
    }

    setUser(savedUser);
    setGameCode(codeToUse.toUpperCase());
  }, [router, searchParams]);

  /* ---------- Join lobby & listen for realtime events ---------- */
  useEffect(() => {
    if (!gameCode || !user) return;
    setConnecting(true);

    const joinLobby = async () => {
      try {
        // ✅ FIXED: Delete old entry first, then insert fresh
        await supabase
          .from("players")
          .delete()
          .eq("game_code", gameCode)
          .eq("name", user.first_name);

        // ✅ Now insert the player
        const { error: insertError } = await supabase.from("players").insert({
          game_code: gameCode,
          name: user.first_name,
          avatar: user.avatar || "/resources/avatars/student1.png",
          is_active: true,
          joined_at: new Date().toISOString(),
        });

        if (insertError) {
          console.error("❌ Insert Error:", insertError);
          throw insertError;
        }

        console.log("✅ Player joined successfully:", user.first_name);
        setConnected(true);
        setConnecting(false);
        await refreshPlayers();

        // ✅ Get professor/game details
        const res = await fetch(`/api/classmode/validate?code=${gameCode}`);
        const gameData = await res.json();
        if (gameData.success) {
          setProfessorInfo({
            name: gameData.game.teacher_id || "PROFESSOR",
            game_type: gameData.game.game_type?.replace("_", " ").toUpperCase(),
          });
        }
      } catch (err: any) {
        console.error("❌ Join Lobby Error:", err.message);
        Swal.fire("Error", "Failed to join lobby. Please try again.", "error");
        setConnecting(false);
      }
    };

    const refreshPlayers = async () => {
      const { data, error } = await supabase
        .from("players")
        .select("name, avatar, is_active")
        .eq("game_code", gameCode)
        .eq("is_active", true)
        .order("joined_at", { ascending: true });

      if (!error) setPlayers(data || []);
    };

    // ✅ Listen for players joining or leaving
    const playerChannel = supabase
      .channel(`players-realtime-${gameCode}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `game_code=eq.${gameCode}` },
        () => refreshPlayers()
      )
      .subscribe();

    // ✅ Listen for game start event
    const gameChannel = supabase
      .channel(`game-state-realtime-${gameCode}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "game_state",
          filter: `game_code=eq.${gameCode}`,
        },
        (payload) => {
          const game = payload.new as any;
          if (game?.event_type === "game_started") {
            console.log("🎮 Game started broadcast received!");
            router.push(`/student/play/classmode/waitingroom/start?code=${gameCode}`);
          }
        }
      )
      .subscribe();

    joinLobby();

    // ✅ Remove player on unload or disconnect
    const handleDisconnect = async () => {
      if (!user?.first_name || !gameCode) return;
      console.log("💨 Player disconnected, cleaning up...");
      await supabase
        .from("players")
        .delete()
        .eq("game_code", gameCode)
        .eq("name", user.first_name);
    };

    window.addEventListener("beforeunload", handleDisconnect);
    window.addEventListener("pagehide", handleDisconnect);

    return () => {
      handleDisconnect();
      supabase.removeChannel(playerChannel);
      supabase.removeChannel(gameChannel);
      window.removeEventListener("beforeunload", handleDisconnect);
      window.removeEventListener("pagehide", handleDisconnect);
    };
  }, [gameCode, user, router]);

  /* ---------- Leave lobby ---------- */
  const leaveLobby = async () => {
    if (!user?.first_name || !gameCode) return;
    await supabase
      .from("players")
      .delete()
      .eq("game_code", gameCode)
      .eq("name", user.first_name);
    console.log("🚪 Player left lobby manually.");
  };

  /* ---------- Loading states ---------- */
  if (connecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white text-gray-700">
        <Loader2 className="animate-spin w-12 h-12 text-[#7b2020] mb-4" />
        <p className="font-semibold text-[#7b2020]">Connecting to lobby...</p>
        <p className="text-sm text-gray-500 mt-1">Please wait ⏳</p>
      </div>
    );
  }

  if (!user || !gameCode)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700">
        Loading lobby...
      </div>
    );

  /* ---------- Display players ---------- */
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

  /* ---------- UI ---------- */
  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-white relative">
      {/* Header */}
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md">
        <div className="flex items-center space-x-3">
          <ArrowLeft
            className="w-6 h-6 cursor-pointer hover:text-gray-300"
            onClick={async () => {
              await leaveLobby();
              router.push("/student/play/classmode");
            }}
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
      </header>

      {/* Game Info */}
      <div className="flex flex-col items-center w-full mt-6">
        <span className="font-bold text-lg text-[#7b2020]">
          {professorInfo?.name || "CLASS LOBBY"}
        </span>
        <div className="text-gray-600 text-sm mt-1">
          GAME CODE: <b>{gameCode}</b>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {professorInfo?.game_type || "WAITING FOR GAME INFO..."}
        </div>
      </div>

      {/* Player Grid */}
      <div className="mt-8 w-[90%] max-w-xs bg-[#b22222] rounded-2xl shadow-md flex flex-col items-center py-5">
        <span className="text-white font-bold text-xl mb-3">
          {displayPlayers.length} PLAYERS
        </span>
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

      {/* Waiting Notice */}
      <div className="flex flex-col items-center mt-8 text-gray-700">
        <p className="text-sm font-medium">
          Waiting for the professor to start the game...
        </p>
      </div>
    </div>
  );
}