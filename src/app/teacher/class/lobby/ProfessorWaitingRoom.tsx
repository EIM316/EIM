"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import {
  LogOut,
  Menu,
  ArrowLeft,
  Play,
  Loader2,
  Music,
  Check,
  X,
  Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function ProfessorWaitingRoom() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get("class_id");

  const [professor, setProfessor] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [connecting, setConnecting] = useState(true);
  const [connected, setConnected] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState<number>(0);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [questionMode, setQuestionMode] = useState<"Module" | "Premade" | "Mixed">("Module");


  const [gameSettings, setGameSettings] = useState({
    gameCode: "",
    mode: "Phase Rush",
    duration: 5,
    points: 10,
    shuffleQuestions: true,
    musicTheme: "theme1",
    class_id: null,
  });

  const themes = [
    { name: "Theme 1", file: "/resources/music/theme1.mp3" },
    { name: "Theme 2", file: "/resources/music/theme2.mp3" },
    { name: "Theme 3", file: "/resources/music/theme3.mp3" },
    { name: "Theme 4", file: "/resources/music/theme4.mp3" },
  ];

  /* ---------- Delete Game Handler (Neon + Supabase cleanup) ---------- */
const handleDeleteGame = async () => {
  Swal.fire({
    title: "Delete This Game?",
    text: "This will permanently delete the current game from the database.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#7b2020",
    cancelButtonColor: "#aaa",
    confirmButtonText: "Yes, delete it",
    cancelButtonText: "Cancel",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const gameCode = localStorage.getItem("activeGameCode");
        if (!gameCode) {
          Swal.fire("Error", "No active game found.", "error");
          return;
        }

        // ✅ Delete from Neon (Prisma via API)
        const response = await fetch(`/api/classmode/delete?game_code=${gameCode}`, {
          method: "DELETE",
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error || "Failed to delete game.");

        // ✅ Delete any leftover game_state or players in Supabase
        await supabase.from("game_state").delete().eq("game_code", gameCode);
        await supabase.from("players").delete().eq("game_code", gameCode);

        Swal.fire({
          title: "Deleted!",
          text: "Game successfully removed.",
          icon: "success",
          confirmButtonColor: "#7b2020",
          timer: 1200,
          showConfirmButton: false,
        });

        // ✅ Cleanup localStorage + redirect
        localStorage.removeItem("activeGameCode");
        localStorage.removeItem("gameSettings");
        setTimeout(() => router.push(`/teacher/class?class_id=${classId}`), 1000);
      } catch (err: any) {
        console.error("❌ Error deleting game:", err);
        Swal.fire("Error", err.message || "Failed to delete game.", "error");
      }
    }
  });
};

  /* ---------- Load professor + setup ---------- */
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (!savedUser.id_number) {
      router.push("/");
      return;
    }
    setProfessor(savedUser);

    const code =
      localStorage.getItem("activeGameCode") ||
      Math.random().toString(36).substring(2, 7).toUpperCase();

    setGameSettings((prev) => ({ ...prev, gameCode: code }));
    localStorage.setItem("activeGameCode", code);

    fetchAvailableQuestions();
    connectLobby(code);
  }, [router]);

  /* ---------- Fetch available questions ---------- */
  const fetchAvailableQuestions = async () => {
    try {
      const [mode1, mode2, mode4] = await Promise.all([
        fetch("/api/gamemode1/list-all").then((res) => res.json()).catch(() => []),
        fetch("/api/gamemode2/list").then((res) => res.json()).catch(() => []),
        fetch("/api/gamemode4/list").then((res) => res.json()).catch(() => []),
      ]);
      setAvailableQuestions([...mode1, ...mode2, ...mode4].length);
    } catch (err) {
      console.warn("⚠️ Failed to fetch available questions:", err);
    }
  };

  /* ---------- Connect to Supabase lobby ---------- */
  const connectLobby = async (code: string) => {
    try {
      setConnecting(true);

      // ✅ Only listen for players; professor no longer added to table
      await refreshPlayers(code);
      setConnected(true);
      setConnecting(false);

      const playerChannel = supabase
        .channel(`players-realtime-${code}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "players", filter: `game_code=eq.${code}` },
          () => refreshPlayers(code)
        )
        .subscribe();

      return () => supabase.removeChannel(playerChannel);
    } catch (err: any) {
      console.error("❌ Lobby Connection Error:", err.message);
      setConnecting(false);
    }
  };

  const refreshPlayers = async (code: string) => {
    const { data, error } = await supabase
      .from("players")
      .select("name,avatar,is_active")
      .eq("game_code", code)
      .order("joined_at", { ascending: true });
    if (!error) setPlayers(data || []);
  };

  /* ---------- Music Preview ---------- */
  const handlePreview = (file: string) => {
    try {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
        previewAudioRef.current = null;
      }
      if (currentlyPlaying === file) {
        setCurrentlyPlaying(null);
        return;
      }
      const audio = new Audio(file);
      audio.volume = 0.5;
      audio.play();
      previewAudioRef.current = audio;
      setCurrentlyPlaying(file);
    } catch {
      console.error("Preview failed");
    }
  };

 /* ---------- Start Game ---------- */
const handleStartGame = async () => {
  try {
    if (gameSettings.duration < 1 || gameSettings.duration > 10) {
      Swal.fire("Invalid Duration", "Please set between 1 and 10 minutes.", "warning");
      return;
    }

    if (gameSettings.points < 10 || gameSettings.points > 1000) {
      Swal.fire("Invalid Points", "Points must be between 10 and 1000.", "warning");
      return;
    }

    const { duration, points, shuffleQuestions, musicTheme, gameCode } = gameSettings;

    const settingsPayload = {
  gameCode,
  mode: "Phase Rush",
  duration,
  points,
  shuffleQuestions,
  musicTheme,
  questionMode, // ✅ NEW FIELD
  class_id: classId ? Number(classId) : null,
};


    // ✅ Save everything locally first to keep teacher & student in sync
    localStorage.setItem("activeGameCode", gameCode);
    localStorage.setItem("gameSettings", JSON.stringify(settingsPayload));
    localStorage.setItem("activeClassId", classId || "");

    // ✅ Clear any previous "game_started" record for same code (optional cleanup)
    await supabase
      .from("game_state")
      .delete()
      .eq("game_code", gameCode)
      .eq("event_type", "game_started");

    // ✅ Insert a fresh "game_started" record
    const { error } = await supabase.from("game_state").insert([
      {
        game_code: gameCode,
        event_type: "game_started",
        started_at: new Date().toISOString(),
        settings: settingsPayload,
      },
    ]);

    if (error) throw error;

    console.log("✅ Game started inserted successfully:", gameCode);

    Swal.fire({
      title: "✅ Game Started!",
      text: `Duration: ${duration} minute(s). Players may now begin.`,
      icon: "success",
      timer: 1200,
      showConfirmButton: false,
    });

    // ✅ Redirect after small delay
    setTimeout(() => {
      router.push(`/teacher/class/lobby/start?class_id=${classId}`);
    }, 1000);
  } catch (err: any) {
    console.error("❌ Error starting game:", err);
    Swal.fire("Error", err.message || "Failed to start game.", "error");
  }
};


  /* ---------- Connecting UI ---------- */
  if (connecting)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white text-gray-700">
        <Loader2 className="animate-spin w-12 h-12 text-[#7b2020] mb-4" />
        <p className="font-semibold text-[#7b2020]">Setting up the lobby...</p>
      </div>
    );

  /* ---------- MAIN UI ---------- */
  return (
    <div className="flex flex-col items-center min-h-screen bg-white">
     {/* Header */}
<header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md">
  <div className="flex items-center gap-3">
    <ArrowLeft className="w-6 h-6 cursor-pointer" onClick={() => router.back()} />
    <h1 className="font-semibold text-lg">
      Game Lobby: {gameSettings.gameCode}
    </h1>
  </div>

  <div className="flex items-center gap-4">
    <div title="Delete Game">
  <Trash2
    onClick={handleDeleteGame}
    className="w-6 h-6 cursor-pointer text-white hover:text-red-400 transition-colors"
  />
</div>

  </div>
</header>


      {/* Settings Panel */}
      <div className="mt-8 w-[90%] max-w-md border-2 border-[#7b2020] rounded-xl shadow-lg p-6">
        <h2 className="text-[#7b2020] font-bold text-lg mb-4 text-center">
          GAME SETTINGS PANEL
        </h2>

        <div className="flex flex-col gap-4">
          {/* Duration */}
          <label className="text-sm font-semibold text-gray-800">
            Game Duration (minutes)
            <input
              type="number"
              min="1"
              max="10"
              value={gameSettings.duration}
              onChange={(e) =>
                setGameSettings({
                  ...gameSettings,
                  duration: Math.min(10, Math.max(1, Number(e.target.value))),
                })
              }
              className="w-full border border-gray-400 rounded-md mt-1 p-2 text-sm"
            />
          </label>

          {/* Points */}
          <label className="text-sm font-semibold text-gray-800">
            Points Per Question
            <input
              type="number"
              min="10"
              max="1000"
              value={gameSettings.points}
              onChange={(e) =>
                setGameSettings({
                  ...gameSettings,
                  points: Math.min(1000, Math.max(10, Number(e.target.value))),
                })
              }
              className="w-full border border-gray-400 rounded-md mt-1 p-2 text-sm"
            />
          </label>
        {/* Mode Chosen: Module | Pre-made | Mixed */}
<div>
  <label className="block text-sm font-semibold text-gray-800 mb-1">
    Mode Chosen
  </label>
  <div className="flex justify-between items-center gap-2">
    {["Module", "Premade", "Mixed"].map((mode) => (
      <button
        key={mode}
        onClick={() => setQuestionMode(mode as "Module" | "Premade" | "Mixed")}
        className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all ${
          questionMode === mode
            ? "bg-[#7b2020] text-white"
            : "bg-gray-200 text-gray-800 hover:bg-gray-300"
        }`}
      >
        {mode}
      </button>
    ))}
  </div>
