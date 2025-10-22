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
  height: number;
  isShaking?: boolean;
  isCorrect?: boolean;
}

interface Question {
  id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c?: string;
  option_d?: string;
  question_image?: string | null;
  option_a_image?: string | null;
  option_b_image?: string | null;
  option_c_image?: string | null;
  option_d_image?: string | null;
  answer: "A" | "B" | "C" | "D";
}

export default function PhaseRush() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [config, setConfig] = useState({
    total_game_time: 60,
    question_interval: 5,
    shuffle_mode: true,
    theme_file: "/resources/music/theme1.mp3",
  });
  const [loading, setLoading] = useState(true);
  const [gameActive, setGameActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [musicOn, setMusicOn] = useState(true);
  const bgAudio = useRef<HTMLAudioElement | null>(null);

  // ✅ use the SAME game code as waiting/start
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
    fetchGameData(savedUser.admin_id || "ADMIN-0001");

    // 👥 Realtime player listener
    const channel = supabase
      .channel("phaselobby-realtime")
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* ---------- Join Lobby (UPSERT fix) ---------- */
  const joinLobby = async (savedUser: any) => {
    try {
      await supabase.from("players").upsert(
        {
          game_code: gameCode,
          name: savedUser.first_name,
          avatar: savedUser.avatar || "/resources/avatars/student1.png",
          height: 0,
        },
        { onConflict: "game_code,name" }
      );
      refreshPlayers();
    } catch (error: any) {
      console.error("Error joining lobby:", error.message);
    }
  };

  const refreshPlayers = async () => {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("game_code", gameCode)
      .order("id", { ascending: true });

    if (error) console.error("Error fetching players:", error);
    else setPlayers(data || []);
  };

  /* ---------- Fetch Questions + Settings ---------- */
  const fetchGameData = async (admin_id: string) => {
    try {
      setLoading(true);
      const [res1, settingsRes] = await Promise.allSettled([
        fetch("/api/gamemode1/list-all"),
        fetch(`/api/gamemode4/settings/get?admin_id=${admin_id}`),
      ]);

      const data1 =
        res1.status === "fulfilled" && res1.value.ok ? await res1.value.json() : [];

      if (settingsRes.status === "fulfilled" && settingsRes.value.ok) {
        const data = await settingsRes.value.json();
        setConfig({
          total_game_time: data.total_game_time ?? 60,
          question_interval: data.question_interval ?? 5,
          shuffle_mode: data.shuffle_mode ?? true,
          theme_file: data.theme_file || "/resources/music/theme1.mp3",
        });
        setTimeLeft(data.total_game_time ?? 60);
      }

      setQuestions(config.shuffle_mode ? shuffle(data1) : data1);
    } catch (error) {
      console.error("Error loading data:", error);
      Swal.fire("Error", "Failed to load questions/settings", "error");
    } finally {
      setLoading(false);
    }
  };

  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  /* ---------- Auto Start Game ---------- */
  useEffect(() => {
    if (!loading && questions.length > 0 && user && !gameActive) startGame();
  }, [loading, questions, user]);

 const askQuestion = async () => {
  if (questions.length === 0) return;
  const q = questions[Math.floor(Math.random() * questions.length)];
  const correctKey = q.answer;

  const html = `
    <div style="text-align:center;">
      ${
        q.question_image
          ? `<img src="${q.question_image}" style="max-width:200px;max-height:150px;border-radius:8px;margin-bottom:10px;" />`
          : ""
      }
      <p style="font-size:18px;margin-bottom:10px;">${q.question}</p>
    </div>

    <div style="display:flex;justify-content:center;flex-wrap:wrap;gap:12px;margin-top:10px;">
      ${["A", "B", "C", "D"]
        .map((key) => {
          const text = (q as any)[`option_${key.toLowerCase()}`];
          const img = (q as any)[`option_${key.toLowerCase()}_image`];

          // Each option box
          return `
            <div class="option-btn" data-answer="${key}"
              style="cursor:pointer;width:160px;border:2px solid #ccc;border-radius:8px;padding:10px;text-align:center;background:white;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;">
              <p style="margin:0;font-weight:bold;">${key}.</p>
              ${
                img
                  ? `<img src="${img}" style="max-width:120px;max-height:100px;border-radius:6px;object-fit:contain;" />`
                  : ""
              }
              ${
                text
                  ? `<p style="font-size:14px;margin:0;color:#333;">${text}</p>`
                  : ""
              }
            </div>`;
        })
        .join("")}
    </div>
  `;

  await Swal.fire({
    title: "🧠 Choose the Correct Answer",
    html,
    showConfirmButton: false,
    allowOutsideClick: false,
    timer: config.question_interval * 1000,
    timerProgressBar: true,
    didOpen: () => {
      const options = Swal.getPopup()?.querySelectorAll(".option-btn");
      options?.forEach((el) =>
        el.addEventListener("click", () => {
          const ans = (el as HTMLElement).dataset.answer as "A" | "B" | "C" | "D";
          const correct = ans === correctKey;
          updateProgress(correct);
          Swal.close();
        })
      );
    },
  });
};


  /* ---------- Player Progress ---------- */
  const updateProgress = async (correct: boolean) => {
    const maxHeight = 8;
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.name === user.first_name) {
          let newHeight = p.height;
          if (correct && p.height < maxHeight) newHeight++;
          else if (!correct && p.height > 0) newHeight--;
          supabase
            .from("players")
            .update({ height: newHeight })
            .eq("name", p.name)
            .eq("game_code", gameCode);
          return { ...p, height: newHeight, isCorrect: correct, isShaking: !correct };
        }
        return p;
      })
    );
  };

  /* ---------- Start Game ---------- */
  const startGame = () => {
    setGameActive(true);
    const qTimer = setInterval(() => askQuestion(), config.question_interval * 1000);
    const cTimer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(qTimer);
          clearInterval(cTimer);
          endGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    if (musicOn && config.theme_file) {
      bgAudio.current = new Audio(config.theme_file);
      bgAudio.current.loop = true;
      bgAudio.current.volume = 0.3;
      bgAudio.current.play();
    }
  };

  const endGame = () => {
    if (bgAudio.current) bgAudio.current.pause();
    Swal.fire("🏁 Game Over", "Returning to lobby...", "info").then(() =>
      router.push("/student/play/classmode")
    );
  };

  /* ---------- UI ---------- */
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-700">
        <Loader2 className="animate-spin w-10 h-10 mb-4 text-[#7b2020]" />
        <p>Loading game data...</p>
      </div>
    );

  return (
    <div className="flex flex-col items-center min-h-screen bg-white">
      {/* HEADER */}
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
            <Volume2 className="w-6 h-6 cursor-pointer" onClick={() => setMusicOn(false)} />
          ) : (
            <VolumeX className="w-6 h-6 cursor-pointer" onClick={() => setMusicOn(true)} />
          )}
          <Menu className="w-7 h-7 cursor-pointer" />
          <LogOut onClick={() => router.push("/")} className="w-6 h-6 cursor-pointer" />
        </div>
      </header>

      {/* GAME BOARD */}
      <main className="flex flex-col items-center w-full max-w-5xl mt-4">
        <h2 className="text-xl font-bold text-[#7b2020]">⚡ Phase Rush</h2>
        <p className="text-gray-600 mb-3">Time Left: {timeLeft}s</p>

        <div
          className="flex justify-around items-end w-full bg-gradient-to-t from-gray-900 to-gray-700 rounded-lg border border-gray-400 p-3 relative"
          style={{ height: "calc(100vh - 200px)" }}
        >
          {players.length === 0 ? (
            <p className="text-white text-sm animate-pulse">Waiting for players...</p>
          ) : (
            players.map((p, i) => {
              const blockHeight = 20;
              const translateY = -(p.height * blockHeight);
              return (
                <div key={i} className="flex flex-col items-center h-full w-20 relative">
                  {/* BOX STACK */}
                  <div className="absolute bottom-12 flex flex-col items-center justify-end">
                    {Array.from({ length: p.height }).map((_, idx) => (
                      <Image
                        key={idx}
                        src="/resources/modes/boxes.png"
                        alt="box"
                        width={45}
                        height={blockHeight}
                        unoptimized
                      />
                    ))}
                  </div>

                  {/* AVATAR */}
                  <div
                    className={`relative flex flex-col items-center transition-all duration-500 ${
                      p.isShaking ? "shake red-flash" : ""
                    } ${p.isCorrect ? "correct-glow" : ""}`}
                    style={{ transform: `translateY(${translateY}px)` }}
                  >
                    <Image
                      src={p.avatar || "/resources/avatars/student1.png"}
                      alt={p.name}
                      width={55}
                      height={55}
                      className="rounded-full ring-4 ring-[#b22222]/70 shadow-md bg-white"
                      unoptimized
                    />
                    <span className="mt-1 text-xs font-bold text-white bg-[#7b2020]/80 px-2 rounded-full">
                      {p.name}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* STYLES */}
      <style jsx>{`
        .shake {
          animation: shake 0.4s ease-in-out;
        }
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }
        .red-flash {
          filter: brightness(1.4) saturate(2) hue-rotate(-20deg);
        }
        .correct-glow {
          box-shadow: 0 0 20px 6px rgba(34, 197, 94, 0.7);
          animation: glowFade 0.6s ease-out forwards;
        }
        @keyframes glowFade {
          0% {
            box-shadow: 0 0 20px 6px rgba(34, 197, 94, 0.7);
          }
          100% {
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  );
}
