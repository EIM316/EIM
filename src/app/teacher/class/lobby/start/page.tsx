"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import {
  Loader2,
  LogOut,
  Menu,
  ArrowLeft,
  Trophy,
  Gamepad2,
} from "lucide-react";

export default function ClassModeMonitorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classIdParam = searchParams.get("class_id");

  const [players, setPlayers] = useState<any[]>([]);
  const [progress, setProgress] = useState<{ [key: string]: number }>({});
  const [gameSettings, setGameSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gameCode, setGameCode] = useState("");
  const [classId, setClassId] = useState<string | null>(classIdParam);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(60);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /* ✅ Load data from localStorage */
  useEffect(() => {
    const storedSettings = JSON.parse(localStorage.getItem("gameSettings") || "{}");
    const code = localStorage.getItem("activeGameCode");
    const storedClass = localStorage.getItem("activeClassId");

    if (!code) {
      router.push("/teacher");
      return;
    }

    setGameCode(code);
    setGameSettings(storedSettings);
    setClassId(classIdParam || storedClass || null);
    connectRealtime(code);

    // Auto timer countdown
    const totalTime = (storedSettings?.duration || 1) * 60;
    setTimeLeft(totalTime);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleGameEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [router, classIdParam]);

  /* ✅ Real-time sync with Supabase events (using game_events_prof) */
  const connectRealtime = async (code: string) => {
    await refreshPlayers(code);

    const playerChannel = supabase
      .channel("phase-rush-monitor")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_events_prof", // ← changed table here
          filter: `game_code=eq.${code}`,
        },
        (payload) => {
          const data = payload.new as any;
          if (data?.player_name && typeof data.progress === "number") {
            setProgress((prev) => ({
              ...prev,
              [data.player_name]: data.progress,
            }));
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(playerChannel);
  };

  /* ✅ Fetch all players */
  const refreshPlayers = async (code: string) => {
    const { data, error } = await supabase
      .from("players")
      .select("name,avatar")
      .eq("game_code", code);
    if (!error) {
      setPlayers(data || []);
      setLoading(false);
    }
  };

  /* ✅ When game ends → compute leaderboard */
  const handleGameEnd = async () => {
    // Get final progress from professor mirror table
    const { data } = await supabase
      .from("game_events_prof") // ← using the professor mirror table
      .select("player_name,progress")
      .eq("game_code", gameCode);

    const progressData = data || [];

    const sorted = progressData
      .map((row) => ({
        name: row.player_name,
        progress: row.progress,
      }))
      .sort((a, b) => b.progress - a.progress);

    setLeaderboard(sorted);
    setShowLeaderboard(true);

    // Optional: Save to backend via API
    const teacher = JSON.parse(localStorage.getItem("user") || "{}");
    for (const player of sorted) {
      await fetch(`/api/classmode/records/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professor_id: teacher.id_number,
          game_code: gameCode,
          student_id_number: player.name,
          points: player.progress,
        }),
      });
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-700 bg-white">
        <Loader2 className="animate-spin w-10 h-10 text-[#7b2020] mb-3" />
        <p className="font-semibold text-[#7b2020]">Loading live monitor...</p>
      </div>
    );

  return (
    <div className="flex flex-col min-h-screen bg-white relative">
      {/* Header */}
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <ArrowLeft
            onClick={() => {
              if (classId) router.push(`/teacher/class?class_id=${classId}`);
              else router.push("/teacher");
            }}
            className="w-6 h-6 cursor-pointer hover:text-gray-300"
          />
          <h1 className="font-semibold text-lg">Phase Rush Monitor</h1>
        </div>
        <div className="flex items-center gap-4">
          <Menu className="w-6 h-6 cursor-pointer hover:text-gray-300" />
          <LogOut
            onClick={() => router.push("/")}
            className="w-6 h-6 text-white cursor-pointer hover:text-gray-300"
          />
        </div>
      </header>

      {/* Game Info */}
      <div className="w-full flex flex-col items-center mt-6">
        <div className="bg-[#7b2020] text-white rounded-xl px-6 py-4 text-center shadow-md max-w-sm w-[90%]">
          <div className="text-xl font-bold mb-1">Code: {gameCode}</div>
          <div className="text-sm">
            Mode: {gameSettings?.mode || "Phase Rush"} | Duration:{" "}
            {gameSettings?.duration || 1} min | Points:{" "}
            {gameSettings?.points || 100}
          </div>
          <p className="text-xs opacity-80 mt-1">Time Left: {timeLeft}s</p>
        </div>
      </div>

      {/* ✅ LIVE GAME PREVIEW */}
      <div className="relative w-[90%] max-w-4xl mx-auto mt-8 border-2 border-[#7b2020] rounded-lg overflow-hidden shadow-md">
        <div
          className="w-full"
          style={{
            height: "250px",
            backgroundImage: "url('/resources/modes/waterbg.gif')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Finish line */}
          <div className="absolute right-8 top-0 bottom-0 w-[4px] bg-yellow-400"></div>

          {/* Player boats */}
          {players.map((p, i) => (
            <div key={i} className="absolute left-4" style={{ top: `${60 + i * 60}px` }}>
              <div
                className="transition-all duration-500 ease-in-out"
                style={{ transform: `translateX(${(progress[p.name] || 0) * 3}px)` }}
              >
                <Image
                  src={"/resources/modes/boat1.png"}
                  alt={p.name}
                  width={60}
                  height={60}
                  className="drop-shadow-md"
                  unoptimized
                />
                <p className="text-xs text-center text-white bg-[#7b2020]/80 rounded-full mt-1 px-2">
                  {p.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Waiting / Active Notice */}
      <div className="flex justify-center mt-10 mb-10">
        {!showLeaderboard ? (
          <button
            className="flex items-center gap-2 bg-[#7b2020] hover:bg-[#5f1717] text-white px-8 py-3 rounded-md font-semibold shadow-md"
            disabled
          >
            <Gamepad2 className="w-5 h-5" /> Game In Progress...
          </button>
        ) : (
          <button
            onClick={() => setShowLeaderboard(true)}
            className="flex items-center gap-2 bg-[#7b2020] hover:bg-[#5f1717] text-white px-8 py-3 rounded-md font-semibold shadow-md"
          >
            <Trophy className="w-5 h-5" /> Show Leaderboard
          </button>
        )}
      </div>

      {/* 🏁 Leaderboard Modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white w-[90%] max-w-md p-6 rounded-lg shadow-xl relative">
            <h2 className="text-2xl font-bold text-[#7b2020] text-center mb-4">
              🏁 Game Finished
            </h2>
            {leaderboard.length === 0 ? (
              <p className="text-center text-gray-500">No progress data available.</p>
            ) : (
              <div className="max-h-[300px] overflow-y-auto border-t border-b border-[#7b2020]/30">
                {leaderboard.map((p, index) => (
                  <div
                    key={index}
                    className="flex justify-between py-2 px-3 border-b border-[#7b2020]/10"
                  >
                    <span className="font-semibold">
                      {index === 0
                        ? "🥇"
                        : index === 1
                        ? "🥈"
                        : index === 2
                        ? "🥉"
                        : "🏅"}{" "}
                      {p.name}
                    </span>
                    <span className="text-[#7b2020] font-bold">
                      {p.progress.toFixed(0)} pts
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() =>
                classId
                  ? router.push(`/teacher/class?class_id=${classId}`)
                  : router.push("/teacher")
              }
              className="mt-5 w-full bg-[#7b2020] text-white font-semibold py-2 rounded-md hover:bg-[#5f1717]"
            >
              Back to Class
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
