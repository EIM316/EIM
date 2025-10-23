// waitingroom/start/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function StartPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [waitingForStart, setWaitingForStart] = useState(true);

  const mode = "Phase Rush";
  const modePath = "/classmode/gamemodes/phaserush";
  const professor = { gameCode: "5ABC9" };

  useEffect(() => {
    let pollInterval: any = null;

    const init = async () => {
      await refreshPlayers();

      // Realtime players
      const playerChannel = supabase
        .channel("players-start-realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "players",
            filter: `game_code=eq.${professor.gameCode}`,
          },
          () => refreshPlayers()
        )
        .subscribe();

      // Realtime start listener (filter on game_code)
      const gameChannel = supabase
        .channel("game-state-start")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "game_state",
            filter: `game_code=eq.${professor.gameCode}`,
          },
          async (payload) => {
            const game = payload.new as any;
            if (game?.event_type === "game_started") {
              console.log("🎮 Start signal received by client!");
              // Reset progress (starter already reset, but safe to ensure)
              await supabase.from("game_events").update({ progress: 0 }).eq("game_code", professor.gameCode);
              setWaitingForStart(false);
              setTimeout(() => router.push(modePath), 800);
            }
          }
        )
        .subscribe();

      // Poll fallback (for clients that missed realtime)
      pollInterval = setInterval(async () => {
        const { data } = await supabase
          .from("game_state")
          .select("*")
          .eq("game_code", professor.gameCode)
          .eq("event_type", "game_started");

        if (data && data.length > 0) {
          console.log("🕓 Detected started game via polling fallback.");
          clearInterval(pollInterval);
          await supabase.from("game_events").update({ progress: 0 }).eq("game_code", professor.gameCode);
          setWaitingForStart(false);
          setTimeout(() => router.push(modePath), 800);
        }
      }, 2000);

      // cleanup function will remove channels and poll
      return () => {
        supabase.removeChannel(playerChannel);
        supabase.removeChannel(gameChannel);
        if (pollInterval) clearInterval(pollInterval);
      };
    };

    // call init and keep reference to cleanup
    let cleanupPromise: any = null;
    init().then((cleanup) => {
      cleanupPromise = cleanup;
    });

    return () => {
      if (cleanupPromise) cleanupPromise();
    };
  }, [router]);

  async function refreshPlayers() {
    const { data, error } = await supabase.from("players").select("*").eq("game_code", professor.gameCode);
    if (error) console.error("⚠️ Error loading players:", error.message);
    setPlayers(data || []);
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white relative">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-[#7b2020] mb-2">
          {waitingForStart ? "🏁 Waiting for Players..." : "🚀 Starting Game..."}
        </h1>
        <p className="text-lg text-gray-700 font-semibold">
          Mode: <span className="text-[#7b2020]">{mode}</span>
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-3">
        <div className={`w-16 h-16 border-4 ${waitingForStart ? "border-[#7b2020]" : "border-green-500"} border-t-transparent rounded-full animate-spin`}></div>
        <p className="text-gray-600 font-medium">
          {waitingForStart ? "Waiting for someone to start..." : "All players ready! Starting Phase Rush..."}
        </p>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-6">
        {loading ? (
          <p className="text-gray-500 text-sm mt-3">Loading players...</p>
        ) : players.length > 0 ? (
          players.map((p, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <img src={p.avatar || "/resources/avatars/student1.png"} alt={p.name} className="w-14 h-14 rounded-full border-2 border-[#7b2020] shadow-md bg-white" />
              <span className="text-sm font-semibold text-[#7b2020] mt-1">{p.name}</span>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm mt-3">No players yet...</p>
        )}
      </div>
    </div>
  );
}
