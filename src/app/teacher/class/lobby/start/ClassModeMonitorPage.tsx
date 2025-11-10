"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, LogOut, Menu, ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";


export default function ClassModeMonitorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classIdParam = searchParams.get("class_id");

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [gameSettings, setGameSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gameCode, setGameCode] = useState("");
  const [classId, setClassId] = useState<string | null>(classIdParam);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [gameOver, setGameOver] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const eventChannelRef = useRef<any>(null);
  const finishChannelRef = useRef<any>(null);



  /* ---------- Initial Load ---------- */
  useEffect(() => {
    const storedSettings = JSON.parse(localStorage.getItem("gameSettings") || "{}");
    const code = (localStorage.getItem("activeGameCode") || "").toUpperCase();

    const storedClass = localStorage.getItem("activeClassId");

    if (!code) {
      router.push("/teacher");
      return;
    }

    setGameCode(code);
    setGameSettings(storedSettings);
    setClassId(classIdParam || storedClass || null);

    Promise.all([
      fetchGameStartTime(code, storedSettings),
      refreshLeaderboard(code),
    ]).then(() => {
      connectRealtimeLeaderboard(code);
      listenForGameFinish(code);
      setLoading(false);
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (eventChannelRef.current) supabase.removeChannel(eventChannelRef.current);
      if (finishChannelRef.current) supabase.removeChannel(finishChannelRef.current);
    };
  }, [router, classIdParam]);

const fetchGameStartTime = async (code: string, settings: any) => {
  try {
    console.log("🎯 Checking game start for code:", code);

    const { data, error } = await supabase
      .from("game_state")
      .select("started_at, created_at, event_type")
      .eq("game_code", code.toUpperCase())
      .in("event_type", ["game_started", "race_started"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && Object.keys(error).length) {
      console.error("Error fetching start time:", error);
    }

    if (data) {
      const startTime = data.started_at
        ? new Date(data.started_at)
        : new Date(data.created_at);
      console.log("⏱ Game started at:", startTime.toISOString());
      await startSyncedTimer(settings, startTime);
      return;
    }

    // If no data found, listen in realtime
    console.warn("⚠️ No start record found — waiting for game_started event...");
    const channel = supabase
      .channel(`wait-start-${code}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "game_state",
          filter: `game_code=eq.${code}`,
        },
        async (payload) => {
          const newEvent = payload.new as any;
          if (["game_started", "race_started"].includes(newEvent.event_type)) {
            console.log("🎯 Game start detected in realtime!");
            const startTime = new Date(newEvent.started_at);
            await startSyncedTimer(settings, startTime);
            supabase.removeChannel(channel);
          }
        }
      )
      .subscribe();
  } catch (err) {
    console.error("Timer fetch error:", err);
  }
};


const startSyncedTimer = async (settings: any, startDate: Date) => {
  if (!settings?.duration) return;

  try {
    // Try server time for accuracy
    const { data: serverTimeData } = await supabase.rpc("get_server_time");
    const serverNow = serverTimeData ? new Date(serverTimeData) : new Date();

    const drift = Date.now() - serverNow.getTime();
    const durationSec = (settings.duration || 1) * 60;

    // Compute elapsed time since start
    const elapsed = Math.floor((serverNow.getTime() - startDate.getTime()) / 1000);
    const initialRemaining = durationSec - elapsed;

    // 🔹 Fix: Don’t set game over unless it’s truly finished
    if (initialRemaining <= 0) {
      setTimeLeft(0);
      return; // do not setGameOver(true) immediately
    }

    setTimeLeft(initialRemaining);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const correctedNow = Date.now() - drift;
      const elapsed = Math.floor((correctedNow - startDate.getTime()) / 1000);
      const remaining = durationSec - elapsed;

      if (remaining <= 0) {
        setTimeLeft(0);
        clearInterval(timerRef.current!);
        setGameOver(true);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);
  } catch (err) {
    console.error("Timer start error:", err);
  }
};

const connectRealtimeLeaderboard = async (code: string) => {
  const channel = supabase
    .channel(`phase-leaderboard-${code}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "game_events",
        filter: `game_code=eq.${code}`,
      },
      async () => {
        console.log("🔄 Live leaderboard update detected");
        await refreshLeaderboard(code);
      }
    );

  await channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      console.log(`✅ Leaderboard realtime channel active`);
    } else if (status === "CHANNEL_ERROR") {
      console.error("⚠️ Leaderboard channel error");
    } else if (status === "CLOSED") {
      console.warn("ℹ️ Leaderboard channel closed");
    }
  });

  eventChannelRef.current = channel;
  await refreshLeaderboard(code); // ensure latest data
};
const listenForGameFinish = async (code: string) => {
  const channel = supabase
    .channel(`phase-finish-${code}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "game_state",
        filter: `game_code=eq.${code}`,
      },
      async (payload) => {
        const newEvent = payload.new as any;
        if (newEvent?.event_type === "game_finished") {
          console.log("🏁 Game finished event received in realtime!");
          setGameOver(true);
          await refreshLeaderboard(code);
        }
      }
    );

  await channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      console.log(`✅ Game finish channel active`);
    } else if (status === "CHANNEL_ERROR") {
      console.error("⚠️ Game finish channel error");
    } else if (status === "CLOSED") {
      console.warn("ℹ️ Game finish channel closed");
    }
  });

  finishChannelRef.current = channel;
};


  /* ---------- Refresh Leaderboard (Fetch Players + Events) ---------- */
  const refreshLeaderboard = async (code: string) => {
    // Fetch both players and events
    const [{ data: eventData }, { data: playerData }] = await Promise.all([
      supabase.from("game_events")
        .select("player_name, progress, score")
        .eq("game_code", code),
      supabase.from("players")
        .select("name, avatar")
        .eq("game_code", code),
    ]);

    if (!eventData || !playerData) return;

    // Merge event + player info
    const merged = eventData.map((row) => {
      const player = playerData.find((p) => p.name === row.player_name);
      return {
        name: row.player_name,
        score: row.score ?? 0,
        progress: row.progress ?? 0,
        avatar: player?.avatar || "/resources/avatars/student1.png",
      };
    });

    const sorted = merged.sort((a, b) => b.score - a.score || b.progress - a.progress);
    setLeaderboard(sorted);
  };

  /* ---------- UI ---------- */
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-700">
        <Loader2 className="animate-spin w-10 h-10 mb-3 text-[#7b2020]" />
        <p>Loading live leaderboard...</p>
      </div>
    );

  const minutes = Math.floor(timeLeft / 60);
  const seconds = (timeLeft % 60).toString().padStart(2, "0");
  // ⏱ Timer calculation (updates on every re-render)
const totalTime = (gameSettings?.duration || 1) * 60;
const percentRemaining = totalTime > 0 ? Math.max(0, (timeLeft / totalTime) * 100) : 0;


  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="bg-[#7b2020] text-white px-4 py-3 flex justify-between items-center shadow-md">
        <div className="flex gap-3 items-center">
          <ArrowLeft
            className="w-6 h-6 cursor-pointer"
            onClick={() =>
              classId
                ? router.push(`/teacher/class?class_id=${classId}`)
                : router.push("/teacher")
            }
          />
          <h1 className="font-semibold text-lg">Phase Rush Live Leaderboard</h1>
        </div>
        
      </header>

{/* Timer + Info */}
<div className="flex flex-col items-center mt-6 w-full">
  <div className="bg-[#7b2020] text-white px-6 py-4 rounded-xl text-center shadow-md w-[90%] max-w-xl">
    <div className="text-xl font-bold mb-1">Game Code: {gameCode}</div>
    <div className="mb-2">Duration: {gameSettings?.duration || 1} min</div>

   
   
</div>
</div>


      {/* Live Leaderboard */}
      <div className="w-[90%] max-w-3xl mx-auto mt-10 mb-10">
        <h2 className="text-2xl font-bold text-center text-[#7b2020] mb-5">
          {gameOver ? "🏁 Final Leaderboard" : "📊 Live Leaderboard"}
        </h2>
        <div className="bg-white border border-[#7b2020] rounded-lg shadow-md overflow-hidden">
          <table className="w-full text-sm sm:text-base">
            <thead className="bg-[#7b2020] text-white">
              <tr>
                <th className="py-2 px-3 text-left">Rank</th>
                <th className="py-2 px-3 text-left">Player</th>
                <th className="py-2 px-3 text-right">Points</th>
                <th className="py-2 px-3 text-left">Progress</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((p, i) => (
                <tr
                  key={i}
                  className={`border-b ${
                    i % 2 === 0 ? "bg-gray-50" : "bg-white"
                  } transition-all`}
                >
                  <td className="py-2 px-3 font-semibold">
                    {i + 1 === 1
                      ? "🥇"
                      : i + 1 === 2
                      ? "🥈"
                      : i + 1 === 3
                      ? "🥉"
                      : i + 1}
                  </td>
                  <td className="py-2 px-3 flex items-center gap-2 text-black">
                    <Image
                      src={p.avatar}
                      alt={p.name}
                      width={35}
                      height={35}
                      className="rounded-full border object-cover bg-white"
                      unoptimized
                    />
                    <span>{p.name}</span>
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-[#7b2020]">
                    {p.score}
                  </td>
                  <td className="py-2 px-3 w-[50%]">
                    <div className="bg-gray-200 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-[#7b2020] h-full transition-all duration-500"
                        style={{ width: `${Math.min(p.progress * 3, 100)}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {gameOver && (
  <div className="flex justify-center mt-6">
    <button
      onClick={async () => {
  const result = await Swal.fire({
    title: "End Game?",
    text: "This will complete now the game. You can check records at Class Game Records",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#7b2020",
    confirmButtonText: "Yes, end it!",
  });

  if (!result.isConfirmed) return;

  try {
    await Promise.all([
      supabase.from("players").delete().eq("game_code", gameCode),
      supabase.from("game_events").delete().eq("game_code", gameCode),
      supabase.from("game_state").delete().eq("game_code", gameCode),
    ]);

    await Swal.fire("Game Completed!", "Ready for new game!", "success");

    if (classId) router.push(`/teacher/class?class_id=${classId}`);
    else router.push("/teacher");
  } catch (err) {
    console.error("❌ Cleanup error:", err);
    Swal.fire("Error", "Something went wrong while deleting.", "error");
  }
}}

      className="bg-[#7b2020] text-white py-2 px-6 rounded-lg font-semibold hover:bg-[#5f1717] transition-all"
    >
      Return to Class
    </button>
  </div>
)}

      </div>
    </div>
  );
}
