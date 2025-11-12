"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Menu, LogOut, Volume2, VolumeX, Loader2, ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";

interface Player {
  name: string;
  color: string;
  height: number;
  image: string;
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

  // 🆕 NEW score-related states
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const answeredRef = useRef(false);
  const correctRef = useRef(0);
const wrongRef = useRef(0);
const totalRef = useRef(0);
const [botScores, setBotScores] = useState([
  { name: "BOT A", correct: 0, wrong: 0 },
  { name: "BOT B", correct: 0, wrong: 0 },
  { name: "BOT C", correct: 0, wrong: 0 },
]);

const botScoresRef = useRef(botScores);
useEffect(() => {
  botScoresRef.current = botScores;
}, [botScores]);

const gameEndingRef = useRef(false);


  /* ---------- Load User + Setup ---------- */
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedType = localStorage.getItem("userType");

    if (!savedUser || savedType !== "student") {
      router.push("/");
      return;
    }

    const u = JSON.parse(savedUser);
    setUser(u);

    const charImg = "/resources/modes/engr.png";
    setPlayers([
      { name: u.first_name || "You", color: "#7b2020", height: 0, image: charImg },
      { name: "BOT A", color: "#1e88e5", height: 0, image: charImg },
      { name: "BOT B", color: "#43a047", height: 0, image: charImg },
      { name: "BOT C", color: "#f4511e", height: 0, image: charImg },
    ]);

    const adminId = u.admin_id || "ADMIN-0001";
    fetchGameData(adminId);
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

  /* ---------- Auto-start Game After Loading ---------- */
  useEffect(() => {
    if (!loading && questions.length > 0 && user && !gameActive) {
      startGame();
    }
  }, [loading, questions, user]);

  /* ---------- Shuffle Helper ---------- */
  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };


  const askQuestion = async () => {
  if (questions.length === 0) return;

  /// 🚫 Stop immediately if the game is ending or time is low
  if (gameEndingRef.current || timeLeft <= 3) {
    console.log("⏸️ Skipping question — game ending or less than 3 seconds left.");
    return;
  }

  answeredRef.current = false;
  const q = questions[Math.floor(Math.random() * questions.length)];
  const correctKey = q.answer;

  console.log("🧩 Showing new question:", q.question);
  const hasImages =
    q.option_a_image || q.option_b_image || q.option_c_image || q.option_d_image;

  let selectedOptions: ("A" | "B" | "C" | "D")[] = [];

  if (hasImages) {
    selectedOptions = ["A", "B", "C", "D"];
  } else {
    const allOptions: ("A" | "B" | "C" | "D")[] = ["A", "B", "C", "D"];
    const wrongOptions = allOptions.filter((opt) => opt !== correctKey);
    const wrongKey = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
    selectedOptions = shuffle([correctKey, wrongKey]);
  }

  let htmlContent = `
    <div style="text-align:center;">
      ${q.question_image ? `<img src="${q.question_image}" style="max-width:200px;max-height:150px;margin-bottom:10px;border-radius:8px;" />` : ""}
      <p style="font-size:18px;margin-bottom:10px;">${q.question}</p>
    </div>
    <div id="options-container" style="display:flex;justify-content:center;flex-wrap:wrap;gap:12px;margin-top:10px;">
      ${selectedOptions
        .map((key, index) => {
          const textKey = (q as any)[`option_${key.toLowerCase()}`];
          const imgKey = (q as any)[`option_${key.toLowerCase()}_image`];
          const letter = String.fromCharCode(65 + index);
          return `
            <div class="option-btn" data-answer="${key}"
              style="cursor:pointer;width:120px;border:2px solid #ccc;border-radius:8px;padding:8px;text-align:center;background:white;transition:0.2s;">
              ${imgKey ? `<img src="${imgKey}" style="max-width:80px;max-height:80px;border-radius:6px;margin-bottom:5px;" />` : ""}
              <p><b>${letter}.</b> ${textKey || ""}</p>
            </div>
          `;
        })
        .join("")}
    </div>
  `;

  // ✅ Double-check just before showing Swal
  if (timeLeft <= 3) {
    console.log("🚫 Cancelled modal opening — time almost up.");
    return;
  }

  await Swal.fire({
    title: "🧠 Choose the Correct Answer",
    html: htmlContent,
    background: "#fff",
    width: hasImages ? "600px" : "400px",
    showConfirmButton: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
    timer: config.question_interval * 1000,
    timerProgressBar: true,
    didOpen: () => {
      const options = Swal.getPopup()?.querySelectorAll(".option-btn");
      options?.forEach((el) => {
        el.addEventListener("click", () => {
          answeredRef.current = true;
          const playerAnswer = (el as HTMLElement).getAttribute("data-answer") as "A" | "B" | "C" | "D";
          const correct = playerAnswer === correctKey;

          console.log("🧍 Player answered:", playerAnswer, "=>", correct ? "✅ Correct" : "❌ Wrong");

          updateProgress(correct);

          totalRef.current += 1;
          setTotalQuestions(totalRef.current);

          if (correct) {
            correctRef.current += 1;
            setCorrectAnswers(correctRef.current);
          } else {
            wrongRef.current += 1;
            setWrongAnswers(wrongRef.current);
          }

          Swal.close();
        });
      });
    },
    willClose: () => {
      if (!answeredRef.current) {
        totalRef.current += 1;
        wrongRef.current += 1;
        setTotalQuestions(totalRef.current);
        setWrongAnswers(wrongRef.current);
        updateProgress(false);
        console.log("❌ Skipped — counted as wrong");
      }
    },
  });
};


