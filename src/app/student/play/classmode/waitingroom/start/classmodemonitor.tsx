"use client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function StartPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [waitingForStart, setWaitingForStart] = useState(true);
  const [gameCode, setGameCode] = useState<string>("XXXX"); // ✅ safe storage for code

  const mode = "Phase Rush";
  const modePath = "/classmode/gamemodes/phaserush";

  /* ---------------- Load game code safely ---------------- */
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedCode = localStorage.getItem("activeGameCode") || "XXXX";
      setGameCode(storedCode);
    }
  }, []);

  /* ---------------- Load players & setup realtime ---------------- */
  useEffect(() => {
    if (!gameCode || gameCode === "XXXX") return;
    let pollInterval: any = null;

    const refreshPlayers = async () => {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("game_code", gameCode)
        .order("id", { ascending: true });
      if (!error) setPlayers(data || []);
      setLoading(false);
    };

    const init = async () => {
      await refreshPlayers();

      // 🔁 Realtime player updates
      const playerChannel = supabase
        .channel(`players-start-realtime-${gameCode}`)
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

      // 🎮 Game start listener
      const gameChannel = supabase
        .channel(`game-state-start-${gameCode}`)
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
              console.log("🎮 Game start detected (realtime)");
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

      // 🕓 Fallback Poll (every 2s)
      pollInterval = setInterval(async () => {
        const { data } = await supabase
          .from("game_state")
          .select("*")
          .eq("game_code", gameCode)
          .eq("event_type", "game_started");

        if (data && data.length > 0) {
          console.log("🕓 Detected game start via polling fallback.");
          clearInterval(pollInterval);
          await supabase
            .from("game_events")
            .update({ progress: 0 })
            .eq("game_code", gameCode);
          setWaitingForStart(false);
          setTimeout(() => router.push(modePath), 800);
        }
      }, 2000);

      return () => {
        supabase.removeChannel(playerChannel);
        supabase.removeChannel(gameChannel);
        if (pollInterval) clearInterval(pollInterval);
      };
    };

    init();
  }, [router, gameCode]);

  /* ---------------- UI ---------------- */
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white relative">
      {/* Title */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-[#7b2020] mb-2">
          {waitingForStart ? "🏁 Waiting for Players..." : "🚀 Starting Game..."}
        </h1>
        <p className="text-lg text-gray-700 font-semibold">
          Mode: <span className="text-[#7b2020]">{mode}</span>
        </p>
      </div>

      {/* Loading Animation */}
      <div className="flex flex-col items-center justify-center gap-3">
        <div
          className={`w-16 h-16 border-4 ${
            waitingForStart ? "border-[#7b2020]" : "border-green-500"
          } border-t-transparent rounded-full animate-spin`}
        ></div>
        <p className="text-gray-600 font-medium">
          {waitingForStart
            ? "Waiting for the professor to start..."
            : "All players ready! Launching Phase Rush..."}
        </p>
      </div>

      {/* Player List */}
      <div className="mt-10 flex flex-wrap justify-center gap-6">
        {loading ? (
          <p className="text-gray-500 text-sm mt-3">Loading players...</p>
        ) : players.length > 0 ? (
          players.map((p, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <Image
                src={p.avatar || "/resources/avatars/student1.png"}
                alt={p.first_name}
                width={56}
                height={56}
                className="rounded-full border-2 border-[#7b2020] shadow-md bg-white"
              />
              <span className="text-sm font-semibold text-[#7b2020] mt-1">
                {p.first_name}
              </span>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm mt-3">No players joined yet...</p>
        )}
      </div>

      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="absolute bottom-5 left-5 text-sm bg-[#7b2020] hover:bg-[#9c2a2a] text-white px-4 py-2 rounded-md shadow-md"
      >
        ⬅ Back to Lobby
      </button>
    </div>
  );
}
