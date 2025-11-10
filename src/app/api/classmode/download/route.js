import { PrismaClient } from "@/generated/prisma";
import { stringify } from "csv-stringify/sync";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const class_id = searchParams.get("class_id");
    const filterType = searchParams.get("filterType") || "all";
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");
    const year = searchParams.get("year");

    if (!class_id)
      return new Response(JSON.stringify({ error: "class_id is required" }), {
        status: 400,
      });

    // 🧠 1. Get all students in class
    const students = await prisma.studentClass.findMany({
      where: { class_id: Number(class_id) },
      include: { student: true },
    });

    // 🧮 2. Compute all mode + module points
    let progressData = await Promise.all(
      students.map(async (sc) => {
        const student = sc.student;

        const [
          modulePoints,
          gamemode1,
          gamemode2,
          gamemode3,
          gamemode4,
          classMode,
        ] = await Promise.all([
          prisma.studentModuleProgress.aggregate({
            where: { student_id: student.id_number },
            _sum: { points_earned: true },
          }),
          prisma.gamemode1Progress.aggregate({
            where: { student_id: student.id_number },
            _sum: { points: true },
          }),
          prisma.gamemode2Progress.aggregate({
            where: { student_id: student.id_number },
            _sum: { points: true },
          }),
          prisma.gamemode3Progress.aggregate({
            where: { student_id: student.id_number },
            _sum: { points_awarded: true },
          }),
          prisma.gamemode4Progress.aggregate({
            where: { student_id: student.id_number },
            _sum: { points: true },
          }),
          prisma.classGameRecord.aggregate({
            where: { student_id_number: student.id_number },
            _sum: { points: true },
          }),
        ]);

        // ✅ Compute accurate totals
        const modulePts = modulePoints._sum.points_earned ?? 0;
        const mode1 = gamemode1._sum.points ?? 0;
        const mode2 = gamemode2._sum.points ?? 0;
        const mode3 = gamemode3._sum.points_awarded ?? 0;
        const mode4 = gamemode4._sum.points ?? 0;
        const classModePts = classMode._sum.points ?? 0;

        const totalGamePts = mode1 + mode2 + mode3 + mode4 + classModePts;
        const totalPts = modulePts + totalGamePts;

        return {
          id_number: `="${student.id_number}"`, // 🧩 Prevents Excel scientific notation
          name: `${student.first_name} ${student.last_name}`,
          email: student.email || "",
          module_points: modulePts,
          gamemode1_points: mode1,
          gamemode2_points: mode2,
          gamemode3_points: mode3,
          gamemode4_points: mode4,
          classmode_points: classModePts,
          total_points: totalPts,
          created_at: student.created_at,
        };
      })
    );

    // 🗓 Apply filters
    const now = new Date();
    if (filterType === "week") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      progressData = progressData.filter(
        (r) => new Date(r.created_at) >= startOfWeek
      );
    } else if (filterType === "range" && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      progressData = progressData.filter(
        (r) => new Date(r.created_at) >= start && new Date(r.created_at) <= end
      );
    } else if (filterType === "year" && year) {
      progressData = progressData.filter(
        (r) => new Date(r.created_at).getFullYear() === Number(year)
      );
    }

    // 🧾 Convert to CSV (formatted for Excel)
    const csv = stringify(progressData, {
      header: true,
      columns: [
        { key: "id_number", header: "Student ID" },
        { key: "name", header: "Full Name" },
        { key: "email", header: "Email" },
        { key: "module_points", header: "Module Points" },
        { key: "gamemode1_points", header: "Gamemode 1 Points" },
        { key: "gamemode2_points", header: "Gamemode 2 Points" },
        { key: "gamemode3_points", header: "Gamemode 3 Points" },
        { key: "gamemode4_points", header: "Gamemode 4 Points" },
        { key: "classmode_points", header: "Class Mode Points" },
        { key: "total_points", header: "Total Points" },
      ],
    });

    // 📦 Return CSV file
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="class_${class_id}_progress.csv"`,
      },
    });
  } catch (err) {
    console.error("❌ Error generating CSV:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
