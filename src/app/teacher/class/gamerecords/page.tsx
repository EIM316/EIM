"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Loader2 } from "lucide-react";
import Swal from "sweetalert2";

export default function GameRecordsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameCode = searchParams.get("code");
  const classId = searchParams.get("class_id");

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState<any>(null);

  useEffect(() => {
    const fetchGameRecords = async () => {
      try {
        setLoading(true);
        const [recordRes, classRes] = await Promise.all([
          fetch(`/api/classmode/records/bygame?code=${gameCode}`),
          fetch(`/api/class/info?class_id=${classId}`),
        ]);

        const recordData = await recordRes.json();
        const classData = await classRes.json();

        if (classData.success) setClassInfo(classData.class);
        if (recordData.success) {
          setRecords(recordData.records || []);
        } else {
          Swal.fire("Error", "Failed to load records for this game.", "error");
        }
      } catch (error) {
        console.error("❌ Error fetching game records:", error);
        Swal.fire("Error", "Something went wrong fetching game records.", "error");
      } finally {
        setLoading(false);
      }
    };

    if (gameCode && classId) fetchGameRecords();
  }, [gameCode, classId]);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-700">
        <Loader2 className="animate-spin w-10 h-10 mb-4 text-[#7b2020]" />
        <p>Loading Game Records...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-white flex flex-col items-center pb-12 relative">
      {/* Header */}
      <header className="w-full bg-[#7b2020] text-white flex items-center justify-between px-4 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <ArrowLeft
            className="w-6 h-6 cursor-pointer"
            onClick={() =>
              router.push(`/teacher/class?class_id=${classId}`)
            }
          />
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold">
              {classInfo?.class_name || "Class Records"}
            </h1>
            <p className="text-xs opacity-80">
              Game Code: {gameCode || "N/A"}
            </p>
          </div>
        </div>
      </header>

      {/* Records Section */}
      <section className="w-[90%] max-w-md mt-6 relative">
        <h2 className="text-[#7b2020] font-bold text-base mb-2">
          GAME RECORDS
        </h2>

        <div className="border-2 border-[#7b2020] rounded-lg bg-[#f8e8e8] p-5 flex flex-col relative min-h-[200px]">
          {records.length > 0 ? (
            <div className="w-full max-h-[400px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#7b2020] text-white text-sm">
                  <tr>
                    <th className="p-2 pl-3">Avatar</th>
                    <th className="p-2">Student</th>
                    <th className="p-2 text-center">Points</th>
                    <th className="p-2 text-right pr-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec: any, idx: number) => (
                    <tr
                      key={idx}
                      className="border-b border-[#7b2020]/30 hover:bg-[#f3dada] transition-all"
                    >
                      <td className="p-2 pl-3">
                        <Image
                          src={
                            rec.student?.avatar ||
                            "/resources/icons/student.png"
                          }
                          alt={rec.student?.first_name || "Student"}
                          width={36}
                          height={36}
                          className="rounded-full border border-[#7b2020] object-cover"
                        />
                      </td>
                      <td className="p-2 text-sm text-gray-800 font-medium">
                        {rec.student?.first_name} {rec.student?.last_name}
                      </td>
                      <td className="p-2 text-center text-sm font-semibold text-[#7b2020]">
                        {rec.points}
                      </td>
                      <td className="p-2 text-right pr-3 text-xs text-gray-600">
                        {new Date(rec.created_at).toLocaleDateString()}{" "}
                        {new Date(rec.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-700 font-medium text-center">
              NO RECORDS FOUND FOR THIS GAME
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
