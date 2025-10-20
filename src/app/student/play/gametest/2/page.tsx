"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu, LogOut, Search, X } from "lucide-react";
import Swal from "sweetalert2";

interface Player {
  name: string;
  color: string;
  height: number; // tower progress
  image: string; // character sprite
}

export default function PhaseRush() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [players, setPlayers] = useState<Player[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameActive, setGameActive] = useState(false);
  const [questionTimer, setQuestionTimer] = useState<NodeJS.Timeout | null>(null);
  const [countdownTimer, setCountdownTimer] = useState<NodeJS.Timeout | null>(null);

  /* ---------- Load User + Setup Bots ---------- */
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

    const tempPlayers: Player[] = [
      { name: u.first_name || "You", color: "#7b2020", height: 0, image: charImg },
      { name: "BOT A", color: "#1e88e5", height: 0, image: charImg },
      { name: "BOT B", color: "#43a047", height: 0, image: charImg },
      { name: "BOT C", color: "#f4511e", height: 0, image: charImg },
      { name: "BOT D", color: "#9c27b0", height: 0, image: charImg },
    ];
    setPlayers(tempPlayers);
  }, [router]);

  /* ---------- Shuffle Helper ---------- */
  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  /* ---------- Question Logic ---------- */
  const askQuestion = async () => {
    const questions = [
      { q: "What is 3 + 5?", a: "8" },
      { q: "What color is grass?", a: "Green" },
      { q: "What is 10 / 2?", a: "5" },
      { q: "What planet do we live on?", a: "Earth" },
      { q: "What is 9 - 3?", a: "6" },
    ];

    const randomQ = shuffle(questions)[0];

    const { value: answer } = await Swal.fire({
      title: "🧠 Quick Question!",
      text: randomQ.q,
      input: "text",
      inputPlaceholder: "Answer quickly!",
      timer: 5000,
      timerProgressBar: true,
      showCancelButton: false,
      confirmButtonText: "Submit",
      inputValidator: (v) => (!v ? "You must answer!" : null),
    });

    const correct = answer && answer.trim().toLowerCase() === randomQ.a.toLowerCase();
    updateProgress(correct);
  };

  /* ---------- Player & Bot Movement ---------- */
  const updateProgress = (playerCorrect: boolean) => {
    setPlayers((prev) =>
      prev.map((p, i) => {
        if (i === 0 && playerCorrect) {
          return { ...p, height: p.height + 1 };
        } else if (i !== 0) {
          const roll = Math.random();
          if (roll > 0.6) return { ...p, height: p.height + 1 };
        }
        return p;
      })
    );
  };

  /* ---------- Start Game ---------- */
  const startGame = () => {
    setPlayers((prev) => prev.map((p) => ({ ...p, height: 0 })));
    setTimeLeft(60);
    setGameActive(true);

    // Question every 5s
    const qTimer = setInterval(() => askQuestion(), 5000);
    setQuestionTimer(qTimer);

    // Countdown
    const cTimer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(qTimer);
          clearInterval(cTimer);
          setGameActive(false);
          finishGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setCountdownTimer(cTimer);
  };

  /* ---------- End Game ---------- */
  const finishGame = () => {
    const highest = Math.max(...players.map((p) => p.height));
    const winners = players.filter((p) => p.height === highest);
    const text =
      winners.length === 1
        ? `${winners[0].name} reached the highest tower!`
        : `${winners.map((w) => w.name).join(", ")} tied for the highest!`;

    Swal.fire({
      icon: "info",
      title: "🏁 Game Over!",
      html: `${text}<br/><br/>Thanks for playing Phase Rush!`,
      confirmButtonText: "Return",
    }).then(() => router.push("/student/play/gametest"));
  };

  /* ---------- Stop Everything ---------- */
  const stopGame = () => {
    if (questionTimer) clearInterval(questionTimer);
    if (countdownTimer) clearInterval(countdownTimer);
    setGameActive(false);
  };

  /* ---------- Render ---------- */
  if (!user)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700">
        Loading player...
      </div>
    );

  return (
    <div className="flex flex-col items-center min-h-screen bg-white relative">
      {/* Header */}
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md mb-4">
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => {
            stopGame();
            router.push("/student/play/gametest");
          }}
        >
          <Image
            src={user.avatar || "/student-avatar.png"}
            alt="Profile"
            width={40}
            height={40}
            className="rounded-full border-2 border-white"
          />
          <span className="font-semibold text-lg">{user.first_name?.toUpperCase()}</span>
        </div>

        <div className="flex items-center gap-4">
          <Search
            onClick={() => setShowSearch(true)}
            className="w-6 h-6 cursor-pointer hover:text-gray-300"
          />
          <Menu className="w-7 h-7 cursor-pointer" />
          <LogOut
            onClick={() => {
              stopGame();
              localStorage.clear();
              router.push("/");
            }}
            className="w-6 h-6 text-white cursor-pointer hover:text-gray-300"
          />
        </div>

        {showSearch && (
          <div className="absolute inset-0 bg-[#7b2020] flex items-center justify-center px-4 z-10">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-3/4 px-3 py-2 rounded-md text-white border"
              autoFocus
            />
            <X
              onClick={() => {
                setSearchTerm("");
                setShowSearch(false);
              }}
              className="ml-3 w-6 h-6 cursor-pointer text-white"
            />
          </div>
        )}
      </header>

      {/* Game UI */}
      <main className="flex flex-col items-center w-full max-w-4xl">
        <h2 className="text-xl font-bold text-[#7b2020] mb-2">⚡ Phase Rush</h2>
        <p className="text-gray-600 mb-3">Time Left: {timeLeft}s</p>

        {!gameActive ? (
          <button
            onClick={startGame}
            className="px-6 py-3 bg-[#548E28] text-white font-semibold rounded-lg hover:scale-105 transition"
          >
            Start Game
          </button>
        ) : (
          <div className="flex justify-around items-end w-full h-[500px] bg-gray-100 rounded-lg border border-gray-300 overflow-hidden p-3 relative">
            {players.map((p, i) => (
              <div key={i} className="flex flex-col items-center h-full w-24 relative">
                <div className="flex flex-col-reverse items-center justify-start h-full relative">
                  {/* Tower Boxes */}
                  {Array.from({ length: p.height }).map((_, idx) => (
                    <Image
                      key={idx}
                      src="/resources/modes/boxes.png"
                      alt="Tower Box"
                      width={55}
                      height={10}
                      className="object-contain m-0 p-0"
                    />
                  ))}

                  {/* Character + Name */}
                  <div
                    className="relative flex flex-col items-center transition-all duration-500 ease-in-out"
                    style={{
                      transform: `translateY(-${p.height * 2}px)`,
                    }}
                  >
                    {/* Floating name above character */}
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
            ))}
          </div>
        )}
      </main>

      <style jsx>{`
        .animate-bounce {
          animation: bounce 1s infinite alternate;
        }

        @keyframes bounce {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(-6px);
          }
        }
      `}</style>
    </div>
  );
}
