"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StartPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const mode = "Phase Rush";
  const modePath = "/classmode/gamemodes/phaserush";

  useEffect(() => {
    // ✅ Safe JSON parser (prevents "undefined" parse errors)
    const getSafeJSON = (key: string, fallback: any) => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw || raw === "undefined" || raw === "null") return fallback;
        return JSON.parse(raw);
      } catch {
        return fallback;
      }
    };

    const storedPlayers = getSafeJSON("players", []);
    const savedUser = getSafeJSON("user", {});

    const allPlayers =
      storedPlayers.length > 0
        ? storedPlayers
        : [
            {
              name: savedUser.first_name || "You",
              avatar:
                savedUser.avatar || "/resources/avatars/student1.png",
            },
          ];

    setPlayers(allPlayers);
    setLoading(false);

    // ⏱️ Auto redirect to Phase Rush after short delay
    const timeout = setTimeout(() => {
      router.push(modePath);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white relative">
      {/* Title */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-[#7b2020] mb-2">🏁 Preparing Game...</h1>
        <p className="text-lg text-gray-700 font-semibold">
          Next Mode: <span className="text-[#7b2020]">{mode}</span>
        </p>
      </div>

      {/* Loading Animation */}
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="w-16 h-16 border-4 border-[#7b2020] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 font-medium">
          {loading ? "Loading players..." : "Starting Phase Rush..."}
        </p>
      </div>

      {/* Player List */}
      <div className="mt-10 flex flex-wrap justify-center gap-6">
        {players.map((p, i) => (
          <div key={i} className="flex flex-col items-center text-center">
            <img
              src={p.avatar || "/resources/avatars/student1.png"}
              alt={p.name}
              className="w-14 h-14 rounded-full border-2 border-[#7b2020] shadow-md bg-white"
            />
            <span className="text-sm font-semibold text-[#7b2020] mt-1">
              {p.name}
            </span>
          </div>
        ))}
      </div>

      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="absolute bottom-5 left-5 text-sm bg-[#7b2020] hover:bg-[#9c2a2a] text-white px-4 py-2 rounded-md shadow-md"
      >
        ⬅ Back to Lobby
      </button>
    </div>
  );
}
