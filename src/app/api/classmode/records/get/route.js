import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const game_code = searchParams.get("game_code");
    const professor_id = searchParams.get("professor_id");

    // 🧩 Filter by either game_code or professor_id
     const where = {};

    if (game_code) where.game_code = game_code;
    if (professor_id) where.professor_id = professor_id;

    const records = await prisma.classGameRecord.findMany({
      where,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        professor_id: true,
        game_code: true,
        student_id_number: true,
        points: true,
        created_at: true,
        student: {
          select: { first_name: true, last_name: true, avatar: true },
        },
      },
    });

    return new Response(JSON.stringify({ success: true, records }), {
      status: 200,
    });
  } catch (error) {
    console.error("❌ Error fetching game records:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error." }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