const updateProgress = (playerCorrect: boolean) => {
  const maxHeight = 8;
  const botAccuracies = [0.8, 0.6, 0.4]; // BOT A smarter, BOT C clumsier

  // ✅ Always use latest reference, not stale state
  const currentBotScores = botScoresRef.current;

  // 🧠 Update bot performance cumulatively
  const updatedBotScores = currentBotScores.map((bot, index) => {
    const success = Math.random() < botAccuracies[index];
    return {
      ...bot,
      correct: bot.correct + (success ? 1 : 0),
      wrong: bot.wrong + (!success ? 1 : 0),
      success,
    };
  });

  // ✅ Commit to both state and ref immediately
  setBotScores(updatedBotScores);
  botScoresRef.current = updatedBotScores;

  // ✅ Update players (player + bots)
  setPlayers((prevPlayers) =>
    prevPlayers.map((p, i) => {
      let newHeight = p.height;
      let shaking = false;

      if (i === 0) {
        // 🎮 Player logic
        if (playerCorrect && p.height < maxHeight) newHeight = p.height + 1;
        else if (!playerCorrect && p.height > 0) {
          newHeight = p.height - 1;
          shaking = true;
        }
      } else {
        // 🤖 Bot logic: use updated scores' success
        const bot = updatedBotScores[i - 1];
        if (bot.success && p.height < maxHeight) newHeight = p.height + 1;
        else if (!bot.success && p.height > 0) newHeight = p.height - 1;
      }

      return {
        ...p,
        height: Math.max(0, Math.min(maxHeight, newHeight)),
        isShaking: shaking,
      };
    })
  );

  console.log("🤖 Updated bot scores (real-time cumulative):", updatedBotScores);
  console.log("🏗️ Players after update:", players);

  // ✅ Clear shake effect after animation
  setTimeout(() => {
    setPlayers((prev) => prev.map((p) => ({ ...p, isShaking: false })));
  }, 600);
};


  /* ---------- Start / End Game ---------- */
  const startGame = () => {
    if (questions.length === 0) {
      
      Swal.fire("⚠️ No questions found!", "Please contact your instructor.", "warning");
      return;
    }

    setPlayers((prev) => prev.map((p) => ({ ...p, height: 0 })));
    setTimeLeft(config.total_game_time);
    setGameActive(true);
    setStartTime(Date.now()); 
  askQuestion();


    const qTimer = setInterval(() => askQuestion(), config.question_interval * 1000);
    setQuestionTimer(qTimer);

const cTimer = setInterval(() => {
  setTimeLeft((prev) => {
    if (prev <= 1) {
      clearInterval(qTimer);
      clearInterval(cTimer);
      finishGame();
      return 0;
    }

    // 🧠 When time hits 3s or below, mark game as ending
    if (prev <= 4 && !gameEndingRef.current) {
      gameEndingRef.current = true; // stop any new questions
      if (questionTimer) {
        clearInterval(questionTimer);
        setQuestionTimer(null);
        console.log("🛑 Stopped question intervals (game ending soon).");
      }
    }

    return prev - 1;
  });
}, 1000);


    setCountdownTimer(cTimer);

    if (musicOn && config.theme_file) {
      bgAudio.current = new Audio(config.theme_file);
      bgAudio.current.loop = true;
      bgAudio.current.volume = 0.3;
      bgAudio.current.play();
    }
  };

