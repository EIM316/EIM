import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const student_id = searchParams.get("student_id");

    if (!student_id) {
      return new Response(
        JSON.stringify({ success: false, error: "student_id is required" }),
        { status: 400 }
      );
    }

    // ✅ 1. Find student by id_number (NOT numeric id)
    const student = await prisma.student.findUnique({
      where: { id_number: student_id },
      select: {
        id_number: true,
        first_name: true,
        last_name: true,
        avatar: true,
        email: true,
        created_at: true,
      },
    });

    if (!student)
      return new Response(
        JSON.stringify({ success: false, error: "Student not found" }),
        { status: 404 }
      );

    // ✅ 2. Fetch all module progress and attempts
    const modules = await prisma.studentModuleProgress.findMany({
      where: { student_id: student.id_number },
      include: {
        module: { select: { name: true, description: true } },
      },
    });

    const modulesWithAttempts = await Promise.all(
      modules.map(async (m) => {
        const attempts = await prisma.studentModuleProgress.count({
          where: { student_id: student.id_number, module_id: m.module_id },
        });
        return { ...m, attempts };
      })
    );

    // ✅ 3. Fetch game progress (Modes 1–4)
    const [mode1, mode2, mode3, mode4] = await Promise.all([
      prisma.gamemode1Progress.findMany({
        where: { student_id: student.id_number },
        select: { points: true },
      }),
      prisma.gamemode2Progress.findMany({
        where: { student_id: student.id_number },
        select: { points: true },
      }),
      prisma.gamemode3Progress.findMany({
        where: { student_id: student.id_number },
        select: { points_awarded: true },
      }),
      prisma.gamemode4Progress.findMany({
        where: { student_id: student.id_number },
        select: { points: true },
      }),
    ]);

    const game_points = {
      mode1: mode1.reduce((sum, g) => sum + (g.points || 0), 0),
      mode2: mode2.reduce((sum, g) => sum + (g.points || 0), 0),
      mode3: mode3.reduce((sum, g) => sum + (g.points_awarded || 0), 0),
      mode4: mode4.reduce((sum, g) => sum + (g.points || 0), 0),
    };

    const game_attempts = {
      mode1: mode1.length,
      mode2: mode2.length,
      mode3: mode3.length,
      mode4: mode4.length,
    };

    // ✅ 4. Fetch badges
    const badges = await prisma.studentModuleProgress.findMany({
      where: {
        student_id: student.id_number,
        badge_earned: true,
      },
      select: {
        module: { select: { name: true } },
        completed_at: true,
      },
    });

    // ✅ 5. Fetch class game records
    const class_game_history = await prisma.classGameRecord.findMany({
      where: { student_id_number: student.id_number },
      select: {
        id: true,
        game_code: true,
        points: true,
        created_at: true,
        game: {
          select: {
            game_type: true,
            status: true,
            class: { select: { class_name: true } },
            teacher: { select: { first_name: true, last_name: true } },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          student,
          modules: modulesWithAttempts,
          game_points,
          game_attempts,
          badges,
          class_game_history,
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error in /api/student/details:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
