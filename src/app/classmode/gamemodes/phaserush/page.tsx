"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Menu, LogOut, Volume2, VolumeX, Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import io from "socket.io-client";

const socket = io("http://localhost:3001", { autoConnect: false });

interface Player {
  id?: string;
  name: string;
  color: string;
  height: number;
  avatar: string;
  isShaking?: boolean;
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
  mode?: string;
  level_id?: number | null;
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
  const [questionTimer, setQuestionTimer] = useState<NodeJS.Timeout | null>(null);
  const [countdownTimer, setCountdownTimer] = useState<NodeJS.Timeout | null>(null);
  const bgAudio = useRef<HTMLAudioElement | null>(null);
  const roomCode = "PHASERUSH123";

  /* ---------- Load User + Connect Socket ---------- */
  useEffect(() => {
    const getSafeJSON = (key: string, fallback: any) => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw || raw === "undefined" || raw === "null") return fallback;
        return JSON.parse(raw);
      } catch {
        return fallback;
      }
    };

    const savedUser = getSafeJSON("user", {});
    const savedType = localStorage.getItem("userType");

    if (!savedUser.first_name || savedType !== "student") {
      router.push("/");
      return;
    }

    setUser(savedUser);

    socket.connect();

    const charImg = "/resources/modes/engr.png";
    socket.emit("join_room", roomCode, savedUser.first_name, charImg);

    socket.on("update_player_list", (list) => {
      const safeList = list.map((p: any) => ({
        ...p,
        avatar:
          p.avatar && p.avatar.trim() !== ""
            ? p.avatar
            : "/resources/avatars/student1.png",
      }));
      setPlayers(safeList);
    });

    socket.on("player_progress_update", (list) => setPlayers(list));
    socket.on("game_finished", (finalRanks) => endGame(finalRanks));

    const adminId = savedUser.admin_id || "ADMIN-0001";
    fetchGameData(adminId);

    return () => {
      socket.disconnect();
      socket.off("update_player_list");
      socket.off("player_progress_update");
      socket.off("game_finished");
    };
  }, [router]);

  /* ---------- Fetch Questions + Settings ---------- */
  const fetchGameData = async (admin_id: string) => {
    try {
      setLoading(true);
      const [res1, res2, res4, settingsRes] = await Promise.allSettled([
        fetch("/api/gamemode1/list-all"),
        fetch("/api/gamemode2/list"),
        fetch("/api/gamemode4/list"),
        fetch(`/api/gamemode4/settings/get?admin_id=${admin_id}`),
      ]);

      const data1 =
        res1.status === "fulfilled" && res1.value.ok ? await res1.value.json() : [];
      const data2 =
        res2.status === "fulfilled" && res2.value.ok ? await res2.value.json() : [];
      const data4 =
        res4.status === "fulfilled" && res4.value.ok ? await res4.value.json() : [];

      let merged = [
        ...data1.map((q: any) => ({ ...q, mode: "GameMode1" })),
        ...data2.map((q: any) => ({ ...q, mode: "GameMode2" })),
        ...data4.map((q: any) => ({ ...q, mode: "GameMode4" })),
      ];

      if (settingsRes.status === "fulfilled" && settingsRes.value.ok) {
        const data = await settingsRes.value.json();
        const totalTime = data.total_game_time ?? 60;
        setConfig({
          total_game_time: totalTime,
          question_interval: data.question_interval ?? 5,
          shuffle_mode: data.shuffle_mode ?? true,
          theme_file: data.theme_file || "/resources/music/theme1.mp3",
        });
        setTimeLeft(totalTime);
      }

      if (config.shuffle_mode) merged = shuffle(merged);
      setQuestions(merged);
    } catch (error) {
      console.error("Error loading data:", error);
      Swal.fire("Error", "Failed to load questions/settings", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Auto-start Game ---------- */
  useEffect(() => {
    if (!loading && questions.length > 0 && user && !gameActive) startGame();
  }, [loading, questions, user]);

  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  /* ---------- Dynamic Question Popup (with image options) ---------- */
  const askQuestion = async () => {
    if (questions.length === 0) return;
    const q = questions[Math.floor(Math.random() * questions.length)];
    const correctKey = q.answer;

    const htmlContent = `
      <div style="text-align:center;">
        ${
          q.question_image
            ? `<img src="${q.question_image}" style="max-width:200px;max-height:150px;margin-bottom:10px;border-radius:8px;" />`
            : ""
        }
        <p style="font-size:18px;margin-bottom:10px;">${q.question}</p>
      </div>
      <div id="options-container" 
           style="display:flex;justify-content:center;flex-wrap:wrap;gap:12px;margin-top:10px;">
        ${["A", "B", "C", "D"]
          .map((key) => {
            const textKey = (q as any)[`option_${key.toLowerCase()}`];
            const imgKey = (q as any)[`option_${key.toLowerCase()}_image`];
            return `
              <div class="option-btn" data-answer="${key}"
                style="cursor:pointer;width:140px;border:2px solid #ccc;border-radius:8px;padding:8px;text-align:center;background:white;transition:0.2s;">
                ${
                  imgKey
                    ? `<img src="${imgKey}" style="max-width:80px;max-height:80px;border-radius:6px;margin-bottom:5px;" />`
                    : ""
                }
                <p><b>${key}.</b> ${textKey || ""}</p>
              </div>
            `;
          })
          .join("")}
      </div>
    `;

    await Swal.fire({
      title: "🧠 Choose the Correct Answer",
      html: htmlContent,
      background: "#fff",
      width: "600px",
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
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
  const updateProgress = (playerCorrect: boolean) => {
    const maxHeight = 8;
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.name === user.first_name) {
          let newHeight = p.height;
          if (playerCorrect && p.height < maxHeight) newHeight += 1;
          else if (!playerCorrect && p.height > 0) newHeight -= 1;
          socket.emit("update_progress", { roomCode, playerName: user.first_name, newHeight });
          return { ...p, height: newHeight, isShaking: !playerCorrect };
        }
        return p;
      })
    );
  };

  /* ---------- Start / End Game ---------- */
  const startGame = () => {
    if (questions.length === 0) {
      Swal.fire("⚠️ No questions found!", "Please contact your instructor.", "warning");
      return;
    }

    setGameActive(true);
    socket.emit("start_game", roomCode);

    const qTimer = setInterval(() => askQuestion(), config.question_interval * 1000);
    const cTimer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(qTimer);
          clearInterval(cTimer);
          finishGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setQuestionTimer(qTimer);
    setCountdownTimer(cTimer);

    if (musicOn && config.theme_file) {
      bgAudio.current = new Audio(config.theme_file);
      bgAudio.current.loop = true;
      bgAudio.current.volume = 0.3;
      bgAudio.current.play();
    }
  };

  const finishGame = () => socket.emit("finish_game", roomCode);

  const endGame = (finalRanks: Player[]) => {
    if (bgAudio.current) bgAudio.current.pause();

    const ranked = [...finalRanks].sort((a, b) => b.height - a.height);
    const medals = ["🥇", "🥈", "🥉", "🏅"];

    const leaderboardHTML = `
      <div style="text-align:center;">
        <h3 style="font-size:22px;margin-bottom:10px;">🏁 Final Rankings</h3>
        ${ranked
          .map(
            (p, i) => `
              <div style="display:flex;align-items:center;justify-content:space-between;width:250px;
                background:#fff;border-radius:8px;box-shadow:0 0 5px rgba(0,0,0,0.1);padding:6px 10px;">
                <span style="font-size:20px;">${medals[i] || "🎖️"}</span>
                <div style="flex:1;text-align:left;margin-left:10px;">
                  <strong>${p.name}</strong><br/>
                  <small style="color:gray;">${p.height} blocks</small>
                </div>
                <img src="${p.avatar}" width="35" height="35" style="border-radius:50%;" />
              </div>
            `
          )
          .join("")}
      </div>
    `;

    Swal.fire({
      icon: "info",
      title: "Game Over!",
      html: leaderboardHTML,
      confirmButtonText: "Return to Menu",
      background: "#fafafa",
      width: "400px",
    }).then(() => router.push("/student/play/classmode"));
  };

  /* ---------- UI ---------- */
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white text-gray-700">
        <Loader2 className="animate-spin w-10 h-10 mb-4 text-[#548E28]" />
        <p>Loading game data...</p>
      </div>
    );

  return (
    <div className="flex flex-col items-center min-h-screen bg-white relative">
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md mb-4">
        <div className="flex items-center space-x-3 cursor-pointer">
          <Image
            src={"/resources/modes/engr.png"}
            alt="Profile"
            width={40}
            height={40}
            unoptimized
            className="rounded-full border-2 border-white"
          />
          <span className="font-semibold text-lg">{user?.first_name?.toUpperCase()}</span>
        </div>

        <div className="flex items-center gap-4">
          {musicOn ? (
            <Volume2 className="w-6 h-6 cursor-pointer" onClick={() => setMusicOn(false)} />
          ) : (
            <VolumeX className="w-6 h-6 cursor-pointer" onClick={() => setMusicOn(true)} />
          )}
          <Menu className="w-7 h-7 cursor-pointer" />
          <LogOut
            onClick={() => {
              setGameActive(false);
              socket.disconnect();
              if (bgAudio.current) bgAudio.current.pause();
              localStorage.clear();
              router.push("/");
            }}
            className="w-6 h-6 text-white cursor-pointer hover:text-gray-300"
          />
        </div>
      </header>

      <main className="flex flex-col items-center w-full max-w-4xl">
        <h2 className="text-xl font-bold text-[#7b2020] mb-2">⚡ Phase Rush</h2>
        <p className="text-gray-600 mb-3">Time Left: {timeLeft}s</p>

        <div
          className="flex justify-around items-end w-full bg-black rounded-lg border border-gray-300 overflow-hidden p-3 relative"
          style={{ height: "calc(100vh - 180px)", maxHeight: "800px", minHeight: "400px" }}
        >
         {players.map((p, i) => {
  const BLOCK_HEIGHT = 3;
  const translateY = Math.min(p.height * BLOCK_HEIGHT, BLOCK_HEIGHT * 1);

  return (
    <div key={i} className="flex flex-col items-center h-full w-24 relative">
      <div className="flex flex-col-reverse items-center justify-start h-full relative">
        {Array.from({ length: p.height }).map((_, idx) => (
          <Image
            key={idx}
            src="/resources/modes/boxes.png"
            alt="Tower Box"
            width={55}
            height={BLOCK_HEIGHT}
            unoptimized
            className="object-contain m-0 p-0"
          />
        ))}
        <div
          className={`relative flex flex-col items-center transition-all duration-500 ease-in-out ${
            p.isShaking ? "shake red-flash" : ""
          }`}
          style={{ transform: `translateY(-${translateY + 2}px)` }}
        >
          <span className="absolute -top-5 text-xs font-bold text-gray-800 bg-white/70 px-1 rounded">
            {p.name}
          </span>
          <Image
            src={p.avatar || "/resources/avatars/student1.png"}
            alt={p.name || "Player"}
            width={60}
            height={60}
            unoptimized
            className="object-contain animate-bounce"
          />
        </div>
      </div>
    </div>
  );
})}

        </div>
      </main>

      <style jsx>{`
        .animate-bounce {
          animation: bounce 1.6s infinite alternate;
        }
        @keyframes bounce {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(-6px);
          }
        }

        .shake {
          animation: shake 0.4s ease-in-out;
        }
        @keyframes shake {
          0% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-4px);
          }
          50% {
            transform: translateX(4px);
          }
          75% {
            transform: translateX(-4px);
          }
          100% {
            transform: translateX(0);
          }
        }

        .red-flash {
          filter: brightness(1.4) saturate(2) hue-rotate(-20deg);
        }
      `}</style>
    </div>
  );
}
