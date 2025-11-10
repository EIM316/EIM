import { PrismaClient } from "@/generated/prisma";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const class_id = searchParams.get("class_id");
    const student_id = searchParams.get("student_id");

    if (!class_id) {
      return NextResponse.json({ success: false, error: "Class ID missing" });
    }

    // ✅ Get all students in this class
    const students = await prisma.studentClass.findMany({
      where: { class_id: Number(class_id) },
      include: {
        student: {
          select: {
            id_number: true,
            first_name: true,
            last_name: true,
            avatar: true,
          },
        },
      },
    });

    // ✅ Fetch points for both modules and games
    const [modulePoints, gamePoints] = await Promise.all([
      prisma.studentModuleProgress.groupBy({
        by: ["student_id"],
        _sum: { points_earned: true },
      }),
      prisma.classGameRecord.groupBy({
        by: ["student_id_number"],
        _sum: { points: true },
      }),
    ]);

    // ✅ Merge module + game totals per student
    const leaderboard = students.map((entry) => {
      const s = entry.student;
      const moduleScore =
        modulePoints.find((m) => m.student_id === s.id_number)?._sum
          ?.points_earned || 0;
      const gameScore =
        gamePoints.find((g) => g.student_id_number === s.id_number)?._sum
          ?.points || 0;

      const total = moduleScore + gameScore;

      return {
        id_number: s.id_number,
        first_name: s.first_name,
        last_name: s.last_name,
        avatar: s.avatar,
        module_points: moduleScore,
        game_points: gameScore,
        total_points: total,
      };
    });

    // ✅ Sort by total_points (descending)
    leaderboard.sort((a, b) => b.total_points - a.total_points);

    // ✅ Assign ranks
    leaderboard.forEach((p, i) => (p.rank = i + 1));

    const studentRank =
      leaderboard.find((p) => p.id_number === student_id)?.rank || null;

    return NextResponse.json({
      success: true,
      leaderboard,
      studentRank,
      totalStudents: leaderboard.length,
      topPeers: leaderboard.slice(0, 10),
    });
  } catch (err) {
    console.error("Leaderboard error:", err);
    return NextResponse.json({ success: false, error: "Server error" });
  }
}
