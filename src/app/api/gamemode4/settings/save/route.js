import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      admin_id,
      total_game_time,
      question_interval,
      shuffle_mode,
      theme_name,
      theme_file,
    } = body;

    if (!admin_id) {
      return new Response(
        JSON.stringify({ error: "Missing admin_id" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ✅ Check if settings already exist for this admin
    const existing = await prisma.gamemode4Settings.findFirst({
      where: { admin_id },
    });

    let savedSettings;

    if (existing) {
      // ✅ Update existing record
      savedSettings = await prisma.gamemode4Settings.update({
        where: { id: existing.id },
        data: {
          total_game_time,
          question_interval,
          shuffle_mode,
          theme_name,
          theme_file,
          updated_at: new Date(),
        },
      });
    } else {
      // ✅ Create new record
      savedSettings = await prisma.gamemode4Settings.create({
        data: {
          admin_id,
          total_game_time,
          question_interval,
          shuffle_mode,
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
    console.error("POST /api/gamemode4/settings/save error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to save GameMode 4 settings." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    await prisma.$disconnect();
  }
}
