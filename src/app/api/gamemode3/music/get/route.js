import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const music = await prisma.gamemodeMusic.findFirst({
      where: { gamemode: "gamemode3" },
      orderBy: { updated_at: "desc" },
    });

    if (!music) {
      return new Response(
        JSON.stringify({ message: "No music theme selected yet." }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify(music), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("GET /api/gamemode3/music/get error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch music theme" }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
