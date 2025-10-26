import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    const { professor_id, game_code, student_id_number, points } = body;

    // 🧩 Validate required fields
    if (!professor_id || !game_code || !student_id_number) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields." }),
        { status: 400 }
      );
    }

    // ✅ Save new record
    const record = await prisma.classGameRecord.create({
      data: {
        professor_id,
        game_code,
        student_id_number,
        points: points ?? 0,
      },
    });

    return new Response(JSON.stringify({ success: true, record }), {
      status: 201,
    });
  } catch (error) {
    console.error("❌ Error saving game record:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error." }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
