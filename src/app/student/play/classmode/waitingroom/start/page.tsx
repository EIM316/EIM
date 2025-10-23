"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function StartPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [waitingForStart, setWaitingForStart] = useState(true);
  const [gameCode, setGameCode] = useState<string | null>(null);
  const [mode, setMode] = useState<string>("Phase Rush");

  const modePath = "/classmode/gamemodes/phaserush"; // fixed for now

  useEffect(() => {
    // ✅ Retrieve game code from URL or localStorage
    const urlCode = searchParams.get("code");
    const storedCode = localStorage.getItem("activeGameCode");
    const codeToUse = urlCode || storedCode;

    if (!codeToUse) {
      router.push("/student/play/classmode");
      return;
    }

    setGameCode(codeToUse.toUpperCase());
  }, [router, searchParams]);

  useEffect(() => {
    if (!gameCode) return;
    let pollInterval: any = null;

    const init = async () => {
      await refreshPlayers();

      // ✅ Realtime updates for players
      const playerChannel = supabase
        .channel("players-start-realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "players",
            filter: `game_code=eq.${gameCode}`,
          },
          () => refreshPlayers()
        )
        .subscribe();

      // ✅ Realtime listener for game start
      const gameChannel = supabase
        .channel("game-state-start")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "game_state",
            filter: `game_code=eq.${gameCode}`,
          },
          async (payload) => {
            const game = payload.new as any;
            if (game?.event_type === "game_started") {
              console.log("🎮 Start signal received!");
              await supabase
                .from("game_events")
                .update({ progress: 0 })
                .eq("game_code", gameCode);
              setWaitingForStart(false);
              setTimeout(() => router.push(modePath), 800);
            }
          }
        )
        .subscribe();

      // ✅ Fallback polling
      pollInterval = setInterval(async () => {
        const { data } = await supabase
          .from("game_state")
          .select("*")
          .eq("game_code", gameCode)
          .eq("event_type", "game_started");

        if (data && data.length > 0) {
          console.log("🕓 Game start detected (poll fallback).");
          clearInterval(pollInterval);
          await supabase
            .from("game_events")
            .update({ progress: 0 })
            .eq("game_code", gameCode);
          setWaitingForStart(false);
          setTimeout(() => router.push(modePath), 800);
        }
      }, 2000);

      // Cleanup
      return () => {
        supabase.removeChannel(playerChannel);
        supabase.removeChannel(gameChannel);
        if (pollInterval) clearInterval(pollInterval);
      };
    };

    let cleanupFn: any = null;
    init().then((cleanup) => {
      cleanupFn = cleanup;
    });

    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [gameCode, router]);

  async function refreshPlayers() {
    if (!gameCode) return;
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("game_code", gameCode);

    if (error) console.error("⚠️ Error loading players:", error.message);
    setPlayers(data || []);
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white relative px-4">
      {/* Title */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-[#7b2020] mb-2">
          {waitingForStart ? "🏁 Waiting for Professor..." : "🚀 Game Starting..."}
        </h1>
        <p className="text-lg text-gray-700 font-semibold">
          Mode: <span className="text-[#7b2020]">{mode}</span>
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Game Code: <b>{gameCode || "..."}</b>
        </p>
      </div>

      {/* Spinner */}
      <div className="flex flex-col items-center justify-center gap-3 mb-10">
        <div
          className={`w-16 h-16 border-4 ${
            waitingForStart ? "border-[#7b2020]" : "border-green-500"
          } border-t-transparent rounded-full animate-spin`}
        ></div>
        <p className="text-gray-600 font-medium">
          {waitingForStart
            ? "Waiting for professor to start the match..."
            : "All players ready! Launching game..."}
        </p>
      </div>

      {/* Players */}
      <div className="w-full max-w-md flex flex-col items-center">
        <h3 className="text-[#7b2020] font-bold text-base mb-3 text-center">
          Players in Lobby ({players.length})
        </h3>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 justify-center">
          {loading ? (
            <p className="text-gray-500 text-sm mt-3 col-span-full">
              Loading players...
            </p>
          ) : players.length > 0 ? (
            players.map((p, i) => (
              <div
                key={i}
                className="flex flex-col items-center text-center"
              >
                <img
                  src={p.avatar || "/resources/avatars/student1.png"}
                  alt={p.name}
                  className="w-14 h-14 rounded-full border-2 border-[#7b2020] shadow-md bg-white object-cover"
                />
                <span className="text-sm font-semibold text-[#7b2020] mt-1 truncate w-[70px]">
                  {p.name}
                </span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm mt-3 col-span-full">
              No players yet...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