</div>

          {/* Shuffle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800">
              Shuffle Questions
            </span>
            <button
              onClick={() =>
                setGameSettings((prev) => ({
                  ...prev,
                  shuffleQuestions: !prev.shuffleQuestions,
                }))
              }
              className={`px-4 py-1 rounded-md text-sm font-semibold ${
                gameSettings.shuffleQuestions
                  ? "bg-green-600 text-white"
                  : "bg-gray-300 text-gray-700"
              }`}
            >
              {gameSettings.shuffleQuestions ? "ON" : "OFF"}
            </button>
          </div>

          {/* Music Theme Selector */}
          <button
            onClick={() => setShowMusicModal(true)}
            className="flex items-center justify-center gap-2 bg-[#7b2020] text-white py-2 rounded-md hover:bg-[#5f1717]"
          >
            <Music className="w-5 h-5" /> Select Music Theme
          </button>
        </div>

        {/* Start Game */}
        <div className="flex justify-center mt-6">
          <button
            onClick={handleStartGame}
            disabled={!connected}
            className={`flex items-center gap-2 px-10 py-3 rounded-md font-semibold transition-all ${
              connected
                ? "bg-[#7b2020] hover:bg-[#5f1717] text-white"
                : "bg-gray-400 cursor-not-allowed text-gray-200"
            }`}
          >
            <Play className="w-5 h-5" /> Start Game
          </button>
        </div>
      </div>

      {/* Players List */}
      <div className="mt-10 w-[90%] max-w-md">
        <h3 className="text-[#7b2020] font-bold text-base mb-4 text-center">
          Players in Lobby ({players.length})
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 justify-center">
          {players.length > 0 ? (
            players.map((p, i) => (
              <div
                key={i}
                className="flex flex-col items-center justify-center text-center"
              >
                <Image
                  src={p.avatar || "/resources/avatars/student1.png"}
                  alt={p.name}
                  width={60}
                  height={60}
                  className="rounded-full border-2 border-[#7b2020] shadow-sm object-cover"
                />
                <span className="text-sm mt-1 font-semibold text-gray-700 truncate w-[70px]">
                  {p.name}
                </span>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 col-span-full py-4">
              Waiting for players to join...
            </p>
          )}
        </div>
      </div>

      {/* 🎵 Music Theme Modal */}
      {showMusicModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 text-black">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative">
            <button
              onClick={() => setShowMusicModal(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-red-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold mb-4 text-[#7b2020] text-center">
              🎵 Choose Music Theme
            </h2>
            <ul className="space-y-3 mb-6">
              {themes.map((theme) => (
                <li
                  key={theme.file}
                  className={`border rounded-lg p-3 flex justify-between items-center cursor-pointer transition ${
                    gameSettings.musicTheme ===
                    theme.file.split("/").pop()?.replace(".mp3", "")
                      ? "bg-[#fbeaea] border-[#7b2020]"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() =>
                    setGameSettings({
                      ...gameSettings,
                      musicTheme: theme.file
                        .split("/")
                        .pop()
                        ?.replace(".mp3", "") as string,
                    })
                  }
                >
                  <div className="flex items-center gap-2">
                    {gameSettings.musicTheme ===
                      theme.file.split("/").pop()?.replace(".mp3", "") && (
                      <Check className="text-[#7b2020] w-5 h-5" />
                    )}
                    <div className="flex flex-col">
                      <span className="font-medium text-[#7b2020]">
                        {theme.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {theme.file.split("/").pop()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(theme.file);
                    }}
                    className={`text-sm text-white px-3 py-1 rounded transition ${
                      currentlyPlaying === theme.file
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-[#7b2020] hover:bg-[#5f1717]"
                    }`}
                  >
                    {currentlyPlaying === theme.file ? "Stop" : "Preview"}
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setShowMusicModal(false)}
              className="w-full bg-[#7b2020] text-white py-2 rounded-md hover:bg-[#5f1717]"
            >
              Confirm Theme
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
