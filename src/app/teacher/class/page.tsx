"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { ArrowLeft, Plus, Search, Copy, X, LogIn } from "lucide-react";
import Swal from "sweetalert2";

export default function ProfessorClassPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get("class_id");

  const [students, setStudents] = useState<any[]>([]);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState("");
  const [gameCode, setGameCode] = useState("");

  // ✅ Load teacher info
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedType = localStorage.getItem("userType");
    if (savedUser && savedType === "teacher") {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // ✅ Fetch class info + students + games
  const fetchAllData = async () => {
    if (!classId) return;
    try {
      setLoading(true);

      const [classRes, studentRes, gameRes] = await Promise.all([
        fetch(`/api/class/info?class_id=${classId}`),
        fetch(`/api/class/students?class_id=${classId}`),
        fetch(`/api/classmode/list?class_id=${classId}`),
      ]);

      const classData = await classRes.json();
      const studentData = await studentRes.json();
      const gameData = await gameRes.json();

      if (classData.success) setClassInfo(classData.class);
      if (studentData.success) setStudents(studentData.students);
      if (gameData.success) setGames(gameData.games || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [classId]);

  // ✅ Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });
  }, [students, searchTerm]);

  // ✅ Generate game code
  const generateGameCode = () => {
    const code = Math.random().toString(36).substring(2, 7).toUpperCase();
    setGameCode(code);
  };

  // ✅ Copy code
  const copyCode = () => {
    navigator.clipboard.writeText(gameCode);
    Swal.fire({
      title: "Copied!",
      text: `Game code ${gameCode} copied.`,
      icon: "success",
      timer: 1000,
      showConfirmButton: false,
    });
  };

  // ✅ Create new game
  const handleCreateGame = async () => {
    if (!selectedMode) {
      Swal.fire("Select Game Mode", "Please choose a game mode.", "warning");
      return;
    }
    if (!classId || !user?.id_number) return;

    try {
      const res = await fetch("/api/classmode/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_id: Number(classId),
          teacher_id: user.id_number,
          game_type: selectedMode.toLowerCase().replace(" ", "_"),
        }),
      });

      const data = await res.json();

      if (data.success) {
        Swal.fire({
          title: "Game Created!",
          text: `Game code: ${data.game.game_code}`,
          icon: "success",
          confirmButtonColor: "#7b2020",
        });
        setShowModal(false);
        fetchAllData(); // ✅ refresh games after creation
      } else {
        Swal.fire("Error", data.error || "Failed to create game.", "error");
      }
    } catch (error) {
      Swal.fire("Error", "Server error occurred.", "error");
    }
  };