const finishGame = async () => {
  const correct = correctRef.current;
  const wrong = wrongRef.current;
  const total = totalRef.current;

  console.log("🏁 FINAL SCORE SUMMARY (REAL VALUES)", {
    correct,
    wrong,
    total,
    players,
    bots: botScoresRef.current,
  });

  if (bgAudio.current) bgAudio.current.pause();

  const elapsedTime = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

  // ✅ Save player result only
  if (user?.id_number && total > 0) {
    try {
      await fetch("/api/gamemode4/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: user.id_number,
          total_questions: total,
          correct_answers: correct,
          wrong_answers: wrong,
          elapsed_time: elapsedTime,
        }),
      });
      console.log("✅ GameMode4 progress saved successfully.");
    } catch (err) {
      console.error("❌ Failed to save GameMode4 progress:", err);
    }
  }

  // ✅ Combine player and bots for fair ranking
  const allResults = [
    {
      name: user.first_name || "You",
      correct,
      wrong,
      total,
      accuracy: total > 0 ? correct / total : 0,
      image: "/resources/modes/engr.png",
    },
    ...botScoresRef.current.map((bot) => {
      const botTotal = bot.correct + bot.wrong;
      return {
        name: bot.name,
        correct: bot.correct,
        wrong: bot.wrong,
        total: botTotal,
        accuracy: botTotal > 0 ? bot.correct / botTotal : 0,
        image: "/resources/modes/engr.png",
      };
    }),
  ];

  // ✅ Sort by correct answers (desc), then by accuracy (desc)
  const rankedAll = [...allResults].sort((a, b) => {
    if (b.correct === a.correct) return b.accuracy - a.accuracy;
    return b.correct - a.correct;
  });

  const medals = ["🥇", "🥈", "🥉", "🏅"];

  // ✅ Build leaderboard HTML
  const leaderboardHTML = `
    <div style="text-align:center;">
      <h3 style="font-size:22px;margin-bottom:10px;">🏁 Final Rankings</h3>
      <p><strong>Correct:</strong> ${correct} | ❌ Wrong: ${wrong} | 🧮 Total: ${total}</p>
      <p><strong>Accuracy:</strong> ${total > 0 ? ((correct / total) * 100).toFixed(1) : 0}%</p>
      <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
        ${rankedAll
          .map((p, i) => {
            const acc = (p.accuracy * 100).toFixed(1);
            const bgColor =
              i === 0
                ? "linear-gradient(90deg,#ffde59,#ffcc00)" // gold
                : i === 1
                ? "linear-gradient(90deg,#d3d3d3,#b0b0b0)" // silver
                : i === 2
                ? "linear-gradient(90deg,#cd7f32,#b87333)" // bronze
                : "#fff";

            return `
              <div style="display:flex;align-items:center;justify-content:space-between;width:270px;background:${bgColor};border-radius:8px;box-shadow:0 0 5px rgba(0,0,0,0.15);padding:8px 10px;">
                <span style="font-size:20px;">${medals[i] || "🎖️"}</span>
                <div style="flex:1;text-align:left;margin-left:10px;">
                  <strong>${p.name}</strong><br/>
                  <small style="color:#333;">${p.correct}✅ ${p.wrong}❌ (${acc}%)</small>
                </div>
                <img src="${p.image}" width="35" height="35" style="border-radius:50%;" />
              </div>
            `;
          })
          .join("")}
      </div>
    </div>
  `;

  await Swal.fire({
    icon: "info",
    title: "Game Over!",
    html: leaderboardHTML,
    confirmButtonText: "Return to Menu",
    background: "#fafafa",
    width: "420px",
  });

  router.push("/student/play/");
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
            <ArrowLeft
              onClick={() => {
                // ✅ Stop the game before logging out
                setGameActive(false);

                if (questionTimer) clearInterval(questionTimer);
                if (countdownTimer) clearInterval(countdownTimer);

                if (bgAudio.current) {
                  bgAudio.current.pause();
                  bgAudio.current = null;
                }

                
                router.push("/student/play");
              }}
              className="w-6 h-6 text-white cursor-pointer hover:text-gray-300"
            />
            <Image
              src={user.avatar || "/student-avatar.png"}
              alt="Profile"
              width={40}
              height={40}
              className="rounded-full border-2 border-white"
            />
            <span className="font-semibold text-lg">{user.first_name?.toUpperCase()}</span>
          </div>

          
        </header>

        <main className="flex flex-col items-center w-full max-w-4xl">
          <h2 className="text-xl font-bold text-[#7b2020] mb-2">⚡ Phase Rush</h2>
          <p className="text-gray-600 mb-3">Time Left: {timeLeft}s</p>

          <div
            className="flex justify-around items-end w-full bg-black rounded-lg border border-gray-300 overflow-hidden p-3 relative"
            style={{
              height: "calc(100vh - 180px)",
              maxHeight: "800px",
              minHeight: "400px",
            }}
          >
            {players.map((p, i) => {
              const effortScale = p.height > 6 ? 1.15 : 1;
              const translateY = Math.min(p.height * 1, 336); // ✅ adjust per block to make character sit right on top

              return (
                <div key={i} className="flex flex-col items-center h-full w-24 relative">
                  <div className="flex flex-col-reverse items-center justify-start h-full relative">
                    {Array.from({ length: p.height }).map((_, idx) => (
                      <Image
                        key={idx}
                        src="/resources/modes/boxes.png"
                        alt="Tower Box"
                        width={55}
                        height={28}
                        className="object-contain m-0 p-0"
                      />
                    ))}
                    <div
                      className={`relative flex flex-col items-center transition-all duration-500 ease-in-out ${
                        p.isShaking ? "shake red-flash" : ""
                      }`}
                      style={{
                        transform: `translateY(-${translateY}px) scale(${effortScale})`,
                      }}
                    >
                      <span className="absolute -top-5 text-xs font-bold text-gray-800 bg-white/70 px-1 rounded">
                        {p.name}
                      </span>
                      <Image
                        src={p.image}
                        alt={p.name}
                        width={60}
                        height={60}
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