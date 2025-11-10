"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Swal from "sweetalert2";
import { Menu, LogOut, Volume2, VolumeX, Loader2 } from "lucide-react";
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
  score?: number;
  is_correct?: boolean;
  updated_at?: string;
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
  const [musicOn, setMusicOn] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [movingBoats, setMovingBoats] = useState<{ [key: string]: boolean }>({});
  const [settings, setSettings] = useState<any>(null);
  const [gameCode, setGameCode] = useState<string>("");

  const bgAudio = useRef<HTMLAudioElement | null>(null);
  const questionInterval = useRef<NodeJS.Timeout | null>(null);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const MAX_PROGRESS = 130; // 🚧 players cannot move past this value


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

    return () => {
      supabase.getChannels().forEach((c) => supabase.removeChannel(c));
      if (bgAudio.current) bgAudio.current.pause();
      if (questionInterval.current) clearInterval(questionInterval.current);
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [router]);

  /* ---------- Fetch Game Settings ---------- */
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

/* ---------- Join Lobby ---------- */
const joinLobby = async (savedUser: any, code: string) => {
  try {
    // ✅ Fetch the class or game info to get the professor_id
    const { data: classData, error: classErr } = await supabase
      .from("class")
      .select("professor_id")
      .eq("game_code", code)
      .maybeSingle();

    if (classErr) console.error("⚠️ Error fetching class professor:", classErr);

    // ✅ Update localStorage user with professor_id (so it's never missing)
    if (classData?.professor_id) {
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...savedUser,
          professor_id: classData.professor_id, // 🧠 Inject here
        })
      );
      console.log("✅ professor_id added to localStorage:", classData.professor_id);
    }

    // ✅ 1. Make sure the player exists
    const { error: playerErr } = await supabase
      .from("players")
      .upsert(
        {
          game_code: code,
          name: savedUser.first_name,
          avatar: savedUser.avatar || "/resources/avatars/student1.png",
          progress: 0,
          score: 0,
          is_active: true,
        },
        { onConflict: "game_code,name" }
      );
    if (playerErr) console.error("⚠️ Player upsert failed:", playerErr);

    // ✅ 2. Check if the player has an existing event
    const { data: eventData, error: checkErr } = await supabase
      .from("game_events")
      .select("id")
      .eq("game_code", code)
      .eq("player_name", savedUser.first_name)
      .maybeSingle();

    if (checkErr) console.error("⚠️ Event check failed:", checkErr);

    // ✅ 3. Insert new if missing
    if (!eventData) {
      const { error: insertErr } = await supabase.from("game_events").insert({
        game_code: code,
        player_name: savedUser.first_name,
        progress: 0,
        score: 0,
        is_correct: false,
        updated_at: new Date().toISOString(),
      });
      if (insertErr) console.error("❌ Error inserting new game event:", insertErr);
    }

    // ✅ 4. Refresh UI
    refreshPlayers(code);
    refreshEvents(code);

    // ✅ 5. Realtime listener
    supabase
      .channel(`phase-events-${code}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_events", filter: `game_code=eq.${code}` },
        () => refreshEvents(code)
      )
      .subscribe();
  } catch (err) {
    console.error("❌ Error in joinLobby:", err);
  }
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
      .select("player_name,progress,score,is_correct,updated_at")
      .eq("game_code", code);
    setEvents(data || []);
  };

/* ---------- Fetch Questions Based on Mode ---------- */
const fetchQuestions = async (settings: any) => {
  try {
    let all: any[] = [];

    // ✅ 1️⃣ Handle Module Mode (Default Questions)
    if (settings.questionMode === "Module") {
      console.log("🧠 Mode: MODULE — using module questions only");
      const [mode1, mode2, mode4] = await Promise.all([
        fetch("/api/gamemode1/list-all").then((r) => r.json()).catch(() => []),
        fetch("/api/gamemode2/list").then((r) => r.json()).catch(() => []),
        fetch("/api/gamemode4/list").then((r) => r.json()).catch(() => []),
      ]);
      all = [...mode1, ...mode2, ...mode4];
      console.log(
        `✅ Loaded ${all.length} module questions — M1:${mode1.length}, M2:${mode2.length}, M4:${mode4.length}`
      );
    }

    // ✅ 2️⃣ Handle Pre-made Mode (Teacher’s Questions)
    else if (settings.questionMode === "Premade") {
      console.log("🧠 Mode: PRE-MADE — using teacher-created questions");

      const classId = settings?.class_id;
      const teacherId = settings?.teacher_id || user?.id_number || user?.professor_id;

      if (!classId && !teacherId) {
        console.warn("⚠️ No class_id or teacher_id found — cannot load pre-made questions.");
      } else {
        const endpoint = classId
          ? `/api/class/questions/list?class_id=${classId}`
          : `/api/class/questions/list?teacher_id=${teacherId}`;

        console.log("📡 Fetching questions from:", endpoint);

        const res = await fetch(endpoint);
        const data = await res.json();

        if (data.success && data.questions.length > 0) {
          all = data.questions;
          console.log(`✅ Loaded ${data.questions.length} pre-made questions`);
        } else {
          console.warn("⚠️ No pre-made questions found for this class/teacher");
        }
      }
    }

    // ✅ 3️⃣ Handle Mixed Mode (Combine Both Sets)
    else if (settings.questionMode === "Mixed") {
      console.log("🧠 Mode: MIXED — combining module + pre-made questions");

      const classId = settings?.class_id;
      const teacherId = settings?.teacher_id || user?.id_number || user?.professor_id;

      const premadeEndpoint = classId
        ? `/api/class/questions/list?class_id=${classId}`
        : teacherId
          ? `/api/class/questions/list?teacher_id=${teacherId}`
          : null;

      // 🚀 Fetch everything in parallel — now includes gamemode1 too!
      const [mode1, mode2, mode4, premadeRes] = await Promise.all([
        fetch("/api/gamemode1/list-all").then((r) => r.json()).catch(() => []),
        fetch("/api/gamemode2/list").then((r) => r.json()).catch(() => []),
        fetch("/api/gamemode4/list").then((r) => r.json()).catch(() => []),
        premadeEndpoint
          ? fetch(premadeEndpoint)
              .then((r) => r.json())
              .catch(() => ({ success: false, questions: [] }))
          : Promise.resolve({ success: false, questions: [] }),
      ]);

      const premade = premadeRes.success ? premadeRes.questions : [];

      // 🧩 Combine all
      all = [...mode1, ...mode2, ...mode4, ...premade];

      console.log(
        `✅ Loaded ${all.length} total questions — Module(M1:${mode1.length}, M2:${mode2.length}, M4:${mode4.length}) + Premade(${premade.length})`
      );
    }

    // ✅ 4️⃣ Fallback (If no questions found)
    if (!Array.isArray(all) || all.length === 0) {
      console.warn("⚠️ No questions available for this mode!");
      Swal.fire("No Questions Found", "No available questions for this mode.", "warning");
      setQuestions([]);
      return;
    }

    // ✅ 5️⃣ Shuffle if enabled
    if (settings.shuffleQuestions) {
      all.sort(() => Math.random() - 0.5);
    }

    // ✅ 6️⃣ Apply questions
    setQuestions(all);
    setCurrentQuestion(all[0]);
    console.log(`✅ Loaded ${all.length} questions for ${settings.questionMode} mode`);
  } catch (err) {
    console.error("❌ Question fetch failed:", err);
    Swal.fire("Error", "Failed to load questions.", "error");
  }
};


  // ✅ Preload and unlock the audio system on first user click
useEffect(() => {
  const unlockAudio = () => {
    if (!bgAudio.current) {
      bgAudio.current = new Audio();
      bgAudio.current.muted = true; // play silently to unlock
      bgAudio.current.play().catch(() => {});
      bgAudio.current.pause();
      bgAudio.current.muted = false;
      console.log("🔓 Audio context unlocked.");
    }
    document.removeEventListener("click", unlockAudio);
  };

  document.addEventListener("click", unlockAudio);
  return () => document.removeEventListener("click", unlockAudio);
}, []);

  /* ---------- Start Game ---------- */
  useEffect(() => {
    if (!loading && questions.length > 0 && user && settings && !gameActive) startGame();
  }, [loading, questions, user, settings]);

  const startGame = async () => {
  setGameActive(true);

  // ✅ Reset progress and broadcast start
  await supabase
    .from("game_events")
    .update({ progress: 0, score: 0 })
    .eq("game_code", gameCode);
  refreshEvents(gameCode);

  await supabase.from("game_state").insert({
    game_code: gameCode,
    event_type: "game_started",
    started_at: new Date().toISOString(),
    settings: JSON.stringify(settings),
  });

  // ✅ Handle music
  try {
    const chosenTheme = settings?.musicTheme || "theme1";
    const themePath = `/resources/music/${chosenTheme}.mp3`;

    // If there is no existing bgAudio or it's paused, play the default
    if (!bgAudio.current || bgAudio.current.paused) {
      bgAudio.current = new Audio(themePath);
      bgAudio.current.loop = true;
      bgAudio.current.volume = 0.3;

      const playAttempt = bgAudio.current.play();

      if (playAttempt instanceof Promise) {
        playAttempt.catch(() => {
          console.warn("⚠️ Could not autoplay — will retry on user interaction.");
          document.addEventListener(
            "click",
            () => {
              bgAudio.current?.play().catch(() => {
                console.warn("❌ Still unable to start music even after click.");
              });
            },
            { once: true }
          );
        });
      }
      console.log(`🎵 Music started: ${chosenTheme}`);
    } else {
      console.log("🎧 Music already playing, no need to restart.");
    }
  } catch (err) {
    console.error("❌ Error playing background music:", err);
    // fallback to default theme1 if no audio at all
    try {
      bgAudio.current = new Audio("/resources/music/theme1.mp3");
      bgAudio.current.loop = true;
      bgAudio.current.volume = 0.3;
      await bgAudio.current.play();
      console.log("🎶 Fallback music (Theme 1) started successfully.");
    } catch (e) {
      console.error("❌ Could not start fallback theme1 audio:", e);
    }
  }

  // ✅ Start question & timer intervals
  questionInterval.current = setInterval(nextQuestion, 12000);

  timerInterval.current = setInterval(() => {
    setTimeLeft((t) => {
      if (t <= 1) {
        clearInterval(timerInterval.current!);
        clearInterval(questionInterval.current!);
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
    const playerName = user.first_name;
    const current = events.find((e) => e.player_name === playerName);
    const progress = current ? current.progress : 0;
    const score = current ? current.score || 0 : 0;

    const newProgress = correct
  ? Math.min(progress + 10, MAX_PROGRESS) // ✅ cap at limit
  : Math.max(0, progress - 5);

    const newScore = correct ? score + 1 : score;

    setMovingBoats((prev) => ({ ...prev, [playerName]: true }));

    const { error } = await supabase.from("game_events").upsert(
      {
        game_code: gameCode,
        player_name: playerName,
        progress: newProgress,
        score: newScore,
        is_correct: correct,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "game_code,player_name" }
    );

    if (error) console.error("❌ Error updating game event:", error);
    refreshEvents(gameCode);

    setTimeout(() => setMovingBoats((prev) => ({ ...prev, [playerName]: false })), 800);
  };



  // 🧩 Helper: Safe, debounced save to prevent duplicate inserts
const saveToNeon = async (payload: any) => {
  // Unique session key to prevent spam saves
  const key = `saving_${payload.game_code}_${payload.student_id_number}`;
  if (sessionStorage.getItem(key)) {
    console.log("⚠️ Save already in progress, skipping duplicate.");
    return;
  }
  sessionStorage.setItem(key, "true");

  try {
    const res = await fetch("/api/classmode/records/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    if (!res.ok) {
      console.error("❌ Failed to save record:", result);
      await Swal.fire("Save Error", "Could not save your game record.", "error");
    } else {
      console.log(
        `✅ Record ${result.action || "saved"} successfully for ${payload.student_id_number}`,
        result
      );
    }
  } catch (err) {
    console.error("❌ Network/API save error:", err);
    await Swal.fire("Network Error", "Failed to contact server.", "error");
  } finally {
    // clear lock after 2 seconds
    setTimeout(() => sessionStorage.removeItem(key), 2000);
  }
};

/* ---------- End Game ---------- */
const endGame = async () => {
  if (bgAudio.current) bgAudio.current.pause();

  try {
    // 1️⃣ Fetch all game events
    const { data: rows, error: rowsErr } = await supabase
      .from("game_events")
      .select("player_name, score, progress")
      .eq("game_code", gameCode);

    if (rowsErr) throw rowsErr;
    if (!rows || rows.length === 0) {
      await Swal.fire("No Results", "No scores were recorded.", "warning");
      router.push("/student/play/classmode");
      return;
    }

    // 2️⃣ Compute leaderboard
    const pointsPerQuestion = settings?.points ?? 10;
    const leaderboard = rows
      .map((r: any) => {
        const correct =
          typeof r.score === "number"
            ? r.score
            : Math.round((r.progress ?? 0) / 10);
        const points = correct * pointsPerQuestion;
        return {
          name: r.player_name,
          correct,
          progress: r.progress ?? 0,
          points,
        };
      })
      .sort((a, b) => b.points - a.points || b.progress - a.progress);

    // 3️⃣ Broadcast game finished to professor view
    await supabase.from("game_state").insert({
      game_code: gameCode,
      event_type: "game_finished",
      started_at: new Date().toISOString(),
      settings: JSON.stringify(leaderboard),
    });

    // 4️⃣ Save to Neon (this student only)
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const student_id_number = currentUser?.id_number || currentUser?.id || null;
    const playerName = currentUser?.first_name || "";
    const myRecord = leaderboard.find((p) => p.name === playerName);

    // ✅ Use student's own ID as professor_id (for consistency with your schema)
    const professor_id = student_id_number;

    if (!student_id_number || !myRecord) {
      console.warn("⚠️ Missing student_id_number or no leaderboard record found.");
    } else {
      const recordPayload = {
        professor_id,
        game_code: gameCode,
        student_id_number,
        points: myRecord.points,
      };

      console.log("📤 Saving record to Neon:", recordPayload);
      await saveToNeon(recordPayload);
    }

    // 5️⃣ Let professor know this student finished
    await supabase.from("game_state").insert({
      game_code: gameCode,
      event_type: "student_finished",
      started_at: new Date().toISOString(),
      settings: JSON.stringify({
        student: playerName,
        points: myRecord?.points ?? 0,
      }),
    });

    console.log("✅ Student record saved and finish event broadcasted.");

    // 6️⃣ Wait a bit before redirect
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 7️⃣ Show leaderboard
    await Swal.fire({
      title: "🏁 Race Over!",
      html:
        leaderboard.length > 0
          ? leaderboard
              .map(
                (p, i) =>
                  `<div style="margin:4px 0;font-weight:600">
                     ${i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : ""} 
                     ${i + 1}. ${p.name} — ${p.points} pts
                   </div>`
              )
              .join("")
          : "<p>No data available.</p>",
      icon: "success",
      confirmButtonText: "Return to Lobby",
      confirmButtonColor: "#7b2020",
    });

    router.push("/student/play/classmode");
  } catch (err: any) {
    console.error("❌ Error ending game:", err);
    Swal.fire("Error", err.message || "Something went wrong ending the game.", "error");
  }
};

const [fieldWidth, setFieldWidth] = useState(0);
const fieldRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (fieldRef.current) {
    setFieldWidth(fieldRef.current.offsetWidth);
  }

  const handleResize = () => {
    if (fieldRef.current) setFieldWidth(fieldRef.current.offsetWidth);
  };

  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);


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
          <div className="absolute inset-0 bg-blue-500/20"></div>
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

        {/* Question Section */}
        {currentQuestion && (
          <div className="w-full max-w-4xl mt-6 bg-white border border-[#7b2020] rounded-lg p-4 sm:p-5 shadow-md">
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
