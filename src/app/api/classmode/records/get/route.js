import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const game_code = searchParams.get("game_code");
    const professor_id = searchParams.get("professor_id");
    const class_id = searchParams.get("class_id"); // 🆕 support class_id filter

    const where = {};

    if (game_code) where.game_code = game_code;
    if (professor_id) where.professor_id = professor_id;

    // 🆕 If filtering by class_id, use nested relation filter
    if (class_id) {
      where.game = {
        class_id: Number(class_id),
      };
    }

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
        game: {
          select: {
            class_id: true,
            class: { select: { class_name: true } },
          },
        },
      },
    });

    return new Response(JSON.stringify({ success: true, records }), {
      status: 200,
    });
  } catch (error) {
    console.error("❌ Error fetching class game records:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error.",
      }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
