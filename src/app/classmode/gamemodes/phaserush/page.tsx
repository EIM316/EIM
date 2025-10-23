"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Menu, LogOut, Volume2, VolumeX, Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import { supabase } from "@/lib/supabaseClient";

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
  const [timeLeft, setTimeLeft] = useState(60);
  const [musicOn, setMusicOn] = useState(true);
  const bgAudio = useRef<HTMLAudioElement | null>(null);
  const [movingBoats, setMovingBoats] = useState<{ [key: string]: boolean }>({});

  const gameCode = "5ABC9";

  /* ---------- Load User + Connect Supabase ---------- */
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (!savedUser.first_name) {
      router.push("/");
      return;
    }

    setUser(savedUser);
    joinLobby(savedUser);
    fetchQuestions();

    const channel = supabase
      .channel("phase-events")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_events",
          filter: `game_code=eq.${gameCode}`,
        },
        () => refreshEvents()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* ---------- Join Lobby ---------- */
  const joinLobby = async (savedUser: any) => {
    await supabase
      .from("players")
      .upsert(
        {
          game_code: gameCode,
          name: savedUser.first_name,
          avatar: savedUser.avatar || "/resources/avatars/student1.png",
        },
        { onConflict: "game_code,name" }
      );

    await supabase
      .from("game_events")
      .upsert(
        { game_code: gameCode, player_name: savedUser.first_name, progress: 0 },
        { onConflict: "game_code,player_name" }
      );

    refreshPlayers();
    refreshEvents();
  };

  const refreshPlayers = async () => {
    const { data } = await supabase
      .from("players")
      .select("name,avatar")
      .eq("game_code", gameCode)
      .order("id", { ascending: true });
    setPlayers(data || []);
  };

  const refreshEvents = async () => {
    const { data } = await supabase
      .from("game_events")
      .select("player_name,progress")
      .eq("game_code", gameCode);
    setEvents(data || []);
  };

  /* ---------- Fetch Questions ---------- */
  const fetchQuestions = async () => {
    setLoading(true);
    const res = await fetch("/api/gamemode1/list-all");
    const data = await res.json();
    setQuestions(data.sort(() => Math.random() - 0.5));
    setCurrentQuestion(data[0]);
    setLoading(false);
  };

  /* ---------- Start Game ---------- */
  useEffect(() => {
    if (!loading && questions.length > 0 && user && !gameActive) startGame();
  }, [loading, questions, user]);

  const startGame = async () => {
    setGameActive(true);
    await supabase.from("game_events").update({ progress: 0 }).eq("game_code", gameCode);
    refreshEvents();

    if (musicOn) {
      bgAudio.current = new Audio("/resources/music/theme1.mp3");
      bgAudio.current.loop = true;
      bgAudio.current.volume = 0.3;
      bgAudio.current.play();
    }

    const questionInterval = setInterval(() => nextQuestion(), 5000);
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

  const nextQuestion = () => {
    setCanAnswer(true);
    setCurrentQuestion((prev) => {
      const idx = questions.findIndex((q) => q.id === prev?.id);
      return questions[(idx + 1) % questions.length];
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

    refreshEvents();

    setTimeout(() => {
      setMovingBoats((prev) => ({ ...prev, [currentPlayer]: false }));
    }, 600);
  };

const endGame = async () => {
  if (bgAudio.current) bgAudio.current.pause();

  // Fetch final scores
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

  // Show leaderboard
  await Swal.fire({
    title: "🏁 Race Over!",
    html: `
      <h3>🏆 Final Rankings</h3>
      ${
        sorted.length > 0
          ? sorted
              .map(
                (p) =>
                  `<div style="margin:4px 0;font-weight:600">
                    ${p.rank === 1 ? "🥇" : p.rank === 2 ? "🥈" : "🥉"} 
                    ${p.rank}. ${p.name} — ${p.score} pts
                  </div>`
              )
              .join("")
          : "<p>No data available.</p>"
      }
    `,
    icon: "info",
    confirmButtonText: "Return to Lobby",
    confirmButtonColor: "#7b2020",
  });

  // ✅ Mark this player as "returned"
  await supabase
    .from("players")
    .update({ returned: true })
    .eq("game_code", gameCode)
    .eq("name", user.first_name);

  // Check if all players have returned
  const { data: check } = await supabase
    .from("players")
    .select("returned")
    .eq("game_code", gameCode);

  const allReturned = check?.every((p) => p.returned === true);

  if (allReturned) {
    // ✅ Now cleanup after everyone has returned
    await supabase.from("game_events").delete().eq("game_code", gameCode);
    await supabase.from("players").delete().eq("game_code", gameCode);
    await supabase.from("game_state").delete().eq("game_code", gameCode);
  }

  // Return player to lobby
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
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md">
        <div className="flex items-center space-x-3">
          <Image
            src={user?.avatar || "/resources/avatars/student1.png"}
            alt="Profile"
            width={40}
            height={40}
            className="rounded-full border-2 border-white"
          />
          <span className="font-semibold text-lg">
            {user?.first_name?.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {musicOn ? (
            <Volume2
              className="w-6 h-6 cursor-pointer"
              onClick={() => setMusicOn(false)}
            />
          ) : (
            <VolumeX
              className="w-6 h-6 cursor-pointer"
              onClick={() => setMusicOn(true)}
            />
          )}
          <Menu className="w-7 h-7 cursor-pointer" />
          <LogOut
            onClick={() => router.push("/")}
            className="w-6 h-6 cursor-pointer"
          />
        </div>
      </header>

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
  backgroundRepeat: "no-repeat",
}}

        >
          <div className="absolute inset-0 bg-blue-500/20"></div> {/* adds a faint water overlay */}


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
                  className="drop-shadow-[0_3px_4px_rgba(0,0,0,0.6)] transition-all duration-300"
                  unoptimized
                />
                <p className="text-xs text-center text-white bg-[#7b2020]/80 rounded-full mt-1 px-2">
                  {p.name}
                </p>
              </div>
            </div>
          ))}
        </div>

