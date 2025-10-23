"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, LogOut, Menu, ArrowLeft, Users, Gamepad2 } from "lucide-react";

export default function ClassModeMonitorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classIdParam = searchParams.get("class_id"); // ✅ Read from URL

  const [players, setPlayers] = useState<any[]>([]);
  const [gameSettings, setGameSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gameCode, setGameCode] = useState("");
  const [classId, setClassId] = useState<string | null>(classIdParam);

  // ✅ Load data from localStorage & connect to lobby
  useEffect(() => {
    const storedSettings = JSON.parse(localStorage.getItem("gameSettings") || "{}");
    const code = localStorage.getItem("activeGameCode");
    const storedClass = localStorage.getItem("activeClassId");

    // If no active code, return to teacher dashboard
    if (!code) {
      router.push("/teacher");
      return;
    }

    setGameCode(code);
    setGameSettings(storedSettings);

    // ✅ Prioritize URL class_id > storedClass
    setClassId(classIdParam || storedClass || null);

    connectRealtime(code);
  }, [router, classIdParam]);

  // ✅ Setup realtime listener for players
  const connectRealtime = async (code: string) => {
    await refreshPlayers(code);

    const playerChannel = supabase
      .channel("monitor-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players" },
        (payload) => {
          const row = payload.new as any;
          if (row?.game_code === code) refreshPlayers(code);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(playerChannel);
  };

  // ✅ Fetch player list
  const refreshPlayers = async (code: string) => {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("game_code", code)
      .order("id", { ascending: true });

    if (!error) {
      setPlayers(data || []);
      setLoading(false);
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
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <ArrowLeft
            onClick={() => {
              // ✅ Go back to class page with correct class_id
              if (classId) {
                router.push(`/teacher/class?class_id=${classId}`);
              } else {
                router.push("/teacher");
              }
            }}
            className="w-6 h-6 cursor-pointer hover:text-gray-300"
          />
          <h1 className="font-semibold text-lg">Game Monitor</h1>
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
          <div className="text-xl font-bold mb-1">
            Code: {gameCode || "—"}
          </div>
          <div className="text-sm">
            Mode: {gameSettings?.mode || "Phase Rush"} | Duration:{" "}
            {gameSettings?.duration || 5} min | Points:{" "}
            {gameSettings?.points || 10}
          </div>
          <div className="text-xs mt-1 opacity-80">
            Shuffle: {gameSettings?.shuffleQuestions ? "ON" : "OFF"} | Music:{" "}
            {gameSettings?.musicTheme || "Classic"}
          </div>
        </div>
      </div>

      {/* Players Section */}
      <div className="flex flex-col items-center mt-10 w-full px-5">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-[#7b2020]" />
          <h2 className="text-[#7b2020] font-bold text-lg">
            Players Connected ({players.length})
          </h2>
        </div>

        {players.length === 0 ? (
          <p className="text-gray-500 text-sm mt-4">Waiting for students...</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-5 justify-center">
            {players.map((p, i) => (
              <div
                key={i}
                className="flex flex-col items-center justify-center text-center"
              >
                <Image
                  src={p.avatar || "/resources/avatars/student1.png"}
                  alt={p.name || "Player"}
                  width={60}
                  height={60}
                  className="rounded-full border-2 border-[#7b2020] shadow-md object-cover"
                />
                <span className="text-sm mt-1 font-semibold text-gray-700 truncate w-[70px]">
                  {p.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Start Button (placeholder for future control) */}
      <div className="flex justify-center mt-10 mb-10">
        <button
          onClick={() =>
            alert("Game monitoring active. Students playing Phase Rush...")
          }
          className="flex items-center gap-2 bg-[#7b2020] hover:bg-[#5f1717] text-white px-8 py-3 rounded-md font-semibold shadow-md"
        >
          <Gamepad2 className="w-5 h-5" />
          Game in Progress
        </button>
      </div>
    </div>
  );
}
