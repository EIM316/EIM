import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const class_id = searchParams.get("class_id");

    if (!class_id)
      return new Response(
        JSON.stringify({ success: false, error: "class_id is required" }),
        { status: 400 }
      );

    // 🧠 1. Get all students in this class (with basic info + avatar)
    const students = await prisma.studentClass.findMany({
      where: { class_id: Number(class_id) },
      include: { student: true },
    });

    // 🧠 2. Compute full progress data for each student
    const progressData = await Promise.all(
      students.map(async (sc) => {
        const student = sc.student;

        // ✅ Fetch all relevant point sources
        const [
          modulePoints,
          gamemode1,
          gamemode2,
          gamemode3,
          gamemode4,
          classMode
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

        // ✅ Compute totals
        const totalGamePoints =
          (gamemode1._sum.points ?? 0) +
          (gamemode2._sum.points ?? 0) +
          (gamemode3._sum.points_awarded ?? 0) +
          (gamemode4._sum.points ?? 0) +
          (classMode._sum.points ?? 0);

        const totalModulePoints = modulePoints._sum.points_earned ?? 0;

        const totalPoints = totalGamePoints + totalModulePoints;

        return {
          student_id: student.id_number,
          student_name: `${student.first_name} ${student.last_name}`,
          avatar: student.avatar || "/resources/icons/student.png",
          module_points: totalModulePoints,
          game_points: totalGamePoints,
          total_points: totalPoints,
        };
      })
    );

    return new Response(
      JSON.stringify({ success: true, progressData }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error fetching class progress:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
