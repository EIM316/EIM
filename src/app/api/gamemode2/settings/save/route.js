import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      admin_id,
      total_minutes,
      total_points,
      hints_per_student,
      time_per_question,
      shuffle_mode,
      max_questions,
      theme_name,
      theme_file,
    } = body;

    if (!admin_id) {
      return new Response(JSON.stringify({ error: "Missing admin_id" }), {
        status: 400,
      });
    }

    // ✅ Corrected model name
    const existing = await prisma.gamemode2Settings.findFirst({
      where: { admin_id },
    });

    let savedSettings;

    if (existing) {
      // ✅ Update existing settings
      savedSettings = await prisma.gamemode2Settings.update({
        where: { id: existing.id },
        data: {
          total_minutes,
          total_points,
          hints_per_student,
          time_per_question,
          shuffle_mode,
          max_questions,
          theme_name,
          theme_file,
          updated_at: new Date(),
        },
      });
    } else {
      // ✅ Create new settings record
      savedSettings = await prisma.gamemode2Settings.create({
        data: {
          admin_id,
          total_minutes,
          total_points,
          hints_per_student,
          time_per_question,
          shuffle_mode,
          max_questions,
          theme_name,
          theme_file,
        },
      });
    }

    return new Response(JSON.stringify(savedSettings), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("POST /api/gamemode2/settings/save error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to save game settings" }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