// ✅ Go to Lobby
const goToLobby = (game: any) => {
  localStorage.setItem("activeGameCode", game.game_code);
  localStorage.setItem("activeGameType", game.game_type);
  localStorage.setItem("activeClassId", classId?.toString() || "");

  router.push(`/teacher/class/lobby?code=${game.game_code}&class_id=${classId}`);
};

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Loading class data...
      </div>
    );

  if (!classInfo)
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-gray-700">
        <p>Class not found.</p>
        <button
          onClick={() => router.push("/teacher")}
          className="text-[#7b2020] font-semibold mt-2 underline"
        >
          Go back
        </button>
      </div>
    );

  return (
    <div className="min-h-screen bg-white flex flex-col items-center pb-12 relative">
      {/* Header */}
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <ArrowLeft
            className="w-6 h-6 cursor-pointer"
            onClick={() => router.push("/teacher")}
          />
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold">{classInfo.class_name}</h1>
            <p className="text-xs opacity-80">Class code: {classInfo.class_code}</p>
          </div>
        </div>
      </header>

      {/* Students Section */}
      <section className="w-[90%] max-w-md mt-5">
        <h2 className="text-[#7b2020] font-bold text-base mb-3">MY STUDENTS</h2>
        <div className="flex items-center bg-[#f8e8e8] border border-[#7b2020] rounded-lg px-3 py-2 mb-3">
          <Search className="w-5 h-5 text-[#7b2020] mr-2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search student..."
            className="bg-transparent w-full text-sm outline-none placeholder:text-gray-500"
          />
        </div>

        <div className="border-2 border-[#7b2020] rounded-lg bg-[#f8e8e8] max-h-[300px] overflow-y-auto shadow-inner">
          {filteredStudents.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#7b2020] text-white text-sm">
                <tr>
                  <th className="p-2 pl-4">Avatar</th>
                  <th className="p-2">Name</th>
                  <th className="p-2 pr-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b border-[#7b2020]/30 hover:bg-[#f3dada] transition-all"
                  >
                    <td className="p-2 pl-4">
                      <Image
                        src={student.avatar || "/resources/icons/student.png"}
                        alt={`${student.first_name} ${student.last_name}`}
                        width={32}
                        height={32}
                        className="rounded-full border border-[#7b2020] object-cover"
                      />
                    </td>
                    <td className="p-2 text-sm font-medium text-gray-800">
                      {student.first_name} {student.last_name}
                    </td>
                    <td className="p-2 pr-4 text-right">
                      <button
                        onClick={() =>
                          router.push(`/teacher/class/student/${student.id}`)
                        }
                        className="text-[#7b2020] font-bold text-sm"
                      >
                        →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-gray-600 text-center py-4">No students found.</div>
          )}
        </div>
      </section>

      {/* Class Mode Records */}
      <section className="w-[90%] max-w-md mt-6 relative">
        <h2 className="text-[#7b2020] font-bold text-base mb-2">
          CLASS MODE RECORDS
        </h2>

        <div className="border-2 border-[#7b2020] rounded-lg bg-[#f8e8e8] p-5 flex flex-col justify-center items-center relative min-h-[200px]">
          {games.length > 0 ? (
            <div className="w-full max-h-[250px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#7b2020] text-white text-sm">
                  <tr>
                    <th className="p-2 pl-3">Game Mode</th>
                    <th className="p-2">Code</th>
                    <th className="p-2 text-right pr-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((game) => (
                    <tr
                      key={game.id}
                      className="border-b border-[#7b2020]/30 hover:bg-[#f3dada] cursor-pointer text-black"
                      onClick={() => goToLobby(game)}
                    >
                      <td className="p-2 pl-3 text-sm capitalize">
                        {game.game_type.replace("_", " ")}
                      </td>
                      <td className="p-2 text-sm font-semibold text-[#7b2020]">
                        {game.game_code}
                      </td>
                      <td className="p-2 text-sm text-right pr-3 text-[#7b2020]">
                        {game.status || "Active"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-700 font-medium text-center">
              NO CLASS MODE GAME RECORD YET
            </p>
          )}

          <button
            onClick={() => {
              setShowModal(true);
              generateGameCode();
            }}
            className="absolute bottom-3 right-3 bg-[#7b2020] text-white p-3 rounded-full shadow-md hover:bg-[#5f1717]"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white w-[90%] max-w-sm p-6 rounded-lg shadow-lg relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-[#7b2020] font-bold text-lg mb-4 text-center">
              Create Class Game
            </h2>

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Game Mode
            </label>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="w-full border-2 border-[#7b2020] rounded-md p-2 text-sm mb-4 text-black"
            >
              <option value="">-- Choose a Game Mode --</option>
              <option value="Phase Rush">Phase Rush</option>
              <option value="Quiz Mode">Quiz Mode</option>
              <option value="Schematic">Schematic</option>
              <option value="Randomized">Randomized</option>
            </select>

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Game Code
            </label>
            <div className="flex items-center bg-[#f8e8e8] border-2 border-[#7b2020] rounded-md px-3 py-2 mb-4">
              <span className="text-[#7b2020] font-bold flex-1">{gameCode}</span>
              <Copy
                className="cursor-pointer text-[#7b2020] w-5 h-5 ml-2"
                onClick={copyCode}
              />
            </div>

            <button
              onClick={handleCreateGame}
              className="w-full bg-[#7b2020] text-white font-semibold py-2 rounded-md hover:bg-[#5f1717]"
            >
              Create Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
