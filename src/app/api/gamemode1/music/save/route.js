// /src/app/api/gamemode1/music/save/route.js
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    const { admin_id, gamemode = "gamemode1", theme_name, theme_file } = body;

    if (!admin_id || !theme_name || !theme_file) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Check if there's already a record for this gamemode
    const existing = await prisma.gamemodeMusic.findFirst({
      where: { gamemode },
    });

    let savedTheme;

    if (existing) {
      // Update existing record
      savedTheme = await prisma.gamemodeMusic.update({
        where: { id: existing.id },
        data: {
          theme_name,
          theme_file,
          admin_id,
          updated_at: new Date(),
        },
      });
    } else {
      // Create new record
      savedTheme = await prisma.gamemodeMusic.create({
        data: {
          gamemode,
          theme_name,
          theme_file,
          admin_id,
        },
      });
    }

    return new Response(JSON.stringify(savedTheme), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("POST /api/gamemode1/music/save error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to save music theme" }),
      { status: 500 }
    );
  }
}
