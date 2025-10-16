"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, CheckCircle, XCircle, Lightbulb } from "lucide-react";
import Swal from "sweetalert2";

interface Question {
  id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  answer: "A" | "B" | "C" | "D";
  question_image?: string | null;
  option_a_image?: string | null;
  option_b_image?: string | null;
  option_c_image?: string | null;
  option_d_image?: string | null;
  mode?: string;
}

interface GameSettings {
  total_minutes: number;
  total_points: number;
  hints_per_student: number;
  time_per_question: number;
  shuffle_mode: boolean;
  max_questions: number;
  theme_file?: string | null;
}

export default function ChallengeModePage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [points, setPoints] = useState(0);
  const [usedHints, setUsedHints] = useState(0);
  const [hiddenOptions, setHiddenOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizFinished, setQuizFinished] = useState(false);

  const [timer, setTimer] = useState<number>(0);
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ✅ Load student info
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedType = localStorage.getItem("userType");

    if (!savedUser || savedType !== "student") {
      router.push("/");
      return;
    }

    setUser(JSON.parse(savedUser));
  }, [router]);

  // ✅ Fetch settings + questions dynamically
  useEffect(() => {
    const init = async () => {
      try {
        const resSettings = await fetch("/api/gamemode2/settings/get2");
        if (!resSettings.ok) throw new Error("No settings found");
        const dataSettings = await resSettings.json();

        setSettings(dataSettings);

        const [res1, res2] = await Promise.all([
          fetch("/api/gamemode1/list-all"),
          fetch("/api/gamemode2/list-all"),
        ]);

        const data1 = res1.ok ? await res1.json() : [];
        const data2 = res2.ok ? await res2.json() : [];

        console.log("✅ GameMode1:", data1.length);
        console.log("✅ GameMode2:", data2.length);

        let combined = [
          ...data1.map((q: Question) => ({ ...q, mode: "GameMode1" })),
          ...data2.map((q: Question) => ({ ...q, mode: "GameMode2" })),
        ];

        if (!combined.length) {
          Swal.fire("No Questions", "No available questions found.", "info");
          setLoading(false);
          return;
        }

        if (dataSettings.shuffle_mode) combined.sort(() => Math.random() - 0.5);

        const maxQ =
          dataSettings.max_questions && dataSettings.max_questions > 0
            ? dataSettings.max_questions
            : combined.length;

        const finalQuestions = combined.slice(0, maxQ);

        console.log("🧠 Final Combined Questions:", finalQuestions.length);

        // ✅ Set game state properly
        setQuestions(finalQuestions);
        setCurrentIndex(0);
        setAnswered(false);
        setQuizFinished(false);
        setTimer(dataSettings.time_per_question ?? 15);
        setMusicUrl(dataSettings.theme_file ?? "/resources/music/theme1.mp3");
      } catch (error) {
        console.error("Init error:", error);
        Swal.fire("Error", "Failed to load Challenge Mode settings or questions.", "error");
        setQuestions([]);
      } finally {
        // Delay loading off until questions fully ready
        setTimeout(() => setLoading(false), 300);
      }
    };

    init();
  }, []);

  // ✅ Countdown per question
  useEffect(() => {
    if (loading || quizFinished || !questions.length) return;
    if (answered) return;

    if (timer <= 0) {
      handleNext();
      return;
    }

    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer, answered, quizFinished, loading, questions.length]);

  // ✅ Background music
  useEffect(() => {
    if (!musicUrl) return;
    const audio = new Audio(musicUrl);
    audio.loop = true;
    audio.volume = 0.5;
    audio.play().catch(() => {});
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [musicUrl]);

  const currentQ = questions[currentIndex] || null;

  if (!loading && !currentQ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-600">
        <p>No question available to display.</p>
        <button
          onClick={() => router.push("/student/play")}
          className="mt-4 px-4 py-2 bg-[#548E28] text-white rounded-md hover:bg-[#3e6a20]"
        >
          Back
        </button>
      </div>
    );
  }

  // ✅ Handle answer
  const handleAnswer = (choice: "A" | "B" | "C" | "D") => {
    if (answered || !currentQ) return;
    setSelectedOption(choice);
    setAnswered(true);

    const correct = choice === currentQ.answer;
    if (correct) {
      const perQuestionPoints = Math.floor(
        (settings?.total_points ?? 100) / (questions.length || 1)
      );
      setPoints((prev) => prev + perQuestionPoints);
      setScore((prev) => prev + 1);
    }
  };

  // ✅ Hint logic — hide 2 wrong options
  const handleUseHint = () => {
    if (!settings || !currentQ) return;
    if (usedHints >= settings.hints_per_student) {
      Swal.fire("No more hints available!", "", "info");
      return;
    }

    const allOptions = ["A", "B", "C", "D"];
    const wrongs = allOptions.filter((o) => o !== currentQ.answer);
    const toHide = wrongs.sort(() => Math.random() - 0.5).slice(0, 2);

    setHiddenOptions(toHide);
    setUsedHints((prev) => prev + 1);
  };

  // ✅ Next question logic
  const handleNext = () => {
    if (!questions.length) return;
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setAnswered(false);
      setHiddenOptions([]);
      setTimer(settings?.time_per_question ?? 15);
    } else {
      stopMusic();
      setQuizFinished(true);
      showResults();
    }
  };

  const stopMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // ✅ Show end result
  const showResults = () => {
    Swal.fire({
      title: "Challenge Complete! 🧩",
      html: `
        <div style="font-size:18px; margin-bottom:10px;">
          You answered <b>${score}</b> out of <b>${questions.length}</b> correctly.
        </div>
        <div style="font-size:22px; color:#548E28;">
          Points Earned: <b>${points}</b>
        </div>
      `,
      icon: "success",
      confirmButtonText: "Back to Menu",
      confirmButtonColor: "#548E28",
    }).then(() => {
      stopMusic();
      router.push("/student/play");
    });
  };

  // ✅ UI: Loading & empty states
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700">
        Loading Challenge Mode...
      </div>
    );

  if (!questions.length)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-600">
        <p>No questions available for this challenge.</p>
        <button
          onClick={() => router.push("/student/play")}
          className="mt-4 px-4 py-2 bg-[#548E28] text-white rounded-md hover:bg-[#3e6a20]"
        >
          Back
        </button>
      </div>
    );

  if (quizFinished)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700">
        Showing results...
      </div>
    );

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-white text-black">
      {/* Header */}
      <header className="w-full bg-[#548E28] text-white flex items-center justify-between px-4 py-3 shadow-md">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => {
            stopMusic();
            router.push("/student/play");
          }}
        >
          <ArrowLeft className="w-6 h-6 hover:text-gray-300" />
          <span className="font-semibold text-lg">Challenge Mode</span>
        </div>

        <div className="text-sm flex items-center gap-4">
          <span>⏱ {timer}s</span>
          <span>💡 {settings?.hints_per_student! - usedHints} hints left</span>
        </div>
      </header>

      {/* Question Section */}
      <main className="w-full max-w-xl px-4 text-center mt-6">
        <h2 className="text-lg font-semibold text-[#548E28] mb-2">
          Question {currentIndex + 1}/{questions.length}
        </h2>

        {currentQ?.question_image && (
          <div className="mb-3">
            <Image
              src={currentQ.question_image}
              alt="Question"
              width={200}
              height={200}
              className="mx-auto rounded-lg border"
            />
          </div>
        )}

        <p className="text-gray-800 mb-4">{currentQ?.question}</p>

        {/* Options */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          {(["A", "B", "C", "D"] as const).map((key) => {
            if (!currentQ || hiddenOptions.includes(key)) return null;
            const isCorrect = key === currentQ.answer;
            const isSelected = selectedOption === key;
            const optionKey = `option_${key.toLowerCase()}` as keyof Question;
            const optionImageKey = `option_${key.toLowerCase()}_image` as keyof Question;

            let style =
              "flex flex-col items-center justify-center border-2 rounded-xl p-3 aspect-square text-center cursor-pointer transition select-none";
            if (answered && isSelected && isCorrect)
              style += " border-green-600 bg-green-100";
            else if (answered && isSelected && !isCorrect)
              style += " border-red-600 bg-red-100";
            else if (answered && isCorrect)
              style += " border-green-500 bg-green-50";
            else style += " border-gray-300 hover:bg-gray-100";

            return (
              <div key={key} onClick={() => handleAnswer(key)} className={style}>
                {currentQ[optionImageKey] && (
                  <div className="flex items-center justify-center mb-2 w-16 h-16 bg-gray-50 border rounded-lg overflow-hidden">
                    <Image
                      src={currentQ[optionImageKey] as string}
                      alt={`Option ${key}`}
                      width={60}
                      height={60}
                      className="object-contain"
                    />
                  </div>
                )}
                <span className="font-semibold text-[#548E28]">
                  {key}. {currentQ[optionKey] as string}
                </span>

                {answered && isSelected && (
                  isCorrect ? (
                    <CheckCircle className="text-green-600 w-5 h-5 mt-2" />
                  ) : (
                    <XCircle className="text-red-600 w-5 h-5 mt-2" />
                  )
                )}
              </div>
            );
          })}
        </div>

        {/* Hint + Next Button */}
        <div className="flex justify-between items-center mt-5">
          <button
            onClick={handleUseHint}
            className="flex items-center gap-2 bg-yellow-400 text-black px-4 py-2 rounded-md hover:bg-yellow-500"
          >
            <Lightbulb className="w-5 h-5" /> Use Hint
          </button>

          {answered && (
            <button
              onClick={handleNext}
              className="bg-[#548E28] text-white px-6 py-2 rounded-md hover:bg-[#3e6a20]"
            >
              {currentIndex + 1 === questions.length ? "Finish" : "Next"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
