import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function GET() {
  try {
    // 🧩 Fetch counts in parallel for performance
    const [students, teachers, classes, classModes, modules] = await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.class.count(),
      prisma.classModeGame.count(),
      prisma.module.count(),
    ]);

    // ✅ Return unified dashboard data
    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          students,
          teachers,
          classes,
          classModes,
          modules,
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Dashboard API Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error",
      }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
