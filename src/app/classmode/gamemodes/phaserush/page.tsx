"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Menu, LogOut, Volume2, VolumeX, Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import { supabase } from "@/lib/supabaseClient";

/* ---------- Interfaces ---------- */
interface Player {
  id?: number;
  name: string;
  avatar: string;
}

interface EventData {
  player_name: string;
  progress: number;
}

interface Question {
  id: number;
  question: string;
  question_image?: string | null;
  option_a: string;
  option_a_image?: string | null;
  option_b: string;
  option_b_image?: string | null;
  option_c?: string;
  option_c_image?: string | null;
  option_d?: string;
  option_d_image?: string | null;
  answer: "A" | "B" | "C" | "D";
}

/* ---------- Component ---------- */
export default function PhaseRush() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [canAnswer, setCanAnswer] = useState(true);
  const [loading, setLoading] = useState(true);
  const [gameActive, setGameActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [musicOn, setMusicOn] = useState(true);
  const [movingBoats, setMovingBoats] = useState<{ [key: string]: boolean }>({});
  const [settings, setSettings] = useState<any>(null);
  const bgAudio = useRef<HTMLAudioElement | null>(null);
  const [gameCode, setGameCode] = useState<string>("");

  /* ---------- Load Player & Fetch Settings ---------- */
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const code = localStorage.getItem("activeGameCode");

    if (!savedUser?.first_name || !code) {
      router.push("/");
      return;
    }

    setUser(savedUser);
    setGameCode(code);
    fetchSettings(code, savedUser);
  }, [router]);

  /* ---------- Fetch Professor Game Settings ---------- */
  const fetchSettings = async (code: string, savedUser: any) => {
    try {
      const { data, error } = await supabase
        .from("game_state")
        .select("settings")
        .eq("game_code", code)
        .eq("event_type", "game_started")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data?.settings) throw new Error("Settings not found");

      const settings =
        typeof data.settings === "string" ? JSON.parse(data.settings) : data.settings;

      setSettings(settings);
      setTimeLeft(settings.duration * 60);

      await joinLobby(savedUser, code);
      await fetchQuestions(settings);
      setLoading(false);
    } catch (err) {
      console.error("⚠️ Game settings load failed:", err);
      Swal.fire("Error", "Unable to load game settings.", "error");
      setLoading(false);
    }
  };

  /* ---------- Join Supabase Lobby ---------- */
  const joinLobby = async (savedUser: any, code: string) => {
    if (!savedUser) return;

    await supabase
      .from("players")
      .upsert(
        {
          game_code: code,
          name: savedUser.first_name,
          avatar: savedUser.avatar || "/resources/avatars/student1.png",
        },
        { onConflict: "game_code,name" }
      );

    await supabase
      .from("game_events")
      .upsert(
        { game_code: code, player_name: savedUser.first_name, progress: 0 },
        { onConflict: "game_code,player_name" }
      );

    refreshPlayers(code);
    refreshEvents(code);

    const channel = supabase
      .channel("phase-events")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_events", filter: `game_code=eq.${code}` },
        () => refreshEvents(code)
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const refreshPlayers = async (code: string) => {
    const { data } = await supabase
      .from("players")
      .select("name,avatar")
      .eq("game_code", code)
      .order("id", { ascending: true });
    setPlayers(data || []);
  };

  const refreshEvents = async (code: string) => {
    const { data } = await supabase
      .from("game_events")
      .select("player_name,progress")
      .eq("game_code", code);
    setEvents(data || []);
  };

  /* ---------- Fetch All Questions ---------- */
  const fetchQuestions = async (settings: any) => {
    setLoading(true);
    try {
      const [mode1, mode2, mode4] = await Promise.all([
        fetch("/api/gamemode1/list-all").then((r) => r.json()).catch(() => []),
        fetch("/api/gamemode2/list").then((r) => r.json()).catch(() => []),
        fetch("/api/gamemode4/list").then((r) => r.json()).catch(() => []),
      ]);

      let all = [...mode1, ...mode2, ...mode4];
      if (settings.shuffleQuestions) all.sort(() => Math.random() - 0.5);

      // ✅ Use all questions directly (no slice or filtering)
      setQuestions(all);
      setCurrentQuestion(all[0]);
    } catch (err) {
      console.error("❌ Question fetch failed:", err);
    }
    setLoading(false);
  };

  /* ---------- Start Game ---------- */
  useEffect(() => {
    if (!loading && questions.length > 0 && user && settings && !gameActive) startGame();
  }, [loading, questions, user, settings]);

  const startGame = async () => {
    setGameActive(true);
    await supabase.from("game_events").update({ progress: 0 }).eq("game_code", gameCode);
    refreshEvents(gameCode);

    if (musicOn && settings?.musicTheme) {
      bgAudio.current = new Audio(`/resources/music/${settings.musicTheme}.mp3`);
      bgAudio.current.loop = true;
      bgAudio.current.volume = 0.3;
      bgAudio.current.play().catch(() => {});
    }

    const questionInterval = setInterval(nextQuestion, 5000); // every 10s
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          clearInterval(questionInterval);
          endGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  /* ---------- Next Question ---------- */
  const nextQuestion = () => {
    setCanAnswer(true);
    setCurrentQuestion((prev) => {
      const idx = questions.findIndex((q) => q.id === prev?.id);
      return questions[(idx + 1) % questions.length]; // loops back
    });
  };

  /* ---------- Handle Answers ---------- */
  const handleAnswer = async (key: "A" | "B" | "C" | "D") => {
    if (!currentQuestion || !canAnswer) return;
    setCanAnswer(false);

    const correct = key === currentQuestion.answer;
    const currentPlayer = user.first_name;
    const current = events.find((e) => e.player_name === currentPlayer);
    const currentProgress = current ? current.progress : 0;

    const newProgress = correct
      ? Math.min(100, currentProgress + 10)
      : Math.max(0, currentProgress - 5);

    setMovingBoats((prev) => ({ ...prev, [currentPlayer]: true }));

    await supabase
      .from("game_events")
      .update({ progress: newProgress })
      .eq("game_code", gameCode)
      .eq("player_name", currentPlayer);

    refreshEvents(gameCode);

    setTimeout(() => {
      setMovingBoats((prev) => ({ ...prev, [currentPlayer]: false }));
    }, 600);
  };

  /* ---------- End Game ---------- */
  const endGame = async () => {
    if (bgAudio.current) bgAudio.current.pause();

    const { data: finalScores } = await supabase
      .from("game_events")
      .select("player_name,progress")
      .eq("game_code", gameCode);

    const sorted = (finalScores || [])
      .sort((a, b) => b.progress - a.progress)
      .map((p, i) => ({
        rank: i + 1,
        name: p.player_name,
        score: p.progress,
      }));

    await Swal.fire({
      title: "🏁 Race Over!",
      html: sorted
        .map(
          (p) =>
            `<div style="margin:4px 0;font-weight:600">
              ${p.rank === 1 ? "🥇" : p.rank === 2 ? "🥈" : "🥉"} 
              ${p.rank}. ${p.name} — ${p.score} pts
            </div>`
        )
        .join(""),
      icon: "success",
      confirmButtonText: "Return",
      confirmButtonColor: "#7b2020",
    });

    router.push("/student/play/classmode");
  };

  /* ---------- UI ---------- */
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-700">
        <Loader2 className="animate-spin w-10 h-10 mb-4 text-[#7b2020]" />
        <p>Loading Phase Rush...</p>
      </div>
    );

  const getProgress = (name: string) =>
    events.find((e) => e.player_name === name)?.progress || 0;

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-gray-100 to-gray-300">
      {/* Header */}
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md">
        <div className="flex items-center space-x-3">
          <Image
            src={user?.avatar || "/resources/avatars/student1.png"}
            alt="Profile"
            width={40}
            height={40}
            className="rounded-full border-2 border-white"
          />
          <span className="font-semibold text-lg">{user?.first_name?.toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-3">
          {musicOn ? (
            <Volume2
              className="w-6 h-6 cursor-pointer"
              onClick={() => {
                setMusicOn(false);
                if (bgAudio.current) bgAudio.current.pause();
              }}
            />
          ) : (
            <VolumeX
              className="w-6 h-6 cursor-pointer"
              onClick={() => {
                setMusicOn(true);
                if (bgAudio.current) bgAudio.current.play().catch(() => {});
              }}
            />
          )}
          <Menu className="w-7 h-7 cursor-pointer" />
          <LogOut
            onClick={() => router.push("/")}
            className="w-6 h-6 cursor-pointer"
          />
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-col items-center w-full max-w-5xl mt-4">
        <h2 className="text-xl font-bold text-[#7b2020]">⚡ Phase Rush</h2>
        <p className="text-gray-600 mb-3">Time Left: {timeLeft}s</p>

        {/* Race Field */}
        <div
          className="relative w-full rounded-lg border border-[#7b2020] overflow-hidden"
          style={{
            height: "220px",
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

        {/* Question */}
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
              <h3 className="text-lg font-semibold text-[#7b2020]">{currentQuestion.question}</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {["A", "B", "C", "D"].map((key) => {
                const text = (currentQuestion as any)[`option_${key.toLowerCase()}`];
                const img = (currentQuestion as any)[`option_${key.toLowerCase()}_image`];
                if (!text && !img) return null;
                return (
                  <button
                    key={key}
                    disabled={!canAnswer}
                    onClick={() => handleAnswer(key as any)}
                    className={`border-2 border-[#7b2020] rounded-lg p-3 bg-white ${
                      canAnswer ? "hover:bg-[#ffb4a2]" : "opacity-50"
                    }`}
                  >
                    <p className="font-bold text-[#7b2020] mb-1">{key}.</p>
                    {img && (
                      <Image
                        src={img.startsWith("http") ? img : `/resources/questions/${img}`}
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
    </div>
  );
}