{currentQuestion && (
  <div className="w-full max-w-4xl mt-6 bg-white border border-[#7b2020] rounded-lg p-4 sm:p-5 shadow-md">
    {/* 🧠 Question */}
    <div className="flex flex-col items-center text-center mb-3 sm:mb-4">
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
          className="rounded-md border border-gray-300 object-contain max-h-36 sm:max-h-48 mb-3"
          unoptimized
        />
      )}
      <h3 className="text-base sm:text-lg font-semibold text-[#7b2020] leading-snug">
        {currentQuestion.question}
      </h3>
    </div>

    {/* 🧩 Answer Options */}
    <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3">
      {["A", "B", "C", "D"].map((key) => {
        const textKey = (currentQuestion as any)[`option_${key.toLowerCase()}`];
        const imgKey = (currentQuestion as any)[`option_${key.toLowerCase()}_image`];
        if (!textKey && !imgKey) return null;

        return (
          <button
            key={key}
            disabled={!canAnswer}
            onClick={() => handleAnswer(key as any)}
            className={`flex flex-col items-center justify-center border-2 border-[#7b2020] rounded-lg p-2 sm:p-3 bg-white transition-all ${
              canAnswer ? "hover:bg-[#ffb4a2]" : "opacity-50"
            }`}
          >
            <p className="font-bold text-[#7b2020] text-sm sm:text-base mb-1">{key}.</p>

            {imgKey && (
              <Image
                src={imgKey.startsWith("http") ? imgKey : `/resources/questions/${imgKey}`}
                alt={`Option ${key}`}
                width={100}
                height={100}
                className="rounded-md border border-gray-300 object-contain max-h-24 sm:max-h-32 mb-1"
                unoptimized
                onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
              />
            )}

            {textKey && (
              <p className="text-xs sm:text-sm text-gray-700 text-center">{textKey}</p>
            )}
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
