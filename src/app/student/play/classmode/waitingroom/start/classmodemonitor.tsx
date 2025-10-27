"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, LogOut, ArrowLeft, Volume2, VolumeX } from "lucide-react";
import Swal from "sweetalert2";

export default function ClassModeMonitorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get("class_id");

  const [players, setPlayers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gameCode, setGameCode] = useState("");
  const [musicOn, setMusicOn] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [movingBoats, setMovingBoats] = useState<{ [key: string]: boolean }>({});
  const bgAudio = useRef<HTMLAudioElement | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [finalScores, setFinalScores] = useState<any[]>([]);

  /* ✅ Load Game Info */
  useEffect(() => {
    const code = localStorage.getItem("activeGameCode");
    const savedSettings = JSON.parse(localStorage.getItem("gameSettings") || "{}");
    if (!code) {
      router.push("/teacher");
      return;
    }

    setGameCode(code);
    setSettings(savedSettings);
    fetchQuestions(savedSettings);
    refreshPlayers(code);
    refreshEvents(code);
    setupRealtime(code);

    setTimeLeft(savedSettings?.duration ? savedSettings.duration * 60 : 60);
    setLoading(false);
  }, []);

  /* ✅ Realtime sync */
  const setupRealtime = (code: string) => {
    const channel = supabase
      .channel("monitor-phase")
      .on("postgres_changes", { event: "*", schema: "public", table: "game_events", filter: `game_code=eq.${code}` }, () => {
        refreshEvents(code);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const refreshPlayers = async (code: string) => {
    const { data } = await supabase.from("players").select("name,avatar").eq("game_code", code);
    setPlayers(data || []);
  };

  const refreshEvents = async (code: string) => {
    const { data } = await supabase.from("game_events").select("player_name,progress").eq("game_code", code);
    setEvents(data || []);
  };

  const fetchQuestions = async (settings: any) => {
    try {
      const [mode1, mode2, mode4] = await Promise.all([
        fetch("/api/gamemode1/list-all").then((r) => r.json()).catch(() => []),
        fetch("/api/gamemode2/list").then((r) => r.json()).catch(() => []),
        fetch("/api/gamemode4/list").then((r) => r.json()).catch(() => []),
      ]);

      let all = [...mode1, ...mode2, ...mode4];
      if (settings?.shuffleQuestions) all.sort(() => Math.random() - 0.5);
      setQuestions(all);
      setCurrentQuestion(all[0]);
    } catch (err) {
      console.error("❌ Question fetch failed:", err);
    }
  };

  /* ✅ Start Simulation (viewer only) */
  useEffect(() => {
    if (!loading && !gameActive && questions.length > 0) {
      setGameActive(true);
      if (musicOn && settings?.musicTheme) {
        bgAudio.current = new Audio(`/resources/music/${settings.musicTheme}.mp3`);
        bgAudio.current.loop = true;
        bgAudio.current.volume = 0.3;
        bgAudio.current.play().catch(() => {});
      }

      const questionTimer = setInterval(() => {
        setCurrentQuestion((prev: any) => {
            const idx = questions.findIndex((q) => q.id === prev?.id);
            return questions[(idx + 1) % questions.length];
          });

      }, 6000);

      const timer = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timer);
            clearInterval(questionTimer);
            endGame();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
  }, [loading, questions]);

  const endGame = async () => {
    if (bgAudio.current) bgAudio.current.pause();

    const { data } = await supabase.from("game_events").select("player_name,progress").eq("game_code", gameCode);
    const sorted = (data || [])
      .sort((a, b) => b.progress - a.progress)
      .map((p, i) => ({
        rank: i + 1,
        name: p.player_name,
        score: p.progress,
      }));

    setFinalScores(sorted);
    setShowLeaderboard(true);
  };

  const getProgress = (name: string) =>
    events.find((e) => e.player_name === name)?.progress || 0;

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white text-gray-700">
        <Loader2 className="animate-spin w-10 h-10 text-[#7b2020] mb-3" />
        <p>Loading live monitor...</p>
      </div>
    );

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-100 to-gray-300">
      {/* Header */}
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <ArrowLeft
            onClick={() =>
              classId
                ? router.push(`/teacher/class?class_id=${classId}`)
                : router.push("/teacher")
            }
            className="w-6 h-6 cursor-pointer hover:text-gray-300"
          />
          <h1 className="font-semibold text-lg">Phase Rush Monitor</h1>
        </div>
        <div className="flex items-center gap-3">
          {musicOn ? (
            <Volume2
              className="w-6 h-6 cursor-pointer"
              onClick={() => {
                setMusicOn(false);
                bgAudio.current?.pause();
              }}
            />
          ) : (
            <VolumeX
              className="w-6 h-6 cursor-pointer"
              onClick={() => {
                setMusicOn(true);
                bgAudio.current?.play().catch(() => {});
              }}
            />
          )}
          <LogOut
            onClick={() => router.push("/")}
            className="w-6 h-6 cursor-pointer hover:text-gray-300"
          />
        </div>
      </header>

      {/* Game Info */}
      <div className="text-center mt-4 mb-2">
        <p className="font-semibold text-[#7b2020] text-lg">
          Code: {gameCode} • Time Left: {timeLeft}s
        </p>
        <p className="text-sm text-gray-600">
          Mode: Phase Rush | Duration: {settings?.duration || 5} min | Points:{" "}
          {settings?.points || 10}
        </p>
      </div>

      {/* Game Display */}
      {!showLeaderboard && (
        <main className="flex flex-col items-center w-full max-w-5xl mt-4">
          <div
            className="relative w-full rounded-lg border border-[#7b2020] overflow-hidden"
            style={{
              height: "250px",
              backgroundImage: "url('/resources/modes/waterbg.gif')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute right-12 top-0 bottom-0 w-2 bg-yellow-400"></div>
            {players.map((p, i) => (
              <div key={i} className="absolute" style={{ top: `${50 + i * 60}px` }}>
                <div
                  className="transition-all duration-500 ease-in-out"
                  style={{ transform: `translateX(${getProgress(p.name) * 3}px)` }}
                >
                  <Image
                    src={
                      movingBoats[p.name]
                        ? "/resources/modes/boat2.png"
                        : "/resources/modes/boat1.png"
                    }
                    alt={p.name}
                    width={60}
                    height={60}
                    className="drop-shadow-[0_3px_4px_rgba(0,0,0,0.6)]"
                    unoptimized
                  />
                  <p className="text-xs text-center text-white bg-[#7b2020]/80 rounded-full mt-1 px-2">
                    {p.name}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Current Question */}
          {currentQuestion && (
            <div className="w-full max-w-4xl mt-6 bg-white border border-[#7b2020] rounded-lg p-4 shadow-md">
              <div className="text-center mb-4">
                {currentQuestion.question_image && (
                  <Image
                    src={
                      currentQuestion.question_image.startsWith("http")
                        ? currentQuestion.question_image
                        : `/resources/questions/${currentQuestion.question_image}`
                    }
                    alt="Question"
                    width={250}
                    height={160}
                    className="rounded-md border border-gray-300 object-contain mb-3"
                    unoptimized
                  />
                )}
                <h3 className="text-lg font-semibold text-[#7b2020]">
                  {currentQuestion.question}
                </h3>
              </div>

              {/* Options - Disabled for Prof */}
              <div className="grid grid-cols-2 gap-3">
                {["A", "B", "C", "D"].map((key) => {
                  const text = currentQuestion[`option_${key.toLowerCase()}`];
                  const img = currentQuestion[`option_${key.toLowerCase()}_image`];
                  if (!text && !img) return null;
                  return (
                    <button
                      key={key}
                      disabled
                      className="border-2 border-[#7b2020] rounded-lg p-3 bg-gray-100 opacity-70 cursor-not-allowed"
                    >
                      <p className="font-bold text-[#7b2020] mb-1">{key}.</p>
                      {img && (
                        <Image
                          src={
                            img.startsWith("http")
                              ? img
                              : `/resources/questions/${img}`
                          }
                          alt={`Option ${key}`}
                          width={100}
                          height={100}
                          className="rounded-md border object-contain mb-1"
                          unoptimized
                        />
                      )}
                      {text && <p className="text-sm text-gray-700">{text}</p>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      )}

      {/* Leaderboard */}
      {showLeaderboard && (
        <div className="flex flex-col items-center mt-10 text-center">
          <h2 className="text-2xl font-bold text-[#7b2020] mb-4">🏁 Race Finished</h2>
          <div className="bg-white border-2 border-[#7b2020] rounded-lg p-4 shadow-md w-[90%] max-w-md">
            {finalScores.map((p) => (
              <div key={p.rank} className="flex justify-between py-2 border-b border-gray-300 last:border-none">
                <span>
                  {p.rank === 1 ? "🥇" : p.rank === 2 ? "🥈" : p.rank === 3 ? "🥉" : "🏅"}{" "}
                  {p.name}
                </span>
                <span className="font-semibold text-[#7b2020]">{p.score} pts</span>
              </div>
            ))}
          </div>

          <button
            onClick={() =>
              classId
                ? router.push(`/teacher/class?class_id=${classId}`)
                : router.push("/teacher")
            }
            className="mt-6 bg-[#7b2020] text-white px-8 py-2 rounded-md hover:bg-[#5f1717] shadow-md font-semibold"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
