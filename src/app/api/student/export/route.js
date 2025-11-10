import { PrismaClient } from "@/generated/prisma";
import { stringify } from "csv-stringify/sync";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const student_id = searchParams.get("student_id");

    if (!student_id) {
      return new Response("student_id is required", { status: 400 });
    }

    // ✅ 1. Find student
    const student = await prisma.student.findUnique({
      where: { id: Number(student_id) },
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
      return new Response("Student not found", { status: 404 });

    // ✅ 2. Fetch modules (with attempts)
    const modules = await prisma.studentModuleProgress.findMany({
      where: { student_id: student.id_number },
      include: { module: { select: { name: true, description: true } } },
    });

    const modulesWithAttempts = await Promise.all(
      modules.map(async (m) => {
        const attempts = await prisma.studentModuleProgress.count({
          where: { student_id: student.id_number, module_id: m.module_id },
        });
        return { ...m, attempts };
      })
    );

    // ✅ 3. Fetch gamemode data
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
      Refresher: mode1.reduce((sum, g) => sum + (g.points || 0), 0),
      "Quiz Mode": mode2.reduce((sum, g) => sum + (g.points || 0), 0),
      "Schematic Builder": mode3.reduce(
        (sum, g) => sum + (g.points_awarded || 0),
        0
      ),
      "Phase Rush": mode4.reduce((sum, g) => sum + (g.points || 0), 0),
    };

    const game_attempts = {
      Refresher: mode1.length,
      "Quiz Mode": mode2.length,
      "Schematic Builder": mode3.length,
      "Phase Rush": mode4.length,
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

    // ✅ 5. Fetch class mode game history
    const class_game_history = await prisma.classGameRecord.findMany({
      where: { student_id_number: student.id_number },
      select: {
        game_code: true,
        points: true,
        created_at: true,
        game: {
          select: {
            game_type: true,
            class: { select: { class_name: true } },
            teacher: { select: { first_name: true, last_name: true } },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    // ✅ 6. Prepare CSV data
    const csvSections = [];

    // Student Info
    csvSections.push([
      ["Student Information"],
      [
        "ID Number",
        "Full Name",
        "Email",
        "Date Joined",
      ],
      [
        student.id_number,
        `${student.first_name} ${student.last_name}`,
        student.email,
        new Date(student.created_at).toLocaleDateString(),
      ],
      [],
    ]);

    // Module Progress
    csvSections.push([
      ["Module Progress"],
      ["Module Name", "Completed", "Points", "Attempts"],
      ...modulesWithAttempts.map((m) => [
        m.module.name,
        m.completed ? "Yes" : "No",
        m.points_earned ?? 0,
        m.attempts ?? 0,
      ]),
      [],
    ]);

    // Game Performance
    csvSections.push([
      ["Game Performance"],
      ["Mode", "Total Points", "Attempts"],
      ...Object.keys(game_points).map((mode) => [
        mode,
        game_points[mode],
        game_attempts[mode],
      ]),
      [],
    ]);

    // Badges
    csvSections.push([
      ["Badges Earned"],
      ["Module", "Completed At"],
      ...(badges.length > 0
        ? badges.map((b) => [
            b.module.name,
            new Date(b.completed_at).toLocaleDateString(),
          ])
        : [["No badges earned", ""]]),
      [],
    ]);

    // Class Game History
    csvSections.push([
      ["Class Mode Game History"],
      ["Game Code", "Class", "Teacher", "Points", "Date"],
      ...(class_game_history.length > 0
        ? class_game_history.map((r) => [
            r.game_code,
            r.game.class.class_name,
            `${r.game.teacher.first_name} ${r.game.teacher.last_name}`,
            r.points,
            new Date(r.created_at).toLocaleDateString(),
          ])
        : [["No records found", "", "", "", ""]]),
    ]);

    // ✅ Combine all into one CSV string
    const csvString = csvSections
      .map((section) => stringify(section))
      .join("\n");

    // ✅ Send downloadable CSV file
    return new Response(csvString, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${student.id_number}_record.csv"`,
      },
    });
  } catch (error) {
    console.error("❌ Error generating CSV:", error);
    return new Response("Internal Server Error", { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
