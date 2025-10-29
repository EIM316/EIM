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

    // 🔍 Check if record already exists (avoid duplicates)
    const existing = await prisma.classGameRecord.findFirst({
      where: {
        professor_id,
        game_code,
        student_id_number,
      },
    });

    let record;

    if (existing) {
      // ✅ Update instead of creating duplicate
      record = await prisma.classGameRecord.update({
        where: { id: existing.id },
        data: {
          points: points ?? existing.points,
          updated_at: new Date(),
        },
      });
      console.log(`🔁 Updated existing record for ${student_id_number}`);
    } else {
      // ✅ Create new record
      record = await prisma.classGameRecord.create({
        data: {
          professor_id,
          game_code,
          student_id_number,
          points: points ?? 0,
        },
      });
      console.log(`🆕 Created new record for ${student_id_number}`);
    }

    return new Response(JSON.stringify({ success: true, record }), {
      status: 200,
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
