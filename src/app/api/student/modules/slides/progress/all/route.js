import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const student_id = searchParams.get("student_id");

    if (!student_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing student_id parameter.",
        }),
        { status: 400 }
      );
    }

    // ✅ Fetch all progress records ordered by `last_updated`
    const progressRecords = await prisma.studentModuleProgress.findMany({
      where: { student_id },
      include: {
        module: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: { last_updated: "desc" }, // ✅ Correct column name
    });

    if (!progressRecords || progressRecords.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          progress: [],
          message: "No progress records found for this student.",
        }),
        { status: 200 }
      );
    }

    // ✅ Format clean output
    const formatted = progressRecords.map((p) => ({
      id: p.id,
      module_id: p.module_id,
      module_name: p.module?.name || "Unknown Module",
      current_slide: p.current_slide || 0,
      points_earned: p.points_earned || 0,
      completed: p.completed || false,
      badge_earned: p.badge_earned || false,
      last_updated: p.last_updated,
      completed_at: p.completed_at,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        progress: formatted,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error fetching all progress:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error.",
        details: error.message,
      }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
